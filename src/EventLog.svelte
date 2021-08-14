<script lang="ts">
    import { eventLog } from './store';

    let reversed = true;
    let length = 80

    $: shownLog = reversed
        ? $eventLog.filter((e) => e.event).reverse().slice(0,length)
        : $eventLog.filter((e) => e.event).slice(0,length);

</script>

<style>
    table {
        max-height: 80vh;
        overflow-y: scroll;
    }
    code.timestamp {
        color: gray;
        font-size: 0.9em;
    }
    input[type=number] {
        font-size: x-small;
    }
    .box {
        max-height: 400px;
        overflow-y: scroll;
    }
</style>

<section>
    <h3>
        Event Log <small>
            please open
            <code>about://webrtc-internals</code>
        </small>
    </h3>

    <label for="reverse">
        <input type="checkbox" name="reverse" id="reverse" bind:checked={reversed} />
        reversed
    </label>
    <label for="reverse">
        <input type="number" name="length" id="length" bind:value={length} /> of {$eventLog.length}
    </label>

    <div class="box">
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
</section>
