import {
  AfterViewInit,
  Component,
  ElementRef, Inject,
  Input,
  OnChanges, OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {AudioRecordingService} from '../../services/audio-recording.service';
import {AudioVisualizerService} from '../../services/audio-visualizer.service';
import {DOCUMENT, isPlatformBrowser, isPlatformServer} from "@angular/common";
import {EventStore} from "../../stores/event.store";
import {BaseComponent} from "../base/base.component";
import {PromptManager} from "../../managers/prompt.manager";

@Component({
  selector: 'app-microphone-view',
  standalone: false,
  templateUrl: './microphone-view.component.html',
  styleUrls: ['./microphone-view.component.scss']
})
export class MicrophoneViewComponent extends BaseComponent implements OnInit, AfterViewInit {
  isListening?: boolean = undefined; // Default value, will be overridden by parent

  @ViewChild("canvasElement")
  public canvasElement?: ElementRef;

  stream?: MediaStream;

  transcribedText: string = '';
  agentResponseText: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) document: Document,
    private readonly audioRecordingService: AudioRecordingService,
    private readonly audioVisualizerService: AudioVisualizerService,
    private readonly promptManager: PromptManager,
    private readonly eventStore: EventStore,
  ) {
    super(document);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.subscriptions.push(this.eventStore.recordingStatus.subscribe(value => {
      if(value) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
    }))
    }

  ngAfterViewInit() {
    if(isPlatformBrowser(this.platformId) && this.canvasElement) {
      this.audioVisualizerService.init(this.canvasElement)
    }
  }

  async startRecording() {
    if(isPlatformServer(this.platformId)) {
      return;
    }

    this.transcribedText = "";
    this.isListening = true;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioVisualizerService.visualize(this.stream);
    this.audioRecordingService.startRecording(this.stream)
  }

  async stopRecording() {
    if(isPlatformServer(this.platformId) || this.isListening === undefined) {
      return;
    }

    this.isListening = false;
    this.transcribedText = "";
    this.agentResponseText = "";
    const audioBlob = await this.audioRecordingService.stopRecording();

    const transcriptionStream = await this.promptManager.transcribe(audioBlob);

    for await (const chunk of transcriptionStream) {
        this.transcribedText += chunk;
    }

    const agentResponseStream = this.promptManager.promptStreaming(this.transcribedText);

    for await (const chunk of agentResponseStream) {
      this.agentResponseText += chunk;
    }
  }
}
