import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraRecordingService {
  private stream: MediaStream | null = null;
  public messageEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.resetStream();
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoElement) {
          videoElement.srcObject = this.stream;
        }
      } else {
        this.messageEmitter.emit('Camera not supported on this device.');
        throw new Error('Camera not supported on this device.');
      }
    } catch (error) {
      console.error("Error accessing camera: ", error);
      this.messageEmitter.emit('Could not access the camera. Please check permissions.');
      throw error; // Re-throw to allow caller to handle
    }
  }

  private resetStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  stopCamera(videoElement?: HTMLVideoElement): void {
    this.resetStream();
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  captureFrame(canvasElement: HTMLCanvasElement, videoElement: HTMLVideoElement): string | null {
    if (!videoElement.srcObject || !canvasElement) {
      this.messageEmitter.emit('Video feed or canvas not ready for capture.');
      return null;
    }

    const video = videoElement;
    const canvas = canvasElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } else {
      this.messageEmitter.emit('Could not get canvas context for capture.');
      return null;
    }
  }

  isStreaming(): boolean {
    return !!this.stream && this.stream.active;
  }
}
