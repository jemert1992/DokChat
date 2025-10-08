import { DocumentChunk } from './smartChunkingService';

/**
 * BM25 (Best Matching 25) - Keyword-based search algorithm
 * Used as first-pass filter before semantic reranking
 */
export class BM25SearchService {
  private readonly K1 = 1.5; // Term frequency saturation parameter
  private readonly B = 0.75; // Length normalization parameter

  /**
   * Search chunks using BM25 algorithm
   * Returns top-k chunks ranked by keyword relevance
   */
  async search(
    query: string,
    chunks: DocumentChunk[],
    topK: number = 10
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    console.log(`🔍 BM25 search: "${query}" across ${chunks.length} chunks`);
    const startTime = Date.now();

    // Tokenize query
    const queryTerms = this.tokenize(query);

    // Calculate IDF (Inverse Document Frequency) for each term
    const idf = this.calculateIDF(queryTerms, chunks);

    // Calculate BM25 score for each chunk
    const scores = chunks.map(chunk => ({
      chunk,
      score: this.calculateBM25Score(queryTerms, chunk, idf, chunks.length)
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return top-k results
    const results = scores.slice(0, topK).filter(s => s.score > 0);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ BM25 found ${results.length} relevant chunks in ${processingTime}ms`);
    console.log(`📊 Top scores: ${results.slice(0, 3).map(r => r.score.toFixed(2)).join(', ')}`);

    return results;
  }

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(term => term.length > 2) // Remove short terms
      .filter(term => !this.isStopWord(term)); // Remove stop words
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]);
    return stopWords.has(word);
  }

  /**
   * Calculate IDF (Inverse Document Frequency)
   */
  private calculateIDF(queryTerms: string[], chunks: DocumentChunk[]): Map<string, number> {
    const idf = new Map<string, number>();
    const N = chunks.length; // Total number of documents

    for (const term of queryTerms) {
      // Count documents containing this term
      const df = chunks.filter(chunk => 
        this.tokenize(chunk.content).includes(term)
      ).length;

      // Calculate IDF: log((N - df + 0.5) / (df + 0.5))
      const idfScore = df > 0 ? Math.log((N - df + 0.5) / (df + 0.5) + 1) : 0;
      idf.set(term, idfScore);
    }

    return idf;
  }

  /**
   * Calculate BM25 score for a chunk
   */
  private calculateBM25Score(
    queryTerms: string[],
    chunk: DocumentChunk,
    idf: Map<string, number>,
    corpusSize: number
  ): number {
    const chunkTerms = this.tokenize(chunk.content);
    const docLength = chunkTerms.length;
    
    // Calculate average document length
    const avgDocLength = chunk.tokens; // Approximate

    let score = 0;

    for (const term of queryTerms) {
      const termIDF = idf.get(term) || 0;
      
      // Calculate term frequency in document
      const tf = chunkTerms.filter(t => t === term).length;

      // BM25 formula
      const numerator = tf * (this.K1 + 1);
      const denominator = tf + this.K1 * (1 - this.B + this.B * (docLength / avgDocLength));
      
      score += termIDF * (numerator / denominator);
    }

    return score;
  }

  /**
   * Explain BM25 scoring for debugging
   */
  explainScore(
    query: string,
    chunk: DocumentChunk,
    score: number
  ): string {
    const queryTerms = this.tokenize(query);
    const chunkTerms = this.tokenize(chunk.content);

    const matches = queryTerms.filter(term => chunkTerms.includes(term));
    
    return `BM25 Score: ${score.toFixed(2)} | Matched terms: [${matches.join(', ')}] | Chunk: "${chunk.content.substring(0, 100)}..."`;
  }
}
