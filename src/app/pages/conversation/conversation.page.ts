import { Component, Inject } from '@angular/core'; // Added Inject here
import { BaseComponent } from '../../components/base/base.component';
import { DOCUMENT } from '@angular/common';
import { PromptManager } from '../../managers/prompt.manager'; // Import PromptManager

@Component({
  selector: 'app-conversation',
  standalone: false,
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss']
})
export class ConversationPage extends BaseComponent {
  public newPrompt: string = '';
  public isSending: boolean = false;

  constructor(
    @Inject(DOCUMENT) document: Document,
    public promptManager: PromptManager
  ) {
    super(document);
  }

  async submitPrompt(): Promise<void> {
    if (!this.newPrompt.trim()) {
      return; // Don't send empty prompts
    }

    this.isSending = true;
    try {
      // The promptManager.promptStreaming method now updates conversationHistory internally
      await this.promptManager.promptStreaming(this.newPrompt);
      this.newPrompt = ''; // Clear the textarea
    } catch (error) {
      console.error("Error sending prompt:", error);
      // Optionally, display an error to the user on the page
      // For example, by setting an error message property and showing it in the HTML
    } finally {
      this.isSending = false;
    }
  }
}
