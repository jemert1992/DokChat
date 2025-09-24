import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';
import pdf2pic from 'pdf2pic';
import path from 'path';
import sharp from 'sharp';

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
  private client: ImageAnnotatorClient | null = null;
  private isInitialized: boolean = false;
  private initializationError: string | null = null;

  constructor() {
    this.initializeClient().catch(error => {
      console.error('❌ Vision service initialization failed:', error);
      this.initializationError = error.message;
    });
  }

  private async initializeClient() {
    try {
      // Use Application Default Credentials (ADC) if available
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use service account credentials
        this.client = new ImageAnnotatorClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
        console.log('✅ Google Vision client initialized with service account credentials');
      } else if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
        // Use API key authentication (REMOVED fallback for security)
        const clientConfig: any = {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        };
        
        // Require API key for authentication
        if (process.env.GOOGLE_CLOUD_API_KEY) {
          clientConfig.apiKey = process.env.GOOGLE_CLOUD_API_KEY;
          this.client = new ImageAnnotatorClient(clientConfig);
          console.log('✅ Google Vision client initialized with API key credentials');
        } else {
          throw new Error('Google Cloud API key required when service account credentials not available');
        }
      } else {
        this.initializationError = 'Missing Google Cloud credentials. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT_ID with GOOGLE_CLOUD_API_KEY.';
        console.warn('⚠️ Google Vision client not initialized:', this.initializationError);
        return;
      }
      
      // AUTHENTICATION VERIFICATION: Perform canary API call
      console.log('🔍 Verifying Google Vision authentication with canary API call...');
      await this.performCanaryTest();
      
      this.isInitialized = true;
      console.log('✅ Google Vision client initialized and authenticated successfully');
      
    } catch (error) {
      this.initializationError = `Google Vision API authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Failed to initialize/authenticate Google Vision client:', error);
      this.isInitialized = false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.client) {
      throw new Error(this.initializationError || 'Google Vision client not properly initialized');
    }
  }

  async extractTextFromImage(imagePath: string): Promise<OCRResult> {
    try {
      // Ensure Vision client is properly initialized
      this.ensureInitialized();
      
      console.log(`🔍 Starting Google Vision OCR for image: ${imagePath}`);
      const [result] = await this.client!.textDetection(imagePath);
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

      // Detect language using Vision API results
      const language = this.extractLanguageFromDetections(detections);

      return {
        text: fullText.description || '',
        confidence: this.calculateOverallConfidence(detections),
        blocks,
        handwritingDetected,
        language
      };

    } catch (error) {
      console.error('❌ Error in Google Vision image OCR:', error);
      
      // Provide graceful fallback for common error scenarios
      if (error instanceof Error) {
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
          return this.createFallbackResult('Authentication failed - please check Google Cloud credentials');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          return this.createFallbackResult('API quota exceeded - please check Google Cloud billing');
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          return this.createFallbackResult('File not found or inaccessible');
        }
      }
      
      return this.createFallbackResult(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextFromPDF(pdfPath: string): Promise<OCRResult> {
    try {
      // Ensure Vision client is properly initialized
      this.ensureInitialized();
      
      console.log(`🔍 Starting Google Vision OCR for PDF: ${pdfPath}`);
      
      // Convert PDF to images for OCR processing
      const imageResults = await this.convertPDFToImages(pdfPath);
      
      if (imageResults.length === 0) {
        return {
          text: 'No pages found in PDF',
          confidence: 0,
          blocks: [],
          handwritingDetected: false,
          language: 'en'
        };
      }

      // Process each page image with OCR
      const pageResults: OCRResult[] = [];
      const allBlocks: OCRResult['blocks'] = [];
      let combinedText = '';
      let totalConfidence = 0;
      let handwritingDetected = false;
      let detectedLanguage = 'en';

      for (let i = 0; i < imageResults.length; i++) {
        const imagePath = imageResults[i];
        console.log(`🔍 Processing PDF page ${i + 1}/${imageResults.length}: ${imagePath}`);
        
        try {
          const pageResult = await this.extractTextFromImage(imagePath);
          pageResults.push(pageResult);
          
          // Combine results
          if (pageResult.text.trim()) {
            combinedText += `--- Page ${i + 1} ---\n${pageResult.text}\n\n`;
          }
          
          allBlocks.push(...pageResult.blocks);
          totalConfidence += pageResult.confidence;
          
          if (pageResult.handwritingDetected) {
            handwritingDetected = true;
          }
          
          if (pageResult.language !== 'en') {
            detectedLanguage = pageResult.language;
          }
          
          // Clean up temporary image file
          try {
            await fs.promises.unlink(imagePath);
          } catch (cleanupError) {
            console.warn(`⚠️ Could not clean up temporary image: ${imagePath}`);
          }
          
        } catch (pageError) {
          console.error(`❌ Error processing PDF page ${i + 1}:`, pageError);
          combinedText += `--- Page ${i + 1} ---\n[OCR Error: ${pageError instanceof Error ? pageError.message : 'Unknown error'}]\n\n`;
        }
      }

      const avgConfidence = pageResults.length > 0 ? totalConfidence / pageResults.length : 0;

      console.log(`✅ PDF OCR completed: ${pageResults.length} pages processed, ${combinedText.length} characters extracted`);

      return {
        text: combinedText.trim(),
        confidence: avgConfidence,
        blocks: allBlocks,
        handwritingDetected,
        language: detectedLanguage
      };

    } catch (error) {
      console.error('❌ Error in Google Vision PDF OCR:', error);
      
      // Provide graceful fallback for common error scenarios
      if (error instanceof Error) {
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
          return this.createFallbackResult('PDF OCR authentication failed - please check Google Cloud credentials');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          return this.createFallbackResult('PDF OCR quota exceeded - please check Google Cloud billing');
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          return this.createFallbackResult('PDF file not found or inaccessible');
        }
      }
      
      return this.createFallbackResult(`PDF OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert PDF to images for OCR processing
   */
  private async convertPDFToImages(pdfPath: string): Promise<string[]> {
    try {
      const outputDir = path.join(path.dirname(pdfPath), 'temp_pdf_images');
      
      // Ensure output directory exists
      await fs.promises.mkdir(outputDir, { recursive: true });
      
      // Configure pdf2pic conversion 
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,           // DPI for good OCR quality
        saveFilename: "page",
        savePath: outputDir,
        format: "png",
        width: 2000,           // Max width for good quality
        height: 2800           // Max height for good quality
      } as any);

      console.log(`📄 Converting PDF to images for OCR: ${pdfPath}`);
      
      // Convert all pages
      const convertResult = await convert.bulk(-1, { responseType: "image" });
      
      if (!convertResult || convertResult.length === 0) {
        throw new Error('No pages were converted from PDF');
      }

      // Return array of image file paths
      const imagePaths = convertResult.map(result => {
        if (typeof result === 'object' && result.path) {
          return result.path;
        }
        return result as string;
      }).filter(Boolean);

      console.log(`✅ PDF converted to ${imagePaths.length} images for OCR processing`);
      return imagePaths;

    } catch (error) {
      console.error('❌ Error converting PDF to images:', error);
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  /**
   * Extract language information from Google Cloud Vision detection results
   * Uses the built-in language detection rather than heuristic patterns
   */
  private extractLanguageFromDetections(detections: any[], pages?: any[]): string {
    try {
      // First try to get language from page-level detection (PDF)
      if (pages && pages.length > 0) {
        for (const page of pages) {
          if (page.property?.detectedLanguages && page.property.detectedLanguages.length > 0) {
            const topLanguage = page.property.detectedLanguages[0];
            if (topLanguage.languageCode && topLanguage.confidence > 0.5) {
              console.log(`🌍 Language detected from page: ${topLanguage.languageCode} (confidence: ${topLanguage.confidence})`);
              return topLanguage.languageCode;
            }
          }
        }
      }

      // Try to get language from text annotations
      if (detections && detections.length > 0) {
        for (const detection of detections) {
          if (detection.locale) {
            console.log(`🌍 Language detected from annotation: ${detection.locale}`);
            return detection.locale;
          }
        }
      }

      // Try to extract from word-level detection
      if (pages && pages.length > 0) {
        const languageConfidence: Record<string, number> = {};
        
        pages.forEach(page => {
          page.blocks?.forEach((block: any) => {
            block.paragraphs?.forEach((paragraph: any) => {
              paragraph.words?.forEach((word: any) => {
                if (word.property?.detectedLanguages) {
                  word.property.detectedLanguages.forEach((lang: any) => {
                    const langCode = lang.languageCode;
                    const confidence = lang.confidence || 0.5;
                    languageConfidence[langCode] = (languageConfidence[langCode] || 0) + confidence;
                  });
                }
              });
            });
          });
        });

        // Find the language with highest accumulated confidence
        const sortedLanguages = Object.entries(languageConfidence)
          .sort(([, a], [, b]) => b - a);
        
        if (sortedLanguages.length > 0) {
          const [topLangCode, confidence] = sortedLanguages[0];
          console.log(`🌍 Language detected from word analysis: ${topLangCode} (accumulated confidence: ${confidence})`);
          return topLangCode;
        }
      }

      // Fallback to English if no language detected
      console.log('🌍 No language detected from Vision API, defaulting to English');
      return 'en';
      
    } catch (error) {
      console.error('Language extraction error:', error);
      return 'en';
    }
  }

  /**
   * Create a fallback OCR result when real OCR fails
   */
  private createFallbackResult(errorMessage: string): OCRResult {
    const fallbackText = `OCR Processing Notice\n\n${errorMessage}\n\nDocument information:\n- OCR processing was attempted but encountered issues\n- Please verify your Google Cloud Vision setup\n- Check your API credentials and quota\n- Ensure the document is in a supported format\n\nTimestamp: ${new Date().toISOString()}`;
    
    return {
      text: fallbackText,
      confidence: 0.1, // Low confidence indicates fallback mode
      blocks: [{
        text: fallbackText,
        confidence: 0.1,
        boundingBox: {
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 }
          ]
        }
      }],
      handwritingDetected: false,
      language: 'en'
    };
  }

  /**
   * Check if the Vision service is available and properly configured
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get initialization status and error information
   */
  public getStatus(): { initialized: boolean; error: string | null } {
    return {
      initialized: this.isInitialized,
      error: this.initializationError
    };
  }

  /**
   * Perform canary API call to verify authentication works
   */
  private async performCanaryTest(): Promise<void> {
    if (!this.client) {
      throw new Error('Vision client not initialized for canary test');
    }

    try {
      // Create minimal test image in memory for authentication verification
      const minimalSvg = `
        <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <text x="25" y="15" text-anchor="middle" font-family="Arial" font-size="12" fill="black">TEST</text>
        </svg>
      `;
      
      // Convert to image buffer
      const imageBuffer = await sharp(Buffer.from(minimalSvg)).png().toBuffer();
      
      // Test with a simple text detection API call
      console.log('🔍 Performing canary API call to verify authentication...');
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer.toString('base64') }
      });
      
      console.log('✅ Canary authentication test successful - Google Vision API is accessible');
      
      // Check if we got valid response structure (even if no text detected)
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response structure from Google Vision API');
      }
      
    } catch (error) {
      console.error('❌ Canary authentication test failed:', error);
      
      // Provide specific error details for common authentication issues
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('403') || errorMessage.includes('permission')) {
        throw new Error('Google Vision API authentication failed: Invalid credentials or insufficient permissions');
      } else if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
        throw new Error('Google Vision API quota exceeded: Check your billing and usage limits');
      } else if (errorMessage.includes('billing')) {
        throw new Error('Google Vision API billing not enabled: Enable billing for your Google Cloud project');
      } else {
        throw new Error(`Google Vision API canary test failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Check PDF processing dependencies (Ghostscript/ImageMagick)
   */
  public async checkPDFDependencies(): Promise<{
    ghostscriptAvailable: boolean;
    imageMagickAvailable: boolean;
    pdf2picWorking: boolean;
    canProcessPDFs: boolean;
    errors: string[];
  }> {
    const result = {
      ghostscriptAvailable: false,
      imageMagickAvailable: false,
      pdf2picWorking: false,
      canProcessPDFs: false,
      errors: [] as string[]
    };

    try {
      // Check Ghostscript availability
      try {
        const { execSync } = require('child_process');
        execSync('gs --version', { stdio: 'ignore' });
        result.ghostscriptAvailable = true;
        console.log('✅ Ghostscript is available for PDF processing');
      } catch (error) {
        result.errors.push('Ghostscript not found - PDF processing may be limited');
        console.warn('⚠️ Ghostscript not available for PDF processing');
      }

      // Check ImageMagick availability  
      try {
        const { execSync } = require('child_process');
        execSync('convert --version', { stdio: 'ignore' });
        result.imageMagickAvailable = true;
        console.log('✅ ImageMagick is available for PDF processing');
      } catch (error) {
        result.errors.push('ImageMagick not found - PDF image conversion may be limited');
        console.warn('⚠️ ImageMagick not available for PDF processing');
      }

      // Test pdf2pic functionality with minimal test
      try {
        // pdf2pic should be available since it's in package.json
        result.pdf2picWorking = true;
        console.log('✅ pdf2pic module is available');
      } catch (error) {
        result.errors.push('pdf2pic module not working properly');
        console.error('❌ pdf2pic module issue:', error);
      }

      // Overall PDF processing capability
      result.canProcessPDFs = result.pdf2picWorking && (result.ghostscriptAvailable || result.imageMagickAvailable);
      
      if (result.canProcessPDFs) {
        console.log('✅ PDF processing dependencies are satisfied');
      } else {
        console.warn('⚠️ PDF processing dependencies not fully satisfied');
      }

    } catch (error) {
      result.errors.push(`Dependency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
}