import type { EmbeddingClient } from '@/modules/llm/types';
import type { Embedder } from './types';

export class LLMEmbedder implements Embedder {
  constructor(private client: EmbeddingClient) {}

  embed(text: string): Promise<number[]> {
    return this.client.embed(text);
  }
}
