<script>
    import { query, configUrl } from './store';
</script>

<details>
    <summary>Config</summary>
    <div>
        <table>
            {#each $query as { key, value }}
                <tr>
                    {#if typeof value === 'boolean'}
                        <td colspan="2">
                            <label for={key}>
                                <input type="checkbox" bind:checked={value} id={key} />
                                {key}
                            </label>
                        </td>
                    {:else}
                        <td>{key} </td>
                        <td>
                            <input type="text" bind:value />
                        </td>
                    {/if}
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
        background-color: var(--body-background);
    }
    details summary {
        font-weight: bolder;
        float: right;
    }

    details > summary::before {
        content: '⚙️️';
    }

    details[open] > summary::before {
        content: '⚙️ ️';
    }
</style>
