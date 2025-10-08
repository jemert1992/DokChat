import { db } from "../db";
import { processingMetrics } from "@shared/schema";
import { processingReportService } from "./processingReportService";

export interface MetricData {
  documentId: number;
  pageNumber?: number;
  sectionName?: string;
  processingMethod: 'vision' | 'sonnet' | 'nlp' | 'ocr';
  confidence: number;
  textExtracted?: number;
  errors?: any[];
  unresolvedFields?: string[];
  processingTime?: number;
  metadata?: any;
}

export class MetricsTrackingService {
  /**
   * Track processing metric for a page or section
   */
  async trackMetric(data: MetricData): Promise<void> {
    try {
      await db.insert(processingMetrics).values({
        documentId: data.documentId,
        pageNumber: data.pageNumber,
        sectionName: data.sectionName,
        processingMethod: data.processingMethod,
        confidence: data.confidence,
        textExtracted: data.textExtracted,
        errors: data.errors as any,
        unresolvedFields: data.unresolvedFields as any,
        processingTime: data.processingTime,
        metadata: data.metadata as any,
      });

      console.log(
        `📊 Tracked metric: doc=${data.documentId}, page=${data.pageNumber}, method=${data.processingMethod}, confidence=${data.confidence.toFixed(2)}`
      );
    } catch (error) {
      console.error("Error tracking metric:", error);
    }
  }

  /**
   * Track batch of metrics for parallel processing
   */
  async trackBatchMetrics(metrics: MetricData[]): Promise<void> {
    try {
      const values = metrics.map((data) => ({
        documentId: data.documentId,
        pageNumber: data.pageNumber,
        sectionName: data.sectionName,
        processingMethod: data.processingMethod,
        confidence: data.confidence,
        textExtracted: data.textExtracted,
        errors: data.errors as any,
        unresolvedFields: data.unresolvedFields as any,
        processingTime: data.processingTime,
        metadata: data.metadata as any,
      }));

      await db.insert(processingMetrics).values(values);

      console.log(`📊 Tracked ${metrics.length} metrics in batch`);
    } catch (error) {
      console.error("Error tracking batch metrics:", error);
    }
  }

  /**
   * Generate final processing report after all metrics are tracked
   */
  async generateReport(documentId: number): Promise<void> {
    try {
      await processingReportService.generateProcessingReport(documentId);
      console.log(`📈 Generated processing report for document ${documentId}`);
    } catch (error) {
      console.error("Error generating processing report:", error);
    }
  }

  /**
   * Track OCR page processing with method auto-detection
   */
  async trackOCRPage(
    documentId: number,
    pageNumber: number,
    result: {
      text: string;
      confidence: number;
      method?: string;
      errors?: any[];
      processingTime?: number;
    }
  ): Promise<void> {
    const method = this.detectProcessingMethod(result.method);

    await this.trackMetric({
      documentId,
      pageNumber,
      processingMethod: method,
      confidence: result.confidence,
      textExtracted: result.text.length,
      errors: result.errors || [],
      processingTime: result.processingTime,
    });
  }

  /**
   * Track AI analysis with unresolved fields
   */
  async trackAIAnalysis(
    documentId: number,
    result: {
      confidence: number;
      method: string;
      unresolvedFields?: string[];
      errors?: any[];
      processingTime?: number;
      sectionName?: string;
    }
  ): Promise<void> {
    const method = this.detectProcessingMethod(result.method);

    await this.trackMetric({
      documentId,
      sectionName: result.sectionName,
      processingMethod: method,
      confidence: result.confidence,
      unresolvedFields: result.unresolvedFields || [],
      errors: result.errors || [],
      processingTime: result.processingTime,
    });
  }

  /**
   * Track batch processing efficiency metrics
   */
  async trackBatchProcessing(
    documentId: number,
    batchData: {
      strategy: string;
      apiCallsUsed: number;
      apiCallsSaved: number;
      pageCount: number;
      overallConfidence: number;
      selfEvaluationScore?: number;
      processingTime: number;
      adaptivePlan?: any;
      fallbacksTriggered?: number;
    }
  ): Promise<void> {
    try {
      await this.trackMetric({
        documentId,
        sectionName: 'batch_processing',
        processingMethod: 'sonnet',
        confidence: batchData.overallConfidence,
        processingTime: batchData.processingTime,
        metadata: {
          batchingStrategy: batchData.strategy,
          apiCallsUsed: batchData.apiCallsUsed,
          apiCallsSaved: batchData.apiCallsSaved,
          pageCount: batchData.pageCount,
          efficiency: `${Math.round((batchData.apiCallsSaved / (batchData.apiCallsUsed + batchData.apiCallsSaved)) * 100)}%`,
          selfEvaluationScore: batchData.selfEvaluationScore,
          adaptivePlan: batchData.adaptivePlan,
          fallbacksTriggered: batchData.fallbacksTriggered || 0,
        },
      });

      console.log(
        `🚀 Batch processing tracked: ${batchData.apiCallsUsed} calls (saved ${batchData.apiCallsSaved}), ${batchData.pageCount} pages`
      );
    } catch (error) {
      console.error("Error tracking batch processing:", error);
    }
  }

  /**
   * Detect processing method from various inputs
   */
  private detectProcessingMethod(method?: string): 'vision' | 'sonnet' | 'nlp' | 'ocr' {
    if (!method) return 'ocr';

    const m = method.toLowerCase();

    if (m.includes('vision') || m.includes('google')) return 'vision';
    if (m.includes('sonnet') || m.includes('claude') || m.includes('anthropic')) return 'sonnet';
    if (m.includes('nlp') || m.includes('entity')) return 'nlp';

    return 'ocr';
  }
}

export const metricsTrackingService = new MetricsTrackingService();
