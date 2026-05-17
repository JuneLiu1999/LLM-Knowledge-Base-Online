import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function findSimilarTopics(embedding: number[], limit = 5) {
  const vectorStr = `[${embedding.join(',')}]`;
  const results = await prisma.$queryRaw<
    Array<{ id: string; topic_path: string; content_md: string; distance: number }>
  >`
    SELECT id, topic_path, content_md,
           embedding <=> ${vectorStr}::vector AS distance
    FROM wiki_topics
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `;
  return results;
}

export async function updateTopicEmbedding(topicId: string, embedding: number[]) {
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE wiki_topics
    SET embedding = ${vectorStr}::vector
    WHERE id = ${topicId}
  `;
}
