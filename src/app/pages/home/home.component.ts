import {Component, ViewChild, AfterViewInit, Inject, OnInit} from '@angular/core';
import {CameraViewComponent} from '../../components/camera-view/camera-view.component';
import {BaseComponent} from '../../components/base/base.component';
import {DOCUMENT} from '@angular/common';
import {EventStore} from '../../stores/event.store';
import {ContextManager} from '../../managers/context.manager';

// MicrophoneComponent is not needed for ViewChild access if interaction is only through Input/Output

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit {
  currentView: 'microphone' | 'camera' = 'microphone';
  messageBoxText: string | null = null;
  isMessageBoxVisible: boolean = false;
  startCameraWithFileUpload: boolean = false;

  // New property for MicrophoneComponent
  isPaused: boolean = false;

  @ViewChild(CameraViewComponent) cameraViewInstance!: CameraViewComponent;

  constructor(
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
    private readonly contextManager: ContextManager,
  ) {
    super(document);
  }

  override ngOnInit() {
    super.ngOnInit();

    this.subscriptions.push(this.eventStore.transcriptionAvailable.subscribe(value => {

    }));

    this.subscriptions.push(this.eventStore.agentResponseAvailable.subscribe(value => {

    }));

    this.subscriptions.push(this.eventStore.isPaused.subscribe(value => {
      if (value === undefined) {
        return;
      }
      this.isPaused = value;

      if(this.isPaused){

      } else {
        this.showMessage("Press the circle to process content.");
      }
    }))
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
