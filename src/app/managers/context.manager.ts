import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {EventStore} from '../stores/event.store';
import {AudioRecordingService} from '../services/audio-recording.service';
import {AudioVisualizerService} from '../services/audio-visualizer.service';
import {PromptManager} from './prompt.manager';
import {CameraRecordingService} from '../services/camera-recording.service';
import {ScreenshareRecordingService} from '../services/screenshare-recording.service';
import {StateContext} from '../states/state.context';
import {ConversationHistoryManager} from './conversation-history.manager';
import {SpeechSynthesisService} from '../services/speech-synthesis.service';

@Injectable({
  providedIn: 'root'
})
export class ContextManager {

  stream?: MediaStream;

  capturingContext: boolean = false;

  detectSilence: boolean = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private readonly eventStore: EventStore,
    private readonly audioRecordingService: AudioRecordingService,
    private readonly audioVisualizerService: AudioVisualizerService,
    private readonly cameraRecordingService: CameraRecordingService,
    private readonly promptManager: PromptManager,
    private readonly screenshareRecordingService: ScreenshareRecordingService,
    private readonly stateContext: StateContext,
    private readonly conversationHistoryManager: ConversationHistoryManager,
    private readonly speechSynthesisService:SpeechSynthesisService,
  ) {
    this.eventStore.captureContext.subscribe(value => {
      if (value) {
        this.captureContext();
      }
    })

    this.eventStore.silenceDetected.subscribe(value => {
      if (value && this.detectSilence) {
        this.captureContext();
      }
    })

    this.eventStore.isPaused.subscribe(value => {
      if (value === false) {
        this.startListening();
      } else {
        this.stopListening();
      }
    })

    this.eventStore.detectSilence.subscribe(value => {
      this.detectSilence = value;
    });
  }

  async startListening() {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.promptManager.setup();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.audioVisualizerService.visualize(this.stream);
    this.audioRecordingService.startRecording(this.stream)
  }

  async stopListening() {
    if (!this.stream) {
      return;
    }

    this.audioRecordingService.stopRecording();
    this.speechSynthesisService.stop();
  }

  async captureContext() {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    if (this.capturingContext) {
      return;
    }

    this.eventStore.isProcessing.next(true);
    this.capturingContext = true;

    // Capture the live image if any
    let imagePromptContent;
    if (this.cameraRecordingService.isStreaming()) {
      const image = this.cameraRecordingService.captureFrame();

      if (image !== null) {
        imagePromptContent = await createImageBitmap(image);
      }
    }

    if (this.screenshareRecordingService.isStreaming()) {
      const image = this.screenshareRecordingService.captureFrame();

      if (image !== null) {
        imagePromptContent = await createImageBitmap(image);
      }
    }

    // Audio transcription of what we have recorded so far
    const audioBlob = await this.audioRecordingService.stopRecording();

    const transcriptionStream = await this.promptManager.transcribe(audioBlob);

    let transcribedText = '';
    for await (const chunk of transcriptionStream) {
      this.eventStore.transcriptionAvailable.next(chunk);
      transcribedText += chunk;
    }

    const agentResponseStream = this.promptManager.promptStreaming(transcribedText, imagePromptContent);

    this.speechSynthesisService.stop();


    let sentenceBuffer = "";
    const sentenceRegex = /([^.!?]+[.!?])\s*/g;

    for await (const chunk of agentResponseStream) {
      this.conversationHistoryManager.addChunk(chunk);
      this.eventStore.agentResponseAvailable.next(chunk);
      this.speechSynthesisService.accumulateText(chunk);
    }

    this.speechSynthesisService.responseComplete()

    // Yield again
    this.capturingContext = false;
    this.eventStore.isProcessing.next(false);
    this.startListening()
  }
}
