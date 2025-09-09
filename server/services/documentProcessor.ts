import { storage } from "../storage";
import { OpenAIService } from "./openaiService";
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
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  async processDocument(documentId: number): Promise<void> {
    try {
      await storage.updateDocumentStatus(documentId, 'processing', 10, 'Starting document processing...');

      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Stage 1: OCR Text Extraction
      await storage.updateDocumentStatus(documentId, 'processing', 30, 'Extracting text from document...');
      const extractedText = await this.extractText(document.filePath);
      
      // Stage 2: AI Analysis
      await storage.updateDocumentStatus(documentId, 'processing', 60, 'Analyzing document content with AI...');
      const analysisResult = await this.openaiService.analyzeDocument(extractedText, document.industry);
      
      // Stage 3: Entity Extraction
      await storage.updateDocumentStatus(documentId, 'processing', 80, 'Extracting entities and insights...');
      const entities = await this.extractEntities(extractedText, document.industry);
      
      // Stage 4: Save Results
      await storage.updateDocumentStatus(documentId, 'processing', 90, 'Saving analysis results...');
      
      const processingResult: ProcessingResult = {
        extractedText,
        extractedData: analysisResult,
        ocrConfidence: 0.95, // This would come from actual OCR
        aiConfidence: analysisResult.confidence || 0.9,
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
        analysisType: 'full_analysis',
        analysisData: analysisResult,
        confidenceScore: processingResult.aiConfidence,
      });

      await storage.updateDocumentStatus(documentId, 'completed', 100, 'Document processing completed successfully');

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      await storage.updateDocumentStatus(
        documentId, 
        'error', 
        0, 
        `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async extractText(filePath: string): Promise<string> {
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
