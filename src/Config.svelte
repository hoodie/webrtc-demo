<script>
    import { query, configUrl } from './store';
</script>

<details>
    <summary>Config</summary>
    <div>
        <table>
            {#each $query as { key, value }}
                <tr>
                    <td>{key}</td>
                    <td>
                        {#if typeof value === 'boolean'}
                            <input type="checkbox" bind:checked={value} />
                        {:else}
                            <input type="text" bind:value />
                        {/if}
                    </td>
                </tr>
            {/each}
        </table>

        <code><pre> <a href={$configUrl}>{$configUrl}</a> </pre> </code>

    </div>
</details>

<style>
    details {
        position: absolute;
        width: 80vw;
        z-index: 10;
        padding: 0em 0.5em;
    }

    details[open] {
        border: 1px solid #aaa;
        border-radius: 2px;
        background-color: white;
    }
    details summary {
        font-weight: bolder;
        float: right;
    }

    details > summary::before {
        content: '⚙️️';
    }

    details[open] > summary::before {
        content: '⚙️️';
    }
</style>
