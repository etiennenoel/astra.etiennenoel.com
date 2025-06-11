import {Injectable} from '@angular/core';
import {ConversationEntry} from '../interfaces/conversation-entry.interface';

@Injectable({
  providedIn: "root",
})
export class ConversationHistoryManager {
  private conversationHistory: ConversationEntry[] = [];

  addPrompts(prompts: LanguageModelPrompt) {
    const entry: ConversationEntry = {
      timestamp: new Date(),
      prompts: prompts,
    };
    this.conversationHistory.push(entry);
  }

  addResponse(response: string) {
    if (this.conversationHistory.length === 0) {
      throw new Error('No prompts found to associate with the response.');
    }

    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];
    lastEntry.assistantResponse = response;
  }
}
