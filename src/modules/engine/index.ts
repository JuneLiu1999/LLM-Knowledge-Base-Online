import { llm } from '@/modules/llm';
import { storage } from '@/modules/storage';
import { LLMClassifier } from './classifier';
import { LLMEmbedder } from './embedder';
import { DefaultIngestPipeline } from './ingest';
import { DefaultReporter } from './reporter';
import { FileSchemaLoader } from './schema';
import type { Classifier, Embedder, IngestPipeline, Reporter } from './types';

export * from './types';
export { LLMClassifier } from './classifier';
export { LLMEmbedder } from './embedder';
export { DefaultIngestPipeline } from './ingest';
export { DefaultReporter } from './reporter';
export { FileSchemaLoader } from './schema';

const schemaLoader = new FileSchemaLoader();

export const embedder: Embedder = new LLMEmbedder(llm.embedding);
export const classifier: Classifier = new LLMClassifier(llm.strong, schemaLoader);
export const ingestPipeline: IngestPipeline = new DefaultIngestPipeline(storage, embedder, classifier);
export const reporter: Reporter = new DefaultReporter(storage, llm.strong);
