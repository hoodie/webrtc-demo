<script>
    import { eventLog } from './store.js';
</script>

<style>
    table {
        max-height: 80vh;
        overflow-y: scroll;
    }
</style>

<section>

    <h3>Event Log <small>
        please open
        <code>about://webrtc-internals</code>
    </small></h3>

    <div class="box">



        <table class="vertical">
            {#each $eventLog.filter(e => e.event) as { name, event }}
            <tr>
                <th>{name}:</th>
                <td><code>
                {event}
                </code>
            </td>
            </tr>
            {/each}
        </table>

    </div>

</section>