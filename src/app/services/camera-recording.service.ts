import {Inject, Injectable, EventEmitter, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class CameraRecordingService {
  private stream: MediaStream | null = null;
  public messageEmitter: EventEmitter<string> = new EventEmitter<string>();

  videoElement?: HTMLVideoElement;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,) {}

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    this.videoElement = videoElement;
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

  stopCamera(): void {
    this.resetStream();
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  captureFrame(): HTMLCanvasElement | null {
    if (isPlatformServer(this.platformId)) {
      return null;
    }
    if (!this.videoElement) {
      this.messageEmitter.emit('Video feed or canvas not ready for capture.');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      return canvas;
    } else {
      this.messageEmitter.emit('Could not get canvas context for capture.');
      return null;
    }
  }

  isStreaming(): boolean {
    return !!this.stream && this.stream.active;
  }
}
