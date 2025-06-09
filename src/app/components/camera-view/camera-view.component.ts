import { Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-camera-view',
  standalone: false,
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss']
})
export class CameraViewComponent implements AfterViewInit, OnChanges {
  @Input() currentView: 'live' | 'camera' = 'live';
  @Input() startWithFileUpload: boolean = false;
  @Output() viewChange = new EventEmitter<'live' | 'camera'>();
  @Output() message = new EventEmitter<string>();
  @Output() fileUploadRequested = new EventEmitter<void>();


  // Properties from Step 1
  imageBase64: string | null = null;
  geminiResponseText: string | null = null;
  isLoadingGemini: boolean = false;
  promptInputValue: string = '';

  @ViewChild('videoFeed') videoFeed!: ElementRef<HTMLVideoElement>;
  @ViewChild('capturedImage') capturedImage!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('promptInputElem') promptInputElem!: ElementRef<HTMLInputElement>;

  // New properties for method logic
  stream: MediaStream | null = null;
  showVideoFeed: boolean = true; // Controls visibility of video element in camera view
  showCapturedImage: boolean = false; // Controls visibility of image element in camera view
  showCaptureButton: boolean = true; // Controls visibility of capture button in camera view
  showPromptArea: boolean = false; // Controls visibility of prompt input area in camera view

  constructor() {}

  ngAfterViewInit() {
    if (this.currentView === 'camera' && !this.startWithFileUpload) {
      this.startCamera();
    }
    if (this.startWithFileUpload) {
      // Delay openFileDialog slightly to ensure view is initialized,
      // especially if currentView is also changing.
      setTimeout(() => {
        if (this.currentView === 'camera') { // Double check view before opening
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
        if (changes['currentView'].currentValue === 'camera' && !this.stream) {
            // If view changes to 'camera'
            if (this.startWithFileUpload && this.fileInput?.nativeElement?.files?.length === 0) {
                // If we intended to start with file upload but no file was chosen (e.g. dialog cancelled)
                // and then user perhaps navigated away and back to camera view.
                // Or if the initial startWithFileUpload flag was set.
                // We will let openFileDialog be called by the startWithFileUpload logic.
                // If it's already been called and cancelled, we might need to start camera.
                // Let's ensure openFileDialog is attempted if startWithFileUpload is true.
                if(!changes['startWithFileUpload']?.currentValue) { // if startWithFileUpload wasn't the trigger
                    this.startCamera();
                }
            } else if (!this.startWithFileUpload) {
                this.startCamera();
            }
        } else if (changes['currentView'].currentValue === 'live' && this.stream) {
            this.stopCameraInternal();
        }
    }
  }

  // --- Core Functions ---

  async startCamera() {
    console.log('CameraView: startCamera called');
    this.resetCameraView();
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (this.videoFeed && this.videoFeed.nativeElement) {
          this.videoFeed.nativeElement.srcObject = this.stream;
        }
      } else {
        this.message.emit('Camera not supported on this device.');
      }
    } catch (error) {
      console.error("Error accessing camera: ", error);
      this.message.emit('Could not access the camera. Please check permissions.');
      this.viewChange.emit('live');
    }
  }

  private stopCameraInternal() {
    console.log('CameraView: stopCameraInternal called');
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoFeed && this.videoFeed.nativeElement) {
      this.videoFeed.nativeElement.srcObject = null;
    }
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
    const video = this.videoFeed.nativeElement;
    const canvas = this.canvas.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.imageBase64 = canvas.toDataURL('image/png');
      if (this.capturedImage && this.capturedImage.nativeElement) {
        this.capturedImage.nativeElement.src = this.imageBase64;
      }

      this.showVideoFeed = false;
      this.showCapturedImage = true;
      this.showCaptureButton = false;
      this.showPromptArea = true;
      this.geminiResponseText = null;
    } else {
        this.message.emit('Could not get canvas context.');
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
      // No file selected, or dialog cancelled.
      if (!this.stream) { // If camera wasn't active (e.g. started directly with file upload)
          this.viewChange.emit('live');
      }
    }
    this.fileUploadRequested.emit(); // Reset the flag in parent
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
    const apiKey = "";
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
      this.stopCameraInternal(); // Stop camera if it's running before opening file dialog
      this.resetCameraView(); // Reset view to hide video feed elements
      this.showVideoFeed = false; // Explicitly hide video feed
      this.showCapturedImage = false; // Ensure no old image is shown
      this.fileInput.nativeElement.click();
    } else {
        this.message.emit('File input is not available in camera view.');
    }
  }
}
