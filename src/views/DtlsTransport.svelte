<script lang="ts">
    import Details from '../Details.svelte';

    interface RTCDtlsTransport {
        readonly state: string;
        readonly iceTransport: RTCIceTransport;
    }
    export let transport: RTCDtlsTransport;
</script>

{#if transport}
    state: {transport.state}
    <Details
        summary="iceTransport"
        open={false}
        data={() => ({
            role: transport.iceTransport.role,
            component: transport.iceTransport.component,
            state: transport.iceTransport.state,
            gatheringState: transport.iceTransport.gatheringState,
            // localCandidates: transport.iceTransport.getLocalCandidates(),
            // remoteCandidates: transport.iceTransport.getRemoteCandidates(),
            // localParameters: transport.iceTransport.getLocalParameters(),
            // remoteParameters: transport.iceTransport.getRemoteParameters(),
            // pair: transport.iceTransport.getSelectedCandidatePair(),
        })}
    />
{/if}
