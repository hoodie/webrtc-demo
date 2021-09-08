<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { renderFloatBars, renderVolume, renderWaveForm } from './visualizers';

    export let open;

    const dispatch = createEventDispatcher();

    let upstreamAudio: HTMLAudioElement;
    let currentActiveStream: MediaStream | undefined;
    let audioDevices: Array<MediaDeviceInfo> = [];
    let audioStreams: Array<MediaStream> = [];

    let canvas: HTMLCanvasElement;
    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let renderer: ReturnType<typeof renderWaveForm>;
    let currentSource: MediaStreamAudioSourceNode;

    function initAnalyzer(): void {
        if (audioCtx) return;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
    }

    function initRendererWaveForm(): void {
        if (renderer) {
            renderer.stop();
        }
        renderer = renderWaveForm({ analyser, canvas });
        renderer.start();
    }
    function initRendererBars(): void {
        if (renderer) {
            renderer.stop();
        }
        renderer = renderFloatBars({ analyser, canvas });
        renderer.start();
    }

    function initRendererVolume(): void {
        if (renderer) {
            renderer.stop();
        }
        renderer = renderVolume({ analyser, canvas });
        renderer.start();
    }

    async function getAudioDevices(): Promise<void> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioDevices = devices.filter(({ kind }) => kind === 'audioinput');
    }

    async function getMicStream(deviceId: string) {
        const constraint = {
            audio: deviceId ? { deviceId } : true,
        };
        return await navigator.mediaDevices.getUserMedia(constraint);
    }

    function getDeviceLabel(id: string) {
        const device = id && audioDevices.find(({ deviceId }) => deviceId === id);
        return device && device.label;
    }

    async function getAudioStream(deviceId: string) {
        const stream = await getMicStream(deviceId);
        stream['name'] = getDeviceLabel(deviceId);
        makeMainStream(stream);
        audioStreams = [...audioStreams, stream];
    }

    function makeMainStream(stream: MediaStream) {
        currentActiveStream = stream;
        upstreamAudio.srcObject = stream;
        pluginStream(stream);
        dispatch('stream', stream);
    }

    function stopStream(stream) {
        stream.getTracks().forEach((track) => track.stop());
        dispatch('stop', stream);
    }

    function deleteStream(stream) {
        stopStream(stream);
        audioStreams = [...audioStreams.filter((s) => s != stream)];
        if (currentActiveStream === stream) {
            currentActiveStream = undefined;
        }
    }

    function disconnectStream() {
        console.debug('disconnecting', currentSource);
        currentSource?.disconnect(analyser);
        currentSource = undefined;
    }

    function pluginStream(stream: MediaStream) {
        disconnectStream();

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        currentSource = source;
    }

    onMount(() => {
        getAudioDevices();
        const keepUpdatingDevices = () => getAudioDevices();
        navigator.mediaDevices.addEventListener('devicechange', keepUpdatingDevices);

        initAnalyzer();
        initRendererVolume();

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', keepUpdatingDevices);
        };
    });
</script>

<details bind:open>
    <summary>
        <h5>audio</h5>
    </summary>

    <canvas bind:this={canvas} />

    <nav>
        {#each audioDevices as device, index}
            <button on:click={() => getAudioStream(device.deviceId)}>
                {device.label || `micorophone ${index}`}
            </button>
        {/each}
        <audio id="upstream" bind:this={upstreamAudio} autoplay={false} controls={Boolean(currentActiveStream)}>
            <track kind="captions" />
        </audio>
    </nav>

    <button on:click={() => initRendererBars()}>bars</button>
    <button on:click={() => initRendererWaveForm()}>waveform</button>
    <button on:click={() => initRendererVolume()}>volume</button>

    <table>
        {#each audioStreams as stream}
            <tr>
                <td>
                    {#if currentActiveStream === stream}✔️{/if}
                </td>
                <td> <button on:click={() => makeMainStream(stream)}> {stream['name']}</button></td>
                <td> <button on:click={() => stopStream(stream)}>stop</button> </td>
                <td> <button on:click={() => deleteStream(stream)}>X</button> </td>
            </tr>
        {/each}
    </table>
</details>

<style>
    nav {
        display: block;
    }
    button {
        font-size: small;
    }
</style>
