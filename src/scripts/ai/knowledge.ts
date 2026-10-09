// The site's own content as small chunks (built at /ai/knowledge.json from src/data), fetched the first time a
// panel that needs it is used.
import type { Knowledge, KnowledgeChunk } from '../../lib/ai-knowledge';

let cached: Promise<KnowledgeChunk[]> | undefined;

const isChunk = (value: unknown): value is KnowledgeChunk => {
  const chunk = value as Partial<Record<keyof KnowledgeChunk, unknown>> | null;
  return (
    !!chunk &&
    typeof chunk.id === 'string' &&
    typeof chunk.kind === 'string' &&
    typeof chunk.title === 'string' &&
    typeof chunk.text === 'string' &&
    typeof chunk.href === 'string'
  );
};

export function loadKnowledge(): Promise<KnowledgeChunk[]> {
  cached ??= fetch('/ai/knowledge.json')
    .then((response) => {
      if (!response.ok) throw new Error(`knowledge.json: HTTP ${response.status}`);
      return response.json() as Promise<Partial<Knowledge>>;
    })
    .then((data) => {
      const chunks = Array.isArray(data.chunks) ? data.chunks.filter(isChunk) : [];
      if (chunks.length === 0) throw new Error('knowledge.json: no chunks');
      return chunks;
    })
    .catch((error) => {
      cached = undefined; // let the next try fetch again
      throw error;
    });
  return cached;
}
