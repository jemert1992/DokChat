import { storage } from "../storage";
import { WebSocketService } from "./websocketService";
import { VisionService } from "./visionService";
import { MultiAIService } from "./multiAIService";
import { ParallelProcessingService, ProcessingTask, ProcessingResult as ParallelResult } from "./parallelProcessingService";
import { TemplateFreeExtractionService } from "./templateFreeExtractionService";
import { AdvancedDocumentIntelligenceService } from "./advancedDocumentIntelligenceService";
import fs from "fs/promises";
import path from "path";

export interface StreamingUpdate {
  documentId: number;
  stage: string;
  progress: number;
  message: string;
  data?: any;
  timestamp: number;
}

export interface EnsemblePrediction {
  model: string;
  result: any;
  confidence: number;
  weight: number;
  processingTime: number;
}

export interface MultiModalResult {
  text: string;
  tables: any[];
  forms: any[];
  signatures: any[];
  images: any[];
  diagrams: any[];
  confidence: number;
  processingTime: number;
}

export class EnhancedDocumentProcessor {
  private parallelProcessor: ParallelProcessingService;
  private visionService: VisionService;
  private multiAIService: MultiAIService;
  private templateFreeService: TemplateFreeExtractionService;
  private advancedIntelligenceService: AdvancedDocumentIntelligenceService;
  private websocketService: WebSocketService | null = null;
  
  // Performance optimization settings
  private readonly BATCH_SIZE = 5;
  private readonly MAX_PARALLEL_PAGES = 10;
  private readonly CACHE_TTL = 3600000; // 1 hour
  private documentCache: Map<string, any> = new Map();
  
  constructor(websocketService?: WebSocketService) {
    this.parallelProcessor = new ParallelProcessingService();
    this.visionService = new VisionService();
    this.multiAIService = new MultiAIService();
    this.templateFreeService = new TemplateFreeExtractionService();
    this.advancedIntelligenceService = new AdvancedDocumentIntelligenceService();
    this.websocketService = websocketService || null;
    
    // Setup parallel processing event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.parallelProcessor.on('progress', (data) => {
      if (this.websocketService) {
        this.websocketService.broadcastProcessingUpdate({
          type: 'parallel_progress',
          data
        });
      }
    });
    
    this.parallelProcessor.on('error', (error) => {
      console.error('Parallel processing error:', error);
    });
    
    this.parallelProcessor.on('circuit-breaker-open', (data) => {
      console.warn(`Circuit breaker opened for ${data.serviceType}`);
      if (this.websocketService) {
        this.websocketService.broadcastProcessingUpdate({
          type: 'circuit_breaker_alert',
          data
        });
      }
    });
  }
  
  async processDocumentWithStreaming(documentId: number): Promise<void> {
    const startTime = Date.now();
    const streamingUpdates: StreamingUpdate[] = [];
    
    try {
      // Initial setup
      await this.sendStreamingUpdate(documentId, 'initialization', 5, 'Starting enhanced document processing');
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Check cache first
      const cacheKey = `${document.filePath}_${document.updatedAt}`;
      if (this.documentCache.has(cacheKey)) {
        console.log('📦 Using cached processing results');
        const cachedResult = this.documentCache.get(cacheKey);
        await this.saveProcessingResults(documentId, cachedResult);
        return;
      }
      
      // Stage 1: Parallel OCR Processing
      await this.sendStreamingUpdate(documentId, 'ocr_parallel', 15, 'Running parallel OCR processing');
      const ocrResult = await this.performParallelOCR(document.filePath, document.mimeType);
      
      // Stage 2: Multi-Modal Vision Analysis
      await this.sendStreamingUpdate(documentId, 'vision_multimodal', 30, 'Analyzing document with multi-modal vision');
      const multiModalResult = await this.performMultiModalAnalysis(document.filePath, ocrResult);
      
      // Stage 3: Ensemble AI Predictions
      await this.sendStreamingUpdate(documentId, 'ai_ensemble', 45, 'Running ensemble AI predictions');
      const ensembleResult = await this.performEnsemblePredictions(
        multiModalResult.text,
        document.industry,
        multiModalResult
      );
      
      // Stage 4: Advanced Document Intelligence
      await this.sendStreamingUpdate(documentId, 'intelligence', 60, 'Applying advanced document intelligence');
      const intelligenceResult = await this.performAdvancedIntelligence(
        ensembleResult,
        document
      );
      
      // Stage 5: Confidence-Weighted Fusion
      await this.sendStreamingUpdate(documentId, 'fusion', 75, 'Fusing results with confidence weighting');
      const fusedResult = await this.performConfidenceWeightedFusion(
        ensembleResult,
        intelligenceResult,
        multiModalResult
      );
      
      // Stage 6: Quality Assurance & Validation
      await this.sendStreamingUpdate(documentId, 'validation', 85, 'Performing quality assurance checks');
      const validatedResult = await this.performQualityAssurance(fusedResult);
      
      // Stage 7: Save Results
      await this.sendStreamingUpdate(documentId, 'saving', 95, 'Saving enhanced analysis results');
      
      const finalResult = {
        ...validatedResult,
        processingTime: Date.now() - startTime,
        streamingUpdates
      };
      
      // Cache the result
      this.documentCache.set(cacheKey, finalResult);
      setTimeout(() => this.documentCache.delete(cacheKey), this.CACHE_TTL);
      
      await this.saveProcessingResults(documentId, finalResult);
      
      // Final update
      await this.sendStreamingUpdate(documentId, 'completed', 100, 'Processing completed successfully');
      
    } catch (error) {
      await this.handleProcessingError(documentId, error);
      throw error;
    }
  }
  
  private async performParallelOCR(filePath: string, mimeType?: string): Promise<any> {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    // For PDFs, split into pages and process in parallel
    if (fileExtension === '.pdf') {
      const tasks: ProcessingTask[] = [];
      
      // Create OCR tasks for parallel processing
      for (let page = 1; page <= this.MAX_PARALLEL_PAGES; page++) {
        tasks.push({
          id: `ocr_page_${page}`,
          type: 'ocr',
          data: { filePath, page, mimeType },
          priority: 10
        });
      }
      
      const results = await this.parallelProcessor.processInParallel(tasks);
      
      // Combine results
      return this.combineOCRResults(results);
    }
    
    // For other files, use standard processing
    return this.visionService.extractTextFromImage(filePath);
  }
  
  private async performMultiModalAnalysis(filePath: string, ocrResult: any): Promise<MultiModalResult> {
    const tasks: ProcessingTask[] = [
      {
        id: 'vision_tables',
        type: 'vision_analysis',
        data: { filePath, analysisType: 'tables' },
        priority: 8
      },
      {
        id: 'vision_forms',
        type: 'vision_analysis',
        data: { filePath, analysisType: 'forms' },
        priority: 8
      },
      {
        id: 'vision_signatures',
        type: 'vision_analysis',
        data: { filePath, analysisType: 'signatures' },
        priority: 7
      },
      {
        id: 'vision_diagrams',
        type: 'vision_analysis',
        data: { filePath, analysisType: 'diagrams' },
        priority: 6
      }
    ];
    
    const results = await this.parallelProcessor.processInParallel(tasks);
    
    return {
      text: ocrResult.text || '',
      tables: results.find(r => r.id === 'vision_tables')?.result?.tables || [],
      forms: results.find(r => r.id === 'vision_forms')?.result?.forms || [],
      signatures: results.find(r => r.id === 'vision_signatures')?.result?.signatures || [],
      images: [],
      diagrams: results.find(r => r.id === 'vision_diagrams')?.result?.diagrams || [],
      confidence: this.calculateAverageConfidence(results),
      processingTime: results.reduce((sum, r) => sum + r.processingTime, 0)
    };
  }
  
  private async performEnsemblePredictions(
    text: string,
    industry: string,
    multiModalData: MultiModalResult
  ): Promise<EnsemblePrediction[]> {
    const models = ['openai', 'gemini', 'anthropic'];
    const tasks: ProcessingTask[] = models.map(model => ({
      id: `ai_${model}`,
      type: 'ai_analysis',
      data: { text, industry, multiModalData, model },
      priority: 9
    }));
    
    const results = await this.parallelProcessor.processInParallel(tasks);
    
    return results.map((r, index) => ({
      model: models[index],
      result: r.result,
      confidence: r.result?.confidence || 0,
      weight: this.calculateModelWeight(models[index], r.result?.confidence || 0),
      processingTime: r.processingTime
    }));
  }
  
  private async performAdvancedIntelligence(
    ensembleResult: EnsemblePrediction[],
    document: any
  ): Promise<any> {
    try {
      // Use the existing advanced intelligence service
      return await this.advancedIntelligenceService.analyzeDocument({
        extractedText: ensembleResult[0]?.result?.text || '',
        industry: document.industry,
        documentType: document.documentType,
        extractedData: ensembleResult[0]?.result,
        entities: [],
        confidence: this.calculateEnsembleConfidence(ensembleResult)
      });
    } catch (error) {
      console.warn('Advanced intelligence failed, using fallback:', error);
      return null;
    }
  }
  
  private async performConfidenceWeightedFusion(
    ensembleResult: EnsemblePrediction[],
    intelligenceResult: any,
    multiModalResult: MultiModalResult
  ): Promise<any> {
    // Calculate weighted consensus
    const weightedResults = ensembleResult.map(prediction => ({
      ...prediction.result,
      weight: prediction.weight
    }));
    
    // Merge all results with confidence weighting
    const fusedResult = {
      consensus: this.calculateWeightedConsensus(weightedResults),
      multiModal: multiModalResult,
      intelligence: intelligenceResult,
      models: ensembleResult,
      overallConfidence: this.calculateOverallConfidence(
        ensembleResult,
        multiModalResult,
        intelligenceResult
      )
    };
    
    return fusedResult;
  }
  
  private async performQualityAssurance(result: any): Promise<any> {
    // Validate result structure
    const validationErrors: string[] = [];
    
    if (!result.consensus) {
      validationErrors.push('Missing consensus data');
    }
    
    if (result.overallConfidence < 0.3) {
      validationErrors.push('Low confidence score');
    }
    
    // Add validation status
    return {
      ...result,
      validation: {
        passed: validationErrors.length === 0,
        errors: validationErrors,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  private async sendStreamingUpdate(
    documentId: number,
    stage: string,
    progress: number,
    message: string,
    data?: any
  ) {
    const update: StreamingUpdate = {
      documentId,
      stage,
      progress,
      message,
      data,
      timestamp: Date.now()
    };
    
    // Send via WebSocket for real-time updates
    if (this.websocketService) {
      this.websocketService.sendDocumentUpdate(documentId.toString(), {
        type: 'streaming_update',
        data: update
      });
    }
    
    // Also update database
    await storage.updateDocumentStatus(documentId, 'processing', progress, message);
  }
  
  private async saveProcessingResults(documentId: number, result: any) {
    await storage.updateDocumentAnalysis(
      documentId,
      result.consensus?.text || '',
      result,
      result.multiModal?.entities || [],
      result.overallConfidence || 0,
      'completed'
    );
  }
  
  private async handleProcessingError(documentId: number, error: any) {
    console.error(`Processing error for document ${documentId}:`, error);
    
    await storage.updateDocumentStatus(
      documentId,
      'failed',
      0,
      error instanceof Error ? error.message : 'Processing failed'
    );
    
    if (this.websocketService) {
      this.websocketService.sendDocumentUpdate(documentId.toString(), {
        type: 'processing_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Helper methods
  private combineOCRResults(results: ParallelResult[]): any {
    const texts = results
      .filter(r => r.success && r.result?.text)
      .map(r => r.result.text);
    
    return {
      text: texts.join('\n'),
      confidence: this.calculateAverageConfidence(results),
      pages: results.length
    };
  }
  
  private calculateAverageConfidence(results: ParallelResult[]): number {
    const confidences = results
      .filter(r => r.success && r.result?.confidence)
      .map(r => r.result.confidence);
    
    if (confidences.length === 0) return 0;
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }
  
  private calculateModelWeight(model: string, confidence: number): number {
    // Assign base weights to models
    const baseWeights: Record<string, number> = {
      openai: 0.4,
      gemini: 0.35,
      anthropic: 0.25
    };
    
    // Adjust weight based on confidence
    const baseWeight = baseWeights[model] || 0.33;
    return baseWeight * (0.5 + confidence * 0.5);
  }
  
  private calculateEnsembleConfidence(predictions: EnsemblePrediction[]): number {
    const weightedSum = predictions.reduce(
      (sum, p) => sum + (p.confidence * p.weight),
      0
    );
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  private calculateWeightedConsensus(weightedResults: any[]): any {
    // Implement weighted voting for consensus
    // This is a simplified version - in production would be more sophisticated
    return weightedResults[0] || {};
  }
  
  private calculateOverallConfidence(
    ensemble: EnsemblePrediction[],
    multiModal: MultiModalResult,
    intelligence: any
  ): number {
    const weights = {
      ensemble: 0.5,
      multiModal: 0.3,
      intelligence: 0.2
    };
    
    const ensembleConf = this.calculateEnsembleConfidence(ensemble);
    const multiModalConf = multiModal.confidence || 0;
    const intelligenceConf = intelligence?.confidence || 0;
    
    return (
      ensembleConf * weights.ensemble +
      multiModalConf * weights.multiModal +
      intelligenceConf * weights.intelligence
    );
  }
  
  // Cleanup
  cleanup() {
    this.parallelProcessor.cleanup();
    this.documentCache.clear();
  }
}