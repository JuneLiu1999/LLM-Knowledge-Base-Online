import { prisma } from './db';
import { encrypt, decrypt, maskKey } from './crypto';

export interface LLMConfig {
  cheapModelBaseUrl: string;
  cheapModelApiKey: string;
  cheapModelName: string;
  strongModelBaseUrl: string;
  strongModelApiKey: string;
  strongModelName: string;
  embeddingModelBaseUrl: string;
  embeddingModelApiKey: string;
  embeddingModelName: string;
}

const SENSITIVE_KEYS = [
  'cheap_model_api_key',
  'strong_model_api_key',
  'embedding_model_api_key',
];

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  if (setting.encrypted) return decrypt(setting.value);
  return setting.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const isSensitive = SENSITIVE_KEYS.includes(key);
  const storedValue = isSensitive ? encrypt(value) : value;

  await prisma.setting.upsert({
    where: { key },
    update: { value: storedValue, encrypted: isSensitive },
    create: { key, value: storedValue, encrypted: isSensitive },
  });
}

export async function getSettingMasked(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;

  if (setting.encrypted) {
    const decrypted = decrypt(setting.value);
    return maskKey(decrypted);
  }
  return setting.value;
}

export async function getAllSettings(): Promise<Record<string, string | null>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string | null> = {};

  for (const s of settings) {
    if (s.encrypted) {
      const decrypted = decrypt(s.value);
      result[s.key] = maskKey(decrypted);
    } else {
      result[s.key] = s.value;
    }
  }
  return result;
}

export async function getLLMConfig(): Promise<LLMConfig> {
  const keys = [
    'cheap_model_base_url', 'cheap_model_api_key', 'cheap_model_name',
    'strong_model_base_url', 'strong_model_api_key', 'strong_model_name',
    'embedding_model_base_url', 'embedding_model_api_key', 'embedding_model_name',
  ];

  const config: Record<string, string> = {};
  for (const key of keys) {
    config[key] = (await getSetting(key)) || '';
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
