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

export interface SettingsService {
  get(userId: string, key: string): Promise<string | null>;
  set(userId: string, key: string, value: string): Promise<void>;
  getMasked(userId: string, key: string): Promise<string | null>;
  getAll(userId: string): Promise<Record<string, string | null>>;
  getLLMConfig(userId: string): Promise<LLMConfig>;
}
