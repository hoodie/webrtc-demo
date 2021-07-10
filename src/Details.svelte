<script lang="ts">
    export let open = true;
    export let summary = '???';
    export let data: any;
</script>

<details open={Boolean(data) && open}>
    <summary>{summary}</summary>
    <pre>
        <code>{JSON.stringify(data, null, 4)}</code>
    </pre>
</details>
