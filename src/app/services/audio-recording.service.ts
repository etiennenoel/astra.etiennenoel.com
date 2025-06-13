import {ElementRef, Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";
import { EventStore } from '../stores/event.store';
import {AudioProcessor} from '../processors/audio.processor';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {

  private canvasElement?: ElementRef;

  mediaRecorder?: MediaRecorder;

  chunks: any[] = []

  stream: any;

  chunkAvailableCallback?: (chunk: any) => void;

  private audioContext?: AudioContext;
  private analyserNode?: AnalyserNode;

  constructor(
    private readonly eventStore: EventStore,
    private readonly audioProcessor: AudioProcessor,
    ) {}

  startRecording(stream: MediaStream, timeslice?: number) {
    this.stream = stream;

    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyserNode);

    this.chunks = [];
    const self = this;

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e: any) => {
      self.chunks.push(e.data);

      this.chunkAvailableCallback?.(e.data);
    }
    this.mediaRecorder.start(timeslice);

    this.audioProcessor.startMonitoring(this.audioContext, this.analyserNode);
  }

  stopRecordingWithoutBlob() {
    if(!this.mediaRecorder) {
      throw new Error("Media Recorder is not available.");
    }

    this.mediaRecorder.stop();
    this.cleanupAudioContext();
  }

  async stopRecording(): Promise<Blob> {
    if(!this.mediaRecorder) {
      throw new Error("Media Recorder is not available.");
    }
    this.cleanupAudioContext();
    this.audioProcessor.stopMonitoring();

    const self = this;
    return new Promise((resolve, reject) => {
      self.mediaRecorder!.onstop = () => {
        this.stream.getAudioTracks().forEach((track: any) => {
          track.stop();
        });

        const blob = new Blob(self.chunks, { type: self.mediaRecorder?.mimeType });
        self.chunks = [];

        return resolve(blob);
      }

      self.mediaRecorder?.stop();
    })
  }

  private cleanupAudioContext() {
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = undefined;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
  }
}




