<script lang="ts">
    import { onMount, tick, createEventDispatcher } from 'svelte';
    import { config } from './store';
    import RtpReceiver from './views/RtpReceiver.svelte';
    import RtpSender from './views/RtpSender.svelte';
    import Track from './views/Track.svelte';

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
        transceiverDetails = peerconnection && peerconnection.getTransceivers();
    }

    onMount(async () => {
        const interval = setInterval(() => {
            if (transceivers) {
                updateDetails();
            }
        }, 1000);

        await tick();
        peerconnection.addEventListener('track', ({ track, transceiver }) => {
            trackMap.set(transceiver, track);
            updateDetails();
        });

        return () => clearInterval(interval);
    });
</script>

<details open={Boolean($config.showTransceivers)}>
    <summary>
        <h5>transceivers</h5>
    </summary>

    {#if transceiverDetails}
        {#each transceiverDetails as transceiver}
            <div class="grid box">
                {#if transceiver.mid !== null || transceiver.track || true}
                    <div>
                        <table class="vertical">
                            <tr>
                                <th>mid</th>
                                <td>
                                    <code>{transceiver.mid}</code>
                                </td>
                            </tr>
                            <tr>
                                <th>direction</th>
                                <td>
                                    <select on:change={({ target }) => (transceiver.direction = target['value'])}>
                                        {#each ['sendrecv', 'sendonly', 'recvonly', 'inactive'] as value}
                                            <option
                                                {value}
                                                selected={value === transceiver.currentDirection ||
                                                    (value === 'inactive' && transceiver.currentDirection === null)}
                                                >{value}</option
                                            >
                                        {/each}
                                    </select>
                                    <strong> → <code>{transceiver.currentDirection}</code> </strong>
                                </td>
                            </tr>

                            {#if trackMap.has(transceiver)}
                                <tr>
                                    <th>track</th>
                                    <td> <Track track={trackMap.get(transceiver)} /> </td>
                                </tr>
                            {/if}
                        </table>

                        <hr />
                        <RtpSender sender={transceiver.sender} />

                        <hr />
                        <RtpReceiver receiver={transceiver.receiver} />
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
</style>
