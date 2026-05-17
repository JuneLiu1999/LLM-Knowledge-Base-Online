import type { PrismaClient } from '@prisma/client';
import type {
  RawCaptureInput,
  RawCaptureRecord,
  RawCaptureRepository,
  TopicRecord,
  TopicRepository,
  TopicWithRelations,
  LinkRepository,
  ContradictionRepository,
  ContributionRepository,
  ContributionWithRelations,
  DailyReportRecord,
  DailyReportRepository,
  SimilarTopic,
  MediaUrl,
} from './types';

export class PrismaRawCaptureRepository implements RawCaptureRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: RawCaptureInput): Promise<RawCaptureRecord> {
    const row = await this.prisma.rawCapture.create({
      data: {
        sourcePlatform: input.sourcePlatform,
        sourceUrl: input.sourceUrl,
        title: input.title,
        bodyMarkdown: input.bodyMarkdown,
        author: input.author,
        mediaUrls: input.mediaUrls as unknown as object,
        confidence: input.confidence,
      },
    });
    return {
      id: row.id,
      sourcePlatform: row.sourcePlatform,
      sourceUrl: row.sourceUrl,
      title: row.title,
      bodyMarkdown: row.bodyMarkdown,
      author: row.author,
      mediaUrls: row.mediaUrls as unknown as MediaUrl[],
      confidence: row.confidence,
      capturedAt: row.capturedAt,
    };
  }
}

export class PrismaTopicRepository implements TopicRepository {
  constructor(private prisma: PrismaClient) {}

  async findByPath(path: string): Promise<TopicRecord | null> {
    const row = await this.prisma.wikiTopic.findUnique({ where: { topicPath: path } });
    if (!row) return null;
    return { id: row.id, topicPath: row.topicPath, contentMd: row.contentMd, updatedAt: row.updatedAt };
  }

  async findByPathWithRelations(path: string): Promise<TopicWithRelations | null> {
    const topic = await this.prisma.wikiTopic.findUnique({
      where: { topicPath: path },
      include: {
        linksFrom: { include: { toTopic: { select: { topicPath: true } } } },
        linksTo: { include: { fromTopic: { select: { topicPath: true } } } },
        contradictions: true,
        contributions: {
          include: { rawCapture: { select: { title: true, sourceUrl: true, sourcePlatform: true } } },
          orderBy: { contributedAt: 'desc' },
        },
      },
    });
    if (!topic) return null;

    return {
      id: topic.id,
      topicPath: topic.topicPath,
      contentMd: topic.contentMd,
      updatedAt: topic.updatedAt,
      links: [
        ...topic.linksFrom.map(l => ({ path: l.toTopic.topicPath, reason: l.reason })),
        ...topic.linksTo.map(l => ({ path: l.fromTopic.topicPath, reason: l.reason })),
      ],
      contradictions: topic.contradictions.map(c => ({
        id: c.id,
        note: c.note,
        resolved: c.resolved,
        rawCaptureId: c.rawCaptureId,
      })),
      sources: topic.contributions.map(c => ({
        title: c.rawCapture.title,
        url: c.rawCapture.sourceUrl,
        platform: c.rawCapture.sourcePlatform,
      })),
    };
  }

  async listAll() {
    return this.prisma.wikiTopic.findMany({
      select: { topicPath: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: { topicPath: string; contentMd: string }): Promise<TopicRecord> {
    const row = await this.prisma.wikiTopic.create({ data: input });
    return { id: row.id, topicPath: row.topicPath, contentMd: row.contentMd, updatedAt: row.updatedAt };
  }

  async update(id: string, contentMd: string): Promise<TopicRecord> {
    const row = await this.prisma.wikiTopic.update({ where: { id }, data: { contentMd } });
    return { id: row.id, topicPath: row.topicPath, contentMd: row.contentMd, updatedAt: row.updatedAt };
  }

  async findSimilar(embedding: number[], limit = 5): Promise<SimilarTopic[]> {
    const vectorStr = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<SimilarTopic[]>`
      SELECT id, topic_path, content_md,
             embedding <=> ${vectorStr}::vector AS distance
      FROM wiki_topics
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE wiki_topics
      SET embedding = ${vectorStr}::vector
      WHERE id = ${id}
    `;
  }
}

export class PrismaLinkRepository implements LinkRepository {
  constructor(private prisma: PrismaClient) {}

  async create(fromTopicId: string, toTopicId: string, reason: string): Promise<void> {
    await this.prisma.topicLink.create({ data: { fromTopicId, toTopicId, reason } });
  }
}

export class PrismaContradictionRepository implements ContradictionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(wikiTopicId: string, rawCaptureId: string, note: string): Promise<void> {
    await this.prisma.contradiction.create({ data: { wikiTopicId, rawCaptureId, note } });
  }
}

export class PrismaContributionRepository implements ContributionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(rawCaptureId: string, wikiTopicId: string): Promise<void> {
    await this.prisma.contribution.create({ data: { rawCaptureId, wikiTopicId } });
  }

  async findByDateRange(start: Date, end: Date): Promise<ContributionWithRelations[]> {
    return this.prisma.contribution.findMany({
      where: { contributedAt: { gte: start, lte: end } },
      include: {
        rawCapture: { select: { title: true, sourcePlatform: true, author: true } },
        wikiTopic: { select: { topicPath: true } },
      },
    });
  }
}

export class PrismaDailyReportRepository implements DailyReportRepository {
  constructor(private prisma: PrismaClient) {}

  async findByDate(date: string): Promise<DailyReportRecord | null> {
    return this.prisma.dailyReport.findUnique({ where: { date } });
  }

  async listRecent(limit = 30) {
    return this.prisma.dailyReport.findMany({
      select: { id: true, date: true, createdAt: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async upsert(date: string, contentMd: string): Promise<DailyReportRecord> {
    return this.prisma.dailyReport.upsert({
      where: { date },
      update: { contentMd },
      create: { date, contentMd },
    });
  }
}
