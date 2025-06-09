import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CameraViewComponent } from '../../components/camera-view/camera-view.component';
// MicrophoneComponent is not needed for ViewChild access if interaction is only through Input/Output

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  currentView: 'microphone' | 'camera' = 'microphone';
  messageBoxText: string | null = null;
  isMessageBoxVisible: boolean = false;
  startCameraWithFileUpload: boolean = false;

  // New property for MicrophoneComponent
  isListening: boolean = true;

  @ViewChild(CameraViewComponent) cameraViewInstance!: CameraViewComponent;

  constructor() {}

  ngAfterViewInit() {
    // console.log('HomeComponent AfterViewInit: ViewChild elements are now available.');
  }

  // --- Event Handlers for Template ---

  // toggleListen() is REMOVED

  // New method to handle event from MicrophoneComponent
  handleToggleListen() {
    this.isListening = !this.isListening;
    // Any other logic that needs to happen when listening state changes can go here.
    // For example, if other parts of HomeComponent need to react to isListening changes.
  }

  // --- Camera Interaction ---

  openCameraView() {
    this.startCameraWithFileUpload = false;
    this.currentView = 'camera';
  }

  handleCameraViewChange(newView: 'live' | 'camera') {
    if (newView === 'live') {
      this.currentView = 'microphone';
      this.startCameraWithFileUpload = false;
    } else {
      this.currentView = newView; // newView can only be 'camera' here
    }
  }

  handleCameraMessage(message: string) {
    this.showMessage(message);
  }

  handleFileUploadInCameraRequest() {
      this.startCameraWithFileUpload = false;
  }

  triggerOrRequestFileUpload() {
    if (this.currentView === 'camera' && this.cameraViewInstance) {
      this.cameraViewInstance.openFileDialog();
    } else {
      this.startCameraWithFileUpload = true;
      this.currentView = 'camera';
    }
  }

  // --- UI Helper Functions ---
  showMessage(message: string) {
    this.messageBoxText = message;
    this.isMessageBoxVisible = true;
    setTimeout(() => {
      this.isMessageBoxVisible = false;
      this.messageBoxText = null;
    }, 3000);
  }
}
