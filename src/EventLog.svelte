<script lang="ts">
    import { onMount } from 'svelte';

    import { eventLog } from './store';

    let table: HTMLDivElement;
    let filterTerm = '';

    $: shownLog =
        filterTerm && filterTerm.length
            ? $eventLog.filter(({ event, short, name }) => {
                  return event?.match(filterTerm) || name?.match(filterTerm) || short?.includes(filterTerm);
              })
            : $eventLog;

    onMount(() => {
        eventLog.subscribe(() => {
            table.scrollTop = table.scrollHeight;
        });
    });
</script>

<section id="EventLog">
    <h3>
        Event Log <small>
            please open
            <code>about://webrtc-internals</code>
        </small>
    </h3>

    <div class="box" bind:this={table}>
        <table class="vertical">
            {#each shownLog as { name, event, timestamp }}
                <tr>
                    <td><code class="timestamp"> {timestamp} </code> </td>
                    <th>{name}:</th>
                    <td><code> {event} </code> </td>
                </tr>
            {/each}
        </table>
    </div>

    <label for="filterTerm">
        <input type="text" name="filterTerm" id="filterTerm" bind:value={filterTerm} placeholder="filter" />
    </label>
</section>

<style>
    table {
        max-height: 80vh;
        overflow-y: scroll;
        padding-bottom: 2em;
    }
    code.timestamp {
        color: gray;
        font-size: 0.9em;
    }
    input#filterTerm {
        font-size: x-small;
        margin: 0 auto;
        width: 100%;
    }
    .box {
        margin: 0 auto;
        height: 400px;
        max-height: 400px;
        overflow-y: scroll;
    }
</style>
