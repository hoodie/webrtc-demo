<script lange="ts">
    // import Slides from './Slides.svelte';
    import Demo from './Demo.svelte';
    import UpstreamAudio from './UpstreamAudio.svelte';

    import { config } from './store';

</script>

{#if $config.audioVisOnly}
testdd
<article class="box">
<UpstreamAudio />
</article>
{:else}
<Demo />
{/if}
