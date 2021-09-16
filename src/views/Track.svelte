<script lang="ts">
    import { onMount } from 'svelte';
    import Details from '../Details.svelte';

    export let track: MediaStreamTrack;
    $: width = track?.getSettings().width;
    $: height = track?.getSettings().height;

    let settings: MediaTrackSettings;
    let constraints: MediaTrackConstraints;
    let capabilities: MediaTrackCapabilities;
    onMount(() => {
        const interval = setInterval(() => {
            settings = track?.getSettings?.();
            constraints = track?.getConstraints?.();
            capabilities = track?.getCapabilities?.();
        }, 500);
        return () => clearInterval(interval);
    });
</script>

{#if track}
    <details>
        <summary>
            {track.constructor.name}
            <strong> {track.kind} </strong>
            {#if width} | {width}x{height} {/if}
            | {track.readyState}
            | {track.muted ? 'muted' : 'unmuted'}
        </summary>
        <pre>{JSON.stringify({
            id: track.id,
            kind: track.kind,
            constraints
        }, null, 4)}</pre>
        <div class="indent">
            <Details data={settings} summary="settings" open={true} />
            <Details data={capabilities} summary="capabilities" open={true} />
        </div>
    </details>
{/if}

<style>
    .indent {
        padding-left: 2em;
    }
</style>
