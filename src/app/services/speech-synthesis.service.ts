import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {EventStore} from '../stores/event.store';

@Injectable()
export class SpeechSynthesisService {
  private speechSynthesis: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private sentenceBuffer: string = "";

  private sentenceRegex = /([^.!?]+[.!?])\s*/g;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private readonly eventStore: EventStore,
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

      this.document.defaultView.addEventListener('beforeunload', () => {
        if (this.speechSynthesis?.speaking) { // Check if synthesis is active
          this.speechSynthesis.cancel();
        }
      });
    }
  }

  accumulateText(chunk: string): void {
    this.sentenceBuffer += chunk;
    let match;
    while ((match = this.sentenceRegex.exec(this.sentenceBuffer)) !== null) {
      const sentence = match[1].trim();
      if (sentence) {
        if (this.speechSynthesis) {
          try {
            const self = this;
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
      this.sentenceBuffer = this.sentenceBuffer.substring(match.index + match[0].length);
      // Reset lastIndex since we modified the string
      this.sentenceRegex.lastIndex = 0;
    }
  }

  responseComplete() {
    // Process any remaining text in the buffer
    const remainingText = this.sentenceBuffer.trim();
    if (remainingText) {
      //this.eventStore.agentResponseAvailable.next(remainingText);
      if (this.speechSynthesis) {
        try {
          const self = this;
          const utterance = new SpeechSynthesisUtterance(remainingText);
          if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
          }
          utterance.rate = 0.5; // Adjust rate as desired (1.0 is default)
          utterance.pitch = 1;
          utterance.onend = (event) => {
            self.eventStore.speechCompleted.next(true);
            // Your code here to execute after the speech is done
          };
          this.speechSynthesis.speak(utterance);

        } catch (error) {
          console.error('Speech synthesis error:', error);
        }
      }
    }
  }

  stop() {
    this.sentenceBuffer = ""; // Clear the buffer
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
}
