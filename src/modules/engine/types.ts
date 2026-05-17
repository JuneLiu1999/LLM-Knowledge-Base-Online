import type { RawCaptureInput } from '@/modules/storage/types';

export interface ClassificationResult {
  topicPath: string;
  action: 'create' | 'append' | 'merge';
  summary: string;
  links: Array<{ targetTopicPath: string; reason: string }>;
  contradictions: Array<{ targetTopicPath: string; note: string }>;
}

export interface Embedder {
  embed(text: string): Promise<number[]>;
}

export interface Classifier {
  classify(
    articleMarkdown: string,
    candidates: Array<{ topic_path: string; content_md: string }>,
  ): Promise<ClassificationResult>;
}

export interface IngestInput extends RawCaptureInput {}

export interface IngestResult {
  rawCaptureId: string;
  topicPath: string;
  action: string;
  linksCreated: number;
  contradictions: number;
}

export interface IngestPipeline {
  ingest(input: IngestInput): Promise<IngestResult>;
}

export interface Reporter {
  generateDailyReport(date?: string): Promise<string>;
}

export interface SchemaLoader {
  load(): string;
}
