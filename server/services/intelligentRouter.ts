import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { VisionService } from './visionService';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { metricsTrackingService } from './metricsTrackingService';

export type ProcessingMethod = 'claude_sonnet' | 'gemini_native' | 'openai_gpt5' | 'ocr_vision';

export interface DocumentClassification {
  documentType: string;
  complexity: 'simple' | 'medium' | 'complex';
  hasTable: boolean;
  hasChart: boolean;
  hasHandwriting: boolean;
  recommendedProcessor: ProcessingMethod;
  confidence: number;
  reasoning: string;
}

export interface RoutingDecision {
  method: ProcessingMethod;
  reason: string;
  confidence: number;
  estimatedTime: number; // in seconds
  classification?: DocumentClassification;
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
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize Gemini if available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }

    // Initialize Vision service
    this.visionService = new VisionService();

    // Initialize Anthropic (Claude) if available - TOP PRIORITY
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    // Initialize OpenAI if available
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Pre-classify document using Claude Sonnet 4.5 (most advanced AI)
   * This determines the optimal processing strategy before routing
   */
  async preClassifyWithClaude(filePath: string, mimeType: string): Promise<DocumentClassification> {
    if (!this.anthropic) {
      console.log('⚠️ Claude not available for pre-classification, using basic classification');
      return this.basicClassification(filePath, mimeType);
    }

    try {
      console.log('🔬 Pre-classifying document with Claude Sonnet 4.5...');
      
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf' as const,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: `Analyze this document and classify it for intelligent processing.

Provide a JSON response with the following structure:
{
  "documentType": "invoice|contract|form|report|receipt|medical_record|legal_document|financial_statement|shipping_manifest|property_deed|other",
  "complexity": "simple|medium|complex",
  "hasTable": true/false,
  "hasChart": true/false,
  "hasHandwriting": true/false,
  "recommendedProcessor": "claude_sonnet|gemini_native|openai_gpt5|ocr_vision",
  "confidence": 0-100,
  "reasoning": "Explain why you chose this processor"
}

Complexity guidelines:
- simple: Plain text, minimal formatting, single column
- medium: Tables, forms, structured layout, 2-3 columns  
- complex: Multiple tables, charts, mixed layout, handwriting, poor quality

Processor selection priority:
1. claude_sonnet: For complex documents with nuanced content, legal/medical analysis, multi-step reasoning
2. gemini_native: For native PDFs with embedded text, fast processing needed
3. openai_gpt5: For structured documents requiring precise entity extraction
4. ocr_vision: ONLY for scanned documents or images with no text layer (last resort)

Respond with ONLY the JSON, no additional text.`
            }
          ]
        }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ Could not parse Claude classification response, using basic fallback');
        return this.basicClassification(filePath, mimeType);
      }

      const classification = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ Claude Classification: ${classification.documentType} (${classification.complexity}) → ${classification.recommendedProcessor}`);
      console.log(`   Reasoning: ${classification.reasoning}`);

      return {
        documentType: classification.documentType || 'other',
        complexity: classification.complexity || 'medium',
        hasTable: classification.hasTable || false,
        hasChart: classification.hasChart || false,
        hasHandwriting: classification.hasHandwriting || false,
        recommendedProcessor: classification.recommendedProcessor || 'claude_sonnet',
        confidence: classification.confidence || 70,
        reasoning: classification.reasoning || 'Claude pre-classification complete'
      };
    } catch (error) {
      console.error('❌ Claude pre-classification error:', error);
      return this.basicClassification(filePath, mimeType);
    }
  }

  /**
   * Basic classification fallback (when Claude is unavailable)
   */
  private async basicClassification(filePath: string, mimeType: string): Promise<DocumentClassification> {
    const fileExt = path.extname(filePath).toLowerCase();
    const stats = await fs.stat(filePath);
    const fileSizeKB = stats.size / 1024;

    // Check if PDF has text layer
    let hasTextLayer = false;
    if (fileExt === '.pdf') {
      hasTextLayer = await this.checkPDFTextLayer(filePath);
    }

    // Determine processor based on file characteristics
    let recommendedProcessor: ProcessingMethod;
    
    if (fileExt === '.pdf' && hasTextLayer && this.gemini) {
      recommendedProcessor = 'gemini_native'; // Fast for native PDFs
    } else if (fileExt === '.pdf' && hasTextLayer && this.openai) {
      recommendedProcessor = 'openai_gpt5'; // Alternative for native PDFs
    } else if (fileExt === '.pdf' && !hasTextLayer) {
      recommendedProcessor = 'ocr_vision'; // Scanned PDFs need OCR
    } else if (mimeType.startsWith('image/')) {
      recommendedProcessor = 'ocr_vision'; // Images need OCR
    } else {
      recommendedProcessor = this.anthropic ? 'claude_sonnet' : 'ocr_vision';
    }

    return {
      documentType: 'other',
      complexity: fileSizeKB > 1000 ? 'complex' : fileSizeKB > 200 ? 'medium' : 'simple',
      hasTable: false,
      hasChart: false,
      hasHandwriting: false,
      recommendedProcessor,
      confidence: 60,
      reasoning: 'Basic classification (Claude unavailable)'
    };
  }

  /**
   * Analyzes document and determines optimal processing method using Claude pre-classification
   */
  async routeDocument(filePath: string, mimeType: string): Promise<RoutingDecision> {
    console.log(`🧭 Routing document: ${path.basename(filePath)}, mimeType: ${mimeType}`);
    
    // Step 1: Pre-classify with Claude Sonnet 4.5
    const classification = await this.preClassifyWithClaude(filePath, mimeType);

    // Step 2: Determine routing based on classification and API availability
    const method = this.determineProcessingMethod(classification);

    // Step 3: Calculate estimated time based on method
    const estimatedTime = this.estimateProcessingTime(method, classification.complexity);

    console.log(`🚀 ROUTING TO: ${method.toUpperCase()} (${estimatedTime}s estimated)`);

    return {
      method,
      reason: classification.reasoning,
      confidence: classification.confidence / 100,
      estimatedTime,
      classification
    };
  }

  /**
   * Determine processing method based on classification and API availability
   * Priority: Claude Sonnet → Gemini → OpenAI → OCR (fallback)
   */
  private determineProcessingMethod(classification: DocumentClassification): ProcessingMethod {
    // Honor Claude's recommendation if the service is available
    switch (classification.recommendedProcessor) {
      case 'claude_sonnet':
        if (this.anthropic) return 'claude_sonnet';
        if (this.gemini) return 'gemini_native';
        if (this.openai) return 'openai_gpt5';
        return 'ocr_vision';

      case 'gemini_native':
        if (this.gemini) return 'gemini_native';
        if (this.anthropic) return 'claude_sonnet';
        if (this.openai) return 'openai_gpt5';
        return 'ocr_vision';

      case 'openai_gpt5':
        if (this.openai) return 'openai_gpt5';
        if (this.anthropic) return 'claude_sonnet';
        if (this.gemini) return 'gemini_native';
        return 'ocr_vision';

      case 'ocr_vision':
        // OCR is last resort, try AI models first
        if (this.anthropic) return 'claude_sonnet';
        if (this.gemini) return 'gemini_native';
        if (this.openai) return 'openai_gpt5';
        return 'ocr_vision';

      default:
        // Default cascade: Claude → Gemini → OpenAI → OCR
        if (this.anthropic) return 'claude_sonnet';
        if (this.gemini) return 'gemini_native';
        if (this.openai) return 'openai_gpt5';
        return 'ocr_vision';
    }
  }

  /**
   * Estimate processing time based on method and complexity
   */
  private estimateProcessingTime(method: ProcessingMethod, complexity: string): number {
    const baseTime = {
      'claude_sonnet': 20,    // Advanced reasoning takes time
      'gemini_native': 15,    // Fast for native PDFs
      'openai_gpt5': 25,      // Structured extraction
      'ocr_vision': 60        // Slowest, OCR processing
    };

    const complexityMultiplier: { [key: string]: number } = {
      'simple': 0.5,
      'medium': 1.0,
      'complex': 1.8
    };

    return Math.round(baseTime[method] * (complexityMultiplier[complexity] || 1.0));
  }

  /**
   * Checks if a PDF has embedded text layer
   */
  private async checkPDFTextLayer(filePath: string): Promise<boolean> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfContent = fileBuffer.toString('latin1');
      
      const hasFont = pdfContent.includes('/Font') || pdfContent.includes('/Type /Font') || pdfContent.includes('/BaseFont');
      const hasTextOperators = pdfContent.includes('BT') && pdfContent.includes('ET');
      const hasTj = pdfContent.includes('Tj') || pdfContent.includes('TJ');
      const hasText = pdfContent.includes('/Type/Page') && (hasTextOperators || hasTj);
      
      return hasFont && hasText;
    } catch (error) {
      console.error('Error checking PDF text layer:', error);
      return false;
    }
  }

  /**
   * Process document using the selected method with CASCADE FALLBACK
   * Priority: Current method → Claude → Gemini → OpenAI → OCR
   */
  async processDocument(
    filePath: string, 
    method: ProcessingMethod,
    progressCallback?: (progress: number, message: string) => void,
    documentId?: number
  ): Promise<ProcessingResult> {
    console.log(`⚙️ Processing with ${method}...`);

    const startTime = Date.now();
    let result: ProcessingResult;
    let errors: any[] = [];

    try {
      switch (method) {
        case 'claude_sonnet':
          result = await this.processWithClaudeSonnet(filePath, progressCallback);
          break;
        
        case 'gemini_native':
          result = await this.processWithGeminiNative(filePath, progressCallback);
          break;
        
        case 'openai_gpt5':
          result = await this.processWithOpenAI(filePath, progressCallback);
          break;
        
        case 'ocr_vision':
          result = await this.processWithOCR(filePath, progressCallback);
          break;
        
        default:
          throw new Error(`Unknown processing method: ${method}`);
      }

      // Track successful processing metrics
      if (documentId) {
        await metricsTrackingService.trackAIAnalysis(documentId, {
          confidence: result.confidence,
          method: result.method,
          processingTime: Date.now() - startTime,
          errors: [],
        });
      }

      return result;

    } catch (error) {
      console.error(`❌ ${method} failed:`, error);
      errors.push({ method, error: error instanceof Error ? error.message : 'Unknown error' });
      
      // CASCADE FALLBACK: Try next best AI model, NOT OCR
      if (method === 'claude_sonnet' && this.gemini) {
        console.log('🔄 Cascading to Gemini...');
        result = await this.processWithGeminiNative(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }
      
      if (method === 'claude_sonnet' && !this.gemini && this.openai) {
        console.log('🔄 Cascading to OpenAI...');
        result = await this.processWithOpenAI(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      if (method === 'gemini_native' && this.anthropic) {
        console.log('🔄 Cascading to Claude...');
        result = await this.processWithClaudeSonnet(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      if (method === 'gemini_native' && !this.anthropic && this.openai) {
        console.log('🔄 Cascading to OpenAI...');
        result = await this.processWithOpenAI(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      if (method === 'openai_gpt5' && this.anthropic) {
        console.log('🔄 Cascading to Claude...');
        result = await this.processWithClaudeSonnet(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      if (method === 'openai_gpt5' && !this.anthropic && this.gemini) {
        console.log('🔄 Cascading to Gemini...');
        result = await this.processWithGeminiNative(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      // LAST RESORT: Only use OCR if ALL AI models failed
      if (method !== 'ocr_vision') {
        console.log('⚠️ All AI models failed, falling back to OCR Vision...');
        result = await this.processWithOCR(filePath, progressCallback);
        if (documentId) {
          await metricsTrackingService.trackAIAnalysis(documentId, {
            confidence: result.confidence,
            method: result.method,
            processingTime: Date.now() - startTime,
            errors,
          });
        }
        return result;
      }

      throw error;
    }
  }

  /**
   * Process with Claude Sonnet 4.5 (TOP PRIORITY - Most Advanced)
   */
  private async processWithClaudeSonnet(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    if (!this.anthropic) {
      throw new Error('Claude API not available');
    }

    const startTime = Date.now();
    progressCallback?.(10, 'Initializing advanced reasoning model...');

    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    progressCallback?.(30, 'Running deep contextual analysis...');

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
              media_type: 'application/pdf' as const,
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
      confidence: 0.95,
      method: 'claude_sonnet',
      metadata: {
        processingTime,
        model: 'claude-3-5-sonnet-20241022'
      }
    };
  }

  /**
   * Process PDF natively with Gemini (fast for text-based PDFs)
   */
  private async processWithGeminiNative(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    if (!this.gemini) {
      throw new Error('Gemini API not available');
    }

    const startTime = Date.now();
    progressCallback?.(10, 'Encoding document into neural format...');

    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    progressCallback?.(30, 'Running multimodal transformer analysis...');

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000);
    });

    const geminiPromise = this.gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        },
        'Extract all text content from this document. Preserve formatting, structure, and page breaks. Return the complete text exactly as it appears.'
      ]
    });

    const result = await Promise.race([geminiPromise, timeoutPromise]);

    progressCallback?.(90, 'Synthesizing document embeddings...');

    const extractedText = result.text || '';
    const processingTime = Date.now() - startTime;
    const estimatedPages = Math.ceil(extractedText.length / 3000);

    progressCallback?.(100, 'Neural extraction complete');

    return {
      text: extractedText,
      confidence: 0.93,
      method: 'gemini_native',
      metadata: {
        pageCount: estimatedPages,
        processingTime,
        model: 'gemini-2.5-flash'
      }
    };
  }

  /**
   * Process with OpenAI GPT-5 (good for structured documents)
   */
  private async processWithOpenAI(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    if (!this.openai) {
      throw new Error('OpenAI API not available');
    }

    const startTime = Date.now();
    progressCallback?.(10, 'Preparing document for AI analysis...');

    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = path.extname(filePath) === '.pdf' ? 'application/pdf' : 'image/jpeg';

    progressCallback?.(30, 'Running GPT-5 vision analysis...');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`
              }
            },
            {
              type: 'text',
              text: 'Extract all text content from this document. Preserve formatting, structure, and page breaks. Return the complete text exactly as it appears.'
            }
          ]
        }
      ],
      max_tokens: 100000
    });

    progressCallback?.(90, 'Finalizing extraction...');

    const extractedText = response.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    progressCallback?.(100, 'Complete!');

    return {
      text: extractedText,
      confidence: 0.91,
      method: 'openai_gpt5',
      metadata: {
        processingTime,
        model: 'gpt-5'
      }
    };
  }

  /**
   * Process with OCR (LAST RESORT ONLY - for scanned documents and images)
   */
  private async processWithOCR(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const fileExt = path.extname(filePath).toLowerCase();

    let ocrResult;
    
    if (fileExt === '.pdf') {
      ocrResult = await this.visionService.extractTextFromPDFLimited(
        filePath,
        250,
        (current, total, timeRemaining) => {
          const progress = 10 + Math.round((current / total) * 80);
          progressCallback?.(progress, `Analyzing page ${current}/${total} with computer vision (~${timeRemaining}s)`);
        }
      );
    } else {
      progressCallback?.(30, 'Applying computer vision algorithms...');
      ocrResult = await this.visionService.extractTextFromImage(filePath);
    }

    const processingTime = Date.now() - startTime;
    progressCallback?.(100, 'Vision analysis complete');

    return {
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      method: 'ocr_vision',
      metadata: {
        processingTime,
        handwritingDetected: ocrResult.handwritingDetected,
        language: ocrResult.language
      }
    };
  }
}
