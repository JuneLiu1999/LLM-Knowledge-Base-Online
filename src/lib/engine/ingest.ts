import { prisma, findSimilarTopics, updateTopicEmbedding } from '@/lib/db';
import { generateEmbedding } from './embedder';
import { classifyContent, ClassificationResult } from './classifier';

interface IngestInput {
  sourcePlatform: string;
  sourceUrl: string;
  title: string;
  bodyMarkdown: string;
  author: string | null;
  mediaUrls: Array<{ type: string; url: string }>;
  confidence: string;
}

export interface IngestResult {
  rawCaptureId: string;
  topicPath: string;
  action: string;
  linksCreated: number;
  contradictions: number;
}

export async function ingestArticle(input: IngestInput): Promise<IngestResult> {
  const rawCapture = await prisma.rawCapture.create({
    data: {
      sourcePlatform: input.sourcePlatform,
      sourceUrl: input.sourceUrl,
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      author: input.author,
      mediaUrls: input.mediaUrls,
      confidence: input.confidence,
    },
  });

  const embedding = await generateEmbedding(input.bodyMarkdown);

  const similarTopics = await findSimilarTopics(embedding, 5);

  const classification = await classifyContent(input.bodyMarkdown, similarTopics);

  const topic = await applyClassification(classification, input, embedding);

  await prisma.contribution.create({
    data: {
      rawCaptureId: rawCapture.id,
      wikiTopicId: topic.id,
    },
  });

  let linksCreated = 0;
  for (const link of classification.links) {
    const targetTopic = await prisma.wikiTopic.findUnique({
      where: { topicPath: link.targetTopicPath },
    });
    if (targetTopic) {
      await prisma.topicLink.create({
        data: {
          fromTopicId: topic.id,
          toTopicId: targetTopic.id,
          reason: link.reason,
        },
      });
      linksCreated++;
    }
  }

  for (const contradiction of classification.contradictions) {
    const targetTopic = await prisma.wikiTopic.findUnique({
      where: { topicPath: contradiction.targetTopicPath },
    });
    if (targetTopic) {
      await prisma.contradiction.create({
        data: {
          wikiTopicId: targetTopic.id,
          rawCaptureId: rawCapture.id,
          note: contradiction.note,
        },
      });
    }
  }

  return {
    rawCaptureId: rawCapture.id,
    topicPath: classification.topicPath,
    action: classification.action,
    linksCreated,
    contradictions: classification.contradictions.length,
  };
}

async function applyClassification(
  classification: ClassificationResult,
  input: IngestInput,
  embedding: number[]
) {
  const existingTopic = await prisma.wikiTopic.findUnique({
    where: { topicPath: classification.topicPath },
  });

  const articleRef = `\n\n---\n### ${input.title}\n- 来源: [${input.sourcePlatform}](${input.sourceUrl})\n- 作者: ${input.author || '未知'}\n- 时间: ${new Date().toISOString().split('T')[0]}\n\n${classification.summary}\n`;

  if (classification.action === 'create' || !existingTopic) {
    const contentMd = `# ${classification.topicPath.split('/').pop()}\n\n## 核心观点\n\n${classification.summary}\n\n## 关键证据\n${articleRef}\n\n## 关联主题\n\n${classification.links.map(l => `- [[${l.targetTopicPath}]]: ${l.reason}`).join('\n')}\n\n## 待澄清\n\n${classification.contradictions.length > 0 ? classification.contradictions.map(c => `- ${c.note}`).join('\n') : '无'}\n`;

    const topic = await prisma.wikiTopic.create({
      data: {
        topicPath: classification.topicPath,
        contentMd,
      },
    });

    await updateTopicEmbedding(topic.id, embedding);
    return topic;
  }

  const updatedContent = existingTopic.contentMd + articleRef;
  const topic = await prisma.wikiTopic.update({
    where: { id: existingTopic.id },
    data: { contentMd: updatedContent },
  });

  const newEmbedding = await generateEmbedding(updatedContent);
  await updateTopicEmbedding(topic.id, newEmbedding);
  return topic;
}
