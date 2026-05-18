import type { RawCaptureInput, RawCaptureStatus } from '@/modules/storage/types';

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

export interface SaveRawResult {
  rawCaptureId: string;
  title: string;
  status: RawCaptureStatus;
}

export interface ClassifyResult {
  rawCaptureId: string;
  topicPath: string;
  action: string;
  linksCreated: number;
  contradictions: number;
}

export interface IngestPipeline {
  /** Save the raw capture only. Status starts as 'unclassified'. */
  saveRaw(userId: string, input: IngestInput): Promise<SaveRawResult>;
  /** Run AI classification on a previously-saved raw capture. Updates status. */
  classifyOne(userId: string, rawCaptureId: string): Promise<ClassifyResult>;
  /** Batch classify: returns per-id success/failure summary. */
  classifyBatch(userId: string, ids: string[]): Promise<Array<{ id: string; success: boolean; error?: string; topicPath?: string }>>;
}

export interface Reporter {
  generateDailyReport(userId: string, date?: string): Promise<string>;
}

export interface SchemaLoader {
  load(): string;
}
