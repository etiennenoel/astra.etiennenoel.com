import { Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CameraRecordingService } from '../../services/camera-recording.service'; // Import the service
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-camera-view',
  standalone: false,
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss']
})
export class CameraViewComponent implements AfterViewInit, OnDestroy {
  @Output() viewChange = new EventEmitter<'live' | 'camera'>();
  @Output() message = new EventEmitter<string>();
  @Output() fileUploadRequested = new EventEmitter<void>();

  imageBase64: string | null = null;
  geminiResponseText: string | null = null;
  isLoadingGemini: boolean = false;
  promptInputValue: string = '';

  @ViewChild('videoFeed') videoFeed!: ElementRef<HTMLVideoElement>;
  @ViewChild('capturedImage') capturedImage!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  showVideoFeed: boolean = true;
  showCapturedImage: boolean = false;

  private messageSubscription: Subscription | undefined;

  constructor(private cameraRecordingService: CameraRecordingService) {} // Inject the service

  ngAfterViewInit() {
    this.messageSubscription = this.cameraRecordingService.messageEmitter.subscribe(
      (msg: string) => this.message.emit(msg)
    );

      this.startCamera();
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    // Ensure camera is stopped when component is destroyed
    this.cameraRecordingService.stopCamera(this.videoFeed?.nativeElement);
  }

  async startCamera() {
    console.log('CameraView: startCamera called');
    this.resetCameraView();
    try {
      if (this.videoFeed && this.videoFeed.nativeElement) {
        await this.cameraRecordingService.startCamera(this.videoFeed.nativeElement);
      } else {
        this.message.emit('Video feed element not available.');
      }
    } catch (error) {
      // Error handling is now primarily within the service, which emits messages.
      // The service re-throws the error, so we can catch it here if specific component actions are needed.
      console.error("CameraView: Error starting camera via service: ", error);
      this.viewChange.emit('live'); // Switch view on critical error
    }
  }

  private stopCameraInternal() {
    console.log('CameraView: stopCameraInternal called');
    this.cameraRecordingService.stopCamera(this.videoFeed?.nativeElement);
  }

  stopCamera() {
    console.log('CameraView: stopCamera called (external)');
    this.stopCameraInternal();
    this.viewChange.emit('live');
  }

  captureFrame() {
    if (!this.videoFeed || !this.videoFeed.nativeElement || !this.canvas || !this.canvas.nativeElement) {
        this.message.emit('Camera feed or canvas not ready.');
        return;
    }

    this.imageBase64 = this.cameraRecordingService.captureFrame(this.canvas.nativeElement, this.videoFeed.nativeElement);

    if (this.imageBase64) {
      if (this.capturedImage && this.capturedImage.nativeElement) {
        this.capturedImage.nativeElement.src = this.imageBase64;
      }
      this.showVideoFeed = false;
      this.showCapturedImage = true;
      this.geminiResponseText = null;
    } else {
        // Message should be emitted by service if capture failed
        // this.message.emit('Could not capture frame.'); // Or rely on service message
    }
  }

  resetCameraView() {
    this.showVideoFeed = true;
    this.showCapturedImage = false;
    this.geminiResponseText = null;
    this.isLoadingGemini = false;
    this.promptInputValue = '';
    if (this.capturedImage && this.capturedImage.nativeElement) {
      this.capturedImage.nativeElement.src = '';
    }
    this.imageBase64 = null;
  }

  displayGeminiResponse(text: string) {
    this.geminiResponseText = text;
  }
}
