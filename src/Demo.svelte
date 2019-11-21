<script>
    import queryString from 'query-string';
    import Participant from './Participant.svelte';
    let events = [];
    const addEvent = ({ detail }) => {
        events = [...events, detail];
    };

    let queryParams = queryString.parse(location.search);

    export const hasCaller = queryParams.role != 'recv';
    export const hasReceiver = queryParams.role != 'call' && queryParams.role != 'send';
    export const hasUpstream = queryParams.stream != 'down';
    export const hasDownstream = queryParams.stream != 'up';
    export const isManual = queryParams.manual == 'true' || queryParams.manual == 'yes';
</script>

<style>
    section {
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
    <nav />
    <section>
        {#if hasCaller}
            <Participant
                name="alice"
                isCaller="true"
                {hasUpstream}
                {hasDownstream}
                {isManual}
                recipient="bob"
                on:event={addEvent} />
        {/if}

        {#if hasReceiver}
            <Participant
                name="bob"
                isReceiver="true"
                {hasUpstream}
                {hasDownstream}
                {isManual}
                recipient="alice"
                on:event={addEvent} />
        {/if}

        <ol>
            {#each events.filter(e => e.event) as { name, event }}
                <li>{name}: {event}</li>
            {/each}
        </ol>
        <em>
            please open
            <code>chrome://webrtc-internals</code>
        </em>
    </section>
</div>
