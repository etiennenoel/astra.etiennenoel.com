import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioVisualizerService {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray!: Uint8Array;
  private animationFrameId: number | null = null;
  private isInitialized = false;
  private readonly FFT_SIZE = 256;

  constructor() {
    // Add resize listener
    window.addEventListener('resize', this.onResize.bind(this));
  }

  public init(): void {
    const canvasEl = document.getElementById('visualizer');
    if (!canvasEl || !(canvasEl instanceof HTMLCanvasElement)) {
      console.error('Canvas element not found or is not a HTMLCanvasElement');
      return;
    }
    this.canvas = canvasEl;
    const context = this.canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get 2D context from canvas');
      return;
    }
    this.ctx = context;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
       // Style canvas
      this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgb(255, 255, 255)'; // White color for the wave
    }
  }

  private onResize(): void {
    this.setupCanvas();
    // If visualization is active, redraw the current state (optional)
    if (this.isInitialized && this.analyser && this.dataArray && this.ctx) {
      // Redraw or adjust visualization as needed after resize
      // For example, if drawWave clears and redraws, that might be enough
    }
  }

  public startVisualization(stream: MediaStream): void {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not initialized. Call init() first.');
      return;
    }

    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8; // As specified

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // Use frequencyBinCount

      this.isInitialized = true;
      this.animate();
    } catch (error) {
      console.error('Error starting visualization:', error);
      this.isInitialized = false;
    }
  }

  public stopVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
    }
    this.isInitialized = false;

    // Optionally clear the canvas
    if (this.ctx && this.canvas) {
      // Use the scaled width and height for clearing
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Reset fill style if it was changed by drawing
      this.ctx.fillStyle = "rgba(0, 0, 0, 0)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private animate(): void {
    if (!this.isInitialized || !this.analyser || !this.ctx || !this.canvas) {
      return;
    }

    this.drawWave();
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  private drawWave(): void {
    if (!this.analyser || !this.dataArray || !this.ctx || !this.canvas) {
      return;
    }

    this.analyser.getByteTimeDomainData(this.dataArray); // For waveform

    // Use canvas internal scaled width/height, then apply DPR for drawing operations if needed,
    // but here ctx is already scaled, so we use canvas.width/height directly for logical dimensions.
    const logicalWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const logicalHeight = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear the canvas using the actual canvas dimensions (already scaled)
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Ensure background is transparent
    this.ctx.fillRect(0, 0, logicalWidth, logicalHeight); // Use logical width/height for fillRect after context scaling

    this.ctx.beginPath();
    // Ensure strokeStyle is set before drawing
    this.ctx.strokeStyle = 'rgb(255, 255, 255)'; // White color for the wave, as set in setupCanvas

    const sliceWidth = logicalWidth * 1.0 / this.analyser.frequencyBinCount;
    let x = 0;

    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      const v = this.dataArray[i] / 128.0; // Normalize data to 0-2 range
      const y = v * logicalHeight / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    this.ctx.lineTo(logicalWidth, logicalHeight / 2); // Draw line to the end of the canvas
    this.ctx.stroke();
  }

  // Cleanup resize listener when service is destroyed
  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
