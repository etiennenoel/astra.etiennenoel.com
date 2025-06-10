import {Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, Inject, PLATFORM_ID} from '@angular/core';
import {DOCUMENT, isPlatformBrowser, isPlatformServer} from '@angular/common';
import {EventStore} from '../../stores/event.store';
import {BaseComponent} from '../base/base.component';

@Component({
  selector: 'app-microphone-visualizer',
  standalone: false,
  templateUrl: './microphone-visualizer.component.html',
  styleUrls: ['./microphone-visualizer.component.scss']
})
export class MicrophoneVisualizerComponent extends BaseComponent implements AfterViewInit, OnDestroy {

  @ViewChild('visualizerCanvas') visualizerCanvasRef!: ElementRef<HTMLCanvasElement>;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private startButton!: HTMLButtonElement;

  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private source?: MediaStreamAudioSourceNode;
  private dataArray?: Uint8Array;
  private isInitialized = false;
  private animationFrameId?: number;

  private readonly FFT_SIZE = 256;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
  ) {
    super(document)
  }


  ngAfterViewInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.canvas = this.visualizerCanvasRef.nativeElement;

    // Check if canvas context can be obtained
    const context = this.canvas.getContext('2d');
    this.ctx = context as CanvasRenderingContext2D;

    this.setupCanvas(); // Initial setup

    // Event Listeners
    window.addEventListener('resize', this.onResize);

    this.subscriptions.push(this.eventStore.isPaused.subscribe(value => {
      if(value === false) {
        this.initAudio();
      } else {
        this.stopAudio();
      }
    }))
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (isPlatformServer(this.platformId)) {
      return;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    window.removeEventListener('resize', this.onResize);
    // No need to remove listener from startButton if the component is destroyed
    // as the element itself will be removed from DOM.
  }

  // Bound methods for event listeners
  private onResize = () => {
    if (isPlatformBrowser(this.platformId)) {
      this.setupCanvas();
    }
  };

  private setupCanvas(): void {
    // This method is called by onResize, which is already guarded
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1; // window access
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    } else {
      console.error("Canvas context not available in setupCanvas");
    }
  }

  private async initAudio(): Promise<void> {
    // This method is called by onStartButtonClick, which is already guarded
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true}); // navigator access
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); // window access
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.isInitialized = true;

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animate(); // Start animation
    } catch (err) {
      // Catch errors on the client-side
      console.error('Error accessing microphone:', err);
    }
  }

  private stopAudio() {

  }

  private animate(): void {
    // This method is called by initAudio, which is already guarded by isPlatformBrowser
    // Also, requestAnimationFrame is a browser API.
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        if (!this.isInitialized || !this.canvas || !this.ctx || !isPlatformBrowser(this.platformId)) {
          // Ensure we don't run animation loop on server or if not initialized
          if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
          return;
        }

        const scaledWidth = this.canvas.clientWidth;
        const scaledHeight = this.canvas.clientHeight;

        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.clearRect(0, 0, scaledWidth, scaledHeight);

        if (this.analyser && this.dataArray) { // isInitialized is checked in loop condition
          this.analyser.getByteFrequencyData(this.dataArray);

          this.drawWave({color: '#2563eb', amplification: 1.5, noise: 0.05});
          this.drawWave({color: '#9333ea', amplification: 1.0, noise: 0.1});
          this.drawWave({color: '#d946ef', amplification: 0.7, noise: 0.15});
        }

        this.animationFrameId = requestAnimationFrame(loop); // window.requestAnimationFrame
      };
      loop();
    });
  }

  private drawWave({color, amplification, noise}: { color: string, amplification: number, noise: number }): void {
    // This method is called by animate, which is already guarded
    if (!this.ctx || !this.dataArray || !this.canvas) return;

    const scaledWidth = this.canvas.clientWidth;
    const scaledHeight = this.canvas.clientHeight;

    const pointsToDraw = this.dataArray.length;
    const activeDataRatio = 0.5;
    const activeDataLength = Math.floor(this.dataArray.length * activeDataRatio);

    const sliceWidth = scaledWidth / (pointsToDraw - 1);

    this.ctx.beginPath();

    const points = [];
    for (let i = 0; i < pointsToDraw; i++) {
      const dataIndex = Math.floor((i / (pointsToDraw - 1)) * (activeDataLength - 1));
      const v = this.dataArray[dataIndex] / 255.0;

      const noiseValue = (Math.sin(i * 0.1) + Math.cos(i * 0.05)) * noise;

      const baselineHeight = scaledHeight * 0.30;
      const dynamicHeight = v * (scaledHeight * 0.6) * amplification;
      const totalWaveHeight = baselineHeight + dynamicHeight;

      const x = i * sliceWidth;
      const y = scaledHeight - totalWaveHeight + (noiseValue * 50);
      points.push({x, y});
    }

    if (points.length === 0) return; // Guard against empty points array

    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Ensure curve goes to the last point if there are points
    if (points.length > 0) {
      this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }


    this.ctx.lineTo(scaledWidth, scaledHeight);
    this.ctx.lineTo(0, scaledHeight);
    this.ctx.closePath();

    const gradient = this.ctx.createLinearGradient(0, scaledHeight * 0.6, 0, scaledHeight);
    const transparentColor = color + '00'; // Assuming hex color
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, transparentColor);

    this.ctx.filter = 'blur(30px)';
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.filter = 'none';
  }
}
