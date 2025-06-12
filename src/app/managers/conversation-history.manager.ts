import {Injectable} from '@angular/core';
import {ConversationEntry} from '../interfaces/conversation-entry.interface';
import {BehaviorSubject} from 'rxjs';
import {HomePage} from '../pages/home/home.page';

@Injectable({
  providedIn: "root",
})
export class ConversationHistoryManager {
  public conversationHistory: ConversationEntry[] = [];

  public conversationHistory$: BehaviorSubject<ConversationEntry[]> = new BehaviorSubject<ConversationEntry[]>(this.conversationHistory);

  addPrompts(prompts: LanguageModelPrompt) {
    const filteredPrompts: { type: "text" | "image" | "audio", content: string | any }[] = [];
    for (const prompt of prompts) {
      if (typeof prompt === "string") {
        filteredPrompts.push({
          type: "text",
          content: prompt,
        })
      } else {
        if (prompt.role === "user") {
          if (typeof prompt.content === "string") {
            filteredPrompts.push({
              type: "text",
              content: prompt.content,
            });
          } else {
            prompt.content.map(value => {
              return {
                type: value.type || "text", // Default to "text" if type is not specified
                content: value.value || "", // Default to empty string if content is not specified
              }
            })
          }
        }
      }
    }

    const entry: ConversationEntry = {
      timestamp: new Date(),
      prompts: filteredPrompts,
    };

    this.conversationHistory.push(entry);
    this.conversationHistory$.next(this.conversationHistory);
  }

  addChunk(chunk: string) {
    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];

    if(!lastEntry.assistantResponse) {
      lastEntry.assistantResponse = '';
    }

    lastEntry.assistantResponse += chunk;

    this.conversationHistory$.next(this.conversationHistory);
  }

  addResponse(response: string) {
    if (this.conversationHistory.length === 0) {
      throw new Error('No prompts found to associate with the response.');
    }

    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];
    lastEntry.assistantResponse = response;

    this.conversationHistory$.next(this.conversationHistory);
  }
}
