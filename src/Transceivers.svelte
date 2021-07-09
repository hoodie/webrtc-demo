<script>
	import { onMount } from 'svelte';

    import Details from './Details.svelte';
    export let name;
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
                                console.debug({name, receiverDetails})
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

    #box{
        width: 450px;
        display: block;
        padding: 0em 0.5em;
        margin: 0 1em 1em 0;
        border: 1px solid #aaa;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    }
</style>

<div id="box">
    <h5>transceivers</h5>
{#if transceiverDetails}
    {#each transceiverDetails as transceiverDetail}
        <Details
            summary={`transceiver ${transceiverDetail.mid}`}
            data={transceiverDetail}
            />
    {/each}
{/if}

</div>