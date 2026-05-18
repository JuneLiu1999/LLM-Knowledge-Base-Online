export interface MediaUrl {
  type: string;
  url: string;
}

export interface RawCaptureInput {
  sourcePlatform: string;
  sourceUrl: string;
  title: string;
  bodyMarkdown: string;
  author: string | null;
  mediaUrls: MediaUrl[];
  confidence: string;
}

export interface RawCaptureRecord extends RawCaptureInput {
  id: string;
  capturedAt: Date;
}

export interface SimilarTopic {
  id: string;
  topic_path: string;
  content_md: string;
  distance: number;
}

export interface TopicRecord {
  id: string;
  topicPath: string;
  contentMd: string;
  updatedAt: Date;
}

export interface TopicWithRelations extends TopicRecord {
  links: Array<{ path: string; reason: string }>;
  contradictions: Array<{ id: string; note: string; resolved: boolean; rawCaptureId: string }>;
  sources: Array<{ title: string; url: string; platform: string }>;
}

export interface DailyReportRecord {
  id: string;
  date: string;
  contentMd: string;
  createdAt: Date;
}

export interface ContributionWithRelations {
  rawCapture: {
    title: string;
    sourcePlatform: string;
    author: string | null;
  };
  wikiTopic: {
    topicPath: string;
  };
}

export interface UserUsage {
  storageBytes: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface RawCaptureRepository {
  create(userId: string, input: RawCaptureInput): Promise<RawCaptureRecord>;
}

export interface TopicRepository {
  findByPath(userId: string, path: string): Promise<TopicRecord | null>;
  findByPathWithRelations(userId: string, path: string): Promise<TopicWithRelations | null>;
  listAll(userId: string): Promise<Array<{ topicPath: string; updatedAt: Date }>>;
  create(userId: string, input: { topicPath: string; contentMd: string }): Promise<TopicRecord>;
  update(id: string, contentMd: string): Promise<TopicRecord>;
  findSimilar(userId: string, embedding: number[], limit?: number): Promise<SimilarTopic[]>;
  updateEmbedding(id: string, embedding: number[]): Promise<void>;
}

export interface LinkRepository {
  create(fromTopicId: string, toTopicId: string, reason: string): Promise<void>;
}

export interface ContradictionRepository {
  create(wikiTopicId: string, rawCaptureId: string, note: string): Promise<void>;
}

export interface ContributionRepository {
  create(rawCaptureId: string, wikiTopicId: string): Promise<void>;
  findByDateRange(userId: string, start: Date, end: Date): Promise<ContributionWithRelations[]>;
}

export interface DailyReportRepository {
  findByDate(userId: string, date: string): Promise<DailyReportRecord | null>;
  listRecent(userId: string, limit?: number): Promise<Array<{ id: string; date: string; createdAt: Date }>>;
  upsert(userId: string, date: string, contentMd: string): Promise<DailyReportRecord>;
}

export interface UserUsageRepository {
  addUsage(userId: string, delta: Partial<UserUsage>): Promise<void>;
  getUsage(userId: string): Promise<UserUsage>;
}

export interface Storage {
  raw: RawCaptureRepository;
  topic: TopicRepository;
  link: LinkRepository;
  contradiction: ContradictionRepository;
  contribution: ContributionRepository;
  report: DailyReportRepository;
  usage: UserUsageRepository;
}
