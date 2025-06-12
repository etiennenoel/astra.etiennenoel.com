import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core'; // Added Inject here
import { BaseComponent } from '../../components/base/base.component';
import {DOCUMENT, isPlatformServer} from '@angular/common';
import { PromptManager } from '../../managers/prompt.manager';
import {ConversationHistoryManager} from '../../managers/conversation-history.manager'; // Import PromptManager

@Component({
  selector: 'app-conversation',
  standalone: false,
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss']
})
export class ConversationPage extends BaseComponent implements OnInit {
  public newPrompt: string = '';
  public isSending: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    @Inject(DOCUMENT) document: Document,
    public promptManager: PromptManager,
    public readonly conversationHistoryManager: ConversationHistoryManager,
  ) {
    super(document);
  }

  override ngOnInit() {
    super.ngOnInit();

    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.promptManager.setup();

    this.subscriptions.push(this.conversationHistoryManager.conversationHistory$.subscribe(value => {

    }));
  }

  async submitPrompt(): Promise<void> {
    if (!this.newPrompt.trim()) {
      return; // Don't send empty prompts
    }

    this.isSending = true;
    try {
      // The promptManager.promptStreaming method now updates conversationHistory internally
      const response = this.promptManager.promptStreaming(this.newPrompt);

      for await(const chunk of response) {
        this.conversationHistoryManager.addChunk(chunk);
      }
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
