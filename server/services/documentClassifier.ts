import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';

export interface DocumentClassification {
  documentType: string; // 'invoice', 'contract', 'form', 'report', 'receipt', 'medical_record', etc.
  complexity: 'simple' | 'medium' | 'complex';
  hasTable: boolean;
  hasChart: boolean;
  hasHandwriting: boolean;
  language: string;
  pageCount: number;
  recommendedProcessor: 'vision_api' | 'document_ai' | 'full_pipeline';
  confidence: number;
  description: string;
}

export class DocumentClassifierService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found - document classification will use basic fallback');
    } else {
      this.genAI = new GoogleGenAI({ apiKey });
      console.log('✅ Document Classifier initialized with Gemini Flash');
    }
  }

  /**
   * Classify a document to determine optimal processing path
   * Uses Gemini Flash for fast, cost-effective visual classification
   */
  async classifyDocument(
    filePath: string,
    mimeType: string
  ): Promise<DocumentClassification> {
    try {
      // SPEED OPTIMIZATION: Skip AI classification for small, simple PDFs (< 2MB)
      // These are likely native PDFs with text layers and can go straight to fast processing
      const stats = await fs.stat(filePath);
      if (mimeType === 'application/pdf' && stats.size < 2 * 1024 * 1024) {
        console.log(`⚡ Skipping classification for small PDF (${Math.round(stats.size / 1024)}KB) - using fast track`);
        return {
          documentType: 'document',
          complexity: 'simple',
          hasTable: false,
          hasChart: false,
          hasHandwriting: false,
          language: 'en',
          pageCount: Math.ceil(stats.size / 50000), // Rough estimate: ~50KB per page
          recommendedProcessor: 'vision_api',
          confidence: 85,
          description: 'Small PDF document - fast track processing'
        };
      }

      // If no Gemini API, use basic classification
      if (!this.genAI) {
        return this.basicClassification(filePath, mimeType);
      }

      // Read file for analysis
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Use Gemini Flash for fast classification
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `Analyze this document and classify it for intelligent processing.

Provide a JSON response with the following structure:
{
  "documentType": "invoice|contract|form|report|receipt|medical_record|legal_document|financial_statement|shipping_manifest|property_deed|other",
  "complexity": "simple|medium|complex",
  "hasTable": true/false,
  "hasChart": true/false,
  "hasHandwriting": true/false,
  "language": "en|es|fr|de|zh|ja|other",
  "pageCount": estimated_number,
  "confidence": 0-100,
  "description": "Brief description of document content and structure"
}

Complexity guidelines:
- simple: Plain text, minimal formatting, single column
- medium: Tables, forms, structured layout, 2-3 columns
- complex: Multiple tables, charts, mixed layout, handwriting, poor quality

Respond with ONLY the JSON, no additional text.`;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ]);

      const response = result.response.text();
      
      // Extract JSON from response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ Could not parse Gemini classification response, using basic fallback');
        return this.basicClassification(filePath, mimeType);
      }

      const classification = JSON.parse(jsonMatch[0]);

      // Determine recommended processor based on classification
      const recommendedProcessor = this.determineProcessor(classification);

      return {
        documentType: classification.documentType || 'other',
        complexity: classification.complexity || 'medium',
        hasTable: classification.hasTable || false,
        hasChart: classification.hasChart || false,
        hasHandwriting: classification.hasHandwriting || false,
        language: classification.language || 'en',
        pageCount: classification.pageCount || 1,
        recommendedProcessor,
        confidence: classification.confidence || 70,
        description: classification.description || 'Document classified',
      };
    } catch (error) {
      console.error('❌ Document classification error:', error);
      return this.basicClassification(filePath, mimeType);
    }
  }

  /**
   * Determine optimal processor based on classification
   */
  private determineProcessor(
    classification: any
  ): 'vision_api' | 'document_ai' | 'full_pipeline' {
    // Complex documents with tables, charts, or handwriting need full pipeline
    if (
      classification.complexity === 'complex' ||
      classification.hasTable ||
      classification.hasChart ||
      classification.hasHandwriting
    ) {
      return 'full_pipeline';
    }

    // Specialized document types benefit from Document AI
    if (
      ['invoice', 'receipt', 'form', 'contract'].includes(classification.documentType)
    ) {
      return 'document_ai';
    }

    // Simple text documents can use Vision API
    return 'vision_api';
  }

  /**
   * Basic classification fallback when Gemini is unavailable
   */
  private async basicClassification(
    filePath: string,
    mimeType: string
  ): Promise<DocumentClassification> {
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Basic heuristics
    const complexity = fileSize > 5000000 ? 'complex' : fileSize > 1000000 ? 'medium' : 'simple';
    
    return {
      documentType: 'other',
      complexity,
      hasTable: false,
      hasChart: false,
      hasHandwriting: false,
      language: 'en',
      pageCount: Math.ceil(fileSize / 100000), // Rough estimate
      recommendedProcessor: complexity === 'simple' ? 'vision_api' : 'full_pipeline',
      confidence: 50,
      description: 'Basic classification based on file size',
    };
  }
}
