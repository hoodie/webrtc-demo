<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { renderWaveForm } from './visualizers';
    const dispatch = createEventDispatcher();

    let upstreamAudio: HTMLAudioElement;
    let audioDevices: Array<MediaDeviceInfo> = [];

    let canvas: HTMLCanvasElement;
    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let renderer: ReturnType<typeof renderWaveForm>;
    let currentSource: MediaStreamAudioSourceNode

    function initAnalyzer(): void {
        if (audioCtx) return;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
    }

    function initRenderer(): void {
        renderer = renderWaveForm({ analyser, canvas });
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
    }

    function makeMainStream(stream: MediaStream) {
        upstreamAudio.srcObject = stream;
        pluginStream(stream);
        dispatch('stream', stream);
    }

    function disconnectStream() {
        console.debug('disconnecting', currentSource)
        currentSource?.disconnect(analyser);
        currentSource = undefined
    }
    
    function pluginStream(stream: MediaStream) {
        disconnectStream()

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        currentSource = source
    }

    onMount(() => {
        getAudioDevices();
        const keepUpdatingDevices = () => getAudioDevices();
        navigator.mediaDevices.addEventListener('devicechange', keepUpdatingDevices);

        initAnalyzer();
        initRenderer();
        renderer.start()

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', keepUpdatingDevices);
        };
    });
</script>
<style>
    nav {
        display: block;
    }
    button {
        font-size: small;
    }
</style>


<h5>audio devices</h5>

<audio id="upstream" bind:this={upstreamAudio} autoplay={false} controls={true}>
    <track kind="captions" />
</audio>

<nav>
    {#each audioDevices as device, index}
        <button on:click={() => getAudioStream(device.deviceId)}>
            {device.label || `micorophone ${index}`}
        </button>
    {/each}
</nav>

<canvas bind:this={canvas} />
