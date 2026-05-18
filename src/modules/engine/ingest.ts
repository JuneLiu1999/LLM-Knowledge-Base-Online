import type { Storage } from '@/modules/storage/types';
import type {
  ClassificationResult,
  Classifier,
  Embedder,
  IngestInput,
  IngestPipeline,
  IngestResult,
} from './types';

export class DefaultIngestPipeline implements IngestPipeline {
  constructor(
    private storage: Storage,
    private embedderFactory: (userId: string) => Embedder,
    private classifierFactory: (userId: string) => Classifier,
  ) {}

  async ingest(userId: string, input: IngestInput): Promise<IngestResult> {
    const embedder = this.embedderFactory(userId);
    const classifier = this.classifierFactory(userId);

    const rawCapture = await this.storage.raw.create(userId, input);

    const embedding = await embedder.embed(input.bodyMarkdown);
    const similarTopics = await this.storage.topic.findSimilar(userId, embedding, 5);
    const classification = await classifier.classify(input.bodyMarkdown, similarTopics);

    const topic = await this.applyClassification(userId, classification, input, embedding, embedder);

    await this.storage.contribution.create(rawCapture.id, topic.id);

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
        await this.storage.contradiction.create(target.id, rawCapture.id, contradiction.note);
      }
    }

    const storageBytes = Buffer.byteLength(input.bodyMarkdown, 'utf-8') +
      Buffer.byteLength(topic.contentMd, 'utf-8');
    await this.storage.usage.addUsage(userId, { storageBytes });

    return {
      rawCaptureId: rawCapture.id,
      topicPath: classification.topicPath,
      action: classification.action,
      linksCreated,
      contradictions: classification.contradictions.length,
    };
  }

  private async applyClassification(
    userId: string,
    classification: ClassificationResult,
    input: IngestInput,
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
