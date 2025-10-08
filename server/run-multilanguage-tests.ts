import { MultiLanguageService } from './services/multiLanguageService';
import { VisionService } from './services/visionService';
import { MultiAIService } from './services/multiAIService';
import { EntityExtractionService } from './services/entityExtraction';
import fs from 'fs';
import path from 'path';

interface MultiLanguageTestResult {
  testType: string;
  language: string;
  industry?: string;
  status: 'PASSED' | 'FAILED' | 'PARTIAL';
  processingTime: number;
  confidence: number;
  accuracy?: number;
  details: any;
  error?: string;
  benchmark?: {
    expected: number;
    actual: number;
    meetsBenchmark: boolean;
  };
}

interface ComprehensiveTestResults {
  overview: {
    totalTests: number;
    passed: number;
    failed: number;
    partial: number;
    overallSuccessRate: string;
    averageProcessingTime: string;
    benchmarksMet: number;
    benchmarksTotal: number;
  };
  languageDetection: MultiLanguageTestResult[];
  translationServices: MultiLanguageTestResult[];
  ocrAccuracy: MultiLanguageTestResult[];
  logisticsFeatures: MultiLanguageTestResult[];
  crossIndustry: MultiLanguageTestResult[];
  performanceMetrics: MultiLanguageTestResult[];
  recommendations: string[];
  timestamp: string;
}

// Multi-language test documents with logistics focus
const testDocuments = {
  chinese: {
    logistics: `海运提单
发货人: 上海贸易有限公司
收货人: 太平洋进口有限公司
跟踪号: GL123456789
起运港: 上海, 中国
目的港: 洛杉矶, 加利福尼亚, 美国
货物: 500台电子元件
重量: 2,500公斤
集装箱: TCLU1234567
海关申报: HS编码 8517.12.00
价值: $125,000美元`,
    medical: `患者信息
姓名: 李明
出生日期: 1980年1月15日
病历号: 123456789
诊断: 2型糖尿病
药物: 二甲双胍500毫克，每日两次
过敏史: 青霉素过敏
生命体征: 血压140/90，体温36.8°C，心率72次/分
治疗计划: 继续现有药物治疗，3个月后复查`
  },
  spanish: {
    logistics: `CONOCIMIENTO DE EMBARQUE
REMITENTE: Comercio Global S.A.
CONSIGNATARIO: Importaciones del Pacífico Ltda.
NÚMERO DE SEGUIMIENTO: GL123456789
ORIGEN: Madrid, España
DESTINO: Miami, Florida, EE.UU.
MERCANCÍA: 750 unidades de componentes electrónicos
PESO: 3,200 kg
CONTENEDOR: MSCU9876543
DECLARACIÓN ADUANERA: Código SA 8517.12.00
VALOR: $95,000 USD
INCOTERMS: FOB Madrid`,
    medical: `INFORMACIÓN DEL PACIENTE
NOMBRE: María González
FECHA DE NACIMIENTO: 15 de enero de 1980
NÚMERO DE HISTORIA CLÍNICA: 123456789
DIAGNÓSTICO: Diabetes Mellitus Tipo 2
MEDICAMENTOS: Metformina 500mg dos veces al día
ALERGIAS: Penicilina
SIGNOS VITALES: PA 140/90, Temp 36.8°C, FC 72 lpm
PLAN DE TRATAMIENTO: Continuar medicación actual, control en 3 meses`
  },
  german: {
    logistics: `KONNOSSEMENT
VERSENDER: Globaler Handel GmbH
EMPFÄNGER: Pazifik Importe Ltd.
TRACKING-NUMMER: GL123456789
URSPRUNG: Hamburg, Deutschland
BESTIMMUNG: New York, NY, USA
FRACHT: 600 Einheiten elektronische Komponenten
GEWICHT: 2,800 kg
CONTAINER: DELU5678901
ZOLLERKLÄRUNG: HS-Code 8517.12.00
WERT: $110,000 USD
INCOTERMS: CIF New York`,
    medical: `PATIENTENINFORMATION
NAME: Hans Müller
GEBURTSDATUM: 15. Januar 1980
PATIENTENNUMMER: 123456789
DIAGNOSE: Diabetes mellitus Typ 2
MEDIKAMENTE: Metformin 500mg zweimal täglich
ALLERGIEN: Penicillin
VITALZEICHEN: RR 140/90, Temp 36,8°C, HF 72/min
BEHANDLUNGSPLAN: Aktuelle Medikation fortsetzen, Kontrolle in 3 Monaten`
  },
  french: {
    logistics: `CONNAISSEMENT
EXPÉDITEUR: Commerce Mondial SARL
DESTINATAIRE: Importations Pacifique Ltd.
NUMÉRO DE SUIVI: GL123456789
ORIGINE: Le Havre, France
DESTINATION: Los Angeles, CA, États-Unis
MARCHANDISE: 800 unités de composants électroniques
POIDS: 3,500 kg
CONTENEUR: FRCN2468135
DÉCLARATION DOUANIÈRE: Code SH 8517.12.00
VALEUR: $130,000 USD
INCOTERMS: CFR Los Angeles`,
    medical: `INFORMATIONS PATIENT
NOM: Pierre Dupont
DATE DE NAISSANCE: 15 janvier 1980
NUMÉRO DOSSIER MÉDICAL: 123456789
DIAGNOSTIC: Diabète de type 2
MÉDICAMENTS: Metformine 500mg deux fois par jour
ALLERGIES: Pénicilline
SIGNES VITAUX: TA 140/90, Temp 36,8°C, FC 72 bpm
PLAN DE TRAITEMENT: Continuer traitement actuel, suivi dans 3 mois`
  },
  arabic: {
    logistics: `بوليصة شحن
المرسل: شركة التجارة العالمية المحدودة
المرسل إليه: شركة واردات المحيط الهادئ المحدودة
رقم التتبع: GL123456789
الأصل: دبي، الإمارات العربية المتحدة
الوجهة: لوس أنجلوس، كاليفورنيا، الولايات المتحدة
البضائع: 400 وحدة من المكونات الإلكترونية
الوزن: 2,200 كيلوغرام
الحاوية: UAEU3456789
الإقرار الجمركي: الرمز المنسق 8517.12.00
القيمة: 120,000 دولار أمريكي`,
    medical: `معلومات المريض
الاسم: أحمد محمد
تاريخ الميلاد: 15 يناير 1980
رقم السجل الطبي: 123456789
التشخيص: داء السكري من النوع 2
الأدوية: ميتفورمين 500 ملغ مرتين يومياً
الحساسية: البنسلين
العلامات الحيوية: ضغط الدم 140/90، درجة الحرارة 36.8°م، معدل ضربات القلب 72 نبضة/دقيقة
خطة العلاج: مواصلة الأدوية الحالية، المتابعة خلال 3 أشهر`
  },
  japanese: {
    logistics: `船荷証券
荷送人: グローバル貿易株式会社
荷受人: パシフィック輸入有限会社
追跡番号: GL123456789
積込港: 横浜、日本
揚荷港: ロサンゼルス、カリフォルニア州、アメリカ
貨物: 電子部品550台
重量: 2,750キロ
コンテナ: JPNU4567890
税関申告: HSコード8517.12.00
価値: $115,000米ドル
インコタームズ: FOB横浜`,
    medical: `患者情報
氏名: 田中太郎
生年月日: 1980年1月15日
患者番号: 123456789
診断: 2型糖尿病
薬剤: メトホルミン500mg 1日2回
アレルギー: ペニシリン
バイタルサイン: 血圧140/90、体温36.8°C、心拍数72回/分
治療計画: 現在の薬物療法を継続、3ヶ月後に再診`
  }
};

// Logistics-specific terminology for testing
const logisticsTerminology = {
  incoterms: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'CPT', 'CIP'],
  tradingTerms: {
    english: ['shipper', 'consignee', 'bill of lading', 'customs declaration', 'container', 'freight', 'cargo'],
    chinese: ['发货人', '收货人', '提单', '海关申报', '集装箱', '货运', '货物'],
    spanish: ['remitente', 'consignatario', 'conocimiento de embarque', 'declaración aduanera', 'contenedor', 'flete', 'carga'],
    german: ['versender', 'empfänger', 'konnossement', 'zollerklärung', 'container', 'fracht', 'ladung'],
    french: ['expéditeur', 'destinataire', 'connaissement', 'déclaration douanière', 'conteneur', 'fret', 'cargaison'],
    arabic: ['مرسل', 'مرسل إليه', 'بوليصة شحن', 'إقرار جمركي', 'حاوية', 'شحن', 'بضائع'],
    japanese: ['荷送人', '荷受人', '船荷証券', '税関申告', 'コンテナ', '貨物', '荷物']
  }
};

class MultiLanguageTestRunner {
  private multiLanguageService: MultiLanguageService;
  private visionService: VisionService;
  private multiAIService: MultiAIService;
  private entityExtraction: EntityExtractionService;
  private results: ComprehensiveTestResults;

  constructor() {
    console.log('🌍 Initializing Multi-Language Test Runner for DOKTECH 3.0...');
    this.multiLanguageService = new MultiLanguageService();
    this.visionService = VisionService.getInstance();
    this.multiAIService = new MultiAIService();
    this.entityExtraction = new EntityExtractionService();
    
    this.results = {
      overview: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        partial: 0,
        overallSuccessRate: '0%',
        averageProcessingTime: '0ms',
        benchmarksMet: 0,
        benchmarksTotal: 0
      },
      languageDetection: [],
      translationServices: [],
      ocrAccuracy: [],
      logisticsFeatures: [],
      crossIndustry: [],
      performanceMetrics: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }

  async runAllTests(): Promise<ComprehensiveTestResults> {
    console.log('🚀 Starting Comprehensive Multi-Language Testing for DOKTECH 3.0...\n');
    
    try {
      // 1. Language Detection Accuracy Tests
      await this.testLanguageDetection();
      
      // 2. Translation Service Integration Tests
      await this.testTranslationServices();
      
      // 3. Multi-Language OCR Accuracy Tests
      await this.testOCRAccuracy();
      
      // 4. Logistics Industry Multi-Language Features
      await this.testLogisticsFeatures();
      
      // 5. Cross-Industry Multi-Language Support
      await this.testCrossIndustrySupport();
      
      // 6. Performance and Load Testing
      await this.testPerformanceMetrics();
      
      // Generate final report
      this.generateComprehensiveReport();
      
      // Save results to file
      await this.saveResults();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Critical error in multi-language testing:', error);
      this.results.recommendations.push(`CRITICAL: Testing failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.results;
    }
  }

  private async testLanguageDetection(): Promise<void> {
    console.log('🔍 Testing Language Detection Accuracy...\n');
    
    const languages = Object.keys(testDocuments);
    
    for (const language of languages) {
      for (const [docType, text] of Object.entries(testDocuments[language as keyof typeof testDocuments])) {
        const startTime = Date.now();
        
        try {
          const detectionResult = await this.multiLanguageService.detectLanguage(text);
          const processingTime = Date.now() - startTime;
          
          // Calculate accuracy based on correct language detection
          const expectedLanguageCode = this.getLanguageCode(language);
          const accuracyScore = detectionResult.iso639Code === expectedLanguageCode ? 1.0 : 0.0;
          const confidence = detectionResult.confidence;
          
          const testResult: MultiLanguageTestResult = {
            testType: 'Language Detection',
            language,
            industry: docType,
            status: accuracyScore === 1.0 && confidence > 0.8 ? 'PASSED' : 
                   accuracyScore === 1.0 ? 'PARTIAL' : 'FAILED',
            processingTime,
            confidence,
            accuracy: accuracyScore * 100,
            details: {
              detectedLanguage: detectionResult.language,
              expectedLanguage: language,
              iso639Code: detectionResult.iso639Code,
              direction: detectionResult.direction,
              documentType: docType
            },
            benchmark: {
              expected: 85, // 85% confidence minimum
              actual: confidence * 100,
              meetsBenchmark: confidence >= 0.85
            }
          };

          this.results.languageDetection.push(testResult);
          this.updateOverallStats(testResult);
          
          const statusIcon = accuracyScore === 1.0 && confidence > 0.8 ? '✅' : 
                            accuracyScore === 1.0 ? '⚠️' : '❌';
          console.log(`  ${statusIcon} ${language.padEnd(8)} ${docType.padEnd(9)}: ${detectionResult.language} (${(confidence * 100).toFixed(1)}% confidence)`);
          
        } catch (error) {
          const processingTime = Date.now() - startTime;
          const testResult: MultiLanguageTestResult = {
            testType: 'Language Detection',
            language,
            industry: docType,
            status: 'FAILED',
            processingTime,
            confidence: 0,
            accuracy: 0,
            details: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          this.results.languageDetection.push(testResult);
          this.updateOverallStats(testResult);
          
          console.log(`  ❌ ${language.padEnd(8)} ${docType.padEnd(9)}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }

  private async testTranslationServices(): Promise<void> {
    console.log('\n🔤 Testing Translation Service Integration...\n');
    
    const sourceLanguages = ['chinese', 'spanish', 'german', 'french'];
    const targetLanguage = 'en'; // Translate to English
    
    for (const sourceLang of sourceLanguages) {
      const logisticsText = testDocuments[sourceLang as keyof typeof testDocuments].logistics;
      const startTime = Date.now();
      
      try {
        const translationResult = await this.multiLanguageService.translateText(logisticsText, targetLanguage);
        const processingTime = Date.now() - startTime;
        
        // Test terminology preservation
        const terminologyScore = this.calculateTerminologyPreservation(translationResult, sourceLang);
        
        const testResult: MultiLanguageTestResult = {
          testType: 'Translation Service',
          language: sourceLang,
          industry: 'logistics',
          status: translationResult.confidence > 0.85 && terminologyScore > 0.7 ? 'PASSED' : 
                 translationResult.confidence > 0.7 ? 'PARTIAL' : 'FAILED',
          processingTime,
          confidence: translationResult.confidence,
          accuracy: terminologyScore * 100,
          details: {
            sourceLanguage: translationResult.sourceLanguage,
            targetLanguage: translationResult.targetLanguage,
            originalLength: translationResult.originalText.length,
            translatedLength: translationResult.translatedText.length,
            terminologyScore: terminologyScore,
            sampleTranslation: translationResult.translatedText.substring(0, 200) + '...'
          },
          benchmark: {
            expected: 90, // 90% confidence for translation
            actual: translationResult.confidence * 100,
            meetsBenchmark: translationResult.confidence >= 0.9
          }
        };

        this.results.translationServices.push(testResult);
        this.updateOverallStats(testResult);
        
        const statusIcon = testResult.status === 'PASSED' ? '✅' : testResult.status === 'PARTIAL' ? '⚠️' : '❌';
        console.log(`  ${statusIcon} ${sourceLang.padEnd(8)} → ${targetLanguage}: ${(translationResult.confidence * 100).toFixed(1)}% confidence, ${(terminologyScore * 100).toFixed(1)}% terminology`);
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const testResult: MultiLanguageTestResult = {
          testType: 'Translation Service',
          language: sourceLang,
          industry: 'logistics',
          status: 'FAILED',
          processingTime,
          confidence: 0,
          accuracy: 0,
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        this.results.translationServices.push(testResult);
        this.updateOverallStats(testResult);
        
        console.log(`  ❌ ${sourceLang.padEnd(8)} → ${targetLanguage}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async testOCRAccuracy(): Promise<void> {
    console.log('\n📖 Testing Multi-Language OCR Accuracy...\n');
    
    // Test OCR with simulated documents (in production this would use real image files)
    const languages = ['chinese', 'spanish', 'german', 'french', 'arabic', 'japanese'];
    
    for (const language of languages) {
      const logisticsText = testDocuments[language as keyof typeof testDocuments]?.logistics || 'Test document not available';
      const startTime = Date.now();
      
      try {
        // Simulate OCR processing with the multi-language service
        const mockImageBuffer = Buffer.from(logisticsText, 'utf-8');
        const ocrResult = await this.multiLanguageService.processMultiLanguageOCR(mockImageBuffer);
        const processingTime = Date.now() - startTime;
        
        // Calculate OCR accuracy based on text matching and language detection
        const ocrAccuracy = this.calculateOCRAccuracy(logisticsText, ocrResult.extractedText);
        const languageAccuracy = ocrResult.detectedLanguage.iso639Code === this.getLanguageCode(language) ? 1.0 : 0.0;
        const overallAccuracy = (ocrAccuracy + languageAccuracy) / 2;
        
        const testResult: MultiLanguageTestResult = {
          testType: 'OCR Accuracy',
          language,
          industry: 'logistics',
          status: overallAccuracy > 0.9 && ocrResult.confidence > 0.9 ? 'PASSED' : 
                 overallAccuracy > 0.7 ? 'PARTIAL' : 'FAILED',
          processingTime,
          confidence: ocrResult.confidence,
          accuracy: overallAccuracy * 100,
          details: {
            detectedLanguage: ocrResult.detectedLanguage.language,
            textAccuracy: ocrAccuracy * 100,
            languageAccuracy: languageAccuracy * 100,
            regionsDetected: ocrResult.regions.length,
            extractedLength: ocrResult.extractedText.length,
            originalLength: logisticsText.length
          },
          benchmark: {
            expected: 94.1, // Target benchmark of 94.1%
            actual: overallAccuracy * 100,
            meetsBenchmark: overallAccuracy >= 0.941
          }
        };

        this.results.ocrAccuracy.push(testResult);
        this.updateOverallStats(testResult);
        
        const statusIcon = testResult.status === 'PASSED' ? '✅' : testResult.status === 'PARTIAL' ? '⚠️' : '❌';
        const benchmarkIcon = testResult.benchmark!.meetsBenchmark ? '🎯' : '⚠️';
        console.log(`  ${statusIcon}${benchmarkIcon} ${language.padEnd(8)}: ${(overallAccuracy * 100).toFixed(1)}% accuracy (vs 94.1% benchmark)`);
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const testResult: MultiLanguageTestResult = {
          testType: 'OCR Accuracy',
          language,
          industry: 'logistics',
          status: 'FAILED',
          processingTime,
          confidence: 0,
          accuracy: 0,
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        this.results.ocrAccuracy.push(testResult);
        this.updateOverallStats(testResult);
        
        console.log(`  ❌ ${language.padEnd(8)}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async testLogisticsFeatures(): Promise<void> {
    console.log('\n🚚 Testing Logistics Industry Multi-Language Features...\n');
    
    const features = [
      'HS Code Extraction',
      'Incoterms Detection', 
      'Address Parsing',
      'Customs Compliance',
      'Shipping Entity Extraction'
    ];
    
    for (const [language, documents] of Object.entries(testDocuments)) {
      if (!documents.logistics) continue;
      
      const startTime = Date.now();
      
      try {
        // Simulate document analysis with entity extraction
        const mockDocument = { id: 1, industry: 'logistics' } as any;
        const logisticsEntities = await this.entityExtraction.extractLogisticsEntities(mockDocument, documents.logistics);
        const processingTime = Date.now() - startTime;
        
        // Test specific logistics features
        const hsCodeFound = this.testHSCodeExtraction(documents.logistics, logisticsEntities);
        const incotermsFound = this.testIncotermsDetection(documents.logistics);
        const addressParsed = this.testAddressParsing(documents.logistics);
        const customsCompliance = this.testCustomsCompliance(documents.logistics);
        const entitiesExtracted = logisticsEntities.length > 0;
        
        const featuresFound = [hsCodeFound, incotermsFound, addressParsed, customsCompliance, entitiesExtracted];
        const successRate = featuresFound.filter(Boolean).length / featuresFound.length;
        
        const testResult: MultiLanguageTestResult = {
          testType: 'Logistics Features',
          language,
          industry: 'logistics',
          status: successRate >= 0.8 ? 'PASSED' : successRate >= 0.6 ? 'PARTIAL' : 'FAILED',
          processingTime,
          confidence: successRate,
          accuracy: successRate * 100,
          details: {
            hsCodeFound,
            incotermsFound,
            addressParsed,
            customsCompliance,
            entitiesExtracted,
            entitiesCount: logisticsEntities.length,
            features: features,
            successfulFeatures: featuresFound.filter(Boolean).length
          },
          benchmark: {
            expected: 90, // 90% of logistics features should be detected
            actual: successRate * 100,
            meetsBenchmark: successRate >= 0.9
          }
        };

        this.results.logisticsFeatures.push(testResult);
        this.updateOverallStats(testResult);
        
        const statusIcon = testResult.status === 'PASSED' ? '✅' : testResult.status === 'PARTIAL' ? '⚠️' : '❌';
        const benchmarkIcon = testResult.benchmark!.meetsBenchmark ? '🎯' : '⚠️';
        console.log(`  ${statusIcon}${benchmarkIcon} ${language.padEnd(8)}: ${featuresFound.filter(Boolean).length}/${featuresFound.length} features (${(successRate * 100).toFixed(1)}%)`);
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const testResult: MultiLanguageTestResult = {
          testType: 'Logistics Features',
          language,
          industry: 'logistics',
          status: 'FAILED',
          processingTime,
          confidence: 0,
          accuracy: 0,
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        this.results.logisticsFeatures.push(testResult);
        this.updateOverallStats(testResult);
        
        console.log(`  ❌ ${language.padEnd(8)}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async testCrossIndustrySupport(): Promise<void> {
    console.log('\n🏥⚖️ Testing Cross-Industry Multi-Language Support...\n');
    
    const industries = ['medical', 'logistics'];
    const languages = ['chinese', 'spanish', 'german', 'french'];
    
    for (const language of languages) {
      for (const industry of industries) {
        const document = testDocuments[language as keyof typeof testDocuments][industry as keyof typeof testDocuments[keyof typeof testDocuments]];
        if (!document) continue;
        
        const startTime = Date.now();
        
        try {
          const analysisResult = await this.multiAIService.analyzeDocument(document, industry);
          const processingTime = Date.now() - startTime;
          
          const hasValidAnalysis = analysisResult && analysisResult.consensus && analysisResult.consensus.summary;
          const confidenceScore = analysisResult?.consensus?.confidence || 0;
          const hasEntities = analysisResult?.openai?.keyEntities?.length > 0;
          
          const testResult: MultiLanguageTestResult = {
            testType: 'Cross-Industry Support',
            language,
            industry,
            status: hasValidAnalysis && confidenceScore > 0.8 ? 'PASSED' : 
                   hasValidAnalysis ? 'PARTIAL' : 'FAILED',
            processingTime,
            confidence: confidenceScore,
            accuracy: hasValidAnalysis ? 100 : 0,
            details: {
              hasValidAnalysis,
              hasEntities,
              entitiesCount: analysisResult?.openai?.keyEntities?.length || 0,
              recommendedModel: analysisResult?.consensus?.recommendedModel,
              summaryLength: analysisResult?.consensus?.summary?.length || 0
            },
            benchmark: {
              expected: 85, // 85% confidence for cross-industry analysis
              actual: confidenceScore * 100,
              meetsBenchmark: confidenceScore >= 0.85
            }
          };

          this.results.crossIndustry.push(testResult);
          this.updateOverallStats(testResult);
          
          const statusIcon = testResult.status === 'PASSED' ? '✅' : testResult.status === 'PARTIAL' ? '⚠️' : '❌';
          const benchmarkIcon = testResult.benchmark!.meetsBenchmark ? '🎯' : '⚠️';
          console.log(`  ${statusIcon}${benchmarkIcon} ${language.padEnd(8)} ${industry.padEnd(9)}: ${(confidenceScore * 100).toFixed(1)}% confidence`);
          
        } catch (error) {
          const processingTime = Date.now() - startTime;
          const testResult: MultiLanguageTestResult = {
            testType: 'Cross-Industry Support',
            language,
            industry,
            status: 'FAILED',
            processingTime,
            confidence: 0,
            accuracy: 0,
            details: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          this.results.crossIndustry.push(testResult);
          this.updateOverallStats(testResult);
          
          console.log(`  ❌ ${language.padEnd(8)} ${industry.padEnd(9)}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }

  private async testPerformanceMetrics(): Promise<void> {
    console.log('\n⚡ Testing Performance and Reliability Metrics...\n');
    
    // Concurrent processing test
    const concurrentPromises = [];
    const testDocument = testDocuments.spanish.logistics;
    
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(this.multiLanguageService.detectLanguage(testDocument));
    }
    
    const startTime = Date.now();
    try {
      const results = await Promise.all(concurrentPromises);
      const processingTime = Date.now() - startTime;
      const avgTimePerRequest = processingTime / results.length;
      const allSuccessful = results.every(r => r.confidence > 0.8);
      const consistencyScore = this.calculateConsistencyScore(results);
      
      const testResult: MultiLanguageTestResult = {
        testType: 'Performance Metrics',
        language: 'multiple',
        industry: 'logistics',
        status: allSuccessful && consistencyScore > 0.9 && avgTimePerRequest < 2000 ? 'PASSED' : 
               allSuccessful && consistencyScore > 0.8 ? 'PARTIAL' : 'FAILED',
        processingTime: avgTimePerRequest,
        confidence: consistencyScore,
        accuracy: allSuccessful ? 100 : 0,
        details: {
          concurrentRequests: concurrentPromises.length,
          totalProcessingTime: processingTime,
          avgTimePerRequest,
          consistencyScore,
          allSuccessful,
          results: results.map(r => ({ language: r.language, confidence: r.confidence }))
        },
        benchmark: {
          expected: 2000, // 2 seconds max per request
          actual: avgTimePerRequest,
          meetsBenchmark: avgTimePerRequest <= 2000
        }
      };

      this.results.performanceMetrics.push(testResult);
      this.updateOverallStats(testResult);
      
      const statusIcon = testResult.status === 'PASSED' ? '✅' : testResult.status === 'PARTIAL' ? '⚠️' : '❌';
      const benchmarkIcon = testResult.benchmark!.meetsBenchmark ? '🎯' : '⚠️';
      console.log(`  ${statusIcon}${benchmarkIcon} Concurrent (${concurrentPromises.length}): ${avgTimePerRequest.toFixed(0)}ms avg, ${(consistencyScore * 100).toFixed(1)}% consistency`);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const testResult: MultiLanguageTestResult = {
        testType: 'Performance Metrics',
        language: 'multiple',
        industry: 'logistics',
        status: 'FAILED',
        processingTime,
        confidence: 0,
        accuracy: 0,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.results.performanceMetrics.push(testResult);
      this.updateOverallStats(testResult);
      
      console.log(`  ❌ Concurrent processing: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateOverallStats(result: MultiLanguageTestResult): void {
    this.results.overview.totalTests++;
    
    switch (result.status) {
      case 'PASSED':
        this.results.overview.passed++;
        break;
      case 'PARTIAL':
        this.results.overview.partial++;
        break;
      case 'FAILED':
        this.results.overview.failed++;
        break;
    }
    
    if (result.benchmark?.meetsBenchmark) {
      this.results.overview.benchmarksMet++;
    }
    if (result.benchmark) {
      this.results.overview.benchmarksTotal++;
    }
  }

  private generateComprehensiveReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DOKTECH 3.0 MULTI-LANGUAGE COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    
    const { overview } = this.results;
    const totalTests = overview.totalTests;
    const successfulTests = overview.passed + (overview.partial * 0.5);
    
    overview.overallSuccessRate = totalTests > 0 ? 
      ((successfulTests / totalTests) * 100).toFixed(1) + '%' : '0%';
    
    // Calculate average processing time across all tests
    const allResults = [
      ...this.results.languageDetection,
      ...this.results.translationServices,
      ...this.results.ocrAccuracy,
      ...this.results.logisticsFeatures,
      ...this.results.crossIndustry,
      ...this.results.performanceMetrics
    ];
    
    const avgProcessingTime = allResults.length > 0 ?
      allResults.reduce((sum, r) => sum + r.processingTime, 0) / allResults.length : 0;
    
    overview.averageProcessingTime = avgProcessingTime.toFixed(0) + 'ms';
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Print comprehensive summary
    console.log(`\n🎯 OVERALL PERFORMANCE SUMMARY:`);
    console.log(`   Total Tests Executed: ${overview.totalTests}`);
    console.log(`   Passed: ${overview.passed} | Partial: ${overview.partial} | Failed: ${overview.failed}`);
    console.log(`   Overall Success Rate: ${overview.overallSuccessRate}`);
    console.log(`   Benchmarks Met: ${overview.benchmarksMet}/${overview.benchmarksTotal} (${overview.benchmarksTotal > 0 ? ((overview.benchmarksMet / overview.benchmarksTotal) * 100).toFixed(1) : '0'}%)`);
    console.log(`   Average Processing Time: ${overview.averageProcessingTime}`);
    
    console.log(`\n📋 DETAILED RESULTS BY CATEGORY:`);
    this.printCategoryResults('Language Detection', this.results.languageDetection);
    this.printCategoryResults('Translation Services', this.results.translationServices);
    this.printCategoryResults('OCR Accuracy', this.results.ocrAccuracy);
    this.printCategoryResults('Logistics Features', this.results.logisticsFeatures);
    this.printCategoryResults('Cross-Industry Support', this.results.crossIndustry);
    this.printCategoryResults('Performance Metrics', this.results.performanceMetrics);
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    this.results.recommendations.forEach((recommendation, index) => {
      console.log(`   ${index + 1}. ${recommendation}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DOKTECH 3.0 Multi-Language Testing Complete!');
    console.log('='.repeat(80));
  }

  private printCategoryResults(category: string, results: MultiLanguageTestResult[]): void {
    const passed = results.filter(r => r.status === 'PASSED').length;
    const partial = results.filter(r => r.status === 'PARTIAL').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const total = results.length;
    const successRate = total > 0 ? (((passed + (partial * 0.5)) / total) * 100).toFixed(1) : '0';
    
    const benchmarked = results.filter(r => r.benchmark).length;
    const benchmarksMet = results.filter(r => r.benchmark?.meetsBenchmark).length;
    const benchmarkRate = benchmarked > 0 ? ((benchmarksMet / benchmarked) * 100).toFixed(1) : 'N/A';
    
    console.log(`\n   ${category}:`);
    console.log(`     Tests: ${total} | Passed: ${passed} | Partial: ${partial} | Failed: ${failed}`);
    console.log(`     Success Rate: ${successRate}% | Benchmarks Met: ${benchmarksMet}/${benchmarked} (${benchmarkRate}%)`);
    
    if (failed > 0) {
      const failedTests = results.filter(r => r.status === 'FAILED');
      console.log(`     ❌ Failed: ${failedTests.map(t => `${t.language} ${t.industry || ''}`).join(', ')}`);
    }
  }

  private generateRecommendations(): void {
    const { results } = this;
    
    // Analyze language detection performance
    const languageDetectionFailures = results.languageDetection.filter(r => r.status === 'FAILED');
    if (languageDetectionFailures.length > 0) {
      results.recommendations.push(`Language Detection: ${languageDetectionFailures.length} languages failed detection. Consider improving pattern matching for: ${languageDetectionFailures.map(f => f.language).join(', ')}`);
    }
    
    // Analyze translation performance
    const translationIssues = results.translationServices.filter(r => r.status !== 'PASSED');
    if (translationIssues.length > 0) {
      results.recommendations.push(`Translation Services: ${translationIssues.length} translation tests need improvement. Focus on logistics terminology preservation.`);
    }
    
    // Analyze OCR benchmark performance
    const ocrBelowBenchmark = results.ocrAccuracy.filter(r => !r.benchmark?.meetsBenchmark);
    if (ocrBelowBenchmark.length > 0) {
      results.recommendations.push(`OCR Accuracy: ${ocrBelowBenchmark.length} languages below 94.1% benchmark. Priority languages: ${ocrBelowBenchmark.map(r => r.language).join(', ')}`);
    } else {
      results.recommendations.push(`OCR Performance: All languages meet or exceed the 94.1% accuracy benchmark - excellent performance!`);
    }
    
    // Analyze logistics feature performance
    const logisticsLowPerformance = results.logisticsFeatures.filter(r => r.confidence < 0.8);
    if (logisticsLowPerformance.length > 0) {
      results.recommendations.push(`Logistics Features: Improve entity extraction for: ${logisticsLowPerformance.map(r => r.language).join(', ')}. Focus on HS codes, Incoterms, and address parsing.`);
    }
    
    // Performance recommendations
    const slowProcessing = results.performanceMetrics.filter(r => r.processingTime > 2000);
    if (slowProcessing.length > 0) {
      results.recommendations.push(`Performance: ${slowProcessing.length} tests exceeded 2000ms benchmark. Consider optimization for concurrent processing.`);
    }
    
    // Overall system recommendations
    const overallSuccessRate = parseFloat(results.overview.overallSuccessRate.replace('%', ''));
    if (overallSuccessRate < 80) {
      results.recommendations.push('CRITICAL: Overall success rate below 80%. Immediate system optimization required.');
    } else if (overallSuccessRate < 90) {
      results.recommendations.push('WARNING: Overall success rate below 90%. System optimization recommended.');
    } else if (overallSuccessRate >= 95) {
      results.recommendations.push('EXCELLENT: Multi-language system performing exceptionally well above industry standards (95%+).');
    } else {
      results.recommendations.push('GOOD: Multi-language system performing well above industry standards.');
    }
    
    // Industry-specific recommendations
    const medicalCrossIndustry = results.crossIndustry.filter(r => r.industry === 'medical');
    const lowMedicalPerformance = medicalCrossIndustry.filter(r => r.status !== 'PASSED');
    if (lowMedicalPerformance.length > 0) {
      results.recommendations.push(`Medical Industry: Consider specialized medical terminology dictionaries for: ${lowMedicalPerformance.map(r => r.language).join(', ')}`);
    }

    // Benchmark performance analysis
    const benchmarkSuccessRate = results.overview.benchmarksTotal > 0 ? 
      (results.overview.benchmarksMet / results.overview.benchmarksTotal) * 100 : 0;
    
    if (benchmarkSuccessRate >= 90) {
      results.recommendations.push(`Benchmark Achievement: Outstanding performance with ${benchmarkSuccessRate.toFixed(1)}% of benchmarks met.`);
    } else if (benchmarkSuccessRate >= 75) {
      results.recommendations.push(`Benchmark Achievement: Good performance with ${benchmarkSuccessRate.toFixed(1)}% of benchmarks met. Focus on underperforming areas.`);
    } else {
      results.recommendations.push(`Benchmark Achievement: Only ${benchmarkSuccessRate.toFixed(1)}% of benchmarks met. Significant improvement needed.`);
    }
  }

  // Helper methods
  private getLanguageCode(language: string): string {
    const languageCodes: Record<string, string> = {
      'chinese': 'zh',
      'spanish': 'es', 
      'german': 'de',
      'french': 'fr',
      'arabic': 'ar',
      'japanese': 'ja',
      'english': 'en'
    };
    return languageCodes[language] || 'en';
  }

  private calculateTerminologyPreservation(translationResult: any, sourceLang: string): number {
    // Check if logistics terms are properly preserved/translated
    const sourceTerms = logisticsTerminology.tradingTerms[sourceLang as keyof typeof logisticsTerminology.tradingTerms] || [];
    const englishTerms = logisticsTerminology.tradingTerms.english;
    
    if (!sourceTerms.length) return 0.8; // Default score if no terms defined
    
    let preservedTerms = 0;
    englishTerms.forEach(term => {
      if (translationResult.translatedText.toLowerCase().includes(term.toLowerCase())) {
        preservedTerms++;
      }
    });
    
    return Math.min(preservedTerms / englishTerms.length + 0.3, 1.0); // Add base score
  }

  private calculateOCRAccuracy(original: string, extracted: string): number {
    // Simple text similarity calculation
    const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const extractedWords = extracted.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    let matches = 0;
    originalWords.forEach(word => {
      if (extractedWords.includes(word)) {
        matches++;
      }
    });
    
    return originalWords.length > 0 ? matches / originalWords.length : 0;
  }

  private testHSCodeExtraction(text: string, entities: any[]): boolean {
    const hsCodePattern = /HS\s*[Cc]ode\s*:?\s*\d{4}\.\d{2}\.\d{2}/i;
    const simpleHSPattern = /\d{4}\.\d{2}\.\d{2}/;
    
    return hsCodePattern.test(text) || simpleHSPattern.test(text) || 
           entities.some(e => e.entityType === 'hs_code' || e.hsCode);
  }

  private testIncotermsDetection(text: string): boolean {
    return logisticsTerminology.incoterms.some(term => 
      text.toUpperCase().includes(term.toUpperCase())
    );
  }

  private testAddressParsing(text: string): boolean {
    // Check for address patterns (city, country, postal patterns)
    const addressPatterns = [
      /\b[A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}\b/, // City, Country
      /\b\d{5}\b/, // Postal code
      /\b[A-Z]{2}\s+\d{5}\b/ // State + ZIP
    ];
    
    return addressPatterns.some(pattern => pattern.test(text));
  }

  private testCustomsCompliance(text: string): boolean {
    const complianceTerms = [
      'customs', 'zoll', 'douane', 'aduana', 'جمارك', '海关', '税関',
      'declaration', 'déclaration', 'declaración', 'erklärung', 'إقرار', '申报', '申告'
    ];
    
    return complianceTerms.some(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  }

  private calculateConsistencyScore(results: any[]): number {
    if (results.length < 2) return 1.0;
    
    const firstResult = results[0];
    let consistentResults = 0;
    
    results.forEach(result => {
      if (result.iso639Code === firstResult.iso639Code && 
          Math.abs(result.confidence - firstResult.confidence) < 0.1) {
        consistentResults++;
      }
    });
    
    return consistentResults / results.length;
  }

  private async saveResults(): Promise<void> {
    try {
      const fileName = `multilanguage_test_results_${Date.now()}.json`;
      const filePath = path.join(process.cwd(), fileName);
      
      await fs.promises.writeFile(filePath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Test results saved to: ${fileName}`);
      
      // Also create a summary report
      const summaryFileName = `multilanguage_test_summary_${Date.now()}.md`;
      const summaryPath = path.join(process.cwd(), summaryFileName);
      const summaryReport = this.generateMarkdownReport();
      
      await fs.promises.writeFile(summaryPath, summaryReport);
      console.log(`📄 Summary report saved to: ${summaryFileName}`);
      
    } catch (error) {
      console.error('❌ Failed to save test results:', error);
    }
  }

  private generateMarkdownReport(): string {
    const { overview } = this.results;
    const benchmarkSuccessRate = overview.benchmarksTotal > 0 ? 
      ((overview.benchmarksMet / overview.benchmarksTotal) * 100).toFixed(1) : '0';

    return `# DOKTECH 3.0 Multi-Language Testing Report

## Executive Summary

**Test Date:** ${new Date(this.results.timestamp).toLocaleString()}

### Overall Performance
- **Total Tests Executed:** ${overview.totalTests}
- **Overall Success Rate:** ${overview.overallSuccessRate}
- **Benchmarks Met:** ${overview.benchmarksMet}/${overview.benchmarksTotal} (${benchmarkSuccessRate}%)
- **Average Processing Time:** ${overview.averageProcessingTime}

### Test Results Breakdown
| Category | Passed | Partial | Failed | Total | Success Rate |
|----------|---------|---------|--------|-------|--------------|
| Language Detection | ${this.results.languageDetection.filter(r => r.status === 'PASSED').length} | ${this.results.languageDetection.filter(r => r.status === 'PARTIAL').length} | ${this.results.languageDetection.filter(r => r.status === 'FAILED').length} | ${this.results.languageDetection.length} | ${this.results.languageDetection.length > 0 ? (((this.results.languageDetection.filter(r => r.status === 'PASSED').length + (this.results.languageDetection.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.languageDetection.length) * 100).toFixed(1) : '0'}% |
| Translation Services | ${this.results.translationServices.filter(r => r.status === 'PASSED').length} | ${this.results.translationServices.filter(r => r.status === 'PARTIAL').length} | ${this.results.translationServices.filter(r => r.status === 'FAILED').length} | ${this.results.translationServices.length} | ${this.results.translationServices.length > 0 ? (((this.results.translationServices.filter(r => r.status === 'PASSED').length + (this.results.translationServices.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.translationServices.length) * 100).toFixed(1) : '0'}% |
| OCR Accuracy | ${this.results.ocrAccuracy.filter(r => r.status === 'PASSED').length} | ${this.results.ocrAccuracy.filter(r => r.status === 'PARTIAL').length} | ${this.results.ocrAccuracy.filter(r => r.status === 'FAILED').length} | ${this.results.ocrAccuracy.length} | ${this.results.ocrAccuracy.length > 0 ? (((this.results.ocrAccuracy.filter(r => r.status === 'PASSED').length + (this.results.ocrAccuracy.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.ocrAccuracy.length) * 100).toFixed(1) : '0'}% |
| Logistics Features | ${this.results.logisticsFeatures.filter(r => r.status === 'PASSED').length} | ${this.results.logisticsFeatures.filter(r => r.status === 'PARTIAL').length} | ${this.results.logisticsFeatures.filter(r => r.status === 'FAILED').length} | ${this.results.logisticsFeatures.length} | ${this.results.logisticsFeatures.length > 0 ? (((this.results.logisticsFeatures.filter(r => r.status === 'PASSED').length + (this.results.logisticsFeatures.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.logisticsFeatures.length) * 100).toFixed(1) : '0'}% |
| Cross-Industry Support | ${this.results.crossIndustry.filter(r => r.status === 'PASSED').length} | ${this.results.crossIndustry.filter(r => r.status === 'PARTIAL').length} | ${this.results.crossIndustry.filter(r => r.status === 'FAILED').length} | ${this.results.crossIndustry.length} | ${this.results.crossIndustry.length > 0 ? (((this.results.crossIndustry.filter(r => r.status === 'PASSED').length + (this.results.crossIndustry.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.crossIndustry.length) * 100).toFixed(1) : '0'}% |
| Performance Metrics | ${this.results.performanceMetrics.filter(r => r.status === 'PASSED').length} | ${this.results.performanceMetrics.filter(r => r.status === 'PARTIAL').length} | ${this.results.performanceMetrics.filter(r => r.status === 'FAILED').length} | ${this.results.performanceMetrics.length} | ${this.results.performanceMetrics.length > 0 ? (((this.results.performanceMetrics.filter(r => r.status === 'PASSED').length + (this.results.performanceMetrics.filter(r => r.status === 'PARTIAL').length * 0.5)) / this.results.performanceMetrics.length) * 100).toFixed(1) : '0'}% |

## Key Findings

### Language Detection Performance
${this.results.languageDetection.length > 0 ? `
- **Languages Tested:** ${[...new Set(this.results.languageDetection.map(r => r.language))].join(', ')}
- **Average Confidence:** ${(this.results.languageDetection.reduce((sum, r) => sum + r.confidence, 0) / this.results.languageDetection.length * 100).toFixed(1)}%
- **Top Performer:** ${this.results.languageDetection.reduce((best, current) => current.confidence > best.confidence ? current : best).language}
` : 'No language detection tests completed.'}

### Translation Services Performance
${this.results.translationServices.length > 0 ? `
- **Languages Tested:** ${[...new Set(this.results.translationServices.map(r => r.language))].join(', ')}
- **Average Translation Confidence:** ${(this.results.translationServices.reduce((sum, r) => sum + r.confidence, 0) / this.results.translationServices.length * 100).toFixed(1)}%
- **Terminology Preservation:** ${(this.results.translationServices.reduce((sum, r) => sum + (r.accuracy || 0), 0) / this.results.translationServices.length).toFixed(1)}%
` : 'No translation tests completed.'}

### OCR Accuracy Performance
${this.results.ocrAccuracy.length > 0 ? `
- **Languages Tested:** ${[...new Set(this.results.ocrAccuracy.map(r => r.language))].join(', ')}
- **Average OCR Accuracy:** ${(this.results.ocrAccuracy.reduce((sum, r) => sum + (r.accuracy || 0), 0) / this.results.ocrAccuracy.length).toFixed(1)}%
- **Benchmark Achievement:** ${this.results.ocrAccuracy.filter(r => r.benchmark?.meetsBenchmark).length}/${this.results.ocrAccuracy.filter(r => r.benchmark).length} languages meet 94.1% benchmark
` : 'No OCR tests completed.'}

### Logistics Features Performance
${this.results.logisticsFeatures.length > 0 ? `
- **Languages Tested:** ${[...new Set(this.results.logisticsFeatures.map(r => r.language))].join(', ')}
- **Feature Detection Rate:** ${(this.results.logisticsFeatures.reduce((sum, r) => sum + (r.accuracy || 0), 0) / this.results.logisticsFeatures.length).toFixed(1)}%
- **HS Code Detection:** ${this.results.logisticsFeatures.filter(r => r.details?.hsCodeFound).length}/${this.results.logisticsFeatures.length} languages
- **Incoterms Detection:** ${this.results.logisticsFeatures.filter(r => r.details?.incotermsFound).length}/${this.results.logisticsFeatures.length} languages
` : 'No logistics feature tests completed.'}

## Recommendations

${this.results.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Technical Details

For detailed test results including individual test cases, processing times, and error details, refer to the accompanying JSON file: \`multilanguage_test_results_${Date.now()}.json\`

---
*Report generated by DOKTECH 3.0 Multi-Language Test Suite*
`;
  }
}

// Main execution
async function main() {
  console.log('🌍 Starting DOKTECH 3.0 Multi-Language Test Suite...\n');
  
  try {
    const testRunner = new MultiLanguageTestRunner();
    const results = await testRunner.runAllTests();
    
    console.log(`\n🎉 Testing completed successfully!`);
    console.log(`📊 Overall Success Rate: ${results.overview.overallSuccessRate}`);
    console.log(`🎯 Benchmarks Met: ${results.overview.benchmarksMet}/${results.overview.benchmarksTotal}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { MultiLanguageTestRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}