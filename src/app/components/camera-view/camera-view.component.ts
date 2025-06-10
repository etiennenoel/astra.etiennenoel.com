import { Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CameraRecordingService } from '../../services/camera-recording.service'; // Import the service
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-camera-view',
  standalone: false,
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss']
})
export class CameraViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() currentView: 'live' | 'camera' = 'live';
  @Input() startWithFileUpload: boolean = false;
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('promptInputElem') promptInputElem!: ElementRef<HTMLInputElement>;

  showVideoFeed: boolean = true;
  showCapturedImage: boolean = false;
  showCaptureButton: boolean = true;
  showPromptArea: boolean = false;

  private messageSubscription: Subscription | undefined;

  constructor(private cameraRecordingService: CameraRecordingService) {} // Inject the service

  ngAfterViewInit() {
    this.messageSubscription = this.cameraRecordingService.messageEmitter.subscribe(
      (msg: string) => this.message.emit(msg)
    );

    if (this.currentView === 'camera' && !this.startWithFileUpload) {
      this.startCamera();
    }
    if (this.startWithFileUpload) {
      setTimeout(() => {
        if (this.currentView === 'camera') {
            this.openFileDialog();
        }
      }, 0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['startWithFileUpload'] && changes['startWithFileUpload'].currentValue === true) {
      if (this.currentView === 'camera') {
          this.openFileDialog();
      }
    }
    if (changes['currentView']) {
        if (changes['currentView'].currentValue === 'camera' && !this.cameraRecordingService.isStreaming()) {
            if (this.startWithFileUpload && this.fileInput?.nativeElement?.files?.length === 0) {
                if(!changes['startWithFileUpload']?.currentValue) {
                    this.startCamera();
                }
            } else if (!this.startWithFileUpload) {
                this.startCamera();
            }
        } else if (changes['currentView'].currentValue === 'live' && this.cameraRecordingService.isStreaming()) {
            this.stopCameraInternal();
        }
    }
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
      this.showCaptureButton = false;
      this.showPromptArea = true;
      this.geminiResponseText = null;
    } else {
        // Message should be emitted by service if capture failed
        // this.message.emit('Could not capture frame.'); // Or rely on service message
    }
  }

  handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageBase64 = e.target?.result as string;
        if (this.capturedImage && this.capturedImage.nativeElement) {
          this.capturedImage.nativeElement.src = this.imageBase64;
        }
        this.showVideoFeed = false;
        this.showCapturedImage = true;
        this.showCaptureButton = false;
        this.showPromptArea = true;
        this.geminiResponseText = null;
      };
      reader.readAsDataURL(file);
    } else {
      if (!this.cameraRecordingService.isStreaming()) {
          this.viewChange.emit('live');
      }
    }
    this.fileUploadRequested.emit();
  }

  async callGeminiAPI() {
    const prompt = this.promptInputValue.trim();
    if (!prompt || !this.imageBase64) {
      this.message.emit("Please capture/upload an image and ask a question.");
      return;
    }

    this.isLoadingGemini = true;
    this.geminiResponseText = null;

    const pureBase64 = this.imageBase64.split(',')[1];
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: pureBase64 } }]
      }],
    };
    const apiKey = ""; // Consider moving to environment variable or config
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
        throw new Error(`API request failed with status ${response.status}. Check console for details.`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0 && result.candidates[0].content.parts[0].text) {
        this.displayGeminiResponse(result.candidates[0].content.parts[0].text);
      } else {
        console.error("Unexpected API response structure:", result);
        if (result.promptFeedback && result.promptFeedback.blockReason){
            this.displayGeminiResponse(`Blocked: ${result.promptFeedback.blockReason}. ${result.promptFeedback.blockReasonMessage || ''}`);
        } else {
            this.displayGeminiResponse("Sorry, the response from the model was not as expected. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      this.displayGeminiResponse(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`);
    } finally {
      this.isLoadingGemini = false;
    }
  }

  resetCameraView() {
    this.showVideoFeed = true;
    this.showCapturedImage = false;
    this.showCaptureButton = true;
    this.showPromptArea = false;
    this.geminiResponseText = null;
    this.isLoadingGemini = false;
    this.promptInputValue = '';
    if (this.capturedImage && this.capturedImage.nativeElement) {
      this.capturedImage.nativeElement.src = '';
    }
    this.imageBase64 = null;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  displayGeminiResponse(text: string) {
    this.geminiResponseText = text;
  }

  public openFileDialog() {
    console.log('CameraView: openFileDialog called');
    if (this.fileInput && this.fileInput.nativeElement) {
      this.cameraRecordingService.stopCamera(this.videoFeed?.nativeElement); // Use service
      this.resetCameraView();
      this.showVideoFeed = false;
      this.showCapturedImage = false;
      this.fileInput.nativeElement.click();
    } else {
        this.message.emit('File input is not available in camera view.');
    }
  }
}
