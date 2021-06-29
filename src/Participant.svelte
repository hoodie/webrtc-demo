<script>
    import { onMount, createEventDispatcher, tick } from 'svelte';
    import { config, addEventFor, eventLogByName } from './store.js';
    import {
        offerStore, answerStore, candidatesStore,
        sendOfferFrom,
        sendAnswerFrom,
        sendCandidateFrom,
        clearCandidatesFrom
    } from './signalingStore.js';
    import { SignalingClient } from './signalingClient.js';
    import { justTheSdp, safeParse,packOffer, packAnswer } from './util.js'

    import Upstream from './Upstream.svelte';
    import RemoteBar from './RemoteBar.svelte';

    export let isCaller = false;
    export let isReceiver = false;

    export let name = 'unnamed participant';
    export let recipient = null;

    const signalingClient = new SignalingClient({
        from: name,
        to: recipient,
    });

    const dispatch = createEventDispatcher();

    const addEvent = addEventFor(name);

    let downstreamVideo;
    $: events = $eventLogByName[name] || [];

    let peerConnection;
    let sender;

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
        new URL(document.location).searchParams.get('semantic') === 'unified-plan'
            ? { sdpSemantics: 'unified-plan' }
            : { sdpSemantics: 'plan-b' })();

    
    // $: if (!$config.isManual) {
    //     ($candidatesStore[recipient] || []).forEach(c => {
    //         if (c) {
    //             addEvent('ac', 'addIceCandidate');
    //             peerConnection.addIceCandidate(c).catch(e => console.warn('whoopsie',e));
    //         }
    //     });
    // }

    function initPeerConnection() {
        pcconfig.sdpSemantics === 'unified-plan';

        const pc = new RTCPeerConnection(pcconfig);
        pc.ontrack = event => {
            const { track, streams, transceiver } = event;
            const stream = streams[0];
            downstreamVideo.srcObject = stream;
            stream.onaddtrack = () => console.warn(`${name}track added to stream`, { track, stream });

            if (track.kind == 'video') {
                console.info(`${name}.ontrack`, {
                    track,
                    streams,
                    kind: track.kind,
                    transceiver,
                });
                track.onmute = event => {
                    console.info(`${name} track onmute`, { event });
                    downstreamVideo.srcObject = null;
                };
                track.onunmute = event => {
                    console.info(`${name} track onunmute`, { event });
                    downstreamVideo.srcObject = stream;
                };
                track.onended = event => {
                    console.debug(`${name} track onended`, { event });
                };
            }
        };

        pc.onicecandidate = ({ candidate }) => {
            addEvent('lc', 'create candidate');
            rawCandidates = [...rawCandidates, candidate];
            sendCandidate(candidate);
        };
        pc.onsignalingstatechange = s => (signalingState = pc.signalingState);
        pc.onconnectionstatechange = s => (connectionState = pc.connectionState);
        pc.oniceconnectionstatechange = s => (iceConnectionState = pc.iceConnectionState);

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
        sendOfferFrom({ from: name, offer })
        $config.isRemote && signalingClient.sendOffer(offer);
    }

    function sendAnswer() {
        const answer = packOffer(localAnswerSdp);
        sendAnswerFrom({ from: name, answer})
        $config.isRemote && signalingClient.sendAnswer(answer);
    }

    function sendCandidate(candidate) {
        if (name && candidate) {
            sendCandidateFrom({ from: name, candidate})
            $config.isRemote && signalingClient.sendCandidate(candidate);
        }
    }

    async function applyLocal(localOfferSdp) {
        addEvent('l', 'setLocalDescription');
        console.debug('localDescription ->', localOfferSdp);
        const sessionDesc = localOfferSdp;
        clearCandidatesFrom(name);
        peerConnection.setLocalDescription(sessionDesc); //
        applyCandidates();
        clearCandidatesFrom(recipient);
    }

    function applyRemoteOffer(receivedOffer) {
        addEvent('r', 'setRemoteDescription');
        const sessionDesc = packOffer(receivedOffer);
        peerConnection.setRemoteDescription(sessionDesc);
        applyCandidates();
        clearCandidatesFrom(recipient);
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
        clearCandidatesFrom(name);
    }

    $: hideDetails = $config.hideDetails

    onMount(() => {
        peerConnection = initPeerConnection();
        candidatesStore.subscribe(({ [recipient]: candidate }) => {
            if (candidate) {
                addEvent('rc');
                // console.debug(`received candidate by ${name}`, candidate);
            }
        });
        if ($config.hasCaller) {
            createOffer()
        }
    });
</script>

<style>
    code {
        color: red;
    }
    #streams {
        display: flex;
        flex-wrap: wrap;
    }

    video {
        padding: 0.5em;
        border: 1px solid #aaa;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 0 1em 0;
    }

    video {
        background-color: black;
    }

    #upstream,
    #downstream,
    #signaling {
        width: 450px;
        display: block;
        padding: 0.5em;
        margin: 0 1em 1em 0;
        border: 1px solid #aaa;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    }
    textarea {
        font-size: 0.7em;
        font-family: monospace;
        width: 100%;
    }
    fieldset {
        display: flex;
    }
    fieldset span {
        display: inline;
    }
    .hideDetails {
        display: none;
    }
</style>

<section>

    <h3>{name}</h3>
    {#if $config.isRemote}
    <RemoteBar {signalingClient}/>
    {/if}
    <small>talking to {recipient}</small>
    <div id="streams">

        {#if $config.hasUpstream}
            <div id="upstream">
                <Upstream on:stream={({ detail: stream }) => addStream(stream)} />
            </div>
        {/if}

        {#if $config.hasDownstream}
            <div id="downstream">
                <label for="downstream">downstream</label>
                <video bind:this={downstreamVideo} autoplay="true" width="400" height="300" />
            </div>
        {/if}

        <div id="signaling">
            <label> signaling: <code>{signalingState}</code> </label>
            <label> connection: <code>{connectionState}</code> </label>
            <label> ice: <code>{iceConnectionState}</code> </label>

            <small>{events.join(',')}</small>

            <fieldset>
                <span>
                    <label> <input type="checkbox" bind:checked={isCaller} /> caller </label>
                    <label> <input type="checkbox" bind:checked={isReceiver} /> receiver </label>
                    <label> <input type="checkbox" bind:checked={$config.isManual} /> manual mode </label>
                </span>
            </fieldset>

            {#if isCaller}
                <label> 1. <button on:click={createOffer}>create offer</button> </label>

                {#if localOfferSdp}
                    <div>
                        <textarea class:hideDetails cols="60" rows="20" bind:value={localOfferSdp} />
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
                        <textarea class:hideDetails cols="60" rows="20" bind:value={receivedAnswer} />
                        <br />
                        <label>
                            5. <button on:click={() => applyRemoteAnswer(receivedAnswer)}>setRemoteDescription</button>
                        </label>
                    </div>
                {/if}
                {#if $config.isManual}
                    <div>
                        <strong>MANUAL ANSWER HERE</strong>
                        <textarea cols="60" rows="20" bind:value={injectedAnswer} />
                        <br />
                        <label>
                            5. <button on:click={() => applyRemoteAnswer(injectedAnswer)}>setRemoteDescription</button>
                        </label>
                    </div>
                {/if}
            {/if}

            {#if isReceiver}
                {#if receivedOffer && !$config.isManual}
                    <div>
                        <textarea class:hideDetails cols="60" rows="20" bind:value={receivedOffer} />
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
                        <textarea cols="60" rows="20" bind:value={injectedOffer} />
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
                        <textarea class:hideDetails  cols="60" rows="20" bind:value={localAnswerSdp} />
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
                <textarea class:hideDetails cols="60" rows="20" bind:value={readableCandidates} />
            {/if}

            {#if $config.isManual}
                <label for="injectedCandidates">injected Candidates</label>
                <textarea name="injectedCandidates" cols="60" rows="20" bind:value={injectedCandidates} />
                <pre>{JSON.stringify(parsedInjectedCandidates, null, 4)}</pre>
            {/if}

        </div>

    </div>
</section>
