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
        EVENT_BUS,
    } from './signalingStore';
    import { SignalingClient } from './signalingClient';
    import { justTheSdp, safeParse, packOffer, packAnswer } from './util';

    import UpstreamVideo from './UpstreamVideo.svelte';
    import Downstream from './Downstream.svelte';
    import RemoteBar from './RemoteBar.svelte';
    import Transceivers from './Transceivers.svelte';
    import SdpTextArea from './SdpTextArea.svelte';
    import RtpSender from './views/RtpSender.svelte';
    import RtpReceiver from './views/RtpReceiver.svelte';
    import UpstreamAudio from './UpstreamAudio.svelte';
    import Stream from './views/Stream.svelte';

    export let isCaller = false;
    export let isReceiver = false;
    $: autoSignal = $config.autoSignal as boolean;

    export let name = 'unnamed participant';
    export let recipient: string | null = null;

    const signalingClient = new SignalingClient({
        from: name,
        to: recipient,
    });

    const addEvent = addEventFor(name);

    let downstreamComponent: Downstream;
    $: events = $eventLogByName[name] || [];

    let peerConnection: RTCPeerConnection;
    let mainSender: RTCRtpSender;
    let senders: RTCRtpSender[] = [];
    let receivers: RTCRtpReceiver[] = [];
    let rtcConfiguration: RTCConfiguration;

    let selectedUpstream: MediaStream & { name?: string };

    let signalingState = '';
    let connectionState = '';
    let iceConnectionState = '';
    let iceGatheringState = '';

    let localOfferSdp = '';
    $: receivedOffer = justTheSdp($offerStore[recipient]);
    $: receivedAnswer = justTheSdp($answerStore[recipient]);

    {
        // autosignaling Events
        EVENT_BUS.addEventListener(`OfferTo:${name}`, async ({ detail: offer }: CustomEvent) => {
            if (autoSignal) {
                applyRemoteOffer(justTheSdp(offer));
                await createAnswer();
                applyLocal(packAnswer(localAnswerSdp));
                sendAnswer();
            }
        });

        EVENT_BUS.addEventListener(`AnswerTo:${name}`, async ({ detail: answer }: CustomEvent) => {
            if (autoSignal) {
                applyRemoteAnswer(justTheSdp(answer));
            }
        });

        EVENT_BUS.addEventListener(`CandidateTo:${name}`, async ({ detail: candidate }: CustomEvent) => {
            if (autoSignal) {
                await applyCandidate(candidate);
            }
        });
    }

    let localAnswerSdp = '';

    let injectedOffer = '';
    let injectedAnswer = '';

    let rawCandidates = [];
    $: readableCandidates = JSON.stringify(rawCandidates);

    let injectedCandidates = '';
    $: parsedInjectedCandidates = safeParse(injectedCandidates);

    const sdpSemantics = new URL(document.location.toString()).searchParams.get('sdpSemantics') ?? 'unified-plan';

    const pcConfig: RTCConfiguration & { sdpSemantics: string } = { sdpSemantics } as any;

    function initPeerConnection() {
        const pc = new RTCPeerConnection(pcConfig);

        pc.addEventListener('track', (event) => {
            addEvent('pct', 'pc ontrack');
            const { track, streams, transceiver } = event;
            const stream = streams[0] || new MediaStream([track]);

            console.info(`${name}.ontrack`, {
                track,
                streams,
                kind: track.kind,
                transceiver,
            });

            useDownstream({ stream, track });

            track.addEventListener('ended', () => {
                addEvent('te', 'track ended');
                console.info(`${name} track ended`, { event });
            });
            track.addEventListener('mute', () => {
                addEvent('🔇', 'track muted');
                console.info(`${name} track muted`, { event });
            });
            track.addEventListener('unmute', () => {
                addEvent('🔈', 'track unmuted');
                console.info(`${name} track unmuted`, { event });
            });

            stream.addEventListener('addtrack', () => {
                addEvent('add', 'stream track added');
            });
            stream.addEventListener('removetrack', () => {
                addEvent('rem', 'stream track removed');
            });
        });

        pc.addEventListener('icecandidate', ({ candidate }) => {
            if ($config.showCandidateEvents) {
                addEvent('lc', 'create candidate');
            }
            rawCandidates = [...rawCandidates, candidate];
            sendCandidate(candidate);
        });

        pc.addEventListener('signalingstatechange', () => (signalingState = pc.signalingState));
        pc.addEventListener('connectionstatechange', () => (connectionState = pc.connectionState));

        // pc.addEventListener('icecandidateerror', (error) => );
        pc.addEventListener('iceconnectionstatechange', () => (iceConnectionState = pc.iceConnectionState));
        pc.addEventListener(
            'icegatheringstatechange',
            ({ target: { iceGatheringState: state } }: any) => (iceGatheringState = state)
        );

        pc.addEventListener('negotiationneeded', () => addEvent('nn', 'negotiation needed'));

        pc.addEventListener('addstream', (stream) => {
            addEvent('as', 'addstream');
            console.warn('addstream', stream);
        });
        pc.addEventListener('removestream', (stream) => {
            addEvent('rs', 'removestream');
            console.warn('removestream', stream);
        });

        console.info(`setup RTCPeerConnection for ${name}`, pcConfig, pc);
        return pc;
    }

    function addTrack(stream: MediaStream) {
        addEvent('at', 'add track');
        console.info('add track');
        mainSender = peerConnection.addTrack(stream.getTracks()[0], stream);
    }

    function replaceTrack(stream: MediaStream, sender: RTCRtpSender) {
        addEvent('rt', 'replace track');
        console.info('replace track', { sender });
        sender.replaceTrack(stream.getTracks()[0]);
    }

    function removeStream() {
        (peerConnection as any).removeStream(selectedUpstream);
        mainSender = undefined;
    }

    function removeTrack() {
        peerConnection.removeTrack(mainSender);
        mainSender = undefined;
    }

    async function startCall() {
        await createOffer();
        applyLocal(packOffer(localOfferSdp));
        sendOffer();
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
        EVENT_BUS.dispatchEvent(new CustomEvent(`OfferTo:${recipient}`, { detail: offer }));
    }

    function sendAnswer() {
        const answer = packOffer(localAnswerSdp);
        sendAnswerFrom({ from: name, answer });
        $config.isRemote && signalingClient.sendAnswer(answer);
        EVENT_BUS.dispatchEvent(new CustomEvent(`AnswerTo:${recipient}`, { detail: answer }));
    }

    function sendCandidate(candidate) {
        if (name && candidate) {
            sendCandidateFrom({ from: name, candidate });
            $config.isRemote && signalingClient.sendCandidate(candidate);
            EVENT_BUS.dispatchEvent(new CustomEvent(`CandidateTo:${recipient}`, { detail: candidate }));
        }
    }

    async function applyLocal(localOfferSdp) {
        addEvent('l', 'setLocalDescription');
        console.debug('localDescription ->', localOfferSdp);
        const sessionDesc = localOfferSdp;
        clearCandidatesFrom({ from: name });
        peerConnection.setLocalDescription(sessionDesc); //
        applyCandidates();
        clearCandidatesFrom({ from: recipient });
    }

    function applyRemoteOffer(receivedOffer) {
        addEvent('r', 'setRemoteDescription');
        const sessionDesc = packOffer(receivedOffer);
        peerConnection.setRemoteDescription(sessionDesc);
        applyCandidates();
        clearCandidatesFrom({ from: recipient });
    }

    function applyCandidates() {
        if ($config.isManual) {
            (parsedInjectedCandidates || []).forEach((c) => {
                if (c && $config.showCandidateEvents) {
                    addEvent('ac', 'addIceCandidate');
                    peerConnection.addIceCandidate(c);
                }
            });
        } else {
            console.debug($candidatesStore[recipient]);
            ($candidatesStore[recipient] || []).forEach((c) => {
                if (c && $config.showCandidateEvents) {
                    addEvent('ac', 'addIceCandidate');
                    peerConnection.addIceCandidate(c);
                }
            });
        }
    }

    async function applyCandidate(candidate: RTCIceCandidate) {
        if ($config.showCandidateEvents) {
            addEvent('ac', 'addIceCandidate');
        }
        await peerConnection.addIceCandidate(candidate);
    }

    function applyRemoteAnswer(receivedOffer) {
        addEvent('r', 'setRemoteDescription');
        const sessionDesc = packAnswer(receivedOffer);
        peerConnection.setRemoteDescription(sessionDesc);
        clearCandidatesFrom({ from: name });
    }

    function useDownstream(usable: { stream?: MediaStream; track?: MediaStreamTrack }) {
        if (usable.stream) {
            downstreamComponent.$set({ stream: usable.stream });
        } else if (usable.track) {
            const stream = new MediaStream([usable.track]);
            downstreamComponent.$set({ stream });
        } else {
            console.error("can't use stream or track, nothing there", usable);
        }
    }

    $: hideSignaling = $config.hideSignaling;
    $: hideEvents = $config.hideEvents;

    onMount(() => {
        peerConnection = initPeerConnection();
        candidatesStore.subscribe(({ [recipient]: candidate }) => {
            if (candidate && $config.showCandidateEvents) {
                addEvent('rc');
            }
        });
        if ($config.hasCaller) {
            createOffer();
        }

        const updatePeerConnectionStuff = () => {
            senders = peerConnection.getSenders();
            receivers = peerConnection.getReceivers();
            rtcConfiguration = peerConnection.getConfiguration();
        };

        updatePeerConnectionStuff();
        const interval = setInterval(() => {
            updatePeerConnectionStuff();
        }, 500);

        return () => clearInterval(interval);
    });
</script>

<section>
    <h3>
        {name}
        <small>talking to {recipient}</small>
    </h3>
    {#if $config.isRemote}
        <RemoteBar {signalingClient} />
    {/if}

    {#if $config.hasUpstream}
        <article id="upstream" class="box">
            <UpstreamVideo
                on:stream={({ detail: stream }) => (selectedUpstream = stream)}
                on:stop={() => (selectedUpstream = undefined)}
                open={true}
            />
            <UpstreamAudio
                on:stream={({ detail: stream }) => (selectedUpstream = stream)}
                on:stop={() => (selectedUpstream = undefined)}
                open={false}
            />
        </article>
    {/if}

    {#if $config.hasDownstream}
        <article id="downstream" class="box">
            <Downstream bind:this={downstreamComponent} stream={undefined} />
        </article>
    {/if}

    <article class="box">
        <small>
            <strong> selected upstream </strong>

            {#if selectedUpstream}
                <Stream stream={selectedUpstream} />
            {/if}
        </small>
        <hr />

        <details open={sdpSemantics == 'plan-b'}>
            <summary>
                <h4>
                    <abbr title={JSON.stringify(rtcConfiguration, null, 4)}> peerconnection </abbr>
                </h4>
                {#if pcConfig.sdpSemantics === 'plan-b'}
                    <span class="warning">plan-b</span>
                {/if}
            </summary>
            {#each senders as sender}
                <RtpSender
                    {sender}
                    open={true}
                    mediaStream={selectedUpstream}
                    onRemove={(sender) => peerConnection.removeTrack(sender)}
                />
            {/each}
            {#each receivers as receiver}
                <RtpReceiver {receiver} open={true} />
            {/each}
        </details>

        <button on:click={() => addTrack(selectedUpstream)} disabled={!Boolean(selectedUpstream)}> addTrack </button>
        {#if mainSender}
            <button on:click={() => replaceTrack(selectedUpstream, mainSender)} disabled={!Boolean(selectedUpstream)}>
                replaceTrack
            </button>

            <button on:click={() => removeStream()} disabled={!Boolean(selectedUpstream)}>
                <strike> removeStream </strike>
            </button>
            <button on:click={() => removeTrack()} disabled={!Boolean(selectedUpstream)}> removeTrack </button>
        {/if}

        <button class="btn-small" on:click={() => peerConnection.close()}> close </button>

        {#if sdpSemantics === 'unified-plan'}
            <Transceivers
                peerconnection={peerConnection}
                streamSource={() => selectedUpstream}
                on:track={({ detail: track }) => useDownstream({ track })}
            />
        {/if}
    </article>

    <article class="box">
        <details open="true">
            <summary> <h4>signaling</h4> </summary>

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
                        <th> iceGathering: </th>
                        <td> <code> {iceGatheringState}</code> </td>
                    </tr>
                    <tr>
                        <th> iceConnection: </th>
                        <td> <code> {iceConnectionState}</code> </td>
                    </tr>
                    {#if !hideEvents}
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
                    <label>
                        <input type="checkbox" bind:checked={autoSignal} />
                        auto
                    </label>
                </span>
            </div>

            {#if isCaller}
                {#if autoSignal}
                    <label>
                        0.
                        <button on:click={startCall}>start call</button>
                    </label>
                {/if}

                <label>
                    1.
                    <button on:click={createOffer} disabled={autoSignal}>create offer</button>
                </label>

                {#if localOfferSdp}
                    <div>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={localOfferSdp} />
                        <br />
                        <label>
                            2.
                            <button on:click={() => applyLocal(packOffer(localOfferSdp))} disabled={autoSignal}
                                >setLocalDescription</button
                            >
                            <button on:click={sendOffer} disabled={autoSignal}>send offer</button>
                        </label>
                    </div>
                {/if}
                {#if receivedAnswer && !$config.isManual}
                    <div>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={receivedAnswer} />
                        <br />
                        <label>
                            5.
                            <button on:click={() => applyRemoteAnswer(receivedAnswer)} disabled={autoSignal}
                                >setRemoteDescription</button
                            >
                        </label>
                    </div>
                {/if}
                {#if $config.isManual}
                    <div>
                        <strong>MANUAL ANSWER HERE</strong>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={injectedAnswer} />
                        <br />
                        <label>
                            5.
                            <button on:click={() => applyRemoteAnswer(injectedAnswer)} disabled={autoSignal}
                                >setRemoteDescription</button
                            >
                        </label>
                    </div>
                {/if}
            {/if}

            {#if isReceiver}
                {#if receivedOffer && !$config.isManual}
                    <div>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={receivedOffer} />
                        <br />
                        <label>
                            3.
                            <button on:click={() => applyRemoteOffer(receivedOffer)} disabled={autoSignal}
                                >setRemoteDescription</button
                            >
                            <button on:click={createAnswer} disabled={autoSignal}>create answer</button>
                        </label>
                    </div>
                {/if}
                {#if $config.isManual}
                    <div>
                        <strong>MANUAL OFFER HERE</strong>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={injectedOffer} />
                        <br />
                        <label>
                            3.
                            <button on:click={() => applyRemoteOffer(injectedOffer)} disabled={autoSignal}
                                >setRemoteDescription</button
                            >
                            <button on:click={createAnswer} disabled={autoSignal}>create answer</button>
                        </label>
                    </div>
                {/if}
                {#if localAnswerSdp && receivedOffer}
                    <div>
                        <SdpTextArea {hideSignaling} rows={20} bind:value={localAnswerSdp} />
                        <br />
                        <label>
                            4.
                            <button on:click={() => applyLocal(packAnswer(localAnswerSdp))} disabled={autoSignal}
                                >setLocalDescription</button
                            >
                            <button on:click={sendAnswer} disabled={autoSignal}>send answer</button>
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
        </details>
    </article>
</section>

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
    .warning {
        color: red;
    }
</style>
