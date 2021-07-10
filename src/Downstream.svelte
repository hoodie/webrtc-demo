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

<h5>downstream</h5>

<video bind:this={videoTag} autoplay="true">
    <track kind="captions" />
</video>

{#if mainTrack}
    <Details summary="settings" data={mainTrack.getSettings()} />
    <Details summary="constraints" data={mainTrack.getConstraints()} />
{/if}
