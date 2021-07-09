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
    let selectedVideoDevice;

    async function getWebcamFeed(deviceId = selectedVideoDevice) {
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

    async function getNoise(deviceId) {
        stopUpstream()
        const stream = await makeNoise()
        upstreamStream = stream;
        upstreamVideo.srcObject = stream;
        dispatch('stream', stream);
    }

    async function getWebcam(deviceId) {
        stopUpstream()
        const stream = await getWebcamFeed(deviceId)
        upstreamStream = stream;
        upstreamVideo.srcObject = stream;
        dispatch('stream', stream);
    }

    function stopUpstream() {
        upstreamStream && upstreamStream.getTracks().forEach((track) => track.stop())
        upstreamStream = undefined
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
    video {
        padding: 0.5em;
        border: 1px solid #aaa;
        border-radius: 2px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 0 1em 0;
        background-color: black;
    }
    nav {
        display: block;
    }
    button {
        font-size: small;
    }
</style>

<label for="upstream">upstream</label>
<video id="upstream" bind:this={upstreamVideo} autoplay="true" width="400" height="300">
    <track kind="captions" />
</video>
<nav>

    <button on:click={getWebcam} disabled={hasStream}>default</button>
    <button on:click={getNoise} disabled={hasStream}>noise</button>
    <button on:click={stopUpstream} disabled={!hasStream}>stop</button>
    <br>
    {#each videoDevices as device, index}
    <button on:click={() => getWebcam(device.deviceId)}>{device.label || `camera ${index}`}</button>
    {/each}

</nav>

{#if mainTrack}
<details>
    <summary> {upstreamName} </summary>

    <Details summary="settings" data={mainTrack.getSettings()} />
    <Details summary="constraints" data={mainTrack.getConstraints()} />
</details>
{/if}