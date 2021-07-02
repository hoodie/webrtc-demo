<script>
    import Details from './Details.svelte';
    import { onMount, createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let upstreamSource = getWebcamFeed;
    let upstreamVideo;
    let upstreamStream;
    $: mainTrack = upstreamStream && upstreamStream.getTracks()[0];

    async function getWebcamFeed() {
        return await navigator.mediaDevices.getUserMedia({ video: true });
    }

    function getNoiseFeed() {
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

    async function startUpstream() {
        const stream = await upstreamSource();
        console.debug({ stream });
        upstreamStream = stream;
        upstreamVideo.srcObject = stream;
        dispatch('stream', stream);
    }

    onMount(() => {});
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
        display: flex;
    }
</style>

<label for="upstream">upstream</label>
<video id="upstream" bind:this={upstreamVideo} autoplay="true" width="400" height="300">
    <track kind="captions" />
</video>
<nav>

    <button on:click={startUpstream}>start upstream</button>
    <span>
        <label>
            <input type="radio" bind:group={upstreamSource} value={getWebcamFeed} />
            webcam
        </label>

        <label>
            <input type="radio" bind:group={upstreamSource} value={getNoiseFeed} />
            noise
        </label>
    </span>
</nav>

{#if mainTrack}
    <Details summary="settings" data={mainTrack.getSettings()} />
    <Details summary="constraints" data={mainTrack.getConstraints()} />
{/if}
