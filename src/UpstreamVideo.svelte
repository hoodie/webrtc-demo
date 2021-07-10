<script>
    import Details from './Details.svelte';
    import { onMount, createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let upstreamVideo;
    let upstreamStream;
    $: mainTrack = upstreamStream && upstreamStream.getTracks()[0];
    $: upstreamName = upstreamStream && upstreamStream.constructor.name
    $: hasStream = Boolean(upstreamStream);
    let videoDevices = [];
    let videoStreams = [];

    async function getWebcamFeed(deviceId) {
        const constraint = {
                video: deviceId ? {deviceId} : true
            };
        return await navigator
            .mediaDevices
            .getUserMedia(constraint);
    }

    function makeNoise() {
        let canvas = Object.assign(document.createElement('canvas'), { width: 400, height: 300 });
        let ctx = canvas.getContext('2d');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let p = ctx.getImageData(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(function draw() {
            for (var i = 0; i < p.data.length; i++) {
                p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
            }
            ctx.putImageData(p, 0, 0);
            requestAnimationFrame(draw);
        });
        return canvas.captureStream(60);
    }

    async function getNoise() {
        const stream = await makeNoise()
        stream.name = 'noise feed'
        makeMainStream(stream)
        videoStreams = [...videoStreams, stream]
    }

    async function getWebcam(deviceId) {
        const stream = await getWebcamFeed(deviceId)
        stream.name = deviceId ? getDeviceLabel(deviceId) : 'default webcam'
        makeMainStream(stream)
        videoStreams = [...videoStreams, stream]
    }

    function makeMainStream(stream) {
        upstreamStream = stream
        upstreamVideo.srcObject = stream;
        dispatch('stream', stream)
    }

    function useStream(stream) {
        dispatch('stream', stream)
    }

    function stopStream(stream) {
        stream.getTracks().forEach((track) => track.stop())
        dispatch('stop', stream)
    }

    function deleteStream(stream) {
        stopStream(stream)
        videoStreams = [...videoStreams.filter(s => s != stream)]
        if (upstreamStream === stream) {
            upstreamStream = undefined
        }
    }

    function getDeviceLabel(id) {
        const device = id && videoDevices.find(({ deviceId }) => deviceId === id)
        return device && device.label
    }

    async function getVideoDevices() {
        const devices = await navigator
            .mediaDevices
            .enumerateDevices()
            videoDevices = devices.filter(({kind}) => kind === 'videoinput')
    }

    onMount(() => {
        getVideoDevices();
        navigator.mediaDevices.addEventListener('devicechange', (deviceChange) => {
            navigator.mediaDevices.enumerateDevices().then(devices => getVideoDevices())
        })
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

<h5>upstream</h5>

<video id="upstream" bind:this={upstreamVideo} autoplay="true">
    <track kind="captions" />
</video>

<nav>

    <button on:click={() => getWebcam()}>default</button>
    <button on:click={() => getNoise()}>noise</button>
    <br>
    {#each videoDevices as device, index}
    <button
        on:click={() => getWebcam(device.deviceId)}
        >
        {device.label || `camera ${index}`}
    </button>
    {/each}

</nav>

<table>
{#each videoStreams as stream}
<tr>
    <td>{#if upstreamStream === stream}✔️{/if}</td>
    <td> <button on:click={() => makeMainStream(stream)}> {stream.name}</button></td>
    <td> <button on:click={() => stopStream(stream)}>stop</button> </td>
    <td> <button on:click={() => deleteStream(stream)}>X</button> </td>
</tr>
{/each}
</table>

{#if mainTrack}
<details>
    <summary> {upstreamName} </summary>

    <dl><dt>readState</dt><dd>{mainTrack.readyState}</dd></dl>

    <Details summary="settings" data={mainTrack.getSettings()} />
    <Details summary="constraints" data={mainTrack.getConstraints()} />
</details>
{/if}