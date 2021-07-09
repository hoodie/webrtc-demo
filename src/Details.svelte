<script>
    export let open = true;
    export let summary = '???';
    export let data;
</script>

<style>
    code {
        color: #900;
    }
</style>

<details open={Boolean(data) && open}>
    <summary>{summary}</summary>
    <pre>
        <code>{JSON.stringify(data, null, 4)}</code>
    </pre>
</details>
