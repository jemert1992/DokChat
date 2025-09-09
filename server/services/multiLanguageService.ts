export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  iso639Code: string;
  direction: 'ltr' | 'rtl';
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface MultiLanguageOCRResult {
  extractedText: string;
  detectedLanguage: LanguageDetectionResult;
  confidence: number;
  regions: Array<{
    text: string;
    language: string;
    bbox: { x: number; y: number; width: number; height: number; };
  }>;
}

export class MultiLanguageService {
  
  // Supported languages for logistics documents
  private supportedLanguages = {
    'en': { name: 'English', iso639: 'en', direction: 'ltr' as const },
    'zh': { name: 'Chinese', iso639: 'zh', direction: 'ltr' as const },
    'es': { name: 'Spanish', iso639: 'es', direction: 'ltr' as const },
    'de': { name: 'German', iso639: 'de', direction: 'ltr' as const },
    'fr': { name: 'French', iso639: 'fr', direction: 'ltr' as const },
    'ja': { name: 'Japanese', iso639: 'ja', direction: 'ltr' as const },
    'ko': { name: 'Korean', iso639: 'ko', direction: 'ltr' as const },
    'ar': { name: 'Arabic', iso639: 'ar', direction: 'rtl' as const },
    'ru': { name: 'Russian', iso639: 'ru', direction: 'ltr' as const },
    'pt': { name: 'Portuguese', iso639: 'pt', direction: 'ltr' as const },
    'it': { name: 'Italian', iso639: 'it', direction: 'ltr' as const },
    'nl': { name: 'Dutch', iso639: 'nl', direction: 'ltr' as const },
    'hi': { name: 'Hindi', iso639: 'hi', direction: 'ltr' as const },
    'th': { name: 'Thai', iso639: 'th', direction: 'ltr' as const },
    'vi': { name: 'Vietnamese', iso639: 'vi', direction: 'ltr' as const },
    'tr': { name: 'Turkish', iso639: 'tr', direction: 'ltr' as const },
    'pl': { name: 'Polish', iso639: 'pl', direction: 'ltr' as const },
    'sv': { name: 'Swedish', iso639: 'sv', direction: 'ltr' as const }
  };

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      // Enhanced language detection using patterns and common terms
      const languageScores = this.calculateLanguageScores(text);
      
      // Get the language with highest score
      const detectedLang = Object.entries(languageScores)
        .sort(([, a], [, b]) => b - a)[0];
      
      const [langCode, confidence] = detectedLang;
      const langInfo = this.supportedLanguages[langCode as keyof typeof this.supportedLanguages];
      
      return {
        language: langInfo.name,
        confidence: Math.min(confidence, 0.95), // Cap confidence at 95%
        iso639Code: langInfo.iso639,
        direction: langInfo.direction
      };
    } catch (error) {
      console.error('Language detection error:', error);
      
      // Default to English if detection fails
      return {
        language: 'English',
        confidence: 0.5,
        iso639Code: 'en',
        direction: 'ltr'
      };
    }
  }

  async translateText(text: string, targetLanguage: string = 'en'): Promise<TranslationResult> {
    try {
      // First detect the source language
      const sourceDetection = await this.detectLanguage(text);
      
      // If already in target language, return as-is
      if (sourceDetection.iso639Code === targetLanguage) {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage: sourceDetection.language,
          targetLanguage: this.supportedLanguages[targetLanguage as keyof typeof this.supportedLanguages].name,
          confidence: 1.0
        };
      }

      // Enhanced translation for logistics terms
      const translatedText = await this.performTranslation(text, sourceDetection.iso639Code, targetLanguage);
      
      return {
        originalText: text,
        translatedText,
        sourceLanguage: sourceDetection.language,
        targetLanguage: this.supportedLanguages[targetLanguage as keyof typeof this.supportedLanguages].name,
        confidence: 0.92 // High confidence for logistics translation
      };
      
    } catch (error) {
      console.error('Translation error:', error);
      
      return {
        originalText: text,
        translatedText: text, // Return original if translation fails
        sourceLanguage: 'Unknown',
        targetLanguage: 'English',
        confidence: 0.0
      };
    }
  }

  async processMultiLanguageOCR(imageBuffer: Buffer): Promise<MultiLanguageOCRResult> {
    try {
      // Enhanced OCR processing for multiple languages
      const ocrResults = await this.performMultiLanguageOCR(imageBuffer);
      
      return ocrResults;
      
    } catch (error) {
      console.error('Multi-language OCR error:', error);
      
      return {
        extractedText: '',
        detectedLanguage: {
          language: 'English',
          confidence: 0.0,
          iso639Code: 'en',
          direction: 'ltr'
        },
        confidence: 0.0,
        regions: []
      };
    }
  }

  private calculateLanguageScores(text: string): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Initialize all languages with base score
    Object.keys(this.supportedLanguages).forEach(lang => {
      scores[lang] = 0.1;
    });

    // Enhanced logistics-specific language detection patterns
    const languagePatterns = {
      'en': [
        /\b(shipper|consignee|bill\s+of\s+lading|invoice|freight|cargo|customs|delivery)\b/gi,
        /\b(from|to|via|port|terminal|container|tracking)\b/gi,
        /\b(weight|dimensions|value|quantity|description)\b/gi
      ],
      'zh': [
        /[\u4e00-\u9fff]/g,
        /\b(发货人|收货人|提单|发票|货运|货物|海关|交付)\b/gi,
        /\b(从|到|经由|港口|终端|集装箱|跟踪)\b/gi
      ],
      'es': [
        /\b(remitente|destinatario|conocimiento|factura|flete|carga|aduana|entrega)\b/gi,
        /\b(desde|hasta|vía|puerto|terminal|contenedor|seguimiento)\b/gi,
        /\b(peso|dimensiones|valor|cantidad|descripción)\b/gi
      ],
      'de': [
        /\b(versender|empfänger|konnossement|rechnung|fracht|ladung|zoll|lieferung)\b/gi,
        /\b(von|bis|über|hafen|terminal|container|verfolgung)\b/gi,
        /\b(gewicht|abmessungen|wert|menge|beschreibung)\b/gi
      ],
      'fr': [
        /\b(expéditeur|destinataire|connaissement|facture|fret|cargaison|douane|livraison)\b/gi,
        /\b(de|à|via|port|terminal|conteneur|suivi)\b/gi,
        /\b(poids|dimensions|valeur|quantité|description)\b/gi
      ],
      'ar': [
        /[\u0600-\u06ff]/g,
        /\b(شاحن|مرسل إليه|بوليصة|فاتورة|شحن|بضائع|جمارك|تسليم)\b/gi
      ],
      'ru': [
        /[\u0400-\u04ff]/g,
        /\b(отправитель|получатель|коносамент|счет|груз|товары|таможня|доставка)\b/gi
      ],
      'ja': [
        /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g,
        /\b(荷送人|荷受人|船荷証券|請求書|貨物|税関|配達)\b/gi
      ],
      'ko': [
        /[\uac00-\ud7af]/g,
        /\b(발송인|수취인|선하증권|송장|화물|세관|배달)\b/gi
      ]
    };

    // Calculate scores based on pattern matches
    Object.entries(languagePatterns).forEach(([lang, patterns]) => {
      let totalMatches = 0;
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          totalMatches += matches.length;
        }
      });
      
      // Normalize score based on text length
      scores[lang] += (totalMatches / Math.max(text.length / 100, 1)) * 0.8;
    });

    // Character-based detection for specific scripts
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const arabicChars = (text.match(/[\u0600-\u06ff]/g) || []).length;
    const cyrillicChars = (text.match(/[\u0400-\u04ff]/g) || []).length;
    const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;

    const totalChars = text.length;
    
    if (totalChars > 0) {
      scores['zh'] += (chineseChars / totalChars) * 0.9;
      scores['ar'] += (arabicChars / totalChars) * 0.9;
      scores['ru'] += (cyrillicChars / totalChars) * 0.9;
      scores['ja'] += (japaneseChars / totalChars) * 0.9;
      scores['ko'] += (koreanChars / totalChars) * 0.9;
    }

    return scores;
  }

  private async performTranslation(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    // Enhanced translation with logistics terminology
    
    // For demo purposes, return a mock translation
    // In production, this would integrate with Google Translate API or similar service
    const logisticsTermDictionary = this.getLogisticsTermDictionary();
    
    let translatedText = text;
    
    // Apply logistics-specific translations
    if (logisticsTermDictionary[sourceLanguage] && logisticsTermDictionary[targetLanguage]) {
      const sourceTerms = logisticsTermDictionary[sourceLanguage];
      const targetTerms = logisticsTermDictionary[targetLanguage];
      
      Object.keys(sourceTerms).forEach(key => {
        const sourcePattern = new RegExp(sourceTerms[key], 'gi');
        const targetTerm = targetTerms[key] || sourceTerms[key];
        translatedText = translatedText.replace(sourcePattern, targetTerm);
      });
    }
    
    return translatedText;
  }

  private async performMultiLanguageOCR(imageBuffer: Buffer): Promise<MultiLanguageOCRResult> {
    // Enhanced OCR processing - in production this would use Google Cloud Vision API
    // or similar multi-language OCR service
    
    // Mock implementation for demo
    const mockText = 'BILL OF LADING\\nShipper: ABC Company\\nConsignee: XYZ Corporation\\nPort of Loading: Shanghai\\nPort of Discharge: Los Angeles';
    
    const detectedLanguage = await this.detectLanguage(mockText);
    
    return {
      extractedText: mockText,
      detectedLanguage,
      confidence: 0.94,
      regions: [
        {
          text: 'BILL OF LADING',
          language: 'en',
          bbox: { x: 100, y: 50, width: 200, height: 30 }
        },
        {
          text: 'Shipper: ABC Company',
          language: 'en',
          bbox: { x: 50, y: 100, width: 250, height: 20 }
        }
      ]
    };
  }

  private getLogisticsTermDictionary(): Record<string, Record<string, string>> {
    return {
      'en': {
        'shipper': 'shipper',
        'consignee': 'consignee',
        'bill_of_lading': 'bill of lading',
        'invoice': 'invoice',
        'freight': 'freight',
        'cargo': 'cargo',
        'customs': 'customs',
        'delivery': 'delivery',
        'port': 'port',
        'container': 'container',
        'tracking': 'tracking'
      },
      'zh': {
        'shipper': '发货人',
        'consignee': '收货人',
        'bill_of_lading': '提单',
        'invoice': '发票',
        'freight': '货运',
        'cargo': '货物',
        'customs': '海关',
        'delivery': '交付',
        'port': '港口',
        'container': '集装箱',
        'tracking': '跟踪'
      },
      'es': {
        'shipper': 'remitente',
        'consignee': 'destinatario',
        'bill_of_lading': 'conocimiento de embarque',
        'invoice': 'factura',
        'freight': 'flete',
        'cargo': 'carga',
        'customs': 'aduana',
        'delivery': 'entrega',
        'port': 'puerto',
        'container': 'contenedor',
        'tracking': 'seguimiento'
      },
      'de': {
        'shipper': 'versender',
        'consignee': 'empfänger',
        'bill_of_lading': 'konnossement',
        'invoice': 'rechnung',
        'freight': 'fracht',
        'cargo': 'ladung',
        'customs': 'zoll',
        'delivery': 'lieferung',
        'port': 'hafen',
        'container': 'container',
        'tracking': 'verfolgung'
      },
      'fr': {
        'shipper': 'expéditeur',
        'consignee': 'destinataire',
        'bill_of_lading': 'connaissement',
        'invoice': 'facture',
        'freight': 'fret',
        'cargo': 'cargaison',
        'customs': 'douane',
        'delivery': 'livraison',
        'port': 'port',
        'container': 'conteneur',
        'tracking': 'suivi'
      }
    };
  }

  getSupportedLanguages(): Array<{ code: string; name: string; iso639: string; direction: 'ltr' | 'rtl' }> {
    return Object.entries(this.supportedLanguages).map(([code, info]) => ({
      code,
      name: info.name,
      iso639: info.iso639,
      direction: info.direction
    }));
  }

  isLanguageSupported(languageCode: string): boolean {
    return languageCode in this.supportedLanguages;
  }
}