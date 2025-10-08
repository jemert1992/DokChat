import { SmartChunkingService, DocumentChunk } from './smartChunkingService';
import { BM25SearchService } from './bm25SearchService';
import { VectorEmbeddingService } from './vectorEmbeddingService';
import Anthropic from '@anthropic-ai/sdk';

export interface RAGResult {
  answer: string;
  citations: Citation[];
  confidence: number;
  selfCritique: string;
  retrievedChunks: DocumentChunk[];
}

export interface Citation {
  text: string;
  chunkId: string;
  pageNumber?: number;
  sectionHeader?: string;
  confidence: number;
}

/**
 * Hybrid RAG Pipeline with BM25 + Vector Semantic Rerank
 * Implements citation-based responses with confidence scoring
 */
export class HybridRAGService {
  private chunkingService: SmartChunkingService;
  private bm25Service: BM25SearchService;
  private vectorService: VectorEmbeddingService;
  private anthropic: Anthropic | null = null;

  // Cache for document chunks and embeddings
  private chunkCache: Map<number, DocumentChunk[]> = new Map();

  constructor() {
    this.chunkingService = new SmartChunkingService();
    this.bm25Service = new BM25SearchService();
    this.vectorService = new VectorEmbeddingService();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      console.log('🔗 Hybrid RAG Service initialized with Claude Sonnet 4.5');
    }
  }

  /**
   * Process and chunk a document for RAG
   */
  async indexDocument(
    documentId: number,
    text: string,
    pageMarkers?: Map<number, number>
  ): Promise<DocumentChunk[]> {
    console.log(`📚 Indexing document ${documentId} for RAG`);

    // Step 1: Smart chunking
    const chunks = await this.chunkingService.chunkDocument(documentId, text, pageMarkers);

    // Step 2: Generate embeddings
    await this.vectorService.embedChunks(chunks);

    // Cache chunks
    this.chunkCache.set(documentId, chunks);

    console.log(`✅ Document ${documentId} indexed: ${chunks.length} chunks with embeddings`);
    return chunks;
  }

  /**
   * Query documents using hybrid retrieval (BM25 + Vector rerank)
   */
  async query(
    query: string,
    documentIds: number[],
    topK: number = 5
  ): Promise<RAGResult> {
    console.log(`🔍 Hybrid RAG query: "${query}" across ${documentIds.length} documents`);
    const startTime = Date.now();

    // Step 1: Get all chunks for specified documents
    const allChunks: DocumentChunk[] = [];
    for (const docId of documentIds) {
      const chunks = this.chunkCache.get(docId);
      if (chunks) {
        allChunks.push(...chunks);
      }
    }

    if (allChunks.length === 0) {
      throw new Error('No indexed chunks found for specified documents');
    }

    console.log(`📊 Searching across ${allChunks.length} total chunks`);

    // Step 2: BM25 keyword search (first-pass filter)
    const bm25Results = await this.bm25Service.search(query, allChunks, topK * 3); // Get 3x candidates

    // Step 3: Vector semantic rerank
    const queryEmbedding = await this.vectorService.embedQuery(query);
    const rerankedResults = await this.vectorService.rerank(queryEmbedding, bm25Results);

    // Step 4: Get top-k final chunks
    const topChunks = rerankedResults.slice(0, topK).map(r => r.chunk);

    // Step 5: Generate answer with citations using Claude Sonnet 4.5
    const result = await this.generateAnswerWithCitations(query, topChunks);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Hybrid RAG completed in ${processingTime}ms`);
    console.log(`📝 Answer confidence: ${result.confidence.toFixed(2)}`);
    console.log(`📌 Citations: ${result.citations.length}`);

    return {
      ...result,
      retrievedChunks: topChunks
    };
  }

  /**
   * Generate answer with explicit citations and self-critique
   */
  private async generateAnswerWithCitations(
    query: string,
    chunks: DocumentChunk[]
  ): Promise<Omit<RAGResult, 'retrievedChunks'>> {
    if (!this.anthropic) {
      throw new Error('Claude Sonnet 4.5 not initialized');
    }

    // Build context from chunks
    const context = chunks.map((chunk, idx) => {
      const citation = `[${idx + 1}]`;
      const metadata = [
        chunk.metadata.pageNumber ? `Page ${chunk.metadata.pageNumber}` : null,
        chunk.metadata.sectionHeader ? `Section: ${chunk.metadata.sectionHeader}` : null
      ].filter(Boolean).join(', ');

      return `${citation} ${metadata ? `(${metadata})` : ''}\n${chunk.content}`;
    }).join('\n\n');

    const prompt = `You are a precise document analysis AI. Answer the query using ONLY the provided context.

QUERY: ${query}

CONTEXT:
${context}

CRITICAL INSTRUCTIONS:
1. CITATIONS: Use [1], [2], etc. to cite sources for EVERY claim
2. CONFIDENCE: Provide a confidence score (0.0-1.0) for your answer
3. SELF-CRITIQUE: End with a brief self-critique identifying potential weaknesses or uncertainties in your answer
4. NO HALLUCINATION: If the context doesn't contain the answer, explicitly state this

OUTPUT FORMAT (JSON):
{
  "answer": "Your detailed answer with inline citations [1][2]...",
  "confidence": 0.0-1.0,
  "citations": [
    {
      "number": 1,
      "text": "Exact quote from context",
      "reasoning": "Why this supports the answer"
    }
  ],
  "selfCritique": "Honest assessment of answer quality and limitations"
}

Provide your response as valid JSON only.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Map citations to chunks
    const citations: Citation[] = (parsed.citations || []).map((cite: any) => {
      const chunkIdx = cite.number - 1;
      const chunk = chunks[chunkIdx];
      
      return {
        text: cite.text,
        chunkId: chunk?.id || `unknown_${cite.number}`,
        pageNumber: chunk?.metadata.pageNumber,
        sectionHeader: chunk?.metadata.sectionHeader,
        confidence: chunk ? 0.9 : 0.5
      };
    });

    return {
      answer: parsed.answer || responseText,
      citations,
      confidence: parsed.confidence || 0.5,
      selfCritique: parsed.selfCritique || 'No self-critique provided'
    };
  }

  /**
   * Get cached chunks for a document
   */
  getDocumentChunks(documentId: number): DocumentChunk[] | undefined {
    return this.chunkCache.get(documentId);
  }

  /**
   * Clear chunk cache for a document
   */
  clearDocumentCache(documentId: number): void {
    this.chunkCache.delete(documentId);
    console.log(`🗑️ Cleared chunk cache for document ${documentId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { documents: number; totalChunks: number } {
    const documents = this.chunkCache.size;
    let totalChunks = 0;
    
    for (const chunks of this.chunkCache.values()) {
      totalChunks += chunks.length;
    }

    return { documents, totalChunks };
  }
}
