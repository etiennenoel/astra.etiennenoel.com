import {ElementRef, Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";
import { EventStore } from '../stores/event.store';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {

  private canvasElement?: ElementRef;

  mediaRecorder?: MediaRecorder;

  chunks: any[] = []

  stream: any;

  chunkAvailableCallback?: (chunk: any) => void;

  silenceInterval?: any;

  private audioContext?: AudioContext;
  private analyserNode?: AnalyserNode;
  private silenceThreshold = 0.01;
  private silenceDuration = 1000
  private silenceStartTime?: number;
  private dataArray?: Uint8Array;

  constructor(private eventStore: EventStore) {}

  startRecording(stream: MediaStream, timeslice?: number) {
    this.stream = stream;

    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyserNode);
    this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.chunks = [];
    const self = this;

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e: any) => {
      self.chunks.push(e.data);

      this.chunkAvailableCallback?.(e.data);
    }
    this.mediaRecorder.start(timeslice);

    this.silenceInterval = setInterval(() => {
      this.checkForSilence();
    }, 100)
  }

  private checkForSilence() {
    if (!this.analyserNode || !this.dataArray) {
      return;
    }

    this.analyserNode.getByteTimeDomainData(this.dataArray);

    let sumSquares = 0.0;
    for (const amplitude of this.dataArray) {
      // Normalize to -1 to 1 range
      const normalizedAmplitude = (amplitude / 128.0) - 1.0;
      sumSquares += normalizedAmplitude * normalizedAmplitude;
    }
    const rms = Math.sqrt(sumSquares / this.dataArray.length);

    if (rms < this.silenceThreshold) {
      if (this.silenceStartTime === undefined) {
        this.silenceStartTime = Date.now();
      } else if (Date.now() - this.silenceStartTime > this.silenceDuration) {
        this.eventStore.silenceDetected.next(true);
        this.silenceStartTime = undefined; // Reset after detection
      }
    } else {
      // If sound is detected, reset silence timer and emit false if needed
      if (this.silenceStartTime !== undefined) {
         // Optional: emit false if you want to signal end of silence period explicitly
         // this.eventStore.silenceDetected.next(false);
      }
      this.silenceStartTime = undefined;
    }
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
    clearInterval(this.silenceInterval);

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
    this.silenceStartTime = undefined;
  }
}
