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
        if (isPlatformServer(platformId)) {
            return;
        }
    }

    async setup () {
        // @ts-expect-error
        this.languageModel = await LanguageModel.create({
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ]
        })
    }

    promptStreaming(prompt: string, image?: ImageBitmap): ReadableStream {
        // @ts-expect-error
        const prompts: LanguageModelPrompt = [
            {
                role: "assistant",
                content: "The user is chatting with you. You have to respond as a very smart and helpful assistant..",
            },
            {
                role: "user",
                content: prompt,
            }
        ];

        if (image) {
            prompts.push({
                role: "user",
                content: [
                    {
                        type: "image",
                        value: image,
                    }
                ],
            });
        }

        return this.languageModel.promptStreaming(prompts);
    }

    async transcribe(audioBlob: Blob): Promise<ReadableStream> {
        // More efficient to create a new model than polluting the old session
        // @ts-expect-error
        const languageModel = await LanguageModel.create({
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ]
        });

        //this.audioSrc = URL.createObjectURL(this.audioBlob);
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

        return languageModel.promptStreaming([
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

    describeImage() {
    }
}
