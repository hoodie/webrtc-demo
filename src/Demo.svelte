<script>
    import { config } from './store.js';

    import Config from './Config.svelte';
    import Participant from './Participant.svelte';
    import EventLog from './EventLog.svelte';
</script>

<style>
    main {
        display: flex;
        grid-template-columns: 1fr 1fr 1fr;
    }

    div {
        padding: 1em;
    }
</style>

<div>
    <h1>WebRTC Plumber</h1>
    <main>

        {#if $config.hasCaller}
            <Participant name="alice" isCaller="true" recipient="bob" />
        {/if}

        {#if $config.hasReceiver}
            <Participant name="bob" isReceiver="true" recipient="alice" />
        {/if}

        {#if !$config.hideSignaling}
            <EventLog />
        {/if}
    </main>

    <aside>
        <Config />
    </aside>

</div>
