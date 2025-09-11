import { storage } from "../storage";
import { MultiAIService } from "./multiAIService";
import { WebSocketService } from "./websocketService";
import { VisionService } from "./visionService";
import { TemplateFreeExtractionService } from "./templateFreeExtractionService";
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
  private websocketService: WebSocketService | null = null;

  constructor(websocketService?: WebSocketService) {
    this.multiAIService = new MultiAIService();
    this.visionService = new VisionService();
    this.templateFreeService = new TemplateFreeExtractionService();
    this.websocketService = websocketService || null;
  }

  async processDocument(documentId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      await storage.updateDocumentStatus(documentId, 'processing', 10, 'Starting document processing...');
      this.sendWebSocketUpdate(documentId, 'processing', 10, 'Starting multi-AI document analysis', 'initialization');

      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Stage 1: Text Extraction (OCR temporarily simplified)
      await storage.updateDocumentStatus(documentId, 'processing', 20, 'Extracting text from document...');
      this.sendWebSocketUpdate(documentId, 'processing', 20, 'Running text extraction', 'ocr');
      const extractedText = await this.extractText(document.filePath, document.mimeType);
      
      // Stage 2: Multi-AI Analysis (OpenAI + Gemini + Anthropic)
      await storage.updateDocumentStatus(documentId, 'processing', 40, 'Analyzing with multiple AI models...');
      this.sendWebSocketUpdate(documentId, 'processing', 40, 'Running OpenAI, Gemini, and Anthropic analysis', 'ai_analysis');
      
      // Get OCR results and pass them to avoid double processing
      const ocrResults = await this.getOCRResults(document.filePath, document.mimeType, extractedText);
      
      const multiAIResult = await this.multiAIService.analyzeDocument(
        extractedText, 
        document.industry, 
        undefined, // Don't pass filePath to prevent double OCR
        undefined, // Don't pass mimeType to prevent double OCR
        ocrResults // Pass pre-computed OCR results
      );
      
      // Stage 3: Template-Free Processing (NEW FEATURE)
      await storage.updateDocumentStatus(documentId, 'processing', 60, 'Running template-free analysis...');
      this.sendWebSocketUpdate(documentId, 'processing', 60, 'Analyzing document without templates using GenAI', 'template_free');
      
      let templateFreeResults = null;
      try {
        templateFreeResults = await this.templateFreeService.processDocumentWithoutTemplates(
          document.filePath,
          extractedText,
          document.mimeType,
          document.userId
        );
        
        if (templateFreeResults && templateFreeResults.extractedFindings) {
          console.log(`✅ Template-free processing discovered ${templateFreeResults.extractedFindings.length} entities with ${templateFreeResults.adaptiveConfidence}% confidence`);
        } else {
          console.warn('⚠️ Template-free processing returned empty results');
        }
      } catch (error) {
        console.warn('⚠️ Template-free processing failed, continuing with standard processing:', error instanceof Error ? error.message : error);
        // Send WebSocket update about template-free processing failure
        this.sendWebSocketUpdate(documentId, 'processing', 65, 'Template-free analysis failed, using standard processing', 'template_free_error');
      }

      // Stage 4: Enhanced Entity Extraction
      await storage.updateDocumentStatus(documentId, 'processing', 75, 'Extracting enhanced entities...');
      this.sendWebSocketUpdate(documentId, 'processing', 75, 'Extracting industry-specific entities', 'entity_extraction');
      const entities = this.combineEntities(multiAIResult, templateFreeResults);
      
      // Stage 4: Consensus Analysis
      await storage.updateDocumentStatus(documentId, 'processing', 85, 'Generating consensus analysis...');
      this.sendWebSocketUpdate(documentId, 'processing', 85, 'Creating consensus from multiple AI models', 'consensus');
      
      // Stage 5: Save Enhanced Results
      await storage.updateDocumentStatus(documentId, 'processing', 95, 'Saving comprehensive analysis...');
      this.sendWebSocketUpdate(documentId, 'processing', 95, 'Saving multi-AI analysis results', 'saving');
      
      const processingResult: ProcessingResult = {
        extractedText: multiAIResult.ocrResults.text,
        extractedData: {
          multiAI: multiAIResult,
          templateFree: templateFreeResults,
          recommendedModel: multiAIResult.consensus.recommendedModel,
          processingTime: Date.now() - startTime,
          hasTemplateFreeAnalysis: !!templateFreeResults
        },
        ocrConfidence: multiAIResult.ocrResults.confidence,
        aiConfidence: multiAIResult.consensus.confidence,
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

      const totalTime = Date.now() - startTime;
      await storage.updateDocumentStatus(documentId, 'completed', 100, 'Multi-AI processing completed successfully');
      
      // Send completion update with full results
      this.sendWebSocketUpdate(
        documentId, 
        'completed', 
        100, 
        `Document processed in ${totalTime}ms using ${multiAIResult.consensus.recommendedModel}`, 
        'completed',
        multiAIResult.consensus.recommendedModel,
        totalTime
      );

      // Send document complete notification with analysis
      if (this.websocketService) {
        this.websocketService.sendDocumentComplete(document.userId, String(documentId), multiAIResult);
      }

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      const errorMessage = `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      await storage.updateDocumentStatus(documentId, 'error', 0, errorMessage);
      this.sendWebSocketUpdate(documentId, 'failed', 0, errorMessage, 'error');
      
      throw error;
    }
  }

  private sendWebSocketUpdate(
    documentId: number, 
    status: 'queued' | 'processing' | 'completed' | 'failed', 
    progress: number, 
    message: string, 
    stage?: string,
    aiModel?: string,
    processingTime?: number
  ) {
    if (this.websocketService) {
      // Get userId from document - we'll need to modify this to pass userId
      const userId = String(documentId); // Simplified for now
      this.websocketService.sendProcessingUpdate(userId, {
        documentId: String(documentId),
        status,
        progress,
        message,
        stage,
        aiModel,
        processingTime
      });
    }
  }

  private combineEntities(multiAIResult: any, templateFreeResults?: any): Array<{type: string, value: string, confidence: number}> {
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
