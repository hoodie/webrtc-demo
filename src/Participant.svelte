<script>
    import { onMount, createEventDispatcher, tick } from 'svelte';
    import Upstream from './Upstream.svelte';
    import { chatTo, offer, offerTo, answer, answerTo, candidates, candidateTo, clearCandidates } from './signalingStore.js';

    const dispatch = createEventDispatcher();

    export let name = 'unnamed participant';
    export let recipient = null;

    const sendOffer = offerTo(recipient);
    const sendAnswer = answerTo(recipient);
    const sendCandidate = candidateTo(recipient);
    const justTheSdp = json => json && JSON.parse(json).sdp

    const packOffer = sdp => ({type: 'offer', sdp});
    const packAnswer = sdp => ({type: 'answer', sdp});

    export let isCaller = false;
    export let isReceiver = false;

    let downstreamVideo;
    let events = [];

    let peerConnection;
    let sender;

    let signalingState = '';
    let connectionState = '';
    let iceConnectionState = '';

    let localOfferSdp = '';
    $: receivedOffer = justTheSdp($offer[name]);
    $: receivedAnswer = justTheSdp($answer[name]);

    let myCandidates = [];

    let pcconfig = (() =>
        new URL(document.location).searchParams.get('semantic') === 'unified-plan'
            ? { sdpSemantics: 'unified-plan' }
            : { sdpSemantics: 'plan-b' })();

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
            logEvent('lc', 'create candidate');
            myCandidates = [...myCandidates, candidate];
            sendCandidate(candidate);
        };
        pc.onsignalingstatechange = s => (signalingState = pc.signalingState);
        pc.onconnectionstatechange = s => (connectionState = pc.connectionState);
        pc.oniceconnectionstatechange = s => (iceConnectionState = pc.iceConnectionState);

        console.info(`setup RTCPeerConnection for ${name}`, pcconfig, pc);
        return pc;
    }

    function logEvent(short, event) {
        events = [...events, short];
        dispatch('event', { name, short, event });
    }

    function addStream(stream) {
        if (sender) {
            logEvent('rt', 'replace track');
            console.info('replace track', { sender });
            sender.replaceTrack(stream.getTracks()[0]);
        } else {
            logEvent('at', 'add track');
            console.info('add track');
            sender = peerConnection.addTrack(stream.getTracks()[0], stream);
        }
    }

    async function createOffer() {
        logEvent('o', 'create offer');
        const offer = await peerConnection.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false,
        });
        localOfferSdp = offer.sdp
    }

    async function createAnswer() {
        logEvent('a', 'create answer');
        const answer = await peerConnection.createAnswer();
        localOfferSdp = answer.sdp
    }

    async function applyLocal(localOfferSdp) {
        logEvent('l', 'setLocalDescription');
        console.debug('localDescription ->', localOfferSdp);
        const sessionDesc = localOfferSdp;
        peerConnection.setLocalDescription(sessionDesc); //
        ($candidates[name] || []).forEach(c => {
            if (c) {
                logEvent('ac', 'addIceCandidate');
                peerConnection.addIceCandidate(c);
            }
        });
        clearCandidates(name);
    }

    function applyRemoteOffer(receivedOffer) {
        logEvent('r', 'setRemoteDescription');
        const sessionDesc = packOffer(receivedOffer);
        // console.debug('remoteDescription ->', sessionDesc);
        peerConnection.setRemoteDescription(sessionDesc);
    }

    function applyRemoteAnswer(receivedOffer) {
        logEvent('r', 'setRemoteDescription');
        const sessionDesc = packAnswer(receivedOffer);
        // console.debug('remoteDescription ->', sessionDesc);
        peerConnection.setRemoteDescription(sessionDesc);
    }

    onMount(() => {
        peerConnection = initPeerConnection();
        candidates.subscribe(({ [name]: candidate }) => {
            if (candidate) {
                logEvent('rc');
                // console.debug(`received candidate by ${name}`, candidate);
            }
        });
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
</style>

<section>

    <h3>{name}</h3>

    <small>talking to {recipient}</small>
    <div id="streams">
        <div id="upstream">
            <Upstream on:stream={({ detail: stream }) => addStream(stream)} />
        </div>

        <div id="downstream">
            <label for="downstream">downstream</label>
            <video bind:this={downstreamVideo} autoplay="true" width="400" height="300" />
        </div>

        <div id="signaling">
            <label>
            signaling: <code> {signalingState} </code>
            </label>
            <label>
            connection:<code> {connectionState} </code>
            </label>
            <label>
            ice:       <code> {iceConnectionState} </code>
            </label>

            <small>{events.join(',')}</small>

            <fieldset>
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
            </fieldset>

            {#if isCaller}
                <label>
                    1.
                    <button on:click={createOffer}>create offer</button>
                </label>
                {#if localOfferSdp}
                    <div>

                        <textarea cols="60" rows="20" bind:value={localOfferSdp}></textarea>
                        <br />
                        <label>
                            2.
                            <button on:click={() => applyLocal(packOffer(localOfferSdp))}>setLocalDescription</button>
                            <button on:click={() => sendOffer(packOffer(localOfferSdp))}>send offer</button>
                        </label>
                    </div>
                {/if}
                {#if receivedAnswer}
                    <div>
                        <textarea cols="60" rows="20" bind:value={receivedAnswer}></textarea>
                        <br />
                        <label>
                            5.
                            <button on:click={() => applyRemoteAnswer(receivedAnswer)}>setRemoteDescription</button>
                        </label>
                    </div>
                {/if}
            {/if}

            {#if isReceiver}
                {#if receivedOffer}
                    <div>
                        <textarea cols="60" rows="20" bind:value={receivedOffer}></textarea>
                        <br />
                        <label>
                            3.
                            <button on:click={() => applyRemoteOffer(receivedOffer)}>setRemoteDescription</button>
                            <button on:click={createAnswer}>create answer</button>
                        </label>
                    </div>
                {/if}
                {#if localOfferSdp}
                    <div>
                        <textarea cols="60" rows="20" bind:value={localOfferSdp}></textarea>
                        <br />
                        <label>
                            4.
                            <button on:click={() => applyLocal(packAnswer(localOfferSdp))}>setLocalDescription</button>
                            <button on:click={() => sendAnswer(packAnswer(localOfferSdp))}>send answer</button>
                        </label>
                    </div>
                {/if}
            {/if}

            {#if myCandidates.length}
                <textarea readonly cols="60" rows="20"> {myCandidates.map(JSON.stringify).join('\n')} </textarea>
            {/if}

        </div>

    </div>
</section>
