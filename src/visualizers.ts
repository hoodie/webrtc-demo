export interface AnalyserRenderer {
    start(): void;
    stop(): void;
}

interface RenderWaveFormConfig {
    analyser: AnalyserNode;
    canvas: HTMLCanvasElement;
}

// thanks to https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
export function renderWaveForm({ analyser, canvas }: RenderWaveFormConfig): AnalyserRenderer {
    console.log('creating renderer', { analyser, canvas });
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationHandle: number;

    function draw() {
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(255, 255, 255)';

        ctx.beginPath();

        let sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        animationHandle = requestAnimationFrame(draw);
    }

    return {
        start() {
            if (typeof animationHandle == 'undefined') {
                draw()
            }

        },
        stop() {
            cancelAnimationFrame(animationHandle);
            animationHandle = undefined;
        },
    };
}
