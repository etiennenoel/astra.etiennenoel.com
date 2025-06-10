import {Injectable} from '@angular/core';
import {EventStore} from '../stores/event.store';
import {AudioRecordingService} from '../services/audio-recording.service';
import {AudioVisualizerService} from '../services/audio-visualizer.service';
import {PromptManager} from './prompt.manager';
import {CameraRecordingService} from '../services/camera-recording.service';

@Injectable({
  providedIn: 'root'
})
export class ContextManager {

  stream?: MediaStream;

  capturingContext: boolean = false;


  constructor(
    private readonly eventStore: EventStore,
    private readonly audioRecordingService: AudioRecordingService,
    private readonly audioVisualizerService: AudioVisualizerService,
    private readonly cameraRecordingService: CameraRecordingService,
    private readonly promptManager: PromptManager,
    ) {

    this.eventStore.captureContext.subscribe(value => {
      if (value) {
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
  }

  async startListening() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioVisualizerService.visualize(this.stream);
    this.audioRecordingService.startRecording(this.stream)
  }

  async stopListening() {
    if (!this.stream) {
      return;
    }

    this.audioRecordingService.stopRecording();
  }

  async captureContext() {
    if(this.capturingContext) {
      return;
    }

    this.eventStore.isProcessing.next(true);
    this.capturingContext = true;

    // Capture the live image if any
    let imagePromptContent;
    if(this.cameraRecordingService.isStreaming()) {
      const image = this.cameraRecordingService.captureFrame();

      if(image !== null) {
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

    for await (const chunk of agentResponseStream) {
      this.eventStore.agentResponseAvailable.next(chunk);
    }

    // Yield again
    this.capturingContext = false;
    this.eventStore.isProcessing.next(false);
    this.startListening()
  }
}
