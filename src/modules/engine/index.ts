import { getLLMProvider } from '@/modules/llm';
import { storage } from '@/modules/storage';
import { LLMClassifier } from './classifier';
import { LLMEmbedder } from './embedder';
import { DefaultIngestPipeline } from './ingest';
import { DefaultReporter } from './reporter';
import { FileSchemaLoader } from './schema';
import type { IngestPipeline, Reporter } from './types';

export * from './types';
export { LLMClassifier } from './classifier';
export { LLMEmbedder } from './embedder';
export { DefaultIngestPipeline } from './ingest';
export { DefaultReporter } from './reporter';
export { FileSchemaLoader } from './schema';

const schemaLoader = new FileSchemaLoader();

const embedderFactory = (userId: string) => new LLMEmbedder(getLLMProvider(userId).embedding);
const classifierFactory = (userId: string) => new LLMClassifier(getLLMProvider(userId).strong, schemaLoader);
const strongChatFactory = (userId: string) => getLLMProvider(userId).strong;

export const ingestPipeline: IngestPipeline = new DefaultIngestPipeline(
  storage,
  embedderFactory,
  classifierFactory,
);

export const reporter: Reporter = new DefaultReporter(storage, strongChatFactory);
