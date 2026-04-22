import { google } from "@ai-sdk/google";
import { embedMany, embed } from "ai";
import { KNOWLEDGE_BASE, KnowledgeChunk } from "./knowledge-base";

interface IndexedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

let index: IndexedChunk[] | null = null;
let indexing = false;
const MIN_SIMILARITY = -1;

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

function tokenize(text: string): string[] {
  const lowered = text.toLowerCase();
  const wordTokens = lowered.match(/[a-z0-9]{2,}/g) ?? [];
  const zhTokens = lowered.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  return [...wordTokens, ...zhTokens];
}

function lexicalOverlapScore(query: string, chunk: KnowledgeChunk): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return 0;
  const chunkTokens = new Set(tokenize(`${chunk.content} ${chunk.tags.join(" ")}`));
  let hits = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) hits += 1;
  }
  return hits / queryTokens.size;
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
    priorityTags?: string[];
    vectorWeight?: number;
    lexicalWeight?: number;
    minScore?: number;
  }
): Promise<KnowledgeChunk[]> {
  const topK = options?.topK ?? 4;
  const filterTags = options?.tags;
  const priorityTags = options?.priorityTags ?? [];
  const vectorWeight = options?.vectorWeight ?? 0.72;
  const lexicalWeight = options?.lexicalWeight ?? 0.28;
  const minScore = options?.minScore ?? MIN_SIMILARITY;

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

  const scored = candidates.map((item) => {
    const vectorScore = cosineSimilarity(queryEmbedding, item.embedding);
    const lexicalScore = lexicalOverlapScore(query, item.chunk);
    const hasPriorityTag =
      priorityTags.length > 0 &&
      priorityTags.some((t) => item.chunk.tags.includes(t));
    const priorityBoost = hasPriorityTag ? 0.06 : 0;
    const score =
      vectorScore * vectorWeight + lexicalScore * lexicalWeight + priorityBoost;
    return {
      chunk: item.chunk,
      score,
      vectorScore,
      lexicalScore,
      priorityBoost,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter((s) => s.score >= minScore)
    .slice(0, topK)
    .map((s) => s.chunk);
}
