<script>
    export let signalingClient;

    $: signalingServer = `wss://${window.location.host}/signaling/test`;
    $:{
        signalingClient.connect({ url: signalingServer });
        window.client = signalingClient;
    }

    function onSubmit() {
        //console.info('submit', {signalingServer})
    }
</script>

<form on:submit|preventDefault={onSubmit}>
    <input bind:value={signalingServer} size="90" placeholder="ws url"/>
</form>

<code>{signalingClient}</code>