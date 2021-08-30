<script lang="ts">
    import { onMount } from 'svelte';

    import Track from './Track.svelte';

    export let stream: MediaStream;
    let active = stream?.active;
    onMount(() => {
        const interval = setInterval(() => {
            active = stream?.active;
        }, 500);
        return () => clearInterval(interval);
    });
</script>

{#if stream}
    {stream.constructor.name}
    ({active ? 'active' : 'inactive'})
    {#each stream.getTracks() as track}
        <Track {track} />
    {/each}
{/if}
