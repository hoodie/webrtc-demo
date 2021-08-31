<script lang="ts">
    import { onMount } from 'svelte';
    import Details from '../Details.svelte';
    import { addEvent } from '../store';
    import DtlsTransport from './DtlsTransport.svelte';

    import Track from './Track.svelte';

    export let sender: RTCRtpSender;
    export let open = false;
    export let mediaStream: MediaStream | undefined = undefined;
    export let onRemove: Function = () => console.warn('no callback');

    function replaceTrack(stream: MediaStream, sender: RTCRtpSender) {
        addEvent('rts', 'replace track per sender');
        console.info('replace track', { sender });
        sender.replaceTrack(stream.getTracks()[0]);
    }

    let parameters;
    onMount(() => {
        const interval = setInterval(() => {
            parameters = sender?.getParameters?.();
        }, 500);
        return () => clearInterval(interval);
    });
</script>

{#if sender}
    <details bind:open>
        <summary>Sender</summary>
        {#if open}
            <table class="vertical">
                <tr>
                    <th>track </th>
                    <td>
                        <Track track={sender.track} />
                    </td>
                </tr>
                <tr>
                    <th> parameters </th>
                    <td> <Details summary={'verbose'} data={parameters} open={false} /> </td>
                </tr>
                <tr>
                    <th> transport </th>
                    <td><DtlsTransport transport={sender.transport} /></td>
                </tr>
                {#if parameters}
                    <tr>
                        <th>rtcp</th>
                        <td><code>{JSON.stringify(parameters.rtcp)}</code></td>
                    </tr>
                    <tr>
                        <th>encodings</th>
                        <td><code>{JSON.stringify(parameters.encodings)}</code></td>
                    </tr>
                {/if}
            </table>
            <button class="btn-small" on:click={() => replaceTrack(mediaStream, sender)} disabled={!Boolean(mediaStream)}>
                replaceTrack
            </button>
            <button class="btn-small" on:click={() => onRemove(sender)}> remove </button>
        {/if}
    </details>
{/if}
