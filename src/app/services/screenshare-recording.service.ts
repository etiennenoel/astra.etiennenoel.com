import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenshareRecordingService {
  private stream: MediaStream | null = null;
  public messageEmitter: EventEmitter<string> = new EventEmitter<string>();

  videoElement?: HTMLVideoElement;

  constructor() {}

  async startScreenShare(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    this.resetStream(); // Stop any existing stream before starting a new one
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = this.stream;
        }
      } else {
        this.messageEmitter.emit('Screen sharing not supported on this device.');
        throw new Error('Screen sharing not supported on this device.');
      }
    } catch (error) {
      console.error("Error starting screen share: ", error);
      // Check if the error is due to user denying permission
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.messageEmitter.emit('Screen share permission denied. Please allow screen sharing in your browser settings.');
      } else {
        this.messageEmitter.emit('Could not start screen share. Please check console for errors.');
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

  stopScreenShare(): void {
    this.resetStream();
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.messageEmitter.emit('Screen sharing stopped.');
  }

  isStreaming(): boolean {
    return !!this.stream && this.stream.active;
  }
}
