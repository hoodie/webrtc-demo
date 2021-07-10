<script>
    // import Slides from './Slides.svelte';
    import Demo from './Demo.svelte';
    import UpstreamAudio from './UpstreamAudio.svelte';

    import { config } from './store.js';

</script>

{#if $config.audioVisOnly}
<article class="box">
<UpstreamAudio />
</article>
{:else}
<Demo />
{/if}
