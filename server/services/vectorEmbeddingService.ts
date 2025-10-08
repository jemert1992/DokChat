import OpenAI from 'openai';
import { DocumentChunk } from './smartChunkingService';

/**
 * Vector Embedding Service for semantic search
 * Uses OpenAI embeddings for high-quality semantic understanding
 */
export class VectorEmbeddingService {
  private openai: OpenAI | null = null;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small'; // Fast and cost-effective
  private readonly EMBEDDING_DIMENSIONS = 1536;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      console.log('🧠 Vector Embedding Service initialized with OpenAI');
    } else {
      console.warn('⚠️ OpenAI API key not found - vector search disabled');
    }
  }

  /**
   * Generate embedding for a text query
   */
  async embedQuery(query: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized - cannot generate embeddings');
    }

    const response = await this.openai.embeddings.create({
      model: this.EMBEDDING_MODEL,
      input: query,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for chunks in batch
   */
  async embedChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.openai) {
      console.warn('⚠️ OpenAI not available - skipping embedding generation');
      return;
    }

    console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);
    const startTime = Date.now();

    // Batch process to respect rate limits (max 2048 inputs per request)
    const batchSize = 100;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map(chunk => chunk.content);

      try {
        const response = await this.openai.embeddings.create({
          model: this.EMBEDDING_MODEL,
          input: texts,
        });

        // Assign embeddings back to chunks
        response.data.forEach((embeddingData, idx) => {
          batch[idx].embedding = embeddingData.embedding;
        });

        console.log(`✅ Embedded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      } catch (error) {
        console.error(`❌ Embedding batch ${i}-${i + batchSize} failed:`, error);
        // Continue with next batch
      }
    }

    const processingTime = Date.now() - startTime;
    const successCount = chunks.filter(c => c.embedding).length;
    console.log(`✅ Embedded ${successCount}/${chunks.length} chunks in ${processingTime}ms`);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Semantic search using vector similarity
   */
  async semanticSearch(
    queryEmbedding: number[],
    chunks: DocumentChunk[],
    topK: number = 10
  ): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
    console.log(`🔍 Semantic search across ${chunks.length} chunks`);
    const startTime = Date.now();

    // Filter chunks that have embeddings
    const chunksWithEmbeddings = chunks.filter(chunk => chunk.embedding);

    if (chunksWithEmbeddings.length === 0) {
      console.warn('⚠️ No chunks have embeddings - semantic search skipped');
      return [];
    }

    // Calculate similarity scores
    const results = chunksWithEmbeddings.map(chunk => ({
      chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding!)
    }));

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    // Return top-k results
    const topResults = results.slice(0, topK);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Semantic search completed in ${processingTime}ms`);
    console.log(`📊 Top similarities: ${topResults.slice(0, 3).map(r => r.similarity.toFixed(3)).join(', ')}`);

    return topResults;
  }

  /**
   * Rerank chunks using semantic similarity
   * Combines BM25 candidates with semantic scoring
   */
  async rerank(
    queryEmbedding: number[],
    candidates: Array<{ chunk: DocumentChunk; score: number }>
  ): Promise<Array<{ chunk: DocumentChunk; score: number; similarity: number }>> {
    console.log(`🔄 Reranking ${candidates.length} BM25 candidates with semantic similarity`);
    
    const reranked = candidates.map(candidate => {
      const similarity = candidate.chunk.embedding
        ? this.cosineSimilarity(queryEmbedding, candidate.chunk.embedding)
        : 0;

      // Combined score: BM25 (40%) + Semantic (60%)
      const combinedScore = (candidate.score * 0.4) + (similarity * 0.6);

      return {
        chunk: candidate.chunk,
        score: combinedScore,
        similarity,
        bm25Score: candidate.score
      };
    });

    // Sort by combined score
    reranked.sort((a, b) => b.score - a.score);

    console.log(`✅ Reranking complete`);
    console.log(`📊 Top combined scores: ${reranked.slice(0, 3).map(r => r.score.toFixed(3)).join(', ')}`);

    return reranked;
  }
}
