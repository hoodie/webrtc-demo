<script lang="ts">
    export let value: string;
    export let rows: number;
    export let name: string = undefined;
    export let hideSignaling: boolean | string;

    $: mlines = value.split('\n');
    $: mlineCount = mlines.filter((line) => line.startsWith('m=')).length;
    $: directions = Array.from(mlines.filter((line) =>
        line.startsWith('a=sendrecv') ||
        line.startsWith('a=sendonly') ||
        line.startsWith('a=recvonly') ||
        line.startsWith('a=inactive'))
        ,(directions) => (directions?.slice(2)));
</script>

<style>
    textarea {
        color: gray;
        padding: 1em;
        font-size: 0.7em;
        font-family: monospace;
        min-width: calc(100% - 1em);
        resize: vertical;
        box-shadow: inset 2px 2px 8px rgba(0, 0, 0, 0.1);
    }

    .hideSignaling {
        display: none;
    }
</style>

<div>
    <textarea {rows} {name} bind:value class:hideSignaling />
    <div class="box">
        <table class="vertical">
            <tr>
                <th> mlines </th>
                <td> <code> {mlineCount} </code> </td>
            </tr>
            <tr>
                <th> directions </th>
                <td> <code> {directions.join(', ')} </code> </td>
            </tr>
        </table>
    </div>
</div>