<script>
    import { onMount, createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let upstreamAudio;
    let upstreamStream;
    let audioDevices = [];
    let isDrawing = false;

    let canvas;
    let canvasCtx;
    let audioCtx;
    let analyser;
    let bufferLength;
    let dataArray;

    async function getAudioDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioDevices = devices.filter(({ kind }) => kind === 'audioinput');
    }

    async function getMicStream(deviceId) {
        const constraint = {
            audio: deviceId ? { deviceId } : true,
        };
        return await navigator.mediaDevices.getUserMedia(constraint);
    }

    function getDeviceLabel(id) {
        const device = id && audioDevices.find(({ deviceId }) => deviceId === id);
        return device && device.label;
    }

    async function getAudioStream(deviceId) {
        const stream = await getMicStream(deviceId);
        stream.name = getDeviceLabel(deviceId);
        makeMainStream(stream);
    }

    function makeMainStream(stream) {
        upstreamStream = stream;
        upstreamAudio.srcObject = stream;
        dispatch('stream', stream);
    }

    function initAnalyzer() {
        if (audioCtx) return;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    function pluginStream(stream) {
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
    }

    function startDrawing() {
        if (isDrawing) return
        isDrawing = true;
        requestAnimationFrame(draw);
    };

    function stopDrawing() {
        isDrawing = false;
        requestAnimationFrame(draw);
    };

    function draw() {
        if (isDrawing) {
            requestAnimationFrame(draw);
        }

        analyser.getByteTimeDomainData(dataArray);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        let sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    onMount(() => {
        getAudioDevices();
        navigator.mediaDevices.addEventListener('devicechange', (deviceChange) => {
            navigator.mediaDevices.enumerateDevices().then((devices) => getAudioDevices());
        });

        canvasCtx = canvas.getContext('2d');
        initAnalyzer();
    });
</script>

<h5>audio devices</h5>

<audio id="upstream" bind:this={upstreamAudio} autoplay="false" controls="true">
    <track kind="captions" />
</audio>

<nav>
    {#each audioDevices as device, index}
        <button on:click={() => getAudioStream(device.deviceId)}>
            {device.label || `micorophone ${index}`}
        </button>
    {/each}
    <hr />
    <button on:click={() => pluginStream(upstreamStream)}> pluginStream </button>
    <button on:click={() => startDrawing()}> start drawing </button>
    <button on:click={() => stopDrawing()}> stop drawing </button>
</nav>

<canvas bind:this={canvas} />
