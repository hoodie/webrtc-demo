<script>
    import Details from './Details.svelte';
    export let stream;

    let videoTag;
    $: mainTrack = stream && stream.getTracks()[0];

    $: {
        if (videoTag) videoTag.srcObject = stream;
    }
</script>

<style>

</style>

<label for="downstream">downstream</label>
<video bind:this={videoTag} autoplay="true" width="400" height="300">
    <track kind="captions" />
</video>

{#if mainTrack}
    <Details summary="settings" data={mainTrack.getSettings()} />
    <Details summary="constraints" data={mainTrack.getConstraints()} />
{/if}
