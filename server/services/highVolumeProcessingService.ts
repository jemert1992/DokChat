import { storage } from '../storage';
import { SecurityService } from './securityService';
import { MultiLanguageService } from './multiLanguageService';
import { EntityExtractionService } from './entityExtraction';
import { IndustryConfigService } from './industryConfig';
import type { Document, ProcessingJob } from '@shared/schema';

export interface BatchProcessingRequest {
  documents: Array<{
    id: number;
    filePath: string;
    industry: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }>;
  processingOptions: {
    enablePHIDetection: boolean;
    enableMultiLanguage: boolean;
    enableEntityExtraction: boolean;
    enableCompliance: boolean;
    parallelProcessing: boolean;
    maxConcurrency: number;
  };
}

export interface ProcessingMetrics {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  avgProcessingTime: number;
  throughputPerMinute: number;
  memoryUsage: number;
  cpuUsage: number;
  queueDepth: number;
}

export interface AnalyticsData {
  industryBreakdown: Record<string, number>;
  documentTypeDistribution: Record<string, number>;
  processingTimeByIndustry: Record<string, number>;
  complianceMetrics: Record<string, number>;
  errorRates: Record<string, number>;
  languageDistribution: Record<string, number>;
  volumeTrends: Array<{
    date: string;
    volume: number;
    avgProcessingTime: number;
  }>;
}

export class HighVolumeProcessingService {
  private securityService: SecurityService;
  private multiLanguageService: MultiLanguageService;
  private entityExtractionService: EntityExtractionService;
  private industryConfigService: IndustryConfigService;
  
  private processingQueue: Array<{
    documentId: number;
    priority: number;
    startTime?: Date;
    retryCount: number;
  }> = [];
  
  private activeJobs = new Map<number, ProcessingJob>();
  private metrics: ProcessingMetrics = {
    totalDocuments: 0,
    processedDocuments: 0,
    failedDocuments: 0,
    avgProcessingTime: 0,
    throughputPerMinute: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    queueDepth: 0
  };

  constructor() {
    this.securityService = new SecurityService();
    this.multiLanguageService = new MultiLanguageService();
    this.entityExtractionService = new EntityExtractionService();
    this.industryConfigService = new IndustryConfigService();
  }

  async processBatch(request: BatchProcessingRequest): Promise<{
    batchId: string;
    estimatedCompletionTime: Date;
    queuePosition: number;
  }> {
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add documents to processing queue with priority
      const queueEntries = request.documents.map(doc => ({
        documentId: doc.id,
        priority: this.getPriorityScore(doc.priority),
        retryCount: 0
      }));

      // Sort by priority (higher score = higher priority)
      queueEntries.sort((a, b) => b.priority - a.priority);
      
      // Add to queue
      this.processingQueue.push(...queueEntries);
      this.metrics.queueDepth = this.processingQueue.length;

      // Start processing if not already running
      this.startProcessing(request.processingOptions);

      // Calculate estimated completion time
      const avgTimePerDoc = this.metrics.avgProcessingTime || 120; // 2 minutes default
      const queuePosition = this.processingQueue.length - queueEntries.length;
      const estimatedSeconds = (queuePosition + queueEntries.length) * avgTimePerDoc / 
        Math.max(request.processingOptions.maxConcurrency, 1);
      
      const estimatedCompletionTime = new Date(Date.now() + estimatedSeconds * 1000);

      return {
        batchId,
        estimatedCompletionTime,
        queuePosition
      };

    } catch (error) {
      console.error('Batch processing error:', error);
      throw new Error('Failed to queue batch for processing');
    }
  }

  async processDocumentParallel(
    document: Document, 
    options: BatchProcessingRequest['processingOptions']
  ): Promise<{
    success: boolean;
    processingTime: number;
    results: any;
    errors?: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let results: any = {};

    try {
      // Create processing job
      const job = await storage.createProcessingJob({
        documentId: document.id,
        jobType: 'high_volume_processing',
        status: 'running',
        progress: 0,
        startedAt: new Date()
      });

      this.activeJobs.set(document.id, job);

      // Get industry configuration
      const industryConfig = await this.industryConfigService.getIndustryConfig(document.industry || 'general');
      
      // Parallel processing tasks
      const processingTasks: Promise<any>[] = [];

      // 1. Multi-language processing (if enabled and supported)
      if (options.enableMultiLanguage && industryConfig.processingRules.multiLanguageSupport) {
        processingTasks.push(
          this.processMultiLanguage(document).catch(error => {
            errors.push(`Multi-language processing failed: ${error.message}`);
            return null;
          })
        );
      }

      // 2. Entity extraction
      if (options.enableEntityExtraction) {
        processingTasks.push(
          this.performEntityExtraction(document, industryConfig).catch(error => {
            errors.push(`Entity extraction failed: ${error.message}`);
            return null;
          })
        );
      }

      // 3. Compliance checking
      if (options.enableCompliance && industryConfig.processingRules.requiresCompliance) {
        processingTasks.push(
          this.performComplianceCheck(document, industryConfig).catch(error => {
            errors.push(`Compliance check failed: ${error.message}`);
            return null;
          })
        );
      }

      // 4. PHI detection (for medical industry)
      if (options.enablePHIDetection && document.industry === 'medical') {
        processingTasks.push(
          this.detectPHI(document).catch(error => {
            errors.push(`PHI detection failed: ${error.message}`);
            return null;
          })
        );
      }

      // Update progress
      await this.updateJobProgress(job.id, 25);

      // Execute all tasks in parallel
      const taskResults = await Promise.allSettled(processingTasks);
      
      // Compile results
      results = {
        multiLanguage: null,
        entities: null,
        compliance: null,
        phi: null
      };

      let resultIndex = 0;
      if (options.enableMultiLanguage && industryConfig.processingRules.multiLanguageSupport) {
        const result = taskResults[resultIndex];
        results.multiLanguage = result?.status === 'fulfilled' ? result.value : null;
        resultIndex++;
      }
      
      if (options.enableEntityExtraction) {
        const result = taskResults[resultIndex];
        results.entities = result?.status === 'fulfilled' ? result.value : null;
        resultIndex++;
      }
      
      if (options.enableCompliance && industryConfig.processingRules.requiresCompliance) {
        const result = taskResults[resultIndex];
        results.compliance = result?.status === 'fulfilled' ? result.value : null;
        resultIndex++;
      }
      
      if (options.enablePHIDetection && document.industry === 'medical') {
        const result = taskResults[resultIndex];
        results.phi = result?.status === 'fulfilled' ? result.value : null;
        resultIndex++;
      }

      // Update progress
      await this.updateJobProgress(job.id, 75);

      // Store results
      await this.storeProcessingResults(document, results, industryConfig);

      // Complete job
      await this.updateJobProgress(job.id, 100);
      await storage.updateProcessingJob(job.id, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      return {
        success: true,
        processingTime,
        results,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Document processing error:', error);
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Processing failed: ${errorMessage}`);

      return {
        success: false,
        processingTime,
        results: {},
        errors
      };
    } finally {
      this.activeJobs.delete(document.id);
    }
  }

  async getProcessingMetrics(): Promise<ProcessingMetrics> {
    // Update real-time metrics
    this.metrics.queueDepth = this.processingQueue.length;
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    return { ...this.metrics };
  }

  async getAnalytics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<AnalyticsData> {
    try {
      // Get documents for the specified time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      const documents = await storage.getDocuments(); // Get all documents for now
      
      // Calculate analytics
      const analytics: AnalyticsData = {
        industryBreakdown: {},
        documentTypeDistribution: {},
        processingTimeByIndustry: {},
        complianceMetrics: {},
        errorRates: {},
        languageDistribution: {},
        volumeTrends: []
      };

      // Industry breakdown
      documents.forEach((doc: any) => {
        const industry = doc.industry || 'general';
        analytics.industryBreakdown[industry] = (analytics.industryBreakdown[industry] || 0) + 1;
      });

      // Document type distribution
      documents.forEach((doc: any) => {
        const type = doc.documentType || 'unknown';
        analytics.documentTypeDistribution[type] = (analytics.documentTypeDistribution[type] || 0) + 1;
      });

      // Mock data for other metrics (in production, these would come from actual processing data)
      analytics.processingTimeByIndustry = {
        medical: 3.2,
        legal: 4.1,
        logistics: 2.8,
        finance: 3.5,
        general: 1.9
      };

      analytics.complianceMetrics = {
        medical: 99.2,
        legal: 98.7,
        logistics: 96.4,
        finance: 97.8,
        general: 95.1
      };

      analytics.errorRates = {
        medical: 0.8,
        legal: 1.3,
        logistics: 3.6,
        finance: 2.2,
        general: 4.9
      };

      analytics.languageDistribution = {
        english: 45,
        chinese: 23,
        spanish: 18,
        german: 8,
        french: 6
      };

      // Volume trends (mock data)
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        analytics.volumeTrends.push({
          date: date.toISOString().split('T')[0],
          volume: Math.floor(Math.random() * 100) + 50,
          avgProcessingTime: 2 + Math.random() * 2
        });
      }

      analytics.volumeTrends.reverse(); // Chronological order

      return analytics;

    } catch (error) {
      console.error('Analytics generation error:', error);
      throw new Error('Failed to generate analytics data');
    }
  }

  private async startProcessing(options: BatchProcessingRequest['processingOptions']): Promise<void> {
    const maxConcurrency = Math.min(options.maxConcurrency, 10); // Cap at 10 concurrent jobs
    
    // Process documents with controlled concurrency
    const processingPromises: Promise<void>[] = [];
    
    for (let i = 0; i < maxConcurrency && this.processingQueue.length > 0; i++) {
      processingPromises.push(this.processNextDocument(options));
    }
    
    // Don't await here - let processing run in background
    Promise.allSettled(processingPromises).then(() => {
      console.log('Batch processing completed');
    });
  }

  private async processNextDocument(options: BatchProcessingRequest['processingOptions']): Promise<void> {
    while (this.processingQueue.length > 0) {
      const queueEntry = this.processingQueue.shift();
      if (!queueEntry) continue;

      try {
        const document = await storage.getDocument(queueEntry.documentId);
        if (!document) continue;

        queueEntry.startTime = new Date();
        await this.processDocumentParallel(document, options);
        
        this.metrics.processedDocuments++;
        
      } catch (error) {
        console.error(`Failed to process document ${queueEntry.documentId}:`, error);
        
        // Retry logic
        if (queueEntry.retryCount < 3) {
          queueEntry.retryCount++;
          this.processingQueue.push(queueEntry);
        } else {
          this.metrics.failedDocuments++;
        }
      }
      
      this.metrics.queueDepth = this.processingQueue.length;
    }
  }

  private async processMultiLanguage(document: Document): Promise<any> {
    if (!document.extractedText) return null;
    
    const languageDetection = await this.multiLanguageService.detectLanguage(document.extractedText);
    
    let translation = null;
    if (languageDetection.iso639Code !== 'en') {
      translation = await this.multiLanguageService.translateText(document.extractedText, 'en');
    }
    
    return {
      detectedLanguage: languageDetection,
      translation
    };
  }

  private async performEntityExtraction(document: Document, industryConfig: any): Promise<any> {
    if (!document.extractedText) return null;
    
    const industry = document.industry || 'general';
    
    switch (industry) {
      case 'medical':
        return await this.entityExtractionService.extractMedicalEntities(document, document.extractedText);
      case 'legal':
        return await this.entityExtractionService.extractLegalEntities(document, document.extractedText);
      case 'logistics':
        return await this.entityExtractionService.extractLogisticsEntities(document, document.extractedText);
      default:
        // General entity extraction
        return await this.entityExtractionService.extractMedicalEntities(document, document.extractedText);
    }
  }

  private async performComplianceCheck(document: Document, industryConfig: any): Promise<any> {
    const industry = document.industry || 'general';
    
    // Industry-specific compliance checks
    const complianceResults = {
      compliant: true,
      violations: [] as string[],
      score: 100,
      checkedStandards: industryConfig.processingRules.complianceStandards
    };

    // Mock compliance checking - in production would implement actual checks
    if (industry === 'medical') {
      // HIPAA compliance check
      const phiResult = await this.securityService.detectPHI(document.extractedText || '', industry);
      if (phiResult.detected) {
        complianceResults.violations.push('Unprotected PHI detected');
        complianceResults.score -= 20;
      }
    } else if (industry === 'legal') {
      // Attorney-client privilege check
      if (document.extractedText?.toLowerCase().includes('privileged') && 
          !document.extractedText?.toLowerCase().includes('attorney-client')) {
        complianceResults.violations.push('Potential privilege issue');
        complianceResults.score -= 15;
      }
    }

    complianceResults.compliant = complianceResults.violations.length === 0;
    
    return complianceResults;
  }

  private async detectPHI(document: Document): Promise<any> {
    if (!document.extractedText) return null;
    
    return await this.securityService.detectPHI(document.extractedText, 'medical');
  }

  private async storeProcessingResults(document: Document, results: any, industryConfig: any): Promise<void> {
    // Store industry-specific results in appropriate tables
    if (results.entities && document.industry === 'medical') {
      for (const entity of results.entities) {
        await storage.createMedicalEntity({
          documentId: document.id,
          entityType: entity.entityType,
          entityValue: entity.entityValue,
          medicalCode: entity.medicalCode,
          confidenceScore: entity.confidenceScore,
          clinicalContext: entity.clinicalContext
        });
      }
    } else if (results.entities && document.industry === 'legal') {
      for (const entity of results.entities) {
        await storage.createLegalEntity({
          documentId: document.id,
          entityType: entity.entityType,
          entityValue: entity.entityValue,
          legalContext: entity.legalContext,
          jurisdiction: entity.jurisdiction,
          confidenceScore: entity.confidenceScore
        });
      }
    }

    // Store general analysis results
    await storage.createDocumentAnalysis({
      documentId: document.id,
      analysisType: 'high_volume_processing',
      analysisData: {
        summary: results.summary || 'High-volume processing completed',
        keyInsights: results.insights || [],
        processingTime: results.processingTime || 0,
        model: 'high_volume_processor'
      },
      confidenceScore: results.overallConfidence || 0.85
    });
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private updateMetrics(processingTime: number, success: boolean): void {
    this.metrics.totalDocuments++;
    
    if (success) {
      // Update average processing time
      const totalTime = this.metrics.avgProcessingTime * (this.metrics.processedDocuments - 1) + processingTime;
      this.metrics.avgProcessingTime = totalTime / this.metrics.processedDocuments;
      
      // Calculate throughput (documents per minute)
      this.metrics.throughputPerMinute = 60000 / this.metrics.avgProcessingTime;
    }
  }

  private async updateJobProgress(jobId: number, progress: number): Promise<void> {
    await storage.updateProcessingJob(jobId, { progress });
  }
}