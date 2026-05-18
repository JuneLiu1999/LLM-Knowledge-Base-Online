import type { Storage } from '@/modules/storage/types';
import type {
  ClassificationResult,
  Classifier,
  ClassifyResult,
  Embedder,
  IngestInput,
  IngestPipeline,
  SaveRawResult,
} from './types';

export class DefaultIngestPipeline implements IngestPipeline {
  constructor(
    private storage: Storage,
    private embedderFactory: (userId: string) => Embedder,
    private classifierFactory: (userId: string) => Classifier,
  ) {}

  async saveRaw(userId: string, input: IngestInput): Promise<SaveRawResult> {
    const rawCapture = await this.storage.raw.create(userId, input);
    const storageBytes = Buffer.byteLength(input.bodyMarkdown, 'utf-8');
    await this.storage.usage.addUsage(userId, { storageBytes });
    return { rawCaptureId: rawCapture.id, title: rawCapture.title, status: rawCapture.status };
  }

  async classifyOne(userId: string, rawCaptureId: string): Promise<ClassifyResult> {
    const raw = await this.storage.raw.findById(userId, rawCaptureId);
    if (!raw) throw new Error('原始内容不存在');
    if (raw.status === 'classified') throw new Error('已分类，无需重复');

    await this.storage.raw.updateStatus(raw.id, 'classifying', { classificationError: null });

    try {
      const embedder = this.embedderFactory(userId);
      const classifier = this.classifierFactory(userId);

      const embedding = await embedder.embed(raw.bodyMarkdown);
      const similarTopics = await this.storage.topic.findSimilar(userId, embedding, 5);
      const classification = await classifier.classify(raw.bodyMarkdown, similarTopics);

      const topic = await this.applyClassification(userId, classification, raw, embedding, embedder);

      await this.storage.contribution.create(raw.id, topic.id);

      let linksCreated = 0;
      for (const link of classification.links) {
        const target = await this.storage.topic.findByPath(userId, link.targetTopicPath);
        if (target) {
          await this.storage.link.create(topic.id, target.id, link.reason);
          linksCreated++;
        }
      }

      for (const contradiction of classification.contradictions) {
        const target = await this.storage.topic.findByPath(userId, contradiction.targetTopicPath);
        if (target) {
          await this.storage.contradiction.create(target.id, raw.id, contradiction.note);
        }
      }

      const topicBytes = Buffer.byteLength(topic.contentMd, 'utf-8');
      await this.storage.usage.addUsage(userId, { storageBytes: topicBytes });

      await this.storage.raw.updateStatus(raw.id, 'classified', {
        classifiedAt: new Date(),
        classificationError: null,
      });

      return {
        rawCaptureId: raw.id,
        topicPath: classification.topicPath,
        action: classification.action,
        linksCreated,
        contradictions: classification.contradictions.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.storage.raw.updateStatus(raw.id, 'failed', { classificationError: message });
      throw err;
    }
  }

  async classifyBatch(userId: string, ids: string[]) {
    const results: Array<{ id: string; success: boolean; error?: string; topicPath?: string }> = [];
    for (const id of ids) {
      try {
        const r = await this.classifyOne(userId, id);
        results.push({ id, success: true, topicPath: r.topicPath });
      } catch (err) {
        results.push({ id, success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return results;
  }

  private async applyClassification(
    userId: string,
    classification: ClassificationResult,
    input: { title: string; sourcePlatform: string; sourceUrl: string; author: string | null },
    embedding: number[],
    embedder: Embedder,
  ) {
    const existing = await this.storage.topic.findByPath(userId, classification.topicPath);

    const articleRef = `\n\n---\n### ${input.title}\n- 来源: [${input.sourcePlatform}](${input.sourceUrl})\n- 作者: ${input.author || '未知'}\n- 时间: ${new Date().toISOString().split('T')[0]}\n\n${classification.summary}\n`;

    if (classification.action === 'create' || !existing) {
      const name = classification.topicPath.split('/').pop();
      const linksMd = classification.links.map(l => `- [[${l.targetTopicPath}]]: ${l.reason}`).join('\n');
      const contradictionsMd = classification.contradictions.length > 0
        ? classification.contradictions.map(c => `- ${c.note}`).join('\n')
        : '无';

      const contentMd = `# ${name}\n\n## 核心观点\n\n${classification.summary}\n\n## 关键证据\n${articleRef}\n\n## 关联主题\n\n${linksMd}\n\n## 待澄清\n\n${contradictionsMd}\n`;

      const topic = await this.storage.topic.create(userId, {
        topicPath: classification.topicPath,
        contentMd,
      });
      await this.storage.topic.updateEmbedding(topic.id, embedding);
      return topic;
    }

    const updatedContent = existing.contentMd + articleRef;
    const topic = await this.storage.topic.update(existing.id, updatedContent);
    const newEmbedding = await embedder.embed(updatedContent);
    await this.storage.topic.updateEmbedding(topic.id, newEmbedding);
    return topic;
  }
}
