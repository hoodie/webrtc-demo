<style>
    code {
        color: red;
    }
</style>
<script>
    import { query, config, configUrl, eventLog } from './store.js';

    const boolable = value => {
        try {
            return JSON.parse(value) === 'boolean';
        } catch {return false}
    };

    const checkConfig = ({target: {value, name}}) => {
        config.update(config => ({...config, [name]: value === 'on'}));
    }
</script>

<details>
    <summary>config</summary>
    <code><pre>
    <a href={$configUrl}>{$configUrl}</a>
    </pre> </code>

    <table>
    {#each $query as {key, value}, i}
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