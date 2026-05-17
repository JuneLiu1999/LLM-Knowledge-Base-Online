export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface ChatClient {
  complete(request: ChatRequest): Promise<string>;
}

export interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}

export interface LLMProvider {
  cheap: ChatClient;
  strong: ChatClient;
  embedding: EmbeddingClient;
  invalidate(): void;
}
