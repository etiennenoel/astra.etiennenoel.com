export interface ConversationEntry {
  timestamp: Date;
  prompts: LanguageModelPrompt;
  assistantResponse?: string;
}
