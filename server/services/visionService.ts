import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox: {
      vertices: Array<{ x: number; y: number }>;
    };
  }>;
  handwritingDetected: boolean;
  language: string;
}

export class VisionService {
  private client: ImageAnnotatorClient;

  constructor() {
    try {
      // Enhanced configuration for Google Cloud Vision
      this.client = new ImageAnnotatorClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        apiKey: process.env.GOOGLE_CLOUD_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize Google Vision client:', error);
      throw new Error('Google Vision API initialization failed');
    }
  }

  async extractTextFromImage(imagePath: string): Promise<OCRResult> {
    try {
      const [result] = await this.client.textDetection(imagePath);
      const detections = result.textAnnotations || [];
      
      if (detections.length === 0) {
        return {
          text: '',
          confidence: 0,
          blocks: [],
          handwritingDetected: false,
          language: 'en'
        };
      }

      // First annotation contains the entire text
      const fullText = detections[0];
      
      // Extract individual blocks (skip the first full text annotation)
      const blocks = detections.slice(1).map(detection => ({
        text: detection.description || '',
        confidence: detection.confidence || 0.9,
        boundingBox: {
          vertices: (detection.boundingPoly?.vertices || []).map(v => ({
            x: v.x || 0,
            y: v.y || 0
          }))
        }
      }));

      // Check for handwriting detection
      const [handwritingResult] = await this.client.documentTextDetection(imagePath);
      const handwritingDetected = this.detectHandwriting(handwritingResult);

      // Detect language
      const language = this.detectLanguage(fullText.description || '');

      return {
        text: fullText.description || '',
        confidence: this.calculateOverallConfidence(detections),
        blocks,
        handwritingDetected,
        language
      };

    } catch (error) {
      console.error('Error in Google Vision OCR:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextFromPDF(pdfPath: string): Promise<OCRResult> {
    try {
      // For PDFs, use document text detection which is better for document analysis
      const [result] = await this.client.documentTextDetection(pdfPath);
      
      if (!result.fullTextAnnotation) {
        return {
          text: '',
          confidence: 0,
          blocks: [],
          handwritingDetected: false,
          language: 'en'
        };
      }

      const fullText = result.fullTextAnnotation.text || '';
      const pages = result.fullTextAnnotation.pages || [];
      
      // Extract blocks from all pages
      const blocks: OCRResult['blocks'] = [];
      let totalConfidence = 0;
      let blockCount = 0;

      pages.forEach(page => {
        page.blocks?.forEach(block => {
          const blockText = this.extractBlockText(block);
          if (blockText.trim()) {
            blocks.push({
              text: blockText,
              confidence: block.confidence || 0.9,
              boundingBox: {
                vertices: (block.boundingBox?.vertices || []).map(v => ({
                  x: v.x || 0,
                  y: v.y || 0
                }))
              }
            });
            totalConfidence += (block.confidence || 0.9);
            blockCount++;
          }
        });
      });

      const avgConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;
      const handwritingDetected = this.detectHandwritingFromPages(pages);
      const language = this.detectLanguage(fullText);

      return {
        text: fullText,
        confidence: avgConfidence,
        blocks,
        handwritingDetected,
        language
      };

    } catch (error) {
      console.error('Error in Google Vision PDF OCR:', error);
      throw new Error(`PDF OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractBlockText(block: any): string {
    let text = '';
    block.paragraphs?.forEach((paragraph: any) => {
      paragraph.words?.forEach((word: any) => {
        word.symbols?.forEach((symbol: any) => {
          text += symbol.text || '';
        });
        text += ' ';
      });
      text += '\n';
    });
    return text;
  }

  private calculateOverallConfidence(detections: any[]): number {
    if (detections.length === 0) return 0;
    
    const confidences = detections.map(d => d.confidence || 0.9);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private detectHandwriting(result: any): boolean {
    // Check if handwriting features are detected
    const pages = result.fullTextAnnotation?.pages || [];
    return pages.some((page: any) => 
      page.blocks?.some((block: any) => 
        block.paragraphs?.some((paragraph: any) =>
          paragraph.words?.some((word: any) =>
            word.property?.detectedLanguages?.some((lang: any) => 
              lang.confidence > 0.5 && word.confidence < 0.7
            )
          )
        )
      )
    );
  }

  private detectHandwritingFromPages(pages: any[]): boolean {
    return pages.some(page => 
      page.blocks?.some((block: any) => 
        (block.confidence || 1) < 0.8 // Lower confidence often indicates handwriting
      )
    );
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const hasLatin = /[a-zA-Z]/.test(text);
    const hasCyrillic = /[\u0400-\u04FF]/.test(text);
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasChinese) return 'zh';
    if (hasCyrillic) return 'ru';
    if (hasArabic) return 'ar';
    if (hasLatin) return 'en';
    
    return 'en'; // Default to English
  }
}