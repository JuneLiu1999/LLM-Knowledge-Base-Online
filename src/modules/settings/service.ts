import type { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, maskKey } from './crypto';
import type { LLMConfig, SettingsService } from './types';

const SENSITIVE_KEYS = new Set([
  'cheap_model_api_key',
  'strong_model_api_key',
  'embedding_model_api_key',
]);

const LLM_KEYS = [
  'cheap_model_base_url', 'cheap_model_api_key', 'cheap_model_name',
  'strong_model_base_url', 'strong_model_api_key', 'strong_model_name',
  'embedding_model_base_url', 'embedding_model_api_key', 'embedding_model_name',
] as const;

export class PrismaSettingsService implements SettingsService {
  constructor(private prisma: PrismaClient) {}

  async get(userId: string, key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({ where: { userId_key: { userId, key } } });
    if (!setting) return null;
    return setting.encrypted ? decrypt(setting.value) : setting.value;
  }

  async set(userId: string, key: string, value: string): Promise<void> {
    const isSensitive = SENSITIVE_KEYS.has(key);
    const storedValue = isSensitive ? encrypt(value) : value;
    await this.prisma.setting.upsert({
      where: { userId_key: { userId, key } },
      update: { value: storedValue, encrypted: isSensitive },
      create: { userId, key, value: storedValue, encrypted: isSensitive },
    });
  }

  async getMasked(userId: string, key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({ where: { userId_key: { userId, key } } });
    if (!setting) return null;
    if (setting.encrypted) return maskKey(decrypt(setting.value));
    return setting.value;
  }

  async getAll(userId: string): Promise<Record<string, string | null>> {
    const settings = await this.prisma.setting.findMany({ where: { userId } });
    const result: Record<string, string | null> = {};
    for (const s of settings) {
      result[s.key] = s.encrypted ? maskKey(decrypt(s.value)) : s.value;
    }
    return result;
  }

  async getLLMConfig(userId: string): Promise<LLMConfig> {
    const config: Record<string, string> = {};
    for (const key of LLM_KEYS) {
      config[key] = (await this.get(userId, key)) || '';
    }
    return {
      cheapModelBaseUrl: config.cheap_model_base_url,
      cheapModelApiKey: config.cheap_model_api_key,
      cheapModelName: config.cheap_model_name || 'deepseek-chat',
      strongModelBaseUrl: config.strong_model_base_url,
      strongModelApiKey: config.strong_model_api_key,
      strongModelName: config.strong_model_name || 'deepseek-chat',
      embeddingModelBaseUrl: config.embedding_model_base_url,
      embeddingModelApiKey: config.embedding_model_api_key,
      embeddingModelName: config.embedding_model_name || 'deepseek-embedding',
    };
  }
}
