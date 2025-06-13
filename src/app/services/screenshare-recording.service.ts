import {Inject, Injectable, EventEmitter, PLATFORM_ID} from '@angular/core';
import {ToastStore} from "../stores/toast.store";
import {isPlatformServer} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class ScreenshareRecordingService {
  private stream: MediaStream | null = null;
  videoElement?: HTMLVideoElement;

  constructor(
      private readonly toastStore: ToastStore,
      @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  async startScreenShare(videoElement: HTMLVideoElement): Promise<void> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    this.videoElement = videoElement;
    this.resetStream(); // Stop any existing stream before starting a new one
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = this.stream;
        }
      } else {
        const message = 'Screen sharing is not supported in this browser.';
        this.toastStore.publish({message});
        throw new Error(message);
      }
    } catch (error) {
      console.error("Error starting screen share: ", error);
      // Check if the error is due to user denying permission
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.toastStore.publish({message: 'Screen share permission denied. Please allow screen sharing in your browser settings.'});
      } else {
        this.toastStore.publish({message: 'Could not start screen share. Please check console for errors.'});
      }
      throw error; // Re-throw to allow caller to handle
    }
  }

  private resetStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  captureFrame(): HTMLCanvasElement | null {
    if (isPlatformServer(this.platformId)) {
      return null;
    }
    if (!this.videoElement) {
      this.toastStore.publish({message:'Video feed or canvas not ready for capture.'})
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
        this.toastStore.publish({message:'Could not get canvas context for capture.'});
      return null;
    }
  }

  stopScreenShare(): void {
    this.resetStream();
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.toastStore.publish({message: 'Screen sharing stopped.'});
  }

  isStreaming(): boolean {
    return !!this.stream && this.stream.active;
  }
}
