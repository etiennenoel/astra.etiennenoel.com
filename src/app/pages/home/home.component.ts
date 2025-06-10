import {Component, ViewChild, AfterViewInit, Inject} from '@angular/core';
import { CameraViewComponent } from '../../components/camera-view/camera-view.component';
import {BaseComponent} from '../../components/base/base.component';
import {DOCUMENT} from '@angular/common';
import {EventStore} from '../../stores/event.store';
// MicrophoneComponent is not needed for ViewChild access if interaction is only through Input/Output

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent {
  currentView: 'microphone' | 'camera' = 'microphone';
  messageBoxText: string | null = null;
  isMessageBoxVisible: boolean = false;
  startCameraWithFileUpload: boolean = false;

  // New property for MicrophoneComponent
  isListening: boolean = false;

  @ViewChild(CameraViewComponent) cameraViewInstance!: CameraViewComponent;

  constructor(
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
  ) {
    super(document);
  }

  handleToggleListen() {
    this.isListening = !this.isListening;
    this.eventStore.recordingStatus.next(this.isListening);

    if(this.isListening) {
      this.showMessage("Press pause for the transcription to start.");
    }
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
