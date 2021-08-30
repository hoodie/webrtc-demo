<script lang="ts">
    import { onMount } from 'svelte';
    import Details from '../Details.svelte';
    import DtlsTransport from './DtlsTransport.svelte';

    import Track from './Track.svelte';

    export let receiver: RTCRtpReceiver;
    export let open = false;

    let parameters, csrcs, ssrcs;
    onMount(() => {
        const interval = setInterval(() => {
            parameters = receiver?.getParameters?.();
            csrcs = receiver.getContributingSources();
            ssrcs = receiver.getSynchronizationSources();
        }, 500);
        return () => clearInterval(interval);
    });
</script>

{#if receiver}
    <details bind:open>
        <summary>Receiver</summary>
        {#if open}
            <table class="vertical">
                <tr>
                    <th>track </th>
                    <td> <Track track={receiver.track} /> </td>
                </tr>
                <tr>
                    <th> parameters </th>
                    <td> <Details summary={'verbose'} data={parameters} open={false} /> </td>
                </tr>
                <tr>
                    <th> transport </th>
                    <td><DtlsTransport transport={receiver.transport} /></td>
                </tr>
                <tr>
                    <th>ssrcs</th>
                    <td><code>{JSON.stringify(ssrcs)}</code></td>
                </tr>
                <tr>
                    <th>csrcs</th>
                    <td><code>{JSON.stringify(csrcs)}</code></td>
                </tr>
            </table>
        {/if}
    </details>
{/if}
