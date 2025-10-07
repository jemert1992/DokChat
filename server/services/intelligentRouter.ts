import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { VisionService } from './visionService';
import Anthropic from '@anthropic-ai/sdk';

export type ProcessingMethod = 'gemini_native' | 'ocr_vision' | 'claude_native';

export interface RoutingDecision {
  method: ProcessingMethod;
  reason: string;
  confidence: number;
  estimatedTime: number; // in seconds
}

export interface ProcessingResult {
  text: string;
  confidence: number;
  method: ProcessingMethod;
  metadata: {
    pageCount?: number;
    processingTime?: number;
    [key: string]: any;
  };
}

export class IntelligentDocumentRouter {
  private gemini: GoogleGenAI | null = null;
  private visionService: VisionService;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize Gemini if available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }

    // Initialize Vision service
    this.visionService = new VisionService();

    // Initialize Anthropic if available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  /**
   * Analyzes document and determines optimal processing method
   */
  async routeDocument(filePath: string, mimeType: string): Promise<RoutingDecision> {
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Check if it's a PDF
    if (mimeType === 'application/pdf' || fileExt === '.pdf') {
      // Check if PDF has embedded text (native PDF) or is scanned
      const hasTextLayer = await this.checkPDFTextLayer(filePath);
      
      if (hasTextLayer && this.gemini) {
        // Native PDF with text - Gemini is fastest and most accurate
        return {
          method: 'gemini_native',
          reason: 'PDF with embedded text - using Gemini native multimodal processing for optimal speed and accuracy',
          confidence: 0.95,
          estimatedTime: 15 // 10-20 seconds typical
        };
      } else {
        // Scanned PDF or image-based - needs OCR
        return {
          method: 'ocr_vision',
          reason: 'Scanned PDF or image-based document - using Google Vision OCR for text extraction',
          confidence: 0.90,
          estimatedTime: 60 // 30-90 seconds depending on pages
        };
      }
    }
    
    // Image files always need OCR
    if (mimeType.startsWith('image/')) {
      return {
        method: 'ocr_vision',
        reason: 'Image document - using Google Vision OCR for text extraction',
        confidence: 0.95,
        estimatedTime: 30 // 20-40 seconds for images
      };
    }

    // Default to OCR for unknown types
    return {
      method: 'ocr_vision',
      reason: 'Unknown document type - using OCR as fallback',
      confidence: 0.70,
      estimatedTime: 45
    };
  }

  /**
   * Checks if a PDF has embedded text layer
   */
  private async checkPDFTextLayer(filePath: string): Promise<boolean> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfContent = fileBuffer.toString('latin1');
      
      // Simple heuristic: look for text content markers
      // PDFs with text layer have /Font, /Type /Font, and text objects
      const hasFont = pdfContent.includes('/Font') || pdfContent.includes('/Type /Font');
      const hasText = pdfContent.includes('BT') && pdfContent.includes('ET'); // BeginText/EndText operators
      
      return hasFont && hasText;
    } catch (error) {
      console.error('Error checking PDF text layer:', error);
      return false; // Assume scanned if can't determine
    }
  }

  /**
   * Process document using the selected method
   */
  async processDocument(
    filePath: string, 
    method: ProcessingMethod,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      switch (method) {
        case 'gemini_native':
          return await this.processWithGeminiNative(filePath, progressCallback);
        
        case 'ocr_vision':
          return await this.processWithOCR(filePath, progressCallback);
        
        case 'claude_native':
          return await this.processWithClaudeNative(filePath, progressCallback);
        
        default:
          throw new Error(`Unknown processing method: ${method}`);
      }
    } catch (error) {
      console.error(`Error processing with ${method}:`, error);
      // Fallback to OCR if primary method fails
      if (method !== 'ocr_vision') {
        console.log('Falling back to OCR...');
        return await this.processWithOCR(filePath, progressCallback);
      }
      throw error;
    }
  }

  /**
   * Process PDF natively with Gemini (fastest for text-based PDFs)
   */
  private async processWithGeminiNative(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    if (!this.gemini) {
      throw new Error('Gemini API not available');
    }

    const startTime = Date.now();
    progressCallback?.(10, 'Uploading document to Gemini...');

    // Read PDF file
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    progressCallback?.(30, 'Processing with Gemini Flash 2.0...');

    // Use Gemini Flash 2.0 for fast document processing
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      },
      {
        text: 'Extract all text content from this document. Preserve formatting, structure, and page breaks. Return the complete text exactly as it appears.'
      }
    ]);

    progressCallback?.(90, 'Finalizing extraction...');

    const extractedText = result.response.text();
    const processingTime = Date.now() - startTime;

    // Estimate page count from text length
    const estimatedPages = Math.ceil(extractedText.length / 3000);

    progressCallback?.(100, 'Complete!');

    return {
      text: extractedText,
      confidence: 0.95, // Gemini native has high confidence for text PDFs
      method: 'gemini_native',
      metadata: {
        pageCount: estimatedPages,
        processingTime: processingTime,
        model: 'gemini-2.0-flash-exp'
      }
    };
  }

  /**
   * Process with OCR (for scanned documents and images)
   */
  private async processWithOCR(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const fileExt = path.extname(filePath).toLowerCase();

    // Use Vision service with reduced batch size to avoid resource exhaustion
    let ocrResult;
    
    if (fileExt === '.pdf') {
      // Process PDF with limited pages for quick mode
      ocrResult = await this.visionService.extractTextFromPDFLimited(
        filePath,
        250, // Process up to 250 pages
        (current, total, timeRemaining) => {
          const progress = 10 + Math.round((current / total) * 80);
          progressCallback?.(progress, `OCR page ${current}/${total} (~${timeRemaining}s remaining)`);
        }
      );
    } else {
      // Single image
      progressCallback?.(30, 'Extracting text from image...');
      ocrResult = await this.visionService.extractTextFromImage(filePath);
    }

    const processingTime = Date.now() - startTime;
    progressCallback?.(100, 'OCR complete!');

    return {
      text: ocrResult.text,
      confidence: ocrResult.confidence / 100, // Convert to 0-1 range
      method: 'ocr_vision',
      metadata: {
        processingTime: processingTime,
        handwritingDetected: ocrResult.handwritingDetected,
        language: ocrResult.language
      }
    };
  }

  /**
   * Process natively with Claude (for complex analysis)
   */
  private async processWithClaudeNative(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic API not available');
    }

    const startTime = Date.now();
    progressCallback?.(10, 'Uploading document to Claude...');

    // Read PDF file
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    progressCallback?.(30, 'Processing with Claude 3.5 Sonnet...');

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Data
            }
          },
          {
            type: 'text',
            text: 'Extract all text content from this document. Preserve formatting, structure, and page breaks. Return the complete text exactly as it appears.'
          }
        ]
      }]
    });

    progressCallback?.(90, 'Finalizing extraction...');

    const extractedText = response.content[0].type === 'text' ? response.content[0].text : '';
    const processingTime = Date.now() - startTime;

    progressCallback?.(100, 'Complete!');

    return {
      text: extractedText,
      confidence: 0.92,
      method: 'claude_native',
      metadata: {
        processingTime: processingTime,
        model: 'claude-3-5-sonnet-20241022'
      }
    };
  }
}
