<script lang="ts">
	import { onMount } from 'svelte';

    import Details from './Details.svelte';
    export let peerconnection;

    $: transceivers = peerconnection && peerconnection.getTransceivers();
    let transceiverDetails;

	onMount(() => {
		const interval = setInterval(() => {
            if(transceivers) {
                transceiverDetails = 
                    transceivers
                        // .map(x => {
                        //     console.debug(name, x)
                        //     return x
                        // })
                        // .filter(({mid}) => Boolean(mid))
                        .map(({mid, direction, currentDirection, stopped, sender, receiver}) => {
                            let senderDetails = {};
                            let receiverDetails = {};
                            {
                                let {dtmf, track, transport} = sender;
                                senderDetails = {
                                    dtmf, track, transport,
                                    parameters: sender.getParameters && sender.getParameters(),
                                }
                            }
                            {
                                let {dtmf, track, transport} = receiver;
                                receiverDetails = {
                                    dtmf, track, transport,
                                    parameters: receiver.getParameters && receiver.getParameters(),
                                    csrcs: receiver.getContributingSources(),
                                    ssrcs: receiver.getSynchronizationSources()
                                }
                            }
                            return {
                                mid, direction, currentDirection,
                                stopped,
                                sender: senderDetails,
                                receiver: receiverDetails,
                            };
                        })
                // if (transceiverDetails) {
                //     console.debug(name, transceiverDetails)
                // }
            }
		}, 1000);

		return () => clearInterval(interval);
	});
</script>


<style>

</style>

<h5>transceivers</h5>
{#if transceiverDetails}
    {#each transceiverDetails as transceiverDetail}
        {`transceiver ${transceiverDetail.mid}`}
        <table>
            <tr>
                <th>mid</th>
                <td><code>{transceiverDetail.mid}</code></td>
            </tr>
        </table>
        <Details
            summary='details'
            data={transceiverDetail}
            open={false}
            />
    {/each}
{/if}
