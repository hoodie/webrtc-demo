<script>
    import { config, eventLog } from './store.js';
</script>

<ol>
    {#each $eventLog.filter(e => e.event) as { name, event }}
        <li>{name}: {event}</li>
    {/each}
</ol>

<em>
    please open
    <code>chrome://webrtc-internals</code>
</em>
