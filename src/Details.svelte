<script lang="ts">
    export let open: boolean;
    export let summary = '???';
    export let data: any;

    let isOpen = Boolean(data) && open;
</script>

<details bind:open={isOpen}>
    <summary>{summary}</summary>
    <pre>
        {#if typeof data === 'function'}
        <strong>
            {#if open}
            {JSON.stringify(data())}
            {/if}
        </strong>
        {:else}
        <code>{JSON.stringify(data, null, 4)}</code>
        {/if}
    </pre>
</details>
