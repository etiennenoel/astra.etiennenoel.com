import {Injectable, Inject, PLATFORM_ID} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {EventStore} from '../stores/event.store';
import {AudioRecordingService} from '../services/audio-recording.service';
import {AudioVisualizerService} from '../services/audio-visualizer.service';
import {PromptManager} from './prompt.manager';
import {CameraRecordingService} from '../services/camera-recording.service';
import {ScreenshareRecordingService} from '../services/screenshare-recording.service';
import {StateContext} from '../states/state.context';

@Injectable({
  providedIn: 'root'
})
export class ContextManager {

  stream?: MediaStream;
  private speechSynthesis: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
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
    ) {
    if (isPlatformBrowser(this.platformId) && this.document.defaultView) {
      this.speechSynthesis = this.document.defaultView.speechSynthesis;
      if (this.speechSynthesis) {
        this.speechSynthesis.onvoiceschanged = () => {
          const voices = this.speechSynthesis!.getVoices();
          const britishVoices = voices.filter(voice => voice.lang === 'en-GB');

          if (britishVoices.length > 0) {
            this.selectedVoice = britishVoices.find(voice => /female|woman/i.test(voice.name)) || null;
            if (this.selectedVoice) {
              console.log(`Found female British voice: ${this.selectedVoice.name}`);
            } else {
              // Fallback to the first available British voice if no female is found
              this.selectedVoice = britishVoices[0];
              console.warn(`No female British voice found. Using first available en-GB voice: ${this.selectedVoice.name}`);
            }
          } else {
            this.selectedVoice = null;
            console.warn('No British English (en-GB) voices found. Using default voice.');
          }
        };
        // Trigger loading voices if they haven't been loaded yet for some browsers
        this.speechSynthesis.getVoices();
      }
    }
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
    this.promptManager.setup();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioVisualizerService.visualize(this.stream);
    this.audioRecordingService.startRecording(this.stream)
  }

  async stopListening() {
    if (!this.stream) {
      return;
    }

    this.audioRecordingService.stopRecording();

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
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

    if(this.screenshareRecordingService.isStreaming()) {
      const image = this.screenshareRecordingService.captureFrame();

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

    const agentResponsePromise = this.promptManager.promptStreaming(transcribedText, imagePromptContent);

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    let sentenceBuffer = "";
    const sentenceRegex = /([^.!?]+[.!?])\s*/g;

    try {
      const fullAgentResponse = await agentResponsePromise; // Await the promise

      // The following logic now operates on the full response string
      this.eventStore.agentResponseAvailable.next(fullAgentResponse);
      sentenceBuffer += fullAgentResponse;

      let match;
      while ((match = sentenceRegex.exec(sentenceBuffer)) !== null) {
        const sentence = match[1].trim();
        if (sentence) {
          if (this.speechSynthesis) {
            try {
              const utterance = new SpeechSynthesisUtterance(sentence);
              if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
              }
              utterance.rate = 1; // Adjust rate as desired (1.0 is default)
              utterance.pitch = 1;
              this.speechSynthesis.speak(utterance);
            } catch (error) {
              console.error('Speech synthesis error:', error);
            }
          }
        }
        sentenceBuffer = sentenceBuffer.substring(match.index + match[0].length);
        sentenceRegex.lastIndex = 0;
      }

      // Process any remaining text in the buffer after sentence extraction
      const remainingTextInSentenceBuffer = sentenceBuffer.trim();
      if (remainingTextInSentenceBuffer) {
        // This event might be redundant if fullAgentResponse was already sent and UI handles it.
        // However, if speech synthesis needs to speak this remaining part specifically:
        // this.eventStore.agentResponseAvailable.next(remainingTextInSentenceBuffer);
        if (this.speechSynthesis) {
          try {
            const utterance = new SpeechSynthesisUtterance(remainingTextInSentenceBuffer);
            if (this.selectedVoice) {
              utterance.voice = this.selectedVoice;
            }
            // Potentially different rate/pitch for remnants, or keep consistent
            utterance.rate = 1;
            utterance.pitch = 1;
            this.speechSynthesis.speak(utterance);
          } catch (error) {
            console.error('Speech synthesis error for remaining text:', error);
          }
        }
      }

    } catch (error) {
      console.error("Error processing agent response in context.manager:", error);
      this.eventStore.agentResponseAvailable.next("Sorry, an error occurred while getting the response.");
      if (this.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance("Sorry, an error occurred.");
          if (this.selectedVoice) { utterance.voice = this.selectedVoice; }
          this.speechSynthesis.speak(utterance);
      }
    }

    // Yield again
    this.capturingContext = false;
    this.eventStore.isProcessing.next(false);
    this.startListening()
  }
}
