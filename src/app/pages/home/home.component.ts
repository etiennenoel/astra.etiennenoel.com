import {Component, ViewChild, AfterViewInit, Inject, OnInit} from '@angular/core';
import {CameraViewComponent} from '../../components/camera-view/camera-view.component';
import {BaseComponent} from '../../components/base/base.component';
import {DOCUMENT} from '@angular/common';
import {EventStore} from '../../stores/event.store';
import {ContextManager} from '../../managers/context.manager';
import {PromptManager} from '../../managers/prompt.manager';

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

  // New property for MicrophoneComponent
  isPaused: boolean = false;

  @ViewChild(CameraViewComponent) cameraViewInstance!: CameraViewComponent;

  constructor(
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
    private readonly contextManager: ContextManager,
    private readonly promptManager: PromptManager,
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
        this.currentView = 'microphone';
      } else {
        this.promptManager.setup();
        this.showMessage("Press the circle to process content.");
      }
    }));

    this.subscriptions.push(this.eventStore.isCameraOn.subscribe(value => {
      if (value === undefined) {
        return;
      }
      if (value) { // If camera is on
        this.currentView = 'camera';
      } else { // If camera is off
        this.currentView = 'microphone';
      }
    }));
  }

  handleCameraMessage(message: string) {
    this.showMessage(message);
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
