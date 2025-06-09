import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  // Properties from Step 1
  currentView: 'live' | 'camera' = 'live';
  isListening: boolean = true;
  imageBase64: string | null = null;
  geminiResponseText: string | null = null;
  isLoadingGemini: boolean = false;
  messageBoxText: string | null = null;
  isMessageBoxVisible: boolean = false;
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
    // console.log('HomeComponent AfterViewInit: ViewChild elements are now available.');
    // Initial UI state based on 'isListening' is handled by property defaults and declarative bindings.
  }

  // --- Core Functions ---

  async startCamera() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (this.videoFeed && this.videoFeed.nativeElement) {
          this.videoFeed.nativeElement.srcObject = this.stream;
        }
        this.currentView = 'camera';
        this.resetCameraView(); // Reset state for a fresh camera view
      } else {
        this.showMessage('Camera not supported on this device.');
      }
    } catch (error) {
      console.error("Error accessing camera: ", error);
      this.showMessage('Could not access the camera. Please check permissions.');
      this.currentView = 'live'; // Fallback to live view on error
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoFeed && this.videoFeed.nativeElement) {
      this.videoFeed.nativeElement.srcObject = null;
    }
    // Do not call resetCameraView() here as we are going back to live view.
    // resetCameraView() is for preparing the camera view itself.
    this.currentView = 'live';
  }

  captureFrame() {
    if (!this.videoFeed || !this.videoFeed.nativeElement || !this.canvas || !this.canvas.nativeElement) {
        this.showMessage('Camera feed or canvas not ready.');
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
      this.geminiResponseText = null; // Clear previous response
    } else {
        this.showMessage('Could not get canvas context.');
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

        this.currentView = 'camera'; // Switch to camera view if not already
        this.showVideoFeed = false; // Hide video feed
        this.showCapturedImage = true; // Show the uploaded image
        this.showCaptureButton = false; // Hide capture button
        this.showPromptArea = true; // Show prompt area
        this.geminiResponseText = null; // Clear previous response
      };
      reader.readAsDataURL(file);
    }
  }

  async callGeminiAPI() {
    const prompt = this.promptInputValue.trim();
    if (!prompt || !this.imageBase64) {
      this.showMessage("Please capture/upload an image and ask a question.");
      return;
    }

    this.isLoadingGemini = true;
    this.geminiResponseText = null; // Clear previous response before new call

    const pureBase64 = this.imageBase64.split(',')[1];
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: pureBase64 } }]
      }],
    };
    const apiKey = ""; // API key is handled by environment or a proxy
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
      // Decide if promptArea should be hidden or kept visible after API call.
      // Keeping it visible allows for follow-up questions on the same image.
      // this.showPromptArea = false;
    }
  }

  // --- UI Helper Functions ---

  resetCameraView() {
    // This function prepares the camera view to its initial state when entering it or resetting it.
    this.showVideoFeed = true;
    this.showCapturedImage = false;
    this.showCaptureButton = true;
    this.showPromptArea = false;
    this.geminiResponseText = null;
    this.isLoadingGemini = false;
    this.promptInputValue = ''; // Clear the prompt input
    if (this.capturedImage && this.capturedImage.nativeElement) {
      this.capturedImage.nativeElement.src = ''; // Clear the image src
    }
    this.imageBase64 = null; // Clear the stored image data
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = ''; // Clear the file input
    }
  }

  displayGeminiResponse(text: string) {
    this.geminiResponseText = text;
  }

  showMessage(message: string) {
    this.messageBoxText = message;
    this.isMessageBoxVisible = true;
    setTimeout(() => {
      this.isMessageBoxVisible = false;
      this.messageBoxText = null; // Clear message after hiding
    }, 3000);
  }

  // --- Event Handlers for Template ---

  toggleListen() {
    this.isListening = !this.isListening;
    // UI updates for mic icon and listening text are handled by declarative bindings in the template.
  }

  closeLiveMode() {
    // Example action: show a message. In a real app, might navigate or change main state.
    this.showMessage('Closing Live Mode...');
    // If there was a main "app screen" to return to, you might set:
    // this.currentView = 'someDefaultAppScreen';
  }

  triggerFileInputClick() {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    } else {
        this.showMessage('File input is not available.');
    }
  }
}
