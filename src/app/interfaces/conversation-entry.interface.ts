export interface ConversationEntry {
  timestamp: Date;
  prompts: {type:"text" | "image" | "audio", content: string}[];
  assistantResponse?: string;
}
