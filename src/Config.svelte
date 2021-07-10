<script>
    import { query, configUrl } from './store';

</script>

<details>
    <summary>config</summary>
    <code><pre>
    <a href={$configUrl}>{$configUrl}</a>
    </pre> </code>

    <table>
    {#each $query as {key, value}}
        <tr>
            <td>{key}</td>
            <td>
            {#if typeof value === 'boolean'}
            <input type="checkbox" bind:checked={value}/>
            {:else}
            <input type="text" bind:value={value}/>
            {/if}
            </td>
        </tr>
    {/each}
    </table>
</details>