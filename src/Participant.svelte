<script lang="ts">
    import { onMount } from 'svelte';
    import { config, addEventFor, eventLogByName } from './store';
    import {
        offerStore,
        answerStore,
        candidatesStore,
        sendOfferFrom,
        sendAnswerFrom,
        sendCandidateFrom,
        clearCandidatesFrom,
    } from './signalingStore';
    import { SignalingClient } from './signalingClient';
    import { justTheSdp, safeParse, packOffer, packAnswer } from './util.js';

    import UpstreamVideo from './UpstreamVideo.svelte';
    import Downstream from './Downstream.svelte';
    import RemoteBar from './RemoteBar.svelte';
    import Transceivers from './Transceivers.svelte';

    export let isCaller = false;
    export let isReceiver = false;

    export let name = 'unnamed participant';
    export let recipient: string | null = null;

    const signalingClient = new SignalingClient({
        from: name,
        to: recipient,
    });

    const addEvent = addEventFor(name);

    let downstreamComponent;
    $: events = $eventLogByName[name] || [];

    let peerConnection: RTCPeerConnection;
    let sender: RTCRtpSender;
    let videoUpstream: MediaStream;

    let signalingState = '';
    let connectionState = '';
    let iceConnectionState = '';

    let localOfferSdp = '';
    $: receivedOffer = justTheSdp($offerStore[recipient]);
    $: receivedAnswer = justTheSdp($answerStore[recipient]);

    let localAnswerSdp = '';

    let injectedOffer = '';
    let injectedAnswer = '';

    let rawCandidates = [];
    $: readableCandidates = JSON.stringify(rawCandidates);

    let injectedCandidates = '';
    $: parsedInjectedCandidates = safeParse(injectedCandidates);

    let pcconfig = (() =>
        new URL(document.location.toString()).searchParams.get('semantic') === 'plan-b'
            ? { sdpSemantics: 'plan-b' }
            : { sdpSemantics: 'unified-plan' }
            )();

    function initPeerConnection() {
        pcconfig.sdpSemantics === 'unified-plan';

        const pc = new RTCPeerConnection(pcconfig as any);
        pc.ontrack = event => {
            const { track, streams, transceiver } = event;
            const stream = streams[0];
            downstreamComponent.$set({ stream });
            stream.onaddtrack = () => {
                addEvent('ta', 'track added');
                console.warn(`${name}track added to stream`, { track, stream });
            };

            if (track.kind == 'video') {
                console.info(`${name}.ontrack`, {
                    track,
                    streams,
                    kind: track.kind,
                    transceiver,
                });
                track.onmute = event => {
                    addEvent('tm', 'track muted');
                    console.info(`${name} track onmute`, { event });
                };
                track.onunmute = event => {
                    addEvent('tu', 'track unmuted');
                    console.info(`${name} track onunmute`, { event });
                };
                track.onended = event => {
                    addEvent('te', 'track ended');
                    console.debug(`${name} track onended`, { event });
                };
            }
        };

        pc.onicecandidate = ({ candidate }) => {
            addEvent('lc', 'create candidate');
            rawCandidates = [...rawCandidates, candidate];
            sendCandidate(candidate);
        };
        pc.onsignalingstatechange = () => (signalingState = pc.signalingState);
        pc.onconnectionstatechange = () => (connectionState = pc.connectionState);
        pc.oniceconnectionstatechange = () => (iceConnectionState = pc.iceConnectionState);

        console.info(`setup RTCPeerConnection for ${name}`, pcconfig, pc);
        return pc;
    }

    function addStream(stream) {
        if (sender) {
            addEvent('rt', 'replace track');
            console.info('replace track', { sender });
            sender.replaceTrack(stream.getTracks()[0]);
        } else {
            addEvent('at', 'add track');
            console.info('add track');
            sender = peerConnection.addTrack(stream.getTracks()[0], stream);
        }
    }

    async function createOffer() {
        addEvent('o', 'create offer');
        const offer = await peerConnection.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false,
        });
        localOfferSdp = offer.sdp;
    }

    async function createAnswer() {
        addEvent('a', 'create answer');
        const answer = await peerConnection.createAnswer();
        localAnswerSdp = answer.sdp;
    }

    function sendOffer() {
        const offer = packOffer(localOfferSdp);
        sendOfferFrom({ from: name, offer });
        $config.isRemote && signalingClient.sendOffer(offer);
    }

    function sendAnswer() {
        const answer = packOffer(localAnswerSdp);
        sendAnswerFrom({ from: name, answer });
        $config.isRemote && signalingClient.sendAnswer(answer);
    }

    function sendCandidate(candidate) {
        if (name && candidate) {
            sendCandidateFrom({ from: name, candidate });
            $config.isRemote && signalingClient.sendCandidate(candidate);
        }
    }

    async function applyLocal(localOfferSdp) {
        addEvent('l', 'setLocalDescription');
        console.debug('localDescription ->', localOfferSdp);
        const sessionDesc = localOfferSdp;
        clearCandidatesFrom({from: name});
        peerConnection.setLocalDescription(sessionDesc); //
        applyCandidates();
        clearCandidatesFrom({from :recipient});
    }

    function applyRemoteOffer(receivedOffer) {
        addEvent('r', 'setRemoteDescription');
        const sessionDesc = packOffer(receivedOffer);
        peerConnection.setRemoteDescription(sessionDesc);
        applyCandidates();
        clearCandidatesFrom({from:recipient});
    }

    function applyCandidates() {
        if ($config.isManual) {
            (parsedInjectedCandidates || []).forEach(c => {
                if (c) {
                    addEvent('ac', 'addIceCandidate');
                    peerConnection.addIceCandidate(c);
                }
            });
        } else {
            console.debug($candidatesStore[recipient]);
            ($candidatesStore[recipient] || []).forEach(c => {
                if (c) {
                    addEvent('ac', 'addIceCandidate');
                    peerConnection.addIceCandidate(c);
                }
            });
        }
    }

    function applyRemoteAnswer(receivedOffer) {
        addEvent('r', 'setRemoteDescription');
        const sessionDesc = packAnswer(receivedOffer);
        peerConnection.setRemoteDescription(sessionDesc);
        clearCandidatesFrom({from: name});
    }

    $: hideSignaling = $config.hideSignaling;

    onMount(() => {
        peerConnection = initPeerConnection();
        candidatesStore.subscribe(({ [recipient]: candidate }) => {
            if (candidate) {
                addEvent('rc');
                // console.debug(`received candidate by ${name}`, candidate);
            }
        });
        if ($config.hasCaller) {
            createOffer();
        }
    });
</script>

<style>
    textarea {
        padding: 1em;
        font-size: 0.7em;
        font-family: monospace;
        min-width: calc(100% - 1em);
        resize: vertical;
        box-shadow: inset 2px 2px 8px rgba(0, 0, 0, 0.1);
    }

    .hideSignaling {
        display: none;
    }

</style>

<section>
    <h3>{name}
    <small>talking to {recipient}</small>
    </h3>
    {#if $config.isRemote}
        <RemoteBar {signalingClient} />
    {/if}

    {#if $config.hasUpstream}
    <article id="upstream" class="box">
        <UpstreamVideo
            on:stream={({ detail: stream }) => videoUpstream = stream}
            on:stop={() => videoUpstream = undefined}
        />
    </article>
    {/if}

    {#if $config.hasDownstream}
    <article id="downstream" class="box">
        <Downstream bind:this={downstreamComponent} stream={undefined} />
    </article>
    {/if}

    <article class="box">
        <h5>streams</h5>
        <button on:click={() => addStream(videoUpstream)}
            disabled={!Boolean(videoUpstream)}>
            {#if sender}replaceTrack{:else}addStream{/if}
        </button>
    </article>

    <article class="box">
        <Transceivers peerconnection={peerConnection}/>
    </article>

    <article class="box">
        <h5>signaling</h5>

        <div class="box">
            <table class="vertical">
                <tr>
                    <th> signaling: </th>
                    <td> <code>{signalingState}</code> </td>
                </tr>
                <tr>
                    <th> connection: </th>
                    <td> <code>{connectionState}</code> </td>
                </tr>
                <tr>
                    <th> ice: </th>
                    <td> <code>{iceConnectionState}</code> </td>
                </tr>
                {#if !hideSignaling}
                <tr>
                    <th> events: </th>
                    <td> <code> <small>{events.join(' ')}</small> </code> </td>
                </tr>
                {/if}
            </table>

        </div>

        <div class="box">
            <span>
                <label>
                    <input type="checkbox" bind:checked={isCaller} />
                    caller
                </label>
                <label>
                    <input type="checkbox" bind:checked={isReceiver} />
                    receiver
                </label>
            </span>
        </div>

        {#if isCaller}
            <label>
                1.
                <button on:click={createOffer}>create offer</button>
            </label>

            {#if localOfferSdp}
                <div>
                    <textarea class:hideSignaling rows=20 bind:value={localOfferSdp} />
                    <br />
                    <label>
                        2.
                        <button on:click={() => applyLocal(packOffer(localOfferSdp))}>setLocalDescription</button>
                        <button on:click={sendOffer}>send offer</button>
                    </label>
                </div>
            {/if}
            {#if receivedAnswer && !$config.isManual}
                <div>
                    <textarea class:hideSignaling rows="20" bind:value={receivedAnswer} />
                    <br />
                    <label>
                        5.
                        <button on:click={() => applyRemoteAnswer(receivedAnswer)}>setRemoteDescription</button>
                    </label>
                </div>
            {/if}
            {#if $config.isManual}
                <div>
                    <strong>MANUAL ANSWER HERE</strong>
                    <textarea rows="20" bind:value={injectedAnswer} />
                    <br />
                    <label>
                        5.
                        <button on:click={() => applyRemoteAnswer(injectedAnswer)}>setRemoteDescription</button>
                    </label>
                </div>
            {/if}
        {/if}

        {#if isReceiver}
            {#if receivedOffer && !$config.isManual}
                <div>
                    <textarea class:hideSignaling rows="20" bind:value={receivedOffer} />
                    <br />
                    <label>
                        3.
                        <button on:click={() => applyRemoteOffer(receivedOffer)}>setRemoteDescription</button>
                        <button on:click={createAnswer}>create answer</button>
                    </label>
                </div>
            {/if}
            {#if $config.isManual}
                <div>
                    <strong>MANUAL OFFER HERE</strong>
                    <textarea rows="20" bind:value={injectedOffer} />
                    <br />
                    <label>
                        3.
                        <button on:click={() => applyRemoteOffer(injectedOffer)}>setRemoteDescription</button>
                        <button on:click={createAnswer}>create answer</button>
                    </label>
                </div>
            {/if}
            {#if localAnswerSdp && receivedOffer}
                <div>
                    <textarea class:hideSignaling rows="20" bind:value={localAnswerSdp} />
                    <br />
                    <label>
                        4.
                        <button on:click={() => applyLocal(packAnswer(localAnswerSdp))}>setLocalDescription</button>
                        <button on:click={sendAnswer}>send answer</button>
                    </label>
                </div>
            {/if}
        {/if}

        {#if readableCandidates.length || $config.isManual}
            <textarea class:hideSignaling rows="10" bind:value={readableCandidates} />
        {/if}

        {#if $config.isManual}
            <label for="injectedCandidates">injected Candidates</label>
            <textarea name="injectedCandidates" rows="20" bind:value={injectedCandidates} />
            <pre>{JSON.stringify(parsedInjectedCandidates, null, 4)}</pre>
        {/if}

    </article>

</section>
