import {ElementRef, Injectable} from '@angular/core';

@Injectable()
export class AudioVisualizerService {
  private canvasElement?: ElementRef;

  audioContext?: AudioContext;

  analyser?: AnalyserNode;

  dataArray?:Uint8Array;

  bufferLength = 2048;

  stream: any;

  init(canvasElement: ElementRef) {
    this.canvasElement = canvasElement;
    const self = this;
    requestAnimationFrame(() => self.init(canvasElement))

    const canvas = this.canvasElement?.nativeElement;
    const canvasCtx = canvas.getContext("2d");

    const WIDTH = canvas.width ;
    const HEIGHT = canvas.height;
    canvasCtx.fillStyle = "rgb(237,237,237)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(110,179,255)";

    canvasCtx.beginPath();
    canvasCtx.moveTo(15, HEIGHT / 2);
    canvasCtx.lineTo(WIDTH - 20, HEIGHT / 2);
    canvasCtx.stroke();
  }

  visualize(stream: MediaStream) {
    this.stream = stream;
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const source = this.audioContext.createMediaStreamSource(this.stream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.bufferLength;
    this.dataArray = new Uint8Array(this.bufferLength);

    source.connect(this.analyser);

    this.draw();
  }

  draw() {
    const canvas = this.canvasElement?.nativeElement;
    const canvasCtx = canvas.getContext("2d");

    if(!canvas || !this.analyser || !this.dataArray) {
      return;
    }

    const WIDTH = canvas.width ;
    const HEIGHT = canvas.height;

    const self = this;
    requestAnimationFrame(() => self.draw());

    this.analyser.getByteTimeDomainData(this.dataArray);

    canvasCtx.fillStyle = "rgb(237,237,237)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(110,179,255)";

    canvasCtx.beginPath();

    let sliceWidth = (WIDTH - 30 * 1.0) / this.bufferLength;
    let x = 15;

    for (let i = 0; i < this.bufferLength; i++) {
      let v = this.dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(WIDTH - 20, HEIGHT / 2);
    canvasCtx.stroke();
  }
}
