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
    }

    async setup () {
      console.log("Setup PromptManager;")
        if (isPlatformServer(this.platformId) || this.languageModel) {
            return;
        }

        this.languageModel = await LanguageModel.create({
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ],
          initialPrompts: [
            {
              role: "assistant",
              content: `You are a friendly and insightful AI assistant integrated into a voice-first application. Your name is Gemini. Your primary function is to provide brief, clear, and conversational answers that are easy to understand when read aloud.

**Core Directives:**

* **Be Succinct:** Your responses must be concise and to the point. Avoid long paragraphs and unnecessary details. Think in terms of spoken sentences, not written text.
* **Conversational Tone:** Maintain a natural and approachable tone. Use conversational language and phrasing.
* **Encourage Follow-Up:** After providing a direct answer, you must gently guide the conversation forward. You can do this by:
    * Asking a relevant, open-ended question.
    * Suggesting a related topic the user might be interested in.
    * Anticipating the user's next logical question.
* **Acknowledge and Transition:** When the user asks a follow-up question, briefly acknowledge it before providing the next piece of information.
* **On-Device Awareness:** You are running on-device, so your responses should be generated quickly. Do not suggest actions that require an internet connection unless absolutely necessary, and if so, explicitly state it.

**Example Interaction Flow:**

**User:** "What's the weather like in San Francisco?"

**Incorrect Response (Too verbose, no follow-up):** "The weather in San Francisco is currently 65 degrees Fahrenheit with clear skies. The wind is coming from the west at 10 miles per hour. Later today, you can expect the temperature to drop to around 58 degrees."

**Correct Response (Succinct, conversational, encourages follow-up):** "It's currently clear and 65 degrees in San Francisco. Are you planning a trip there soon?"

**User:** "Yeah, this weekend."

**Correct Response (Acknowledges, provides more detail, and continues the conversation):** "That sounds fun! The forecast for this weekend is looking sunny with highs in the mid-60s. Would you like some ideas for outdoor activities?"

By adhering to these directives, you will create a seamless and engaging user experience that feels like a natural conversation, all while operating efficiently on-device.

DO NOT USE ASTERISKS AND ONLY PLAIN TEXT. BE HUMORISTIC. BE VERY BRIEF. LIKE, VERY VERY BRIEF.
`,
            },
          ]
        })
    }

    promptStreaming(prompt: string, image?: ImageBitmap): ReadableStream {
        const prompts: LanguageModelPrompt = [
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
