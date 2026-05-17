import OpenAI from 'openai';
import type { ChatClient, ChatRequest, EmbeddingClient } from './types';

export interface OpenAIChatOptions {
  baseURL: string | undefined;
  apiKey: string;
  model: string;
}

export class OpenAIChatClient implements ChatClient {
  private client: OpenAI;
  constructor(private opts: OpenAIChatOptions) {
    this.client = new OpenAI({ baseURL: opts.baseURL || undefined, apiKey: opts.apiKey || 'not-set' });
  }

  async complete(req: ChatRequest): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.opts.model,
      messages: req.messages,
      temperature: req.temperature,
      response_format: req.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    });
    return response.choices[0]?.message?.content ?? '';
  }
}

export interface OpenAIEmbeddingOptions {
  baseURL: string | undefined;
  apiKey: string;
  model: string;
}

export class OpenAIEmbeddingClient implements EmbeddingClient {
  private client: OpenAI;
  constructor(private opts: OpenAIEmbeddingOptions) {
    this.client = new OpenAI({ baseURL: opts.baseURL || undefined, apiKey: opts.apiKey || 'not-set' });
  }

  async embed(text: string): Promise<number[]> {
    const truncated = text.slice(0, 8000);
    const response = await this.client.embeddings.create({ model: this.opts.model, input: truncated });
    return response.data[0].embedding;
  }
}
