import { storage } from "../storage";
import { MultiAIService } from "./multiAIService";
import { WebSocketService } from "./websocketService";
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
  private websocketService: WebSocketService | null = null;

  constructor(websocketService?: WebSocketService) {
    this.multiAIService = new MultiAIService();
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
      
      const multiAIResult = await this.multiAIService.analyzeDocument(
        extractedText, 
        document.industry, 
        document.filePath,
        document.mimeType
      );
      
      // Stage 3: Enhanced Entity Extraction
      await storage.updateDocumentStatus(documentId, 'processing', 70, 'Extracting enhanced entities...');
      this.sendWebSocketUpdate(documentId, 'processing', 70, 'Extracting industry-specific entities', 'entity_extraction');
      const entities = this.combineEntities(multiAIResult);
      
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
          recommendedModel: multiAIResult.consensus.recommendedModel,
          processingTime: Date.now() - startTime
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

  private combineEntities(multiAIResult: any): Array<{type: string, value: string, confidence: number}> {
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
    
    return entities;
  }

  private async extractText(filePath: string, mimeType?: string): Promise<string> {
    try {
      // For demo purposes, we'll simulate OCR text extraction
      // In a real implementation, this would use Google Cloud Vision API or Tesseract
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      }
      
      // Simulate OCR for PDF and image files
      return `EXTRACTED TEXT FROM ${fileExtension.toUpperCase()} FILE

This is simulated OCR text extraction. In a production environment, 
this would integrate with Google Cloud Vision API or other OCR services
to extract actual text from PDF documents and images.

Sample extracted content:
- Document type: Medical Record
- Patient information detected
- Clinical data identified
- Timestamps and signatures found

The actual implementation would return the real extracted text from the document.`;
      
    } catch (error) {
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
