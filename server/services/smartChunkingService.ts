import Anthropic from '@anthropic-ai/sdk';

export interface DocumentChunk {
  id: string;
  content: string;
  tokens: number;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  pageNumber?: number;
  pageRange?: string;
  sectionHeader?: string;
  documentId: number;
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
}

export class SmartChunkingService {
  private anthropic: Anthropic | null = null;
  private readonly TARGET_CHUNK_SIZE = 1500; // 1-2K tokens target
  private readonly MIN_CHUNK_SIZE = 1000;
  private readonly MAX_CHUNK_SIZE = 2000;
  private readonly OVERLAP_TOKENS = 200; // Overlap for context continuity

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      console.log('🧩 Smart Chunking Service initialized with Claude token counting');
    }
  }

  /**
   * Smart chunking with metadata extraction
   * Splits documents into 1-2K token chunks while preserving structure
   */
  async chunkDocument(
    documentId: number,
    text: string,
    pageMarkers?: Map<number, number>
  ): Promise<DocumentChunk[]> {
    console.log(`🧩 Starting smart chunking for document ${documentId}`);
    const startTime = Date.now();

    // Step 1: Detect structure (headers, sections)
    const structure = await this.detectDocumentStructure(text);

    // Step 2: Split into semantic sections
    const sections = this.splitIntoSections(text, structure);

    // Step 3: Create chunks with metadata
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = await this.chunkSection(
        section,
        documentId,
        chunkIndex,
        pageMarkers
      );
      chunks.push(...sectionChunks);
      chunkIndex += sectionChunks.length;
    }

    // Update total chunks metadata
    chunks.forEach((chunk, idx) => {
      chunk.metadata.chunkIndex = idx;
      chunk.metadata.totalChunks = chunks.length;
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ Created ${chunks.length} smart chunks in ${processingTime}ms`);
    console.log(`📊 Avg chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length)} tokens`);

    return chunks;
  }

  /**
   * Detect document structure (headers, sections)
   */
  private async detectDocumentStructure(text: string): Promise<any> {
    // Detect headers using common patterns
    const headerPatterns = [
      /^#{1,6}\s+(.+)$/gm, // Markdown headers
      /^[A-Z][A-Z\s]{3,}$/gm, // ALL CAPS headers
      /^\d+\.\s+[A-Z].+$/gm, // Numbered sections
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:$/gm, // Title case with colon
      /^(?:Chapter|Section|Part|Article)\s+\d+/gim, // Common section keywords
    ];

    const headers: Array<{ text: string; position: number; level: number }> = [];

    headerPatterns.forEach((pattern, level) => {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          headers.push({
            text: match[0].trim(),
            position: match.index,
            level: level + 1
          });
        }
      }
    });

    // Sort by position
    headers.sort((a, b) => a.position - b.position);

    return { headers };
  }

  /**
   * Split document into semantic sections
   */
  private splitIntoSections(text: string, structure: any): Array<{
    content: string;
    header?: string;
    startPosition: number;
    endPosition: number;
  }> {
    const sections: Array<{
      content: string;
      header?: string;
      startPosition: number;
      endPosition: number;
    }> = [];

    if (structure.headers.length === 0) {
      // No headers found - treat as single section
      return [{
        content: text,
        startPosition: 0,
        endPosition: text.length
      }];
    }

    // Create sections based on headers
    for (let i = 0; i < structure.headers.length; i++) {
      const currentHeader = structure.headers[i];
      const nextHeader = structure.headers[i + 1];

      const startPos = currentHeader.position;
      const endPos = nextHeader ? nextHeader.position : text.length;

      sections.push({
        content: text.substring(startPos, endPos),
        header: currentHeader.text,
        startPosition: startPos,
        endPosition: endPos
      });
    }

    return sections;
  }

  /**
   * Chunk a section into 1-2K token chunks
   */
  private async chunkSection(
    section: any,
    documentId: number,
    startChunkIndex: number,
    pageMarkers?: Map<number, number>
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const sectionText = section.content;

    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(sectionText.length / 4);

    if (estimatedTokens <= this.MAX_CHUNK_SIZE) {
      // Section fits in one chunk
      const chunk: DocumentChunk = {
        id: `${documentId}_chunk_${startChunkIndex}`,
        content: sectionText,
        tokens: estimatedTokens,
        metadata: {
          documentId,
          chunkIndex: startChunkIndex,
          totalChunks: 0, // Will be updated later
          sectionHeader: section.header,
          pageNumber: this.findPageNumber(section.startPosition, pageMarkers),
          startPosition: section.startPosition,
          endPosition: section.endPosition
        }
      };
      chunks.push(chunk);
    } else {
      // Need to split section into multiple chunks
      const sentences = this.splitIntoSentences(sectionText);
      let currentChunk = '';
      let currentTokens = 0;
      let chunkStartPos = section.startPosition;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceTokens = Math.ceil(sentence.length / 4);

        if (currentTokens + sentenceTokens > this.MAX_CHUNK_SIZE && currentChunk.length > 0) {
          // Save current chunk
          const chunk: DocumentChunk = {
            id: `${documentId}_chunk_${startChunkIndex + chunks.length}`,
            content: currentChunk.trim(),
            tokens: currentTokens,
            metadata: {
              documentId,
              chunkIndex: startChunkIndex + chunks.length,
              totalChunks: 0,
              sectionHeader: section.header,
              pageNumber: this.findPageNumber(chunkStartPos, pageMarkers),
              startPosition: chunkStartPos,
              endPosition: chunkStartPos + currentChunk.length
            }
          };
          chunks.push(chunk);

          // Start new chunk with overlap
          const overlapSentences = sentences.slice(Math.max(0, i - 2), i);
          currentChunk = overlapSentences.join(' ') + ' ' + sentence;
          currentTokens = Math.ceil(currentChunk.length / 4);
          chunkStartPos = section.startPosition + sectionText.indexOf(overlapSentences[0] || sentence);
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
          currentTokens += sentenceTokens;
        }
      }

      // Add final chunk
      if (currentChunk.trim().length > 0) {
        const chunk: DocumentChunk = {
          id: `${documentId}_chunk_${startChunkIndex + chunks.length}`,
          content: currentChunk.trim(),
          tokens: currentTokens,
          metadata: {
            documentId,
            chunkIndex: startChunkIndex + chunks.length,
            totalChunks: 0,
            sectionHeader: section.header,
            pageNumber: this.findPageNumber(chunkStartPos, pageMarkers),
            startPosition: chunkStartPos,
            endPosition: section.endPosition
          }
        };
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting with common abbreviations handling
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Find page number for a text position
   */
  private findPageNumber(position: number, pageMarkers?: Map<number, number>): number | undefined {
    if (!pageMarkers || pageMarkers.size === 0) {
      return undefined;
    }

    // Find the page that contains this position
    let currentPage = 1;
    for (const [pageNum, pageStartPos] of Array.from(pageMarkers.entries()).sort((a, b) => a[1] - b[1])) {
      if (position >= pageStartPos) {
        currentPage = pageNum;
      } else {
        break;
      }
    }

    return currentPage;
  }

  /**
   * Count tokens using Claude API (accurate)
   */
  async countTokens(text: string): Promise<number> {
    if (!this.anthropic) {
      // Fallback estimation
      return Math.ceil(text.length / 4);
    }

    try {
      const response = await this.anthropic.messages.countTokens({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{
          role: 'user',
          content: text
        }]
      });

      return response.input_tokens;
    } catch (error) {
      console.warn('Token counting failed, using estimation:', error);
      return Math.ceil(text.length / 4);
    }
  }
}
