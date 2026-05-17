import { settingsService } from '@/modules/settings';
import type { LLMConfig, SettingsService } from '@/modules/settings/types';
import { OpenAIChatClient, OpenAIEmbeddingClient } from './openai';
import type { ChatClient, EmbeddingClient, LLMProvider } from './types';

export * from './types';
export { OpenAIChatClient, OpenAIEmbeddingClient } from './openai';

const CONFIG_TTL = 60_000;

function envFallback(): LLMConfig {
  return {
    cheapModelBaseUrl: process.env.CHEAP_MODEL_BASE_URL || '',
    cheapModelApiKey: process.env.CHEAP_MODEL_API_KEY || '',
    cheapModelName: process.env.CHEAP_MODEL_NAME || 'deepseek-chat',
    strongModelBaseUrl: process.env.STRONG_MODEL_BASE_URL || '',
    strongModelApiKey: process.env.STRONG_MODEL_API_KEY || '',
    strongModelName: process.env.STRONG_MODEL_NAME || 'deepseek-chat',
    embeddingModelBaseUrl: process.env.EMBEDDING_MODEL_BASE_URL || '',
    embeddingModelApiKey: process.env.EMBEDDING_MODEL_API_KEY || '',
    embeddingModelName: process.env.EMBEDDING_MODEL_NAME || 'deepseek-embedding',
  };
}

export class SettingsBackedLLMProvider implements LLMProvider {
  private config: LLMConfig | null = null;
  private loadedAt = 0;

  constructor(private settings: SettingsService) {}

  private async resolveConfig(): Promise<LLMConfig> {
    const now = Date.now();
    if (!this.config || now - this.loadedAt > CONFIG_TTL) {
      try {
        this.config = await this.settings.getLLMConfig();
      } catch {
        this.config = envFallback();
      }
      this.loadedAt = now;
    }
    return this.config;
  }

  get cheap(): ChatClient {
    return {
      complete: async (req) => {
        const cfg = await this.resolveConfig();
        const client = new OpenAIChatClient({
          baseURL: cfg.cheapModelBaseUrl,
          apiKey: cfg.cheapModelApiKey,
          model: cfg.cheapModelName,
        });
        return client.complete(req);
      },
    };
  }

  get strong(): ChatClient {
    return {
      complete: async (req) => {
        const cfg = await this.resolveConfig();
        const client = new OpenAIChatClient({
          baseURL: cfg.strongModelBaseUrl,
          apiKey: cfg.strongModelApiKey,
          model: cfg.strongModelName,
        });
        return client.complete(req);
      },
    };
  }

  get embedding(): EmbeddingClient {
    return {
      embed: async (text) => {
        const cfg = await this.resolveConfig();
        const client = new OpenAIEmbeddingClient({
          baseURL: cfg.embeddingModelBaseUrl,
          apiKey: cfg.embeddingModelApiKey,
          model: cfg.embeddingModelName,
        });
        return client.embed(text);
      },
    };
  }

  invalidate(): void {
    this.config = null;
    this.loadedAt = 0;
  }
}

export const llm: LLMProvider = new SettingsBackedLLMProvider(settingsService);
