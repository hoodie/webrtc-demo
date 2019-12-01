<script>
    import { config, eventLog } from './store.js';
    import { offerStore, answerStore, candidatesStore } from './signalingStore.js';

    import Config from './Config.svelte';
    import Participant from './Participant.svelte';

</script>

<style>
    section {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
    }

    div {
        padding: 1em;
        border: 1px solid #aaa;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 0 1em 0;
    }

    code {
        color: red;
    }
</style>

<div>
    <aside>
        <Config/>
    </aside>

    <section>

        {#if $config.hasCaller}
        <Participant name="alice" isCaller="true" recipient="bob"/>
        {/if}

        {#if $config.hasReceiver}
        <Participant name="bob" isReceiver="true" recipient="alice"/>
        {/if}

        <div>
            <ol>
                {#each $eventLog.filter(e => e.event) as { name, event }}
                <li>{name}: {event}</li>
                {/each}
            </ol>

            <em> please open <code>chrome://webrtc-internals</code> </em>
        </div>
    </section>
</div>
