import {ElementRef, Injectable} from '@angular/core';

@Injectable()
export class AudioRecordingService {

  private canvasElement?: ElementRef;

  mediaRecorder?: MediaRecorder;

  chunks: any[] = []

  stream: any;

  chunkAvailableCallback?: (chunk: any) => void;

  startRecording(stream: MediaStream, timeslice?: number) {
    this.stream = stream;

    this.chunks = [];
    const self = this;

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e: any) => {
      self.chunks.push(e.data);

      this.chunkAvailableCallback?.(e.data);
    }
    this.mediaRecorder.start(timeslice);
  }

  stopRecordingWithoutBlob() {
    if(!this.mediaRecorder) {
      throw new Error("Media Recorder is not available.");
    }

    this.mediaRecorder.stop();
  }

  async stopRecording(): Promise<Blob> {
    if(!this.mediaRecorder) {
      throw new Error("Media Recorder is not available.");
    }

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
}
