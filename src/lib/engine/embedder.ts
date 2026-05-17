import { getEmbeddingClient, getEmbeddingModelName } from '@/lib/llm';

export async function generateEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 8000);
  const client = await getEmbeddingClient();
  const modelName = await getEmbeddingModelName();

  const response = await client.embeddings.create({
    model: modelName,
    input: truncated,
  });

  return response.data[0].embedding;
}
