import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { VisionService } from './visionService';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { metricsTrackingService } from './metricsTrackingService';
import { sonnetBatchingService } from './sonnetBatchingService';
import { warmSessionManager } from './warmSessionManager';

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
    // Use warm session manager for hot-started clients
    const clients = warmSessionManager.getClients();
    this.anthropic = clients.anthropic;
    this.gemini = clients.gemini;
    this.openai = clients.openai;
    
    // Initialize Vision service
    this.visionService = VisionService.getInstance();
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
        model: 'claude-sonnet-4-5',
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
    // BEST PRACTICE: Always prioritize AI models (Sonnet/Gemini) over OCR, even for scanned docs
    let recommendedProcessor: ProcessingMethod;
    
    if (fileExt === '.pdf' && hasTextLayer && this.gemini) {
      recommendedProcessor = 'gemini_native'; // Fast for native PDFs
    } else if (fileExt === '.pdf' && hasTextLayer && this.openai) {
      recommendedProcessor = 'openai_gpt5'; // Alternative for native PDFs
    } else if (fileExt === '.pdf' && !hasTextLayer) {
      // FIX: Try Sonnet/Gemini vision first, OCR is last resort
      if (this.anthropic) {
        recommendedProcessor = 'claude_sonnet'; // Sonnet can handle scanned docs with vision
      } else if (this.gemini) {
        recommendedProcessor = 'gemini_native'; // Gemini vision for scanned docs
      } else {
        recommendedProcessor = 'ocr_vision'; // Last resort only
      }
    } else if (mimeType.startsWith('image/')) {
      // FIX: Try AI vision models before OCR
      if (this.anthropic) {
        recommendedProcessor = 'claude_sonnet'; // Sonnet vision for images
      } else if (this.gemini) {
        recommendedProcessor = 'gemini_native'; // Gemini vision for images
      } else {
        recommendedProcessor = 'ocr_vision'; // Last resort only
      }
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
   * SPEED OPTIMIZATION: Fast classification mode with intelligent fallback
   * Saves 3-5 seconds for most documents by using heuristics
   * Falls back to Claude for complex cases requiring high metadata accuracy
   */
  private async fastClassify(filePath: string, mimeType: string): Promise<DocumentClassification> {
    console.log('⚡ FAST CLASSIFICATION MODE: Using structure-based routing');
    
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    const stats = await fs.stat(filePath);
    const fileSizeKB = stats.size / 1024;
    
    let recommendedProcessor: ProcessingMethod;
    let complexity: 'simple' | 'medium' | 'complex';
    let reasoning: string;
    let documentType = 'other';
    let hasTable = false;
    let hasChart = false;
    let hasHandwriting = false;
    let heuristicConfidence = 50; // Start with low confidence
    
    // Determine complexity based on file size
    if (fileSizeKB > 5000) {
      complexity = 'complex';
      hasTable = true; // Large docs likely have tables
    } else if (fileSizeKB > 1000) {
      complexity = 'medium';
      hasTable = fileSizeKB > 2000; // Medium-large docs may have tables
    } else {
      complexity = 'simple';
    }
    
    // Document type inference from filename patterns (increases confidence if matched)
    if (fileName.includes('invoice') || fileName.includes('bill')) {
      documentType = 'invoice';
      hasTable = true;
      heuristicConfidence = 85;
    } else if (fileName.includes('contract') || fileName.includes('agreement')) {
      documentType = 'contract';
      heuristicConfidence = 85;
    } else if (fileName.includes('form') || fileName.includes('application')) {
      documentType = 'form';
      hasTable = true;
      heuristicConfidence = 80;
    } else if (fileName.includes('report') || fileName.includes('statement')) {
      documentType = 'report';
      hasTable = true;
      hasChart = fileSizeKB > 500;
      heuristicConfidence = 80;
    } else if (fileName.includes('receipt')) {
      documentType = 'receipt';
      heuristicConfidence = 90;
    } else if (fileName.includes('medical') || fileName.includes('patient') || fileName.includes('health')) {
      documentType = 'medical_record';
      hasTable = true;
      heuristicConfidence = 85;
    } else if (fileName.includes('legal') || fileName.includes('court') || fileName.includes('case')) {
      documentType = 'legal_document';
      heuristicConfidence = 85;
    } else if (fileName.includes('financial') || fileName.includes('bank') || fileName.includes('account')) {
      documentType = 'financial_statement';
      hasTable = true;
      hasChart = true;
      heuristicConfidence = 85;
    } else if (fileName.includes('shipping') || fileName.includes('manifest') || fileName.includes('cargo')) {
      documentType = 'shipping_manifest';
      hasTable = true;
      heuristicConfidence = 85;
    } else if (fileName.includes('property') || fileName.includes('deed') || fileName.includes('title')) {
      documentType = 'property_deed';
      heuristicConfidence = 85;
    }
    
    // LOW CONFIDENCE: Fall back to Claude for accurate metadata
    if (heuristicConfidence < 70 && this.anthropic) {
      console.log(`⚠️ Low heuristic confidence (${heuristicConfidence}%) - falling back to Claude for accurate metadata`);
      return await this.preClassifyWithClaude(filePath, mimeType);
    }
    
    // HIGH CONFIDENCE: Use fast classification
    // PDF routing logic
    if (fileExt === '.pdf') {
      const hasTextLayer = await this.checkPDFTextLayer(filePath);
      
      if (hasTextLayer) {
        // Native PDF with text layer → Gemini (fastest)
        recommendedProcessor = this.gemini ? 'gemini_native' : 'openai_gpt5';
        reasoning = 'Native PDF with text layer → routed to Gemini for fast processing';
        console.log(`✅ PDF with text layer → ${recommendedProcessor} (fast mode, ${heuristicConfidence}% confidence)`);
      } else {
        // Scanned PDF without text layer → Claude Sonnet (best vision)
        recommendedProcessor = this.anthropic ? 'claude_sonnet' : 'gemini_native';
        reasoning = 'Scanned PDF without text layer → routed to Claude Sonnet for vision processing';
        hasHandwriting = complexity === 'complex'; // Only complex scanned docs likely have handwriting
        console.log(`✅ Scanned PDF → ${recommendedProcessor} (vision mode, ${heuristicConfidence}% confidence)`);
      }
    } 
    // Image routing logic
    else if (mimeType.startsWith('image/')) {
      // Images → Claude Sonnet (best vision capabilities)
      recommendedProcessor = this.anthropic ? 'claude_sonnet' : 'gemini_native';
      reasoning = 'Image document → routed to Claude Sonnet for superior vision analysis';
      hasHandwriting = complexity !== 'simple'; // Medium/complex images may have handwriting
      console.log(`✅ Image → ${recommendedProcessor} (vision mode, ${heuristicConfidence}% confidence)`);
    }
    // Other file types
    else {
      recommendedProcessor = this.anthropic ? 'claude_sonnet' : 'ocr_vision';
      reasoning = 'Non-PDF/image document → routed to Claude Sonnet';
      console.log(`✅ Other type → ${recommendedProcessor} (${heuristicConfidence}% confidence)`);
    }
    
    return {
      documentType,
      complexity,
      hasTable,
      hasChart,
      hasHandwriting,
      recommendedProcessor,
      confidence: heuristicConfidence,
      reasoning
    };
  }

  /**
   * Analyzes document and determines optimal processing method
   * SPEED OPTIMIZATION: Uses fast classification to save 3-5 seconds per document
   */
  async routeDocument(filePath: string, mimeType: string): Promise<RoutingDecision> {
    console.log(`🧭 Routing document: ${path.basename(filePath)}, mimeType: ${mimeType}`);
    
    // SPEED OPTIMIZATION: Use fast classification mode (saves 3-5s)
    // Skips expensive Claude pre-classification, uses file structure analysis instead
    const classification = await this.fastClassify(filePath, mimeType);

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
   * SPEED OPTIMIZATION: Fast parallel processing with model racing
   * TACTIC: Fire all models in parallel, use fastest response with 12s timeout
   */
  async processFast(
    filePath: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<ProcessingResult> {
    console.log('🏎️ FAST MODE: Parallel model racing enabled');
    
    const startTime = Date.now();
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');
    
    progressCallback?.(10, 'Racing all available models...');
    
    const races: Promise<ProcessingResult>[] = [];
    
    // RACE 1: Claude Sonnet 4.5 (if warm)
    if (this.anthropic && warmSessionManager.isWarm('claude')) {
      races.push(
        this.processWithClaudeSonnetFast(filePath, base64Data)
          .then(result => {
            console.log(`✅ Claude finished in ${Date.now() - startTime}ms`);
            return result;
          })
      );
    }
    
    // RACE 2: Gemini (if warm)
    if (this.gemini && warmSessionManager.isWarm('gemini')) {
      races.push(
        this.processWithGeminiFast(base64Data)
          .then(result => {
            console.log(`✅ Gemini finished in ${Date.now() - startTime}ms`);
            return result;
          })
      );
    }
    
    // RACE 3: OpenAI (if warm)
    if (this.openai && warmSessionManager.isWarm('openai')) {
      races.push(
        this.processWithOpenAIFast(base64Data)
          .then(result => {
            console.log(`✅ OpenAI finished in ${Date.now() - startTime}ms`);
            return result;
          })
      );
    }
    
    if (races.length === 0) {
      throw new Error('No warm models available for fast processing');
    }
    
    // TACTIC: Low-latency failover with 12s timeout
    const timeoutPromise = new Promise<ProcessingResult>((_, reject) => {
      setTimeout(() => reject(new Error('All models exceeded 12s timeout')), 12000);
    });
    
    try {
      // Use the fastest response
      const winner = await Promise.race([...races, timeoutPromise]);
      progressCallback?.(100, 'Complete!');
      
      const totalTime = Date.now() - startTime;
      console.log(`🏁 Fast mode complete in ${totalTime}ms`);
      
      return winner;
    } catch (error) {
      console.error('❌ Fast mode failed, falling back to OCR');
      // Fallback to OCR if all models timeout
      return await this.processWithOCR(filePath, progressCallback);
    }
  }
  
  /**
   * Fast Claude processing (no streaming, direct response)
   */
  private async processWithClaudeSonnetFast(filePath: string, base64Data: string): Promise<ProcessingResult> {
    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 64000,
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
            text: 'Extract all text from this document. Return only the text, no formatting.'
          }
        ]
      }]
    });
    
    return {
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      confidence: 0.95,
      method: 'claude_sonnet',
      metadata: { model: 'claude-sonnet-4-5' }
    };
  }
  
  /**
   * Fast Gemini processing
   */
  private async processWithGeminiFast(base64Data: string): Promise<ProcessingResult> {
    const result = await this.gemini!.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        },
        'Extract all text from this document. Return only the text.'
      ]
    });
    
    return {
      text: result.text || '',
      confidence: 0.93,
      method: 'gemini_native',
      metadata: { model: 'gemini-2.5-flash' }
    };
  }
  
  /**
   * Fast OpenAI processing
   */
  private async processWithOpenAIFast(base64Data: string): Promise<ProcessingResult> {
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`
              }
            },
            {
              type: 'text',
              text: 'Extract all text from this document.'
            }
          ]
        }
      ]
    });
    
    return {
      text: response.choices[0]?.message?.content || '',
      confidence: 0.92,
      method: 'openai_gpt5',
      metadata: { model: 'gpt-4' }
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

    // Use streaming for long operations (Anthropic requirement)
    const stream = await this.anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 64000,
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

    let extractedText = '';
    let lastProgress = 30;
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        extractedText += chunk.delta.text;
        
        // Update progress incrementally
        const newProgress = Math.min(90, lastProgress + 5);
        if (newProgress > lastProgress) {
          progressCallback?.(newProgress, 'Extracting text...');
          lastProgress = newProgress;
        }
      }
    }

    progressCallback?.(90, 'Finalizing extraction...');

    const processingTime = Date.now() - startTime;

    progressCallback?.(100, 'Complete!');

    return {
      text: extractedText,
      confidence: 0.95,
      method: 'claude_sonnet',
      metadata: {
        processingTime,
        model: 'claude-sonnet-4-5'
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
      max_tokens: 16000
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

  /**
   * OPTIMIZED: Batched processing with Sonnet 4.5 (adaptive planning + self-evaluation)
   * Uses long context window (200K tokens) to process multiple pages in one call
   */
  async processWithSonnetBatching(
    filePath: string,
    industry: string,
    documentId: number,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<{
    text: string;
    confidence: number;
    extractedData: any;
    metadata: any;
  }> {
    if (!this.anthropic) {
      throw new Error('Claude API not available for batching');
    }

    const startTime = Date.now();
    progressCallback?.(5, 'Initializing intelligent batching with Sonnet 4.5...');

    // SPEED OPTIMIZATION: Send PDF directly to Claude instead of Vision extraction
    const fileExt = path.extname(filePath).toLowerCase();
    progressCallback?.(10, 'Extracting text with Claude AI...');

    let pages: any[] = [];
    
    // Check if PDF has text layer
    const hasTextLayer = fileExt === '.pdf' ? await this.checkPDFTextLayer(filePath) : false;
    
    if (fileExt === '.pdf' && hasTextLayer) {
      // SPEED BOOST: Send PDF directly to Claude (skip Vision)
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');
      
      progressCallback?.(20, 'Processing PDF with Claude AI...');
      
      const stream = await this.anthropic!.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 64000,
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
              text: 'Extract all text content from this document. Separate each page with "--- PAGE X ---" markers. Preserve formatting and structure. Return the complete text.'
            }
          ]
        }]
      });

      let extractedText = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          extractedText += chunk.delta.text;
        }
      }
      
      // Split by page markers
      const pageTexts = extractedText.split(/\n?--- PAGE \d+ ---\n?/).filter(Boolean);
      pages = pageTexts.map((pageText: string, index: number) => ({
        pageNumber: index + 1,
        text: pageText.trim(),
        confidence: 0.95,
        source: 'native'
      }));
      
      if (pages.length === 0) {
        pages = [{
          pageNumber: 1,
          text: extractedText,
          confidence: 0.95,
          source: 'native'
        }];
      }
    } else {
      // Fallback to Vision for images or scanned PDFs
      progressCallback?.(10, 'Using Vision for scanned document...');
      const ocrResult = await this.visionService.extractTextFromImage(filePath);
      pages = [{
        pageNumber: 1,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        source: 'vision'
      }];
    }

    progressCallback?.(40, `Processing ${pages.length} pages with Sonnet batching...`);

    // Step 2: Use Sonnet batching service for intelligent processing
    const batchResult = await sonnetBatchingService.processDocumentIntelligently(
      pages,
      industry,
      documentId
    );

    progressCallback?.(70, 'Analyzing results and checking for re-analysis needs...');

    // Step 3: Handle adaptive plan fallback recommendations FIRST
    let fallbacksProcessed = 0;
    if (batchResult.processingPlan.fallbackNeeded.length > 0) {
      const fallbacks = batchResult.processingPlan.fallbackNeeded;
      progressCallback?.(70, `Processing ${fallbacks.length} adaptive plan fallbacks...`);
      
      for (const fallback of fallbacks) {
        const pageIndex = fallback.pageNumber - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          console.log(`🔄 Adaptive plan fallback: Re-processing page ${fallback.pageNumber} with ${fallback.recommendedMethod} (reason: ${fallback.reason})`);
          
          // Re-extract with recommended method (Vision or OCR)
          try {
            if (fallback.recommendedMethod === 'vision') {
              const visionResult = await this.visionService.extractTextFromImage(filePath);
              pages[pageIndex].text = visionResult.text;
              pages[pageIndex].confidence = visionResult.confidence;
              pages[pageIndex].source = 'vision';
              fallbacksProcessed++;
            } else if (fallback.recommendedMethod === 'ocr') {
              // Use OCR method for fallback
              const ocrResult = await this.visionService.extractTextFromImage(filePath);
              pages[pageIndex].text = ocrResult.text;
              pages[pageIndex].confidence = ocrResult.confidence;
              pages[pageIndex].source = 'ocr';
              fallbacksProcessed++;
            }
          } catch (error) {
            console.error(`Failed to process fallback for page ${fallback.pageNumber}:`, error);
          }
        }
      }
      
      // Re-run batching with updated pages if fallbacks were processed
      if (fallbacksProcessed > 0) {
        console.log(`🔄 Re-running Sonnet analysis with ${fallbacksProcessed} improved pages...`);
        const updatedBatchResult = await sonnetBatchingService.processBatchedPages(
          pages.filter(p => fallbacks.some(f => f.pageNumber === p.pageNumber)),
          industry,
          documentId
        );
        // Merge updated results back
        Object.assign(batchResult.extractedData, updatedBatchResult.extractedData || {});
      }
    }

    // Step 4: Handle self-evaluation fallback recommendations
    if (batchResult.selfEvaluation.pageEvaluations.some(p => p.needsReanalysis)) {
      const reanalysisPages = batchResult.selfEvaluation.pageEvaluations
        .filter(p => p.needsReanalysis);
      
      progressCallback?.(85, `Self-evaluation: Re-analyzing ${reanalysisPages.length} pages...`);
      
      for (const pageEval of reanalysisPages) {
        const pageIndex = pageEval.pageNumber - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          // Re-extract with recommended method
          if (pageEval.recommendedMethod === 'vision' || pageEval.recommendedMethod === 'ocr') {
            console.log(`🔄 Self-eval fallback: Re-analyzing page ${pageEval.pageNumber} with ${pageEval.recommendedMethod} (reason: ${pageEval.reason})`);
            try {
              const reanalysisResult = await this.visionService.extractTextFromImage(filePath);
              pages[pageIndex].text = reanalysisResult.text;
              pages[pageIndex].confidence = reanalysisResult.confidence;
              fallbacksProcessed++;
            } catch (error) {
              console.error(`Failed self-eval fallback for page ${pageEval.pageNumber}:`, error);
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;
    progressCallback?.(100, 'Intelligent batching complete!');

    // Combine all page text
    const combinedText = pages.map(p => p.text).join('\n\n');

    // Calculate API call savings
    const apiCallsSaved = batchResult.traditionalApiCalls - batchResult.apiCallsUsed;
    const efficiencyPercent = Math.round((apiCallsSaved / batchResult.traditionalApiCalls) * 100);

    console.log(`✅ Sonnet batching completed: ${batchResult.apiCallsUsed} API calls (vs ${batchResult.traditionalApiCalls} traditional = ${apiCallsSaved} saved, ${efficiencyPercent}% efficiency)`);

    // Track batch processing efficiency
    await metricsTrackingService.trackBatchProcessing(documentId, {
      strategy: batchResult.processingPlan.strategy,
      apiCallsUsed: batchResult.apiCallsUsed,
      apiCallsSaved,
      pageCount: pages.length,
      overallConfidence: batchResult.confidence,
      selfEvaluationScore: batchResult.selfEvaluation.overallConfidence,
      processingTime,
      adaptivePlan: {
        batches: batchResult.processingPlan.batches.length,
        parallelizable: batchResult.processingPlan.batches.filter(b => b.parallelizable).length,
        fallbacks: batchResult.processingPlan.fallbackNeeded.length
      },
      fallbacksTriggered: batchResult.selfEvaluation.pageEvaluations.filter(p => p.needsReanalysis).length
    });

    return {
      text: combinedText,
      confidence: batchResult.confidence,
      extractedData: batchResult.extractedData,
      metadata: {
        processingTime,
        model: 'claude-sonnet-4-batched',
        apiCallsUsed: batchResult.apiCallsUsed,
        apiCallsSaved,
        efficiency: `${efficiencyPercent}% fewer API calls`,
        processingPlan: batchResult.processingPlan,
        selfEvaluation: batchResult.selfEvaluation,
        pageCount: pages.length,
        entities: batchResult.entities,
        summaries: batchResult.summaries
      }
    };
  }
}
