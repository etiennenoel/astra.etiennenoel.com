import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformServer} from "@angular/common";
// Assuming LanguageModel and LanguageModelPrompt are defined/imported elsewhere or are ambient
// For the subtask, we'll assume they exist.

export interface ConversationEntry {
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
}

// Assuming LanguageModelPrompt is something like:
// type LanguageModelPrompt = { role: string; content: string | Array<{type: string; value: any;}>; }[];
// Or it might be a class/interface from the LanguageModel library.
// NOTE: Based on previous file reads, LanguageModelPrompt is used as an array type: LanguageModelPrompt[]
// and also as a singular object type in the promptStreaming method.
// The prompt suggests `const languageModelInputs: LanguageModelPrompt = [ ... ]`
// If LanguageModelPrompt is an array type itself (e.g. `TypeX[]`), then `languageModelInputs` would be `TypeX[][]`.
// However, the usage `this.prompts.push(languageModelInputs)` where `prompts` is `LanguageModelPrompt[]`
// implies `languageModelInputs` should be of the element type of `LanguageModelPrompt[]`, not `LanguageModelPrompt[]` itself.
// Let's assume LanguageModelPrompt is the type of the elements within the array that languageModel.promptStreaming expects.
// So, `const languageModelInputs: LanguageModelPromptPart[] = [...]` (hypothetical LanguageModelPromptPart)
// and `this.languageModel.promptStreaming(languageModelInputs)` would be correct.
// And `this.prompts: LanguageModelPromptPart[][] = []` (if `this.prompts` stores arrays of these parts)
// Or, more likely, `LanguageModelPrompt` is the type for the array itself, as in `type LanguageModelPrompt = Array<{...}>;`
// The existing code `const prompts: LanguageModelPrompt = [` implies LanguageModelPrompt is an array.
// And `this.prompts: LanguageModelPrompt[] = []` implies `this.prompts` is an array of these arrays.
// This seems the most consistent.

@Injectable({
    providedIn: 'root',
})
export class PromptManager {

    private languageModel!: LanguageModel; // Assuming LanguageModel is a defined type

    prompts: LanguageModelPrompt[] = [] // This is the original prompts array, an array of prompt arrays
    public conversationHistory: ConversationEntry[] = []; // New conversation history array

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
    ) {
        if (isPlatformServer(this.platformId)) { // Fixed: platformId was used directly
            return;
        }
    }

    async setup () {
        // Assuming LanguageModel.create is an async method
        this.languageModel = await LanguageModel.create({
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ]
        });
    }

    async promptStreaming(prompt: string, image?: ImageBitmap): Promise<string> { // Changed return type
        // This is the array of prompt parts for a single call to the model
        const languageModelInputs: any[] = [ // Changed type to any[] temporarily to satisfy LanguageModelPrompt usage
        // Re-evaluating LanguageModelPrompt:
        // If `this.languageModel.promptStreaming(prompts)` expects `prompts` to be `LanguageModelPrompt`
        // and `const prompts: LanguageModelPrompt = [ ... ]` was the old code, then `LanguageModelPrompt` IS an array type.
        // Let's call the elements `PromptPart` for clarity in thought.
        // So, `type PromptPart = {role: string, content: string | Array<{type: string, value: any}>}`
        // And `type LanguageModelPrompt = PromptPart[]`.
        // Then `this.prompts: LanguageModelPrompt[] = []` means `this.prompts` is an array of (array of PromptPart). Correct.
        // And `const languageModelInputs: LanguageModelPrompt = [` is correct.
            {
                role: "assistant", // System prompt or initial assistant message
                content: "The user is chatting with you. You have to respond as a very smart and helpful assistant..",
            },
            {
                role: "user",
                content: prompt,
            }
        ];

        if (image) {
            // Assuming LanguageModelPrompt (which is an array) can handle image content this way
            languageModelInputs.push({
                role: "user",
                content: [
                    {
                        type: "image",
                        value: image, // Assuming ImageBitmap is the correct type for 'value'
                    }
                ],
            });
        }

        // Add user's prompt to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: prompt,
            timestamp: new Date()
        });

        // this.prompts is LanguageModelPrompt[], and languageModelInputs is LanguageModelPrompt (an array of parts)
        this.prompts.push(languageModelInputs as LanguageModelPrompt); // Keep pushing to the original 'prompts' array

        const stream = this.languageModel.promptStreaming(languageModelInputs as LanguageModelPrompt); // Cast to ensure type compatibility
        const reader = stream.getReader();
        let fullResponse = "";
        // const decoder = new TextDecoder(); // REMOVED: Assuming stream provides strings directly based on TS error

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value !== undefined) { // Check for undefined, as value can be the chunk type or undefined
                    // Assuming 'value' is string, as implied by the TS error TS2345
                    // when trying to use it with TextDecoder.
                    fullResponse += value;
                }
            }
            // Add AI's response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date()
            });
            return fullResponse;
        } catch (error) {
            console.error("Error reading stream:", error);
            // Add error entry to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: "Error: Could not get response from assistant.", // User-friendly error
                timestamp: new Date()
            });
            throw error; // Re-throw the error so the caller can handle it
        }
    }

    async transcribe(audioBlob: Blob): Promise<ReadableStream> {
        // This method is not being changed in this step.
        // More efficient to create a new model than polluting the old session
        const languageModel = await LanguageModel.create({ // This creates a local LM, not using this.languageModel
            expectedInputs: [
                {type: "text"},
                {type: "image"},
                {type: "audio"},
            ]
        });

        //this.audioSrc = URL.createObjectURL(this.audioBlob);
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

        // Assuming the LanguageModelPrompt type (array of parts) is expected here too
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
        ] as LanguageModelPrompt); // Cast for clarity, assuming LanguageModelPrompt is T[]
    }

    describeImage() {
        // This method is not being changed in this step.
    }
}
