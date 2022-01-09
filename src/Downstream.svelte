<script lang="ts">
    import Track from './views/Track.svelte';
    export let stream: MediaStream | undefined;

    let videoTag: HTMLVideoElement;
    $: mainTrack = stream && stream.getTracks()[0];

    $: {
        if (videoTag) videoTag.srcObject = stream;
    }
</script>

<h5>downstream</h5>

<video bind:this={videoTag} autoplay={true}>
    <track kind="captions" />
</video>

{#if mainTrack}
    <Track track={mainTrack} />
{/if}

<style>
</style>
