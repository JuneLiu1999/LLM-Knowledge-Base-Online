import { settingsService } from '@/modules/settings';
import type { LLMConfig, SettingsService } from '@/modules/settings/types';
import { OpenAIChatClient, OpenAIEmbeddingClient } from './openai';
import type { ChatClient, EmbeddingClient, LLMProvider } from './types';

export * from './types';
export { OpenAIChatClient, OpenAIEmbeddingClient } from './openai';

const CONFIG_TTL = 60_000;

interface CacheEntry {
  config: LLMConfig;
  loadedAt: number;
}

const configCache = new Map<string, CacheEntry>();

export function invalidateLLMCache(userId: string): void {
  configCache.delete(userId);
}

export class SettingsBackedLLMProvider implements LLMProvider {
  constructor(private settings: SettingsService, private userId: string) {}

  private async resolveConfig(): Promise<LLMConfig> {
    const now = Date.now();
    const entry = configCache.get(this.userId);
    if (entry && now - entry.loadedAt < CONFIG_TTL) return entry.config;
    const config = await this.settings.getLLMConfig(this.userId);
    configCache.set(this.userId, { config, loadedAt: now });
    return config;
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
    configCache.delete(this.userId);
  }
}

export function getLLMProvider(userId: string): LLMProvider {
  return new SettingsBackedLLMProvider(settingsService, userId);
}
