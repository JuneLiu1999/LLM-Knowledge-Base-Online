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
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getMasked(key: string): Promise<string | null>;
  getAll(): Promise<Record<string, string | null>>;
  getLLMConfig(): Promise<LLMConfig>;
}
