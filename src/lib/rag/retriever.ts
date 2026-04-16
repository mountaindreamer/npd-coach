import { google } from "@ai-sdk/google";
import { embedMany, embed } from "ai";
import { KNOWLEDGE_BASE, KnowledgeChunk } from "./knowledge-base";

interface IndexedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

let index: IndexedChunk[] | null = null;
let indexing = false;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildIndex(): Promise<IndexedChunk[]> {
  if (index) return index;
  if (indexing) {
    while (indexing) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return index!;
  }

  indexing = true;
  try {
    const model = google.textEmbeddingModel("text-embedding-004");
    const texts = KNOWLEDGE_BASE.map((c) => c.content);

    const batchSize = 20;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const { embeddings } = await embedMany({ model, values: batch });
      allEmbeddings.push(...embeddings);
    }

    index = KNOWLEDGE_BASE.map((chunk, i) => ({
      chunk,
      embedding: allEmbeddings[i],
    }));

    console.log(`[RAG] Index built: ${index.length} chunks`);
    return index;
  } finally {
    indexing = false;
  }
}

export async function retrieveRelevantChunks(
  query: string,
  options?: {
    topK?: number;
    tags?: string[];
  }
): Promise<KnowledgeChunk[]> {
  const topK = options?.topK ?? 4;
  const filterTags = options?.tags;

  const builtIndex = await buildIndex();

  const model = google.textEmbeddingModel("text-embedding-004");
  const { embedding: queryEmbedding } = await embed({
    model,
    value: query,
  });

  let candidates = builtIndex;
  if (filterTags && filterTags.length > 0) {
    candidates = builtIndex.filter(
      (item) =>
        item.chunk.tags.includes("all") ||
        filterTags.some((t) => item.chunk.tags.includes(t))
    );
  }

  const scored = candidates.map((item) => ({
    chunk: item.chunk,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.chunk);
}
