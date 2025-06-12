import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";
import {ConversationEntry} from '../interfaces/conversation-entry.interface';
import {ConversationHistoryManager} from './conversation-history.manager';

@Injectable({
    providedIn: 'root',
})
export class PromptManager {

    private languageModel!: LanguageModel;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private readonly conversationHistoryManager: ConversationHistoryManager,
    ) {
        if (isPlatformServer(platformId)) {
            return;
        }
    }

    async setup () {
        if (isPlatformServer(this.platformId)) {
            return;
        }
        this.languageModel = await LanguageModel.create({
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ]
        })
    }

    promptStreaming(prompt: string, image?: ImageBitmap): ReadableStream {
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

        this.conversationHistoryManager.addPrompts(prompts);

        return this.languageModel.promptStreaming(prompts);
    }

    async transcribe(audioBlob: Blob): Promise<ReadableStream> {
        if (isPlatformServer(this.platformId)) {
            return new ReadableStream(); // Or handle appropriately for server context
        }
        // More efficient to create a new model than polluting the old session
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
