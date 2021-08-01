<script lang="ts">
    import { onMount } from 'svelte';

    import Details from './Details.svelte';
    export let peerconnection: RTCPeerConnection;
    export let streamSource: (() => MediaStream | undefined) | undefined;

    $: transceivers = peerconnection && peerconnection.getTransceivers();
    let transceiverDetails: any[];
    
    function getStreamFromSource(sender: RTCRtpSender) {
        return () => {
            const stream = streamSource();
            const track = stream.getTracks()[0]
            if (track) {
                sender.replaceTrack(track)
            }
        }
    }

    onMount(() => {
        const interval = setInterval(() => {
            if (transceivers) {
                transceiverDetails = transceivers
                    // .map(x => {
                    //     console.debug(name, x)
                    //     return x
                    // })
                    // .filter(({mid}) => Boolean(mid))
                    .map((transceiver) => {
                        const { mid, direction, currentDirection, stopped, sender, receiver } = transceiver;
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
                        return [transceiver, {
                            mid,
                            direction,
                            currentDirection,
                            stopped,
                            sender: senderDetails,
                            receiver: receiverDetails,
                        }];
                    });
                // if (transceiverDetails) {
                //     console.debug(name, transceiverDetails)
                // }
            }
        }, 1000);

        return () => clearInterval(interval);
    });
</script>

<h5>transceivers</h5>
{#if transceiverDetails}
    {#each transceiverDetails as [transceiver, transceiverDetail]}
        <div class="grid box">
            <div>
                {`transceiver ${transceiverDetail.mid}`}
                <table>
                    <tr>
                        <th>mid</th>
                        <td><code>{transceiverDetail.mid}</code></td>
                    </tr>
                    <tr>
                        <th>track</th>
                        <td><code>{transceiverDetail.sender.track}</code></td>
                    </tr>
                </table>
                <Details summary="details" data={transceiverDetail} open={false} />
            </div>
            <div>
                <button class="btn-small" on:click={getStreamFromSource(transceiver.sender)}>replaceTrack</button>
                <button class="btn-small" on:click={() => transceiver.sender.replaceTrack(null)}>replaceTrack(null)</button>
            </div>
        </div>
    {/each}
{/if}

<style>
    .grid {
        flex: grid;
    }
</style>
