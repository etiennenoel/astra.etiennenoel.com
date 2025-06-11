import {Injectable} from '@angular/core';
import {ConversationEntry} from '../interfaces/conversation-entry.interface';
import {BehaviorSubject} from 'rxjs';
import {ConversationPage} from '../pages/conversation/conversation.page';

@Injectable({
  providedIn: "root",
})
export class ConversationHistoryManager {
  public conversationHistory: ConversationEntry[] = [];

  public conversationHistory$: BehaviorSubject<ConversationEntry[]> = new BehaviorSubject<ConversationEntry[]>(this.conversationHistory);

  addPrompts(prompts: LanguageModelPrompt) {
    const entry: ConversationEntry = {
      timestamp: new Date(),
      prompts: prompts,
    };

    this.conversationHistory.push(entry);
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
