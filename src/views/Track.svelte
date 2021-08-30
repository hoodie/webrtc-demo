<script lang="ts">
    export let track: MediaStreamTrack;
    $: width = track?.getSettings().width;
    $: height = track?.getSettings().height;
</script>

{#if track}
    <details>
        <summary>
            {track.constructor.name}
            {#if width} | {width}x{height} {/if}
            | {track.readyState}
            | {track.muted ? 'muted' : 'unmuted'}
        </summary>
        <pre>{JSON.stringify({
            id: track.id,
            settings: track.getSettings(),
            constraints: track.getConstraints()
        }, null, 4)}</pre>
    </details>
{/if}
