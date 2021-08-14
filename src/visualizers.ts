export interface AnalyserRenderer {
    start(): void;
    stop(): void;
}

interface RenderWaveFormConfig {
    analyser: AnalyserNode;
    canvas: HTMLCanvasElement;
}

export function renderVolume({ analyser, canvas }: RenderWaveFormConfig): AnalyserRenderer {
    console.log('creating renderer', { analyser, canvas });
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationHandle: number;

    function draw() {
        analyser.getByteTimeDomainData(dataArray);

        // clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '15px sans-serif';
        ctx.strokeStyle = 'rgb(255, 255, 255)'

        let maxValue = 0;

        ctx.lineWidth = 5;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height)/ 2;
            if (y > maxValue) {
                maxValue = y
            }
        }

        let volume = (maxValue - 75)*2;
        let amplitudePoint = canvas.height - volume

        ctx.beginPath();
        ctx.moveTo(0, amplitudePoint);
        ctx.lineTo(canvas.width, amplitudePoint);
        ctx.stroke();

        ctx.fillStyle = 'rgb(100,255,100)';
        ctx.fillRect(0, canvas.height, canvas.width, -canvas.height+amplitudePoint);

        ctx.fillStyle = 'rgb(0,0,0)'
        ctx.fillText(String(volume), canvas.width-40, canvas.height-10)


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

export function renderFloatBars({ analyser, canvas }: RenderWaveFormConfig): AnalyserRenderer {
    console.log('creating renderer', { analyser, canvas });
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    let animationHandle: number;

    const {width: WIDTH, height: HEIGHT} = canvas;

    function draw() {

        analyser.getFloatFrequencyData(dataArray);
  
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
        var barWidth = (WIDTH / bufferLength) * 2.5;
        var barHeight;
        var x = 0;
  
        for(var i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] + 140)*2;
          
          ctx.fillStyle = 'rgb(' + Math.floor(barHeight+100) + ',50,50)';
          ctx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);
  
          x += barWidth + 1;
        }

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
