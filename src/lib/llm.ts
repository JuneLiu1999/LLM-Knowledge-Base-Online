import OpenAI from 'openai';
import { getLLMConfig, LLMConfig } from './settings';

let _config: LLMConfig | null = null;
let _configLoadedAt = 0;
const CONFIG_TTL = 60_000; // reload config every 60s

async function getConfig(): Promise<LLMConfig> {
  const now = Date.now();
  if (!_config || now - _configLoadedAt > CONFIG_TTL) {
    try {
      _config = await getLLMConfig();
      _configLoadedAt = now;
    } catch {
      // Fallback to env vars if DB not ready
      _config = {
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
  }
  return _config;
}

export async function getCheapClient(): Promise<OpenAI> {
  const config = await getConfig();
  return new OpenAI({
    baseURL: config.cheapModelBaseUrl || undefined,
    apiKey: config.cheapModelApiKey || 'not-set',
  });
}

export async function getStrongClient(): Promise<OpenAI> {
  const config = await getConfig();
  return new OpenAI({
    baseURL: config.strongModelBaseUrl || undefined,
    apiKey: config.strongModelApiKey || 'not-set',
  });
}

export async function getEmbeddingClient(): Promise<OpenAI> {
  const config = await getConfig();
  return new OpenAI({
    baseURL: config.embeddingModelBaseUrl || undefined,
    apiKey: config.embeddingModelApiKey || 'not-set',
  });
}

export async function getStrongModelName(): Promise<string> {
  const config = await getConfig();
  return config.strongModelName || 'deepseek-chat';
}

export async function getCheapModelName(): Promise<string> {
  const config = await getConfig();
  return config.cheapModelName || 'deepseek-chat';
}

export async function getEmbeddingModelName(): Promise<string> {
  const config = await getConfig();
  return config.embeddingModelName || 'deepseek-embedding';
}

export function invalidateConfigCache() {
  _config = null;
  _configLoadedAt = 0;
}
