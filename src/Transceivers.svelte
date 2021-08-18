<script lang="ts">
    import { onMount, tick, createEventDispatcher } from 'svelte';
    import Details from './Details.svelte';
    import { config } from './store';

    export let peerconnection: RTCPeerConnection;
    export let streamSource: (() => MediaStream | undefined) | undefined;

    const dispatch = createEventDispatcher();

    $: transceivers = peerconnection && peerconnection.getTransceivers();
    let transceiverDetails: any[];
    const trackMap = new Map<RTCRtpTransceiver, MediaStreamTrack>();

    function getStreamFromSource(sender: RTCRtpSender) {
        return () => {
            const stream = streamSource();
            const track = stream.getTracks()[0];
            if (track) {
                sender.replaceTrack(track);
            }
        };
    }

    function addTransceiver() {
        peerconnection.addTransceiver('video');
        transceivers = peerconnection.getTransceivers();
        updateDetails();
    }

    function updateDetails() {
        transceiverDetails =
            peerconnection &&
            peerconnection.getTransceivers().map((transceiver) => {
                const { mid, direction, currentDirection, sender, receiver } = transceiver;
                let senderDetails = {};
                let receiverDetails = {};
                {
                    let { dtmf, track, transport } = sender;
                    senderDetails = {
                        dtmf,
                        track,
                        transport,
                        parameters: sender.getParameters && sender.getParameters(),
                    };
                }
                {
                    let { dtmf, track, transport } = receiver;
                    receiverDetails = {
                        dtmf,
                        track,
                        transport,
                        parameters: receiver.getParameters && receiver.getParameters(),
                        csrcs: receiver.getContributingSources(),
                        ssrcs: receiver.getSynchronizationSources(),
                    };
                }
                return [
                    transceiver,
                    {
                        mid,
                        direction,
                        currentDirection,
                        sender: senderDetails,
                        receiver: receiverDetails,
                    },
                ];
            });
    }

    const displayOptArray = (optArray: Array<unknown> | undefined) => new Array(optArray).flatMap((elem) => JSON.stringify(elem));
    const displayTrack = (maybeTrack: MediaStreamTrack | null) => JSON.stringify(maybeTrack?.constructor?.name)

    onMount(async () => {
        const interval = setInterval(() => {
            if (transceivers) {
                updateDetails();
            }
        }, 1000);

        await tick();
        peerconnection.addEventListener('track', ({ track, transceiver, streams }) => {
            const stream = streams[0] || new MediaStream([track]);
            trackMap.set(transceiver, track);
            updateDetails();
        });

        return () => clearInterval(interval);
    });
</script>

<details open={Boolean($config.showTransceivers)}>
    <summary>
        <strong> transceivers</strong>
    </summary>

    {#if transceiverDetails}
        {#each transceiverDetails as [transceiver, transceiverDetail]}
            <div class="grid box">
                <strong>mid:</strong> <code>{transceiverDetail.mid}</code>

                {#if transceiverDetail.mid !== null || transceiverDetail.track}
                    <div>
                        <table>
                            <tr>
                                <th>direction</th>
                                <td>
                                    <strong> <code>{transceiverDetail.currentDirection}</code> </strong>
                                    <em> <code>({transceiverDetail.direction})</code> </em>
                                    <select on:change={({ target }) => (transceiver.direction = target.value)}>
                                        {#each ['sendrecv', 'sendonly', 'recvonly', 'inactive'] as value}
                                            <option {value} selected={value === transceiver.currentDirection}>{value}</option>
                                        {/each}
                                    </select>
                                </td>
                            </tr>

                            {#if trackMap.has(transceiver)}
                                <tr>
                                    <th>track</th>
                                    <td><code>{trackMap.has(transceiver) && trackMap.get(transceiver)}</code></td>
                                </tr>
                            {/if}
                        </table>

                        <hr />
                        <table>
                            <tablehead>
                                <tr> <th colspan="2">sender</th> </tr>
                            </tablehead>

                            <tr>
                                <th>track</th>
                                <td><code>{displayTrack(transceiverDetail.sender.track)}</code></td>
                            </tr>
                            <tr>
                                <th>encodings</th>
                                <td><code>{displayOptArray(transceiverDetail.sender.parameters.encodings)}</code></td>
                            </tr>
                            <tr>
                                <th>rtcp</th>
                                <td><code>{displayOptArray(transceiverDetail.sender.parameters.rtcp)}</code></td>
                            </tr>
                            <tr>
                                <th>ssrcs</th>
                                <td><code>{displayOptArray(transceiverDetail.sender.ssrcs)}</code></td>
                            </tr>
                            <tr>
                                <th>csrcs</th>
                                <td><code>{displayOptArray(transceiverDetail.sender.csrcs)}</code></td>
                            </tr>
                        </table>
                        <Details summary="verbose" data={transceiverDetail.sender} open={false} />

                        <hr />
                        <table>
                            <tablehead>
                                <tr> <th colspan="2">receiver</th> </tr>
                            </tablehead>
                            <tr>
                                <th>track</th>
                                <td><code>{displayTrack(transceiverDetail.receiver.track)}</code></td>
                            </tr>
                            <tr>
                                <th>ssrcs</th>
                                <td><code>{displayOptArray(transceiverDetail.receiver.ssrcs)}</code></td>
                            </tr>
                            <tr>
                                <th>csrcs</th>
                                <td><code>{displayOptArray(transceiverDetail.receiver.csrcs)}</code></td>
                            </tr>
                        </table>

                        <Details summary="verbose" data={transceiverDetail.receiver} open={false} />
                    </div>

                    <div>
                        <button class="btn-small" on:click={getStreamFromSource(transceiver.sender)}>replaceTrack</button>
                        <button class="btn-small" on:click={() => transceiver.sender.replaceTrack(null)}
                            >replaceTrack(null)</button
                        >
                        {#if trackMap.has(transceiver)}
                            <button class="btn-small" on:click={() => dispatch('track', trackMap.get(transceiver))}
                                >display track</button
                            >
                        {/if}
                        <button class="btn-small" on:click={() => transceiver.stop()}>stop</button>
                        <button class="btn-small" on:click={() => peerconnection.removeTrack(transceiver.sender)}
                            >removeTrack</button
                        >
                    </div>
                {/if}
            </div>
        {/each}
    {/if}
    <button on:click={addTransceiver}>add video transceiver</button>
    <button class="btn-small" on:click={updateDetails}>update</button>
</details>

<style>
    .grid {
        flex: grid;
    }
    th {
        text-align: left;
    }
    tablehead th {
        font-size: larger;
    }
</style>
