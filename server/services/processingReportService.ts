import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { processingMetrics, processingReports } from "@shared/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PageMetric {
  pageNumber: number;
  confidence: number;
  method: string;
  errors: any[];
  unresolvedFields: string[];
}

interface MethodBreakdown {
  vision: { avgConfidence: number; pageCount: number };
  sonnet: { avgConfidence: number; pageCount: number };
  nlp: { avgConfidence: number; pageCount: number };
  ocr: { avgConfidence: number; pageCount: number };
}

export class ProcessingReportService {
  /**
   * Generate comprehensive processing report with AI-generated error summaries
   */
  async generateProcessingReport(documentId: number): Promise<void> {
    try {
      // 1. Fetch all processing metrics for this document
      const metrics = await db
        .select()
        .from(processingMetrics)
        .where(eq(processingMetrics.documentId, documentId));

      if (metrics.length === 0) {
        console.log(`⚠️ No processing metrics found for document ${documentId}`);
        return;
      }

      // 2. Calculate method breakdown
      const methodBreakdown = this.calculateMethodBreakdown(metrics);

      // 3. Aggregate page metrics
      const pageMetrics = this.aggregatePageMetrics(metrics);

      // 4. Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(metrics);

      // 5. Generate AI error summary
      const errorSummary = await this.generateAIErrorSummary(metrics);

      // 6. Generate unresolved fields summary
      const unresolvedFieldsSummary = await this.generateUnresolvedFieldsSummary(metrics);

      // 7. Generate AI recommendations
      const recommendations = await this.generateRecommendations(
        metrics,
        methodBreakdown,
        overallConfidence
      );

      // 8. Save the processing report
      await db.insert(processingReports).values({
        documentId,
        reportType: "comprehensive",
        overallConfidence,
        methodBreakdown: methodBreakdown as any,
        errorSummary,
        unresolvedFieldsSummary,
        recommendations: recommendations as any,
        pageMetrics: pageMetrics as any,
        sectionMetrics: null, // Can be extended later
      });

      console.log(`✅ Processing report generated for document ${documentId}`);
    } catch (error) {
      console.error(`❌ Error generating processing report:`, error);
      throw error;
    }
  }

  /**
   * Calculate method breakdown with average confidence per method
   */
  private calculateMethodBreakdown(metrics: any[]): MethodBreakdown {
    const breakdown: MethodBreakdown = {
      vision: { avgConfidence: 0, pageCount: 0 },
      sonnet: { avgConfidence: 0, pageCount: 0 },
      nlp: { avgConfidence: 0, pageCount: 0 },
      ocr: { avgConfidence: 0, pageCount: 0 },
    };

    const methodConfidences: Record<string, number[]> = {
      vision: [],
      sonnet: [],
      nlp: [],
      ocr: [],
    };

    metrics.forEach((metric) => {
      const method = metric.processingMethod.toLowerCase();
      if (methodConfidences[method]) {
        methodConfidences[method].push(metric.confidence);
      }
    });

    // Calculate averages
    Object.keys(methodConfidences).forEach((method) => {
      const confidences = methodConfidences[method];
      if (confidences.length > 0) {
        const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        breakdown[method as keyof MethodBreakdown] = {
          avgConfidence: Math.round(avg * 100) / 100,
          pageCount: confidences.length,
        };
      }
    });

    return breakdown;
  }

  /**
   * Aggregate page-level metrics
   */
  private aggregatePageMetrics(metrics: any[]): PageMetric[] {
    const pageMap = new Map<number, PageMetric>();

    metrics.forEach((metric) => {
      if (metric.pageNumber) {
        if (!pageMap.has(metric.pageNumber)) {
          pageMap.set(metric.pageNumber, {
            pageNumber: metric.pageNumber,
            confidence: metric.confidence,
            method: metric.processingMethod,
            errors: metric.errors || [],
            unresolvedFields: metric.unresolvedFields || [],
          });
        } else {
          const existing = pageMap.get(metric.pageNumber)!;
          // Update if this metric has higher confidence
          if (metric.confidence > existing.confidence) {
            existing.confidence = metric.confidence;
            existing.method = metric.processingMethod;
          }
          // Merge errors and unresolved fields
          existing.errors = [...existing.errors, ...(metric.errors || [])];
          existing.unresolvedFields = [
            ...existing.unresolvedFields,
            ...(metric.unresolvedFields || []),
          ];
        }
      }
    });

    return Array.from(pageMap.values()).sort((a, b) => a.pageNumber - b.pageNumber);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(metrics: any[]): number {
    const confidences = metrics.map((m) => m.confidence);
    const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return Math.round(avg * 100) / 100;
  }

  /**
   * Generate AI-powered error summary using Claude Sonnet 4.5
   */
  private async generateAIErrorSummary(metrics: any[]): Promise<string> {
    try {
      // Extract all errors
      const allErrors = metrics
        .filter((m) => m.errors && m.errors.length > 0)
        .flatMap((m) => ({
          page: m.pageNumber,
          method: m.processingMethod,
          errors: m.errors,
        }));

      if (allErrors.length === 0) {
        return "No errors detected during processing. All pages processed successfully.";
      }

      const errorContext = JSON.stringify(allErrors, null, 2);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: `You are an AI document processing analyst. Analyze the following errors from document processing and provide a concise, business-friendly summary.

Processing Errors:
${errorContext}

Provide:
1. A brief overview of the most critical errors (1-2 sentences)
2. Key patterns or recurring issues
3. Impact assessment (low/medium/high)
4. Specific page references where errors occurred

Keep your summary under 200 words and focus on actionable insights.`,
          },
        ],
      });

      return message.content[0].type === "text" ? message.content[0].text : "Unable to generate error summary.";
    } catch (error) {
      console.error("Error generating AI error summary:", error);
      return `Error summary generation failed. ${metrics.filter((m) => m.errors && m.errors.length > 0).length} pages had processing errors.`;
    }
  }

  /**
   * Generate AI-powered unresolved fields summary
   */
  private async generateUnresolvedFieldsSummary(metrics: any[]): Promise<string> {
    try {
      // Extract all unresolved fields
      const unresolvedFields = metrics
        .filter((m) => m.unresolvedFields && m.unresolvedFields.length > 0)
        .flatMap((m) => ({
          page: m.pageNumber,
          method: m.processingMethod,
          fields: m.unresolvedFields,
        }));

      if (unresolvedFields.length === 0) {
        return "All fields successfully extracted. No unresolved fields detected.";
      }

      const fieldsContext = JSON.stringify(unresolvedFields, null, 2);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: `You are an AI document processing analyst. Analyze the following unresolved fields from document processing and provide a concise summary.

Unresolved Fields:
${fieldsContext}

Provide:
1. Which fields are most commonly missing (top 3-5)
2. Possible reasons why these fields couldn't be extracted
3. Recommendations for improving extraction
4. Business impact of missing fields

Keep your summary under 200 words and focus on actionable insights.`,
          },
        ],
      });

      return message.content[0].type === "text" ? message.content[0].text : "Unable to generate unresolved fields summary.";
    } catch (error) {
      console.error("Error generating unresolved fields summary:", error);
      return `Unresolved fields summary generation failed. ${metrics.filter((m) => m.unresolvedFields && m.unresolvedFields.length > 0).length} pages had missing fields.`;
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    metrics: any[],
    methodBreakdown: MethodBreakdown,
    overallConfidence: number
  ): Promise<string[]> {
    try {
      const context = {
        totalPages: metrics.length,
        overallConfidence,
        methodBreakdown,
        errorRate: metrics.filter((m) => m.errors && m.errors.length > 0).length / metrics.length,
      };

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: `You are an AI document processing analyst. Based on the following processing metrics, provide 3-5 specific, actionable recommendations to improve document processing quality.

Processing Context:
${JSON.stringify(context, null, 2)}

Provide recommendations as a JSON array of strings. Each recommendation should be:
1. Specific and actionable
2. Based on the data provided
3. Focused on improving accuracy or reducing errors

Return ONLY a valid JSON array of strings, nothing else.`,
          },
        ],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "[]";
      
      // Try to parse as JSON
      try {
        const recommendations = JSON.parse(responseText);
        if (Array.isArray(recommendations)) {
          return recommendations;
        }
      } catch {
        // If parsing fails, extract recommendations from text
        const lines = responseText.split('\n').filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./));
        return lines.map(line => line.replace(/^[-\d.]\s*/, '').trim());
      }

      return [
        "Review pages with low confidence scores for manual verification",
        "Consider using higher-tier AI models for complex documents",
        "Implement pre-processing steps to improve OCR quality",
      ];
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [
        "Review processing metrics to identify patterns",
        "Consider document quality improvements for better extraction",
      ];
    }
  }
}

export const processingReportService = new ProcessingReportService();
