import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";

@Injectable({
  providedIn: 'root',
})
export class PromptManager {

  // @ts-expect-error
  private languageModel!: LanguageModel;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if(isPlatformServer(platformId)) {
      return;
    }

    // @ts-expect-error
    LanguageModel.create({
      expectedInputs: [
        { type: "text" },
        { type: "image" },
        { type: "audio" },
      ]
    }).then(
      // @ts-expect-error
      (languageModel: LanguageModel) => {
      this.languageModel = languageModel;
    });
  }

  promptStreaming(prompt: string): ReadableStream {
    return this.languageModel.promptStreaming([
      {
        role: "assistant",
        content: "The user is chatting with you. You have to respond as a very smart and helpful assistant..",
      },
      {
        role: "user",
        content: prompt,
      }
    ]);
  }

  async transcribe(audioBlob: Blob): Promise<ReadableStream> {
    //this.audioSrc = URL.createObjectURL(this.audioBlob);
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

    return this.languageModel.promptStreaming([
      {
        role: "user",
        content: "Transcribe the following audio:",
      },
      {
        role: "user",
        content: [
          {
            type: "audio",
            value: audioBuffer,
          }
        ],
      }
    ]);
  }

  describeImage() {}
}
