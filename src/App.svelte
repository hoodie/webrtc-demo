<script lange="ts">
    // import Slides from './Slides.svelte';
    import Demo from './Demo.svelte';
    import UpstreamAudio from './UpstreamAudio.svelte';
    import UpstreamVideo from './UpstreamVideo.svelte';

    import { config } from './store';
</script>

{#if $config.audioVisOnly}
<section>

    <article class="box">
        <UpstreamAudio />
    </article>
    <article class="box">
        <UpstreamVideo />
    </article>
</section>
{:else}
    <Demo />
{/if}
