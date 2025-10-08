import { storage } from "../storage";
import { MultiAIService } from "./multiAIService";
import { WebSocketService } from "./websocketService";
import { VisionService } from "./visionService";
import { TemplateFreeExtractionService } from "./templateFreeExtractionService";
import { RAGService } from "./ragService";
import { AdvancedConfidenceService } from "./advancedConfidenceService";
import { AdvancedDocumentIntelligenceService } from "./advancedDocumentIntelligenceService";
import { DocumentClassifierService } from "./documentClassifier";
import { OCRCacheService } from "./ocrCache";
import { IntelligentDocumentRouter } from "./intelligentRouter";
import { verificationService } from "./verificationService";
import fs from "fs/promises";
import path from "path";

export interface ProcessingResult {
  extractedText: string;
  extractedData: any;
  ocrConfidence: number;
  aiConfidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export class DocumentProcessor {
  private multiAIService: MultiAIService;
  private visionService: VisionService;
  private templateFreeService: TemplateFreeExtractionService;
  private ragService: RAGService;
  private advancedConfidenceService: AdvancedConfidenceService;
  private advancedIntelligenceService: AdvancedDocumentIntelligenceService;
  private classifierService: DocumentClassifierService;
  private ocrCacheService: OCRCacheService;
  private intelligentRouter: IntelligentDocumentRouter;
  private websocketService: WebSocketService | null = null;

  constructor(websocketService?: WebSocketService) {
    this.multiAIService = new MultiAIService();
    this.visionService = new VisionService();
    this.templateFreeService = new TemplateFreeExtractionService();
    this.ragService = new RAGService();
    this.advancedConfidenceService = new AdvancedConfidenceService();
    this.advancedIntelligenceService = new AdvancedDocumentIntelligenceService();
    this.classifierService = new DocumentClassifierService();
    this.ocrCacheService = new OCRCacheService();
    this.intelligentRouter = new IntelligentDocumentRouter();
    this.websocketService = websocketService || null;
  }

  // Quick analysis mode - Essential processing only (30-60 seconds)
  async processDocumentQuick(documentId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      await storage.updateDocumentStatus(documentId, 'processing', 5, 'Initializing neural processing pipeline...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 5, 'Deploying advanced AI architecture', 'initialization');

      // Stage 0: Document Classification (determines optimal processing path)
      console.log(`🔍 Classifying document ${documentId}...`);
      const classification = await this.classifierService.classifyDocument(document.filePath, document.mimeType);
      console.log(`✅ Document classified as: ${classification.documentType} (${classification.complexity} complexity)`);
      
      // Save classification results
      await storage.saveDocumentClassification({
        documentId,
        ...classification,
      });
      
      // Stage 0.5: Check OCR Cache (huge cost savings!)
      console.log(`🔍 Checking OCR cache for document ${documentId}...`);
      const documentHash = await this.ocrCacheService.generateDocumentHash(document.filePath);
      const cachedOCR = await this.ocrCacheService.getCachedResult(documentHash);
      
      let extractedText: string;
      let ocrResults: any;
      
      if (cachedOCR) {
        console.log(`✅ OCR cache HIT! Skipping OCR for document ${documentId}`);
        await storage.updateDocumentStatus(documentId, 'processing', 25, 'Loading pre-analyzed neural embeddings...');
        this.sendWebSocketUpdate(document.userId, documentId, 'processing', 25, 'Retrieving cached intelligence matrix', 'cache_hit');
        
        // Construct consistent ocrResults from cache (with metadata guard for legacy entries)
        extractedText = cachedOCR.extractedText;
        ocrResults = {
          text: cachedOCR.extractedText,
          confidence: cachedOCR.ocrConfidence,
          pageCount: cachedOCR.pageCount,
          metadata: cachedOCR.metadata || {},
          fromCache: true,
          cacheHit: true,
        };
      } else {
        console.log(`ℹ️  OCR cache MISS - using intelligent routing for document ${documentId}`);
        
        // Stage 1: Intelligent Routing - Determines optimal processing method
        await storage.updateDocumentStatus(documentId, 'processing', 25, 'Analyzing document structure with deep learning...');
        this.sendWebSocketUpdate(document.userId, documentId, 'processing', 25, 'Deploying multimodal AI architecture', 'routing');
        
        const routingDecision = await this.intelligentRouter.routeDocument(document.filePath, document.mimeType);
        console.log(`🧠 Routing decision: ${routingDecision.method} (${routingDecision.reason})`);
        
        await storage.updateDocumentStatus(documentId, 'processing', 30, `Initializing transformer models - ETA ${routingDecision.estimatedTime}s`);
        this.sendWebSocketUpdate(document.userId, documentId, 'processing', 30, 'Activating neural extraction pipeline', 'routing');
        
        // Process with selected method
        const processResult = await this.intelligentRouter.processDocument(
          document.filePath,
          routingDecision.method,
          (progress, message) => {
            const progressPercent = Math.round(30 + (progress / 100) * 30); // Text extraction is 30-60%
            this.sendWebSocketUpdate(document.userId, documentId, 'processing', progressPercent, message, 'extraction');
          }
        );
        
        extractedText = processResult.text;
        ocrResults = {
          text: processResult.text,
          confidence: processResult.confidence * 100, // Convert to 0-100 range
          metadata: {
            ...processResult.metadata,
            processingMethod: processResult.method,
            routingReason: routingDecision.reason
          },
        };
        
        // Cache the results for future use
        console.log(`💾 Caching extraction results for document ${documentId}`);
        await this.ocrCacheService.cacheResult(
          documentHash,
          ocrResults.text,
          ocrResults.confidence,
          processResult.metadata.pageCount || classification.pageCount || 1,
          { 
            industry: document.industry, 
            mimeType: document.mimeType,
            processingMethod: processResult.method
          }
        );
      }
      
      // Stage 2: Single AI Analysis (Gemini for speed) - REQUIRED
      await storage.updateDocumentStatus(documentId, 'processing', 60, 'Running deep semantic analysis...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 60, 'Synthesizing contextual intelligence', 'ai_analysis');
      
      // Use Gemini for quick mode (faster and more cost-effective)
      const quickAIResult = await this.multiAIService.analyzeDocumentWithSingleModel(
        extractedText, 
        document.industry,
        'gemini', // Use Gemini Flash for speed
        ocrResults
      );
      
      // Stage 3: Basic Entity Extraction - REQUIRED
      await storage.updateDocumentStatus(documentId, 'processing', 75, 'Performing entity recognition...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 75, 'Extracting semantic entities with NLP', 'entity_extraction');
      
      // Extract only essential entities
      const entities = this.extractEssentialEntities(quickAIResult);
      
      // Stage 3.5: Auto-QA Verification (Second-Pass Validation)
      await storage.updateDocumentStatus(documentId, 'processing', 85, 'Running verification checks...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 85, 'Validating extracted data with Auto-QA', 'verification');
      
      let finalExtractedData = {
        analysisMode: 'quick',
        gemini: quickAIResult,
        processingTime: Date.now() - startTime,
        recommendedModel: 'gemini',
      };
      
      try {
        // Perform second-pass verification
        const verificationResult = await verificationService.verifyExtraction(
          documentId,
          finalExtractedData,
          extractedText,
          document.industry
        );
        
        // Store verification results
        const verificationId = await verificationService.storeVerificationResult(
          documentId,
          finalExtractedData,
          verificationResult,
          'gemini-crosscheck'
        );
        
        // Use verified extraction if available
        if (verificationResult.verifiedExtraction) {
          finalExtractedData = {
            ...finalExtractedData,
            ...verificationResult.verifiedExtraction,
            verification: {
              uncertaintyScore: verificationResult.uncertaintyScore,
              discrepancies: verificationResult.discrepancies,
              needsManualReview: verificationResult.needsManualReview,
              reviewReason: verificationResult.reviewReason,
              verificationId
            }
          };
        }
        
        console.log(`✅ Verification complete: ${verificationResult.discrepancies.length} discrepancies, uncertainty ${(verificationResult.uncertaintyScore * 100).toFixed(1)}%`);
      } catch (verificationError) {
        console.error('Verification failed, using unverified data:', verificationError);
        // Continue with unverified data if verification fails
      }
      
      // Stage 4: Save Results
      await storage.updateDocumentStatus(documentId, 'processing', 95, 'Finalizing intelligence synthesis...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 95, 'Compiling analysis results', 'saving');
      
      const processingResult: ProcessingResult = {
        extractedText: ocrResults.text,
        extractedData: finalExtractedData,
        ocrConfidence: ocrResults.confidence,
        aiConfidence: quickAIResult.confidence || 85, // Default confidence for quick mode
        entities,
      };

      // Update document with results
      await storage.updateDocumentAnalysis(
        documentId,
        processingResult.extractedText,
        processingResult.extractedData,
        processingResult.ocrConfidence,
        processingResult.aiConfidence
      );

      // Save entities
      for (const entity of processingResult.entities) {
        await storage.createExtractedEntity({
          documentId,
          entityType: entity.type,
          entityValue: entity.value,
          confidenceScore: entity.confidence,
        });
      }

      // Create analysis record
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'quick_analysis',
        analysisData: processingResult.extractedData,
        confidenceScore: processingResult.aiConfidence,
      });

      // Mark as completed
      const processingTimeMs = Date.now() - startTime;
      await storage.updateDocumentStatus(documentId, 'completed', 100, 'AI analysis complete');
      this.sendWebSocketUpdate(
        document.userId,
        documentId, 
        'completed', 
        100, 
        `Quick analysis completed in ${Math.round(processingTimeMs / 1000)} seconds`,
        'completed',
        'Gemini Flash',
        processingTimeMs,
        document.originalFilename
      );

      console.log(`✅ Quick document processing completed for document ${documentId} in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`Error in quick processing for document ${documentId}:`, error);
      
      // Get userId for error WebSocket update
      const doc = await storage.getDocument(documentId);
      const userId = doc?.userId || 'unknown';
      
      await storage.updateDocumentStatus(
        documentId, 
        'error', 
        0, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.sendWebSocketUpdate(
        userId,
        documentId,
        'failed',
        0,
        error instanceof Error ? error.message : 'Quick processing failed',
        'error'
      );
      throw error;
    }
  }

  // Helper method to extract only essential entities
  private extractEssentialEntities(aiResult: any): Array<{type: string; value: string; confidence: number}> {
    const entities = [];
    
    // Extract only the most important entity types
    if (aiResult.entities) {
      const essentialTypes = ['person', 'organization', 'date', 'money', 'location', 'document_type'];
      
      for (const entity of aiResult.entities) {
        if (essentialTypes.includes(entity.type.toLowerCase())) {
          entities.push({
            type: entity.type,
            value: entity.value,
            confidence: entity.confidence || 85
          });
        }
      }
    }
    
    return entities;
  }

  async processDocument(documentId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      await storage.updateDocumentStatus(documentId, 'processing', 10, 'Starting document processing...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 10, 'Starting multi-AI document analysis', 'initialization', undefined, undefined, document.originalFilename);

      // Stage 1: Text Extraction (OCR temporarily simplified)
      await storage.updateDocumentStatus(documentId, 'processing', 20, 'Extracting text from document...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 20, 'Running text extraction', 'ocr');
      const extractedText = await this.extractText(document.filePath, document.mimeType);
      
      // Stage 2: Multi-AI Analysis (OpenAI + Gemini + Anthropic)
      await storage.updateDocumentStatus(documentId, 'processing', 40, 'Analyzing with multiple AI models...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 40, 'Running OpenAI, Gemini, and Anthropic analysis', 'ai_analysis');
      
      // Get OCR results and pass them to avoid double processing
      const ocrResults = await this.getOCRResults(document.filePath, document.mimeType, extractedText);
      
      const multiAIResult = await this.multiAIService.analyzeDocument(
        extractedText, 
        document.industry, 
        undefined, // Don't pass filePath to prevent double OCR
        undefined, // Don't pass mimeType to prevent double OCR
        ocrResults // Pass pre-computed OCR results
      );
      
      // Stage 3: Run Advanced Features in PARALLEL for speed
      await storage.updateDocumentStatus(documentId, 'processing', 60, 'Running advanced analysis features...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 60, 'Parallel processing: Template-free, RAG, and Intelligence analysis', 'parallel_analysis');
      
      // Run template-free and RAG enhancement in parallel since they're independent
      const [templateFreeResult, ragResult] = await Promise.allSettled([
        // Template-Free Processing
        this.templateFreeService.processDocumentWithoutTemplates(
          document.filePath,
          extractedText,
          document.mimeType,
          document.userId
        ).catch(error => {
          console.warn('⚠️ Template-free processing failed:', error instanceof Error ? error.message : error);
          return null;
        }),
        
        // RAG-Enhanced Analysis
        (async () => {
          const query = `${document.documentType || 'document'} ${document.industry} analysis`;
          return this.ragService.enhanceAnalysisWithRAG(
            multiAIResult,
            query,
            document.industry,
            document.documentType || undefined
          ).catch(error => {
            console.warn('⚠️ RAG enhancement failed:', error);
            return null;
          });
        })()
      ]);

      // Extract results from parallel execution
      let templateFreeResults = templateFreeResult.status === 'fulfilled' ? templateFreeResult.value : null;
      let ragEnhancedResults = ragResult.status === 'fulfilled' ? ragResult.value : null;
      
      if (templateFreeResults && templateFreeResults.extractedFindings) {
        console.log(`✅ Template-free processing discovered ${templateFreeResults.extractedFindings.length} entities with ${templateFreeResults.adaptiveConfidence}% confidence`);
      }
      
      if (ragEnhancedResults) {
        console.log(`✅ RAG enhancement provided ${ragEnhancedResults.confidenceBoost}% confidence boost`);
      }

      // Stage 6: Advanced Confidence Calculation (NEW FEATURE)
      await storage.updateDocumentStatus(documentId, 'processing', 75, 'Calculating advanced confidence metrics...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 75, 'Computing enterprise-grade confidence scores', 'advanced_confidence');
      
      let advancedConfidenceMetrics = null;
      let finalConfidence = multiAIResult.consensus.confidence; // Fallback to basic confidence
      
      try {
        // Build model predictions data for advanced confidence calculation
        const modelPredictions = this.buildModelPredictions(
          multiAIResult,
          templateFreeResults,
          ragEnhancedResults,
          Date.now() - startTime
        );
        
        // Calculate document context for advanced confidence
        const documentContext = {
          industry: document.industry,
          documentType: document.documentType || 'unknown',
          textQuality: ocrResults.confidence,
          processingComplexity: this.calculateProcessingComplexity(extractedText, document.mimeType)
        };
        
        // Build RAG context if available
        const ragContext = ragEnhancedResults ? {
          similarity: (ragEnhancedResults as any).similarity || 0.7,
          historicalConfidence: (ragEnhancedResults as any).historicalConfidence || 0.75,
          sampleSize: (ragEnhancedResults as any).sampleSize || 0
        } : undefined;
        
        // Build template-free context if available
        const templateFreeContext = templateFreeResults ? {
          structureConfidence: templateFreeResults.documentStructure?.confidenceScore || 0.8,
          patternMatch: templateFreeResults.discoveredPatterns ? 0.85 : 0.6,
          adaptiveConfidence: templateFreeResults.adaptiveConfidence / 100
        } : undefined;
        
        // Calculate advanced confidence metrics
        advancedConfidenceMetrics = await this.advancedConfidenceService.calculateAdvancedConfidence(
          modelPredictions,
          documentContext,
          ragContext,
          templateFreeContext
        );
        
        finalConfidence = advancedConfidenceMetrics.overall;
        
        console.log(`✅ Advanced confidence calculated: ${Math.round(finalConfidence * 100)}% (components: content=${Math.round(advancedConfidenceMetrics.components.content * 100)}%, consensus=${Math.round(advancedConfidenceMetrics.components.consensus * 100)}%, uncertainty=${Math.round(advancedConfidenceMetrics.uncertainty.total * 100)}%)`);
        
      } catch (error) {
        console.warn('⚠️ Advanced confidence calculation failed, using basic confidence:', error instanceof Error ? error.message : error);
        this.sendWebSocketUpdate(document.userId, documentId, 'processing', 77, 'Advanced confidence failed, using standard confidence', 'advanced_confidence_error');
      }

      // Stage 7: Advanced Document Intelligence Analysis (NEW INTEGRATION)
      await storage.updateDocumentStatus(documentId, 'processing', 78, 'Running advanced document intelligence...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 78, 'Analyzing document relationships, compliance, and risk factors', 'advanced_intelligence');
      
      let advancedIntelligenceResult = null;
      try {
        // First, prepare entities for advanced intelligence
        const preliminaryEntities = this.combineEntities(multiAIResult, templateFreeResults, ragEnhancedResults);
        
        // Build document context for advanced intelligence
        const documentContext = {
          industry: document.industry,
          documentType: document.documentType || 'unknown',
          extractedText,
          metadata: {
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            processingTime: Date.now() - startTime,
            ocrConfidence: multiAIResult.ocrResults.confidence,
            aiConfidence: finalConfidence
          }
        };
        
        // Call advanced intelligence service
        advancedIntelligenceResult = await this.advancedIntelligenceService.analyzeDocumentIntelligence(
          documentId,
          multiAIResult,
          templateFreeResults,
          ragEnhancedResults,
          preliminaryEntities,
          documentContext
        );
        
        console.log(`✅ Advanced intelligence analysis completed: ${advancedIntelligenceResult.intelligenceInsights.length} insights, ${advancedIntelligenceResult.complianceResults.length} compliance checks, ${advancedIntelligenceResult.riskAssessment.riskFactors.length} risk factors`);
        
      } catch (error) {
        console.warn('⚠️ Advanced document intelligence failed, continuing with standard processing:', error instanceof Error ? error.message : error);
        this.sendWebSocketUpdate(document.userId, documentId, 'processing', 79, 'Advanced intelligence failed, using standard analysis', 'advanced_intelligence_error');
      }

      // Stage 8: Enhanced Entity Extraction  
      await storage.updateDocumentStatus(documentId, 'processing', 80, 'Extracting enhanced entities...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 80, 'Extracting industry-specific entities', 'entity_extraction');
      const entities = this.combineEntities(multiAIResult, templateFreeResults, ragEnhancedResults);
      
      // Stage 4: Consensus Analysis
      await storage.updateDocumentStatus(documentId, 'processing', 85, 'Generating consensus analysis...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 85, 'Creating consensus from multiple AI models', 'consensus');
      
      // Stage 5: Save Enhanced Results
      await storage.updateDocumentStatus(documentId, 'processing', 95, 'Saving comprehensive analysis...');
      this.sendWebSocketUpdate(document.userId, documentId, 'processing', 95, 'Saving multi-AI analysis results', 'saving');
      
      const processingResult: ProcessingResult = {
        extractedText: multiAIResult.ocrResults.text,
        extractedData: {
          multiAI: multiAIResult,
          templateFree: templateFreeResults,
          ragEnhanced: ragEnhancedResults,
          advancedConfidence: advancedConfidenceMetrics,
          advancedIntelligence: advancedIntelligenceResult, // NEW: Include advanced intelligence
          recommendedModel: multiAIResult.consensus.recommendedModel,
          processingTime: Date.now() - startTime,
          hasTemplateFreeAnalysis: !!templateFreeResults,
          hasRAGEnhancement: !!ragEnhancedResults,
          hasAdvancedConfidence: !!advancedConfidenceMetrics,
          hasAdvancedIntelligence: !!advancedIntelligenceResult // NEW: Track intelligence availability
        },
        ocrConfidence: multiAIResult.ocrResults.confidence,
        aiConfidence: finalConfidence, // Use advanced confidence or fallback to basic
        entities,
      };

      // Update document with enhanced results
      await storage.updateDocumentAnalysis(
        documentId,
        processingResult.extractedText,
        processingResult.extractedData,
        processingResult.ocrConfidence,
        processingResult.aiConfidence
      );

      // Save enhanced entities
      for (const entity of processingResult.entities) {
        await storage.createExtractedEntity({
          documentId,
          entityType: entity.type,
          entityValue: entity.value,
          confidenceScore: entity.confidence,
        });
      }

      // Create comprehensive analysis record
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'multi_ai_analysis',
        analysisData: processingResult.extractedData,
        confidenceScore: processingResult.aiConfidence,
      });

      // Create separate template-free analysis record if available
      if (templateFreeResults) {
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'template_free_analysis',
          analysisData: {
            documentStructure: templateFreeResults.documentStructure,
            extractedFindings: templateFreeResults.extractedFindings,
            intelligentSummary: templateFreeResults.intelligentSummary,
            suggestedActions: templateFreeResults.suggestedActions,
            processingStrategy: templateFreeResults.processingStrategy,
            adaptiveConfidence: templateFreeResults.adaptiveConfidence,
            discoveredPatterns: templateFreeResults.discoveredPatterns,
            industryRecommendations: templateFreeResults.industryRecommendations
          },
          confidenceScore: templateFreeResults.adaptiveConfidence,
        });

        console.log(`✅ Template-free analysis saved: ${templateFreeResults.extractedFindings.length} findings, ${templateFreeResults.adaptiveConfidence}% confidence`);
      }

      // Create advanced confidence analysis record if available
      if (advancedConfidenceMetrics) {
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'advanced_confidence_analysis',
          analysisData: {
            overallConfidence: advancedConfidenceMetrics.overall,
            componentConfidences: advancedConfidenceMetrics.components,
            uncertaintyMetrics: advancedConfidenceMetrics.uncertainty,
            calibrationMetrics: advancedConfidenceMetrics.calibration,
            confidenceExplanation: advancedConfidenceMetrics.explanation,
            processingTimestamp: new Date().toISOString()
          },
          confidenceScore: advancedConfidenceMetrics.overall,
        });

        console.log(`✅ Advanced confidence analysis saved: overall=${Math.round(advancedConfidenceMetrics.overall * 100)}%, uncertainty=${Math.round(advancedConfidenceMetrics.uncertainty.total * 100)}%`);
      }

      // Create advanced intelligence analysis record if available (NEW FEATURE)
      if (advancedIntelligenceResult) {
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'advanced_intelligence',
          analysisData: {
            documentRelationships: advancedIntelligenceResult.documentRelationships,
            complianceResults: advancedIntelligenceResult.complianceResults,
            temporalPatterns: advancedIntelligenceResult.temporalPatterns,
            riskAssessment: advancedIntelligenceResult.riskAssessment,
            intelligenceInsights: advancedIntelligenceResult.intelligenceInsights,
            crossDocumentAnalysis: advancedIntelligenceResult.crossDocumentAnalysis,
            qualityAssessment: advancedIntelligenceResult.qualityAssessment,
            smartRecommendations: advancedIntelligenceResult.smartRecommendations,
            processingTimestamp: advancedIntelligenceResult.processingTimestamp,
            overallIntelligenceScore: advancedIntelligenceResult.qualityAssessment?.overallQuality || 0.85
          },
          confidenceScore: advancedIntelligenceResult.qualityAssessment?.overallQuality || 0.85,
        });

        console.log(`✅ Advanced intelligence analysis saved: ${advancedIntelligenceResult.intelligenceInsights.length} insights, ${advancedIntelligenceResult.complianceResults.length} compliance checks, risk score: ${Math.round((advancedIntelligenceResult.riskAssessment.overallRiskScore || 0) * 100)}%`);
      }

      const totalTime = Date.now() - startTime;
      await storage.updateDocumentStatus(documentId, 'completed', 100, 'Multi-AI processing completed successfully');
      
      // Send completion update with full results
      this.sendWebSocketUpdate(
        document.userId,
        documentId, 
        'completed', 
        100, 
        `Document processed in ${totalTime}ms using ${multiAIResult.consensus.recommendedModel}`, 
        'completed',
        multiAIResult.consensus.recommendedModel,
        totalTime,
        document.originalFilename
      );

      // Send document complete notification with analysis
      if (this.websocketService) {
        this.websocketService.sendDocumentComplete(document.userId, String(documentId), multiAIResult);
      }

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      const errorMessage = `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Get userId for error WebSocket update
      const doc = await storage.getDocument(documentId);
      const userId = doc?.userId || 'unknown';
      
      await storage.updateDocumentStatus(documentId, 'error', 0, errorMessage);
      this.sendWebSocketUpdate(userId, documentId, 'failed', 0, errorMessage, 'error');
      
      throw error;
    }
  }

  private sendWebSocketUpdate(
    userId: string,
    documentId: number, 
    status: 'queued' | 'processing' | 'completed' | 'failed', 
    progress: number, 
    message: string, 
    stage?: string,
    aiModel?: string,
    processingTime?: number,
    documentName?: string
  ) {
    if (this.websocketService) {
      this.websocketService.sendProcessingUpdate(userId, {
        documentId: String(documentId),
        documentName,
        status,
        progress,
        message,
        stage,
        aiModel,
        processingTime
      });
    }
  }

  private combineEntities(multiAIResult: any, templateFreeResults?: any, ragEnhancedResults?: any): Array<{type: string, value: string, confidence: number}> {
    const entities: Array<{type: string, value: string, confidence: number}> = [];
    
    // Combine entities from OpenAI analysis
    if (multiAIResult.openai?.keyEntities) {
      entities.push(...multiAIResult.openai.keyEntities);
    }
    
    // Add insights as entities
    if (multiAIResult.openai?.insights) {
      multiAIResult.openai.insights.forEach((insight: string) => {
        entities.push({
          type: 'insight',
          value: insight,
          confidence: 0.85
        });
      });
    }
    
    // Add Gemini insights
    if (multiAIResult.gemini?.insights) {
      multiAIResult.gemini.insights.forEach((insight: string) => {
        entities.push({
          type: 'gemini_insight',
          value: insight,
          confidence: 0.82
        });
      });
    }
    
    // Add consensus findings
    if (multiAIResult.consensus?.keyFindings) {
      multiAIResult.consensus.keyFindings.forEach((finding: string) => {
        entities.push({
          type: 'consensus_finding',
          value: finding,
          confidence: multiAIResult.consensus.confidence
        });
      });
    }

    // Add OCR-specific entities
    if (multiAIResult.ocrResults?.language !== 'en') {
      entities.push({
        type: 'language',
        value: multiAIResult.ocrResults.language,
        confidence: 0.95
      });
    }

    if (multiAIResult.ocrResults?.handwritingDetected) {
      entities.push({
        type: 'handwriting',
        value: 'Handwritten text detected',
        confidence: 0.88
      });
    }

    // Add template-free processing entities
    if (templateFreeResults?.extractedFindings) {
      templateFreeResults.extractedFindings.forEach((finding: any) => {
        entities.push({
          type: `template_free_${finding.entityType}`,
          value: finding.entityValue,
          confidence: finding.confidence
        });
      });
    }

    // Add template-free document structure insights
    if (templateFreeResults?.documentStructure) {
      const structure = templateFreeResults.documentStructure;
      
      entities.push({
        type: 'document_category',
        value: structure.documentCategory,
        confidence: structure.confidenceScore
      });

      entities.push({
        type: 'document_complexity',
        value: structure.complexity,
        confidence: 0.9
      });

      entities.push({
        type: 'layout_type',
        value: structure.layoutType,
        confidence: 0.85
      });

      // Add discovered patterns as entities
      if (templateFreeResults.discoveredPatterns) {
        templateFreeResults.discoveredPatterns.forEach((pattern: string) => {
          entities.push({
            type: 'discovered_pattern',
            value: pattern,
            confidence: 0.8
          });
        });
      }
    }
    
    return entities;
  }

  /**
   * Build ModelPrediction data for advanced confidence calculation
   */
  private buildModelPredictions(
    multiAIResult: any,
    templateFreeResults?: any,
    ragEnhancedResults?: any,
    processingTime?: number
  ): Array<{
    model: string;
    prediction: any;
    confidence: number;
    entropy: number;
    features: {
      textQuality: number;
      structuralClarity: number;
      domainMatch: number;
      processingTime: number;
    };
  }> {
    const predictions = [];
    
    // Add OpenAI prediction
    if (multiAIResult.openai) {
      predictions.push({
        model: 'openai',
        prediction: multiAIResult.openai,
        confidence: multiAIResult.openai.confidence || 0.8,
        entropy: this.calculateModelEntropy(multiAIResult.openai),
        features: {
          textQuality: multiAIResult.ocrResults?.confidence || 0.8,
          structuralClarity: multiAIResult.openai.keyEntities ? 0.9 : 0.6,
          domainMatch: multiAIResult.openai.insights ? 0.85 : 0.7,
          processingTime: processingTime || 5000
        }
      });
    }
    
    // Add Gemini prediction
    if (multiAIResult.gemini) {
      predictions.push({
        model: 'gemini',
        prediction: multiAIResult.gemini,
        confidence: multiAIResult.gemini.confidence || 0.82,
        entropy: this.calculateModelEntropy(multiAIResult.gemini),
        features: {
          textQuality: multiAIResult.ocrResults?.confidence || 0.8,
          structuralClarity: multiAIResult.gemini.insights ? 0.87 : 0.65,
          domainMatch: multiAIResult.gemini.keyFindings ? 0.83 : 0.72,
          processingTime: processingTime || 4500
        }
      });
    }
    
    // Add Anthropic prediction
    if (multiAIResult.anthropic) {
      predictions.push({
        model: 'anthropic',
        prediction: multiAIResult.anthropic,
        confidence: multiAIResult.anthropic.confidence || 0.85,
        entropy: this.calculateModelEntropy(multiAIResult.anthropic),
        features: {
          textQuality: multiAIResult.ocrResults?.confidence || 0.8,
          structuralClarity: multiAIResult.anthropic.analysis ? 0.88 : 0.68,
          domainMatch: multiAIResult.anthropic.keyInsights ? 0.86 : 0.74,
          processingTime: processingTime || 5200
        }
      });
    }
    
    // Add template-free prediction if available
    if (templateFreeResults) {
      predictions.push({
        model: 'template_free',
        prediction: templateFreeResults,
        confidence: templateFreeResults.adaptiveConfidence / 100,
        entropy: this.calculateTemplateFrameEntropy(templateFreeResults),
        features: {
          textQuality: templateFreeResults.documentStructure?.confidenceScore || 0.8,
          structuralClarity: templateFreeResults.documentStructure ? 0.92 : 0.7,
          domainMatch: templateFreeResults.industryRecommendations ? 0.88 : 0.75,
          processingTime: processingTime || 6000
        }
      });
    }
    
    // Add RAG-enhanced prediction if available
    if (ragEnhancedResults) {
      predictions.push({
        model: 'rag_enhanced',
        prediction: ragEnhancedResults,
        confidence: ragEnhancedResults.enhancedConfidence || 0.87,
        entropy: this.calculateRAGEntropy(ragEnhancedResults),
        features: {
          textQuality: ragEnhancedResults.similarity || 0.8,
          structuralClarity: ragEnhancedResults.historicalPattern ? 0.85 : 0.7,
          domainMatch: ragEnhancedResults.contextMatch || 0.82,
          processingTime: processingTime || 3500
        }
      });
    }
    
    return predictions;
  }
  
  /**
   * Calculate model entropy for confidence scoring
   */
  private calculateModelEntropy(modelResult: any): number {
    let entropy = 0.5; // Base entropy
    
    try {
      // Calculate entropy based on prediction certainty
      const confidence = modelResult.confidence || 0.8;
      
      // Higher confidence = lower entropy (more certain)
      entropy = 1 - confidence;
      
      // Adjust based on number of insights/findings
      const insightCount = (
        (modelResult.insights?.length || 0) + 
        (modelResult.keyFindings?.length || 0) + 
        (modelResult.keyEntities?.length || 0)
      );
      
      // More insights = lower entropy (more information)
      if (insightCount > 0) {
        entropy *= Math.max(0.3, 1 - (insightCount / 20));
      }
      
      // Bound between 0.1 and 0.9
      return Math.max(0.1, Math.min(0.9, entropy));
      
    } catch (error) {
      console.warn('Entropy calculation failed, using default:', error);
      return 0.5;
    }
  }
  
  /**
   * Calculate entropy for template-free results
   */
  private calculateTemplateFrameEntropy(templateFreeResults: any): number {
    let entropy = 0.4; // Lower base entropy for template-free (more structured)
    
    try {
      const confidence = templateFreeResults.adaptiveConfidence / 100;
      entropy = 1 - confidence;
      
      // Adjust based on findings count
      const findingsCount = templateFreeResults.extractedFindings?.length || 0;
      if (findingsCount > 0) {
        entropy *= Math.max(0.2, 1 - (findingsCount / 15));
      }
      
      // Adjust based on discovered patterns
      const patternsCount = templateFreeResults.discoveredPatterns?.length || 0;
      if (patternsCount > 0) {
        entropy *= Math.max(0.25, 1 - (patternsCount / 10));
      }
      
      return Math.max(0.1, Math.min(0.8, entropy));
      
    } catch (error) {
      return 0.4;
    }
  }
  
  /**
   * Calculate entropy for RAG-enhanced results
   */
  private calculateRAGEntropy(ragResults: any): number {
    let entropy = 0.3; // Lower base entropy for RAG (historical context)
    
    try {
      const similarity = ragResults.similarity || 0.7;
      const historicalConfidence = ragResults.historicalConfidence || 0.75;
      
      // Higher similarity and historical confidence = lower entropy
      entropy = 1 - ((similarity + historicalConfidence) / 2);
      
      // Adjust based on sample size
      const sampleSize = ragResults.sampleSize || 0;
      if (sampleSize > 0) {
        const sampleWeight = Math.min(sampleSize / 10, 1);
        entropy *= (1 - sampleWeight * 0.3);
      }
      
      return Math.max(0.1, Math.min(0.7, entropy));
      
    } catch (error) {
      return 0.3;
    }
  }
  
  /**
   * Calculate processing complexity for confidence scoring
   */
  private calculateProcessingComplexity(extractedText: string, mimeType?: string): number {
    let complexity = 0.5; // Base complexity
    
    try {
      // Text length factor
      const textLength = extractedText.length;
      if (textLength < 500) {
        complexity -= 0.2; // Simple document
      } else if (textLength > 5000) {
        complexity += 0.2; // Complex document
      }
      
      // File type factor
      if (mimeType) {
        if (mimeType.includes('pdf')) {
          complexity += 0.1; // PDFs are more complex to process
        } else if (mimeType.includes('image')) {
          complexity += 0.15; // Images require OCR
        } else if (mimeType.includes('text')) {
          complexity -= 0.1; // Plain text is simpler
        }
      }
      
      // Language and structure complexity
      const lines = extractedText.split('\n').length;
      const words = extractedText.split(/\s+/).length;
      const avgWordsPerLine = words / Math.max(lines, 1);
      
      if (avgWordsPerLine > 15) {
        complexity += 0.1; // Dense text
      } else if (avgWordsPerLine < 5) {
        complexity += 0.05; // Fragmented text (could be table/form)
      }
      
      // Check for special characters/formatting
      const specialChars = (extractedText.match(/[\$\%\#\@\&\*]/g) || []).length;
      const specialCharRatio = specialChars / Math.max(textLength, 1);
      
      if (specialCharRatio > 0.05) {
        complexity += 0.1; // Document with many special characters
      }
      
      // Bound between 0.1 and 0.9
      return Math.max(0.1, Math.min(0.9, complexity));
      
    } catch (error) {
      console.warn('Processing complexity calculation failed, using default:', error);
      return 0.5;
    }
  }

  private async getOCRResults(filePath: string, mimeType?: string, extractedText?: string): Promise<any> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // For images and PDFs, get full OCR results
      if (this.isImageFile(fileExtension) || fileExtension === '.pdf') {
        let ocrResult;
        if (fileExtension === '.pdf') {
          ocrResult = await this.visionService.extractTextFromPDF(filePath);
        } else {
          ocrResult = await this.visionService.extractTextFromImage(filePath);
        }
        return ocrResult;
      }
      
      // For text files, return basic OCR results
      return {
        text: extractedText || '',
        confidence: 0.95,
        language: 'en',
        handwritingDetected: false,
        blocks: []
      };
    } catch (error) {
      console.error('OCR results extraction failed:', error);
      return {
        text: extractedText || '',
        confidence: 0.5,
        language: 'en',
        handwritingDetected: false,
        blocks: []
      };
    }
  }

  // Quick text extraction for fast processing (limits pages for PDFs)
  private async extractTextQuick(
    filePath: string, 
    mimeType?: string, 
    maxPages: number = 250,
    progressCallback?: (currentPage: number, totalPages: number, estimatedTimeRemaining: number) => void
  ): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // For plain text files, read directly
      if (fileExtension === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      }
      
      // For PDFs, only process first few pages in quick mode
      if (fileExtension === '.pdf') {
        console.log(`⚡ Quick PDF extraction - processing only first ${maxPages} pages`);
        const limitedOcrResult = await this.visionService.extractTextFromPDFLimited(filePath, maxPages, progressCallback);
        return limitedOcrResult.text;
      }
      
      // For images, use standard OCR
      if (this.isImageFile(fileExtension)) {
        const ocrResult = await this.visionService.extractTextFromImage(filePath);
        return ocrResult.text;
      }
      
      // For Word documents and other types
      return await this.extractText(filePath, mimeType);
    } catch (error) {
      console.error('Quick text extraction failed:', error);
      throw error;
    }
  }

  private async extractText(filePath: string, mimeType?: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // For plain text files, read directly
      if (fileExtension === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      }
      
      // For images and PDFs, use real Google Cloud Vision OCR
      if (this.isImageFile(fileExtension) || fileExtension === '.pdf') {
        console.log(`🔍 Starting real OCR processing for ${fileExtension.toUpperCase()} file: ${filePath}`);
        
        let ocrResult;
        if (fileExtension === '.pdf') {
          ocrResult = await this.visionService.extractTextFromPDF(filePath);
        } else {
          ocrResult = await this.visionService.extractTextFromImage(filePath);
        }
        
        const extractedText = ocrResult.text || '';
        const handwritingNote = ocrResult.handwritingDetected ? ' [Handwriting detected]' : '';
        
        console.log(`✅ Real OCR completed: extracted ${extractedText.length} chars, confidence: ${ocrResult.confidence}${handwritingNote}`);
        
        return extractedText;
      }
      
      // For other file types, return basic extraction notice
      return `Document processed: ${path.basename(filePath)}
File type: ${fileExtension.toUpperCase()}
Processing timestamp: ${new Date().toISOString()}

Note: This file type requires specialized processing beyond OCR.
For full document intelligence, please upload PDF or image files.`;
      
    } catch (error) {
      console.error('Real OCR extraction failed:', error);
      
      // Fallback for OCR failures
      const fileExtension = path.extname(filePath).toLowerCase();
      return `OCR Processing Attempted for ${fileExtension.toUpperCase()} file

Error occurred during text extraction: ${error instanceof Error ? error.message : 'Unknown error'}

Fallback processing applied. For optimal results:
- Ensure the document image is clear and high resolution
- Check that text is not rotated or skewed
- Verify the document contains readable text content

File: ${path.basename(filePath)}
Timestamp: ${new Date().toISOString()}`;
    }
  }
  
  /**
   * Check if file extension represents an image file
   */
  private isImageFile(extension: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  private async extractEntities(text: string, industry: string): Promise<Array<{type: string, value: string, confidence: number}>> {
    // Industry-specific entity extraction
    const entities: Array<{type: string, value: string, confidence: number}> = [];
    
    switch (industry) {
      case 'real_estate':
        // Extract real estate entities
        if (text.toLowerCase().includes('buyer') || text.toLowerCase().includes('seller')) {
          entities.push({ type: 'buyer_seller_info', value: 'Buyer/Seller information detected', confidence: 0.96 });
        }
        if (text.toLowerCase().includes('purchase price') || text.includes('$')) {
          entities.push({ type: 'purchase_price', value: 'Purchase price identified', confidence: 0.97 });
        }
        if (text.toLowerCase().includes('closing') && text.toLowerCase().includes('date')) {
          entities.push({ type: 'closing_date', value: 'Closing date found', confidence: 0.95 });
        }
        if (text.toLowerCase().includes('contingency') || text.toLowerCase().includes('contingencies')) {
          entities.push({ type: 'contingencies', value: 'Contract contingencies detected', confidence: 0.93 });
        }
        if (text.toLowerCase().includes('inspection')) {
          entities.push({ type: 'inspection_info', value: 'Inspection information found', confidence: 0.94 });
        }
        if (text.toLowerCase().includes('agent') || text.toLowerCase().includes('realtor')) {
          entities.push({ type: 'agent_info', value: 'Agent information detected', confidence: 0.92 });
        }
        break;
        
      case 'medical':
        // Extract medical entities
        if (text.toLowerCase().includes('patient')) {
          entities.push({ type: 'patient_info', value: 'Patient information detected', confidence: 0.95 });
        }
        if (text.toLowerCase().includes('diagnosis')) {
          entities.push({ type: 'diagnosis', value: 'Diagnosis information found', confidence: 0.92 });
        }
        break;
        
      case 'legal':
        // Extract legal entities
        if (text.toLowerCase().includes('contract')) {
          entities.push({ type: 'contract_term', value: 'Contract terms identified', confidence: 0.94 });
        }
        break;
        
      case 'finance':
        // Extract financial entities
        if (text.toLowerCase().includes('amount') || text.includes('$')) {
          entities.push({ type: 'financial_amount', value: 'Financial amounts detected', confidence: 0.96 });
        }
        break;
        
      default:
        // General business entities
        if (text.toLowerCase().includes('date')) {
          entities.push({ type: 'date', value: 'Date information found', confidence: 0.93 });
        }
    }
    
    return entities;
  }
}
