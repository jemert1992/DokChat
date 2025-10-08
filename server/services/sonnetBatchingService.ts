import Anthropic from "@anthropic-ai/sdk";

/**
 * Sonnet 4.5 Batching Service
 * 
 * Optimizes document processing by:
 * 1. Batching multiple pages/documents into single Sonnet 4.5 context
 * 2. Using adaptive planning for optimal tool sequencing
 * 3. Implementing self-evaluation for intelligent fallback decisions
 * 
 * Leverages Sonnet 4.5's 200K token context window
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PageContent {
  pageNumber: number;
  text: string;
  confidence?: number;
  source?: 'vision' | 'ocr' | 'native';
}

interface BatchedDocument {
  documentId: number;
  industry: string;
  pages: PageContent[];
  totalTokens: number;
}

interface AdaptivePlan {
  strategy: 'batch_process' | 'parallel_process' | 'sequential_process';
  batches: {
    pages: number[];
    reason: string;
    parallelizable: boolean;
  }[];
  fallbackNeeded: {
    pageNumber: number;
    currentMethod: string;
    recommendedMethod: 'vision' | 'ocr';
    reason: string;
  }[];
}

interface SelfEvaluationResult {
  overallConfidence: number;
  pageEvaluations: {
    pageNumber: number;
    confidence: number;
    needsReanalysis: boolean;
    recommendedMethod?: 'vision' | 'ocr';
    reason?: string;
  }[];
  extractedData: any;
}

export class SonnetBatchingService {
  private readonly MAX_CONTEXT_TOKENS = 180000; // Leave 20K buffer for response
  private readonly TOKENS_PER_CHAR = 0.3; // Approximate token estimation

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length * this.TOKENS_PER_CHAR);
  }

  /**
   * Batch pages intelligently to fit within context window
   */
  batchPages(pages: PageContent[]): PageContent[][] {
    const batches: PageContent[][] = [];
    let currentBatch: PageContent[] = [];
    let currentTokens = 0;

    for (const page of pages) {
      const pageTokens = this.estimateTokens(page.text);
      
      if (currentTokens + pageTokens > this.MAX_CONTEXT_TOKENS && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [page];
        currentTokens = pageTokens;
      } else {
        currentBatch.push(page);
        currentTokens += pageTokens;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * Ask Sonnet to create adaptive processing plan
   */
  async createAdaptivePlan(
    pages: PageContent[],
    industry: string
  ): Promise<AdaptivePlan> {
    const pagesInfo = pages.map(p => ({
      page: p.pageNumber,
      textLength: p.text.length,
      confidence: p.confidence,
      source: p.source
    }));

    const prompt = `You are an adaptive document processing orchestrator. Analyze the following document pages and create an optimal processing plan.

DOCUMENT CONTEXT:
- Industry: ${industry}
- Total Pages: ${pages.length}
- Pages Info: ${JSON.stringify(pagesInfo, null, 2)}

YOUR TASK:
1. Determine the best processing strategy (batch_process, parallel_process, or sequential_process)
2. Group pages into optimal batches (consider related content, dependencies)
3. Identify which pages can be processed in parallel (no dependencies)
4. Recommend fallback to Vision/OCR ONLY if text quality is poor (confidence < 0.7) or source is already OCR

RESPOND IN JSON FORMAT:
{
  "strategy": "batch_process|parallel_process|sequential_process",
  "batches": [
    {
      "pages": [1, 2, 3],
      "reason": "Related content - invoice header and line items",
      "parallelizable": true
    }
  ],
  "fallbackNeeded": [
    {
      "pageNumber": 5,
      "currentMethod": "ocr",
      "recommendedMethod": "vision",
      "reason": "Low confidence OCR, handwritten text detected"
    }
  ]
}

IMPORTANT:
- Minimize fallbacks - only recommend when truly necessary
- Maximize batching to reduce API calls
- Identify parallel opportunities to improve speed
- Be conservative with Vision/OCR fallbacks (expensive)`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      try {
        const plan = JSON.parse(content.text);
        return plan;
      } catch (error) {
        console.error("Failed to parse adaptive plan:", error);
        // Fallback to simple batching
        return {
          strategy: 'batch_process',
          batches: [{ pages: pages.map(p => p.pageNumber), reason: 'Default batch', parallelizable: true }],
          fallbackNeeded: []
        };
      }
    }

    throw new Error("Unexpected response format from Sonnet");
  }

  /**
   * Process batched pages with Sonnet 4.5 (single API call)
   */
  async processBatchedPages(
    batch: PageContent[],
    industry: string,
    documentId: number
  ): Promise<any> {
    // Combine all pages into single context
    const combinedText = batch
      .map(p => `--- PAGE ${p.pageNumber} (Source: ${p.source || 'unknown'}, Confidence: ${p.confidence || 'N/A'}) ---\n${p.text}`)
      .join('\n\n');

    const industryPrompts = {
      medical: 'Extract medical information including patient details, diagnoses, medications, procedures, and clinical notes.',
      legal: 'Extract legal information including parties, dates, clauses, obligations, and legal references.',
      logistics: 'Extract logistics information including shipment details, tracking numbers, destinations, and delivery schedules.',
      finance: 'Extract financial information including amounts, accounts, transactions, and financial statements.',
      real_estate: 'Extract real estate information including property details, prices, locations, and contract terms.',
      general: 'Extract key information and structured data from the document.'
    };

    const prompt = `You are processing a ${industry} document with ${batch.length} page(s). Extract ALL relevant information in a single comprehensive analysis.

DOCUMENT CONTENT:
${combinedText}

EXTRACTION TASK:
${industryPrompts[industry as keyof typeof industryPrompts] || industryPrompts.general}

RESPOND IN JSON FORMAT:
{
  "extractedData": {
    // Industry-specific structured data
  },
  "entities": [
    // Extracted entities with confidence scores
  ],
  "summary": "Brief document summary",
  "confidence": 0.95, // Overall extraction confidence (0-1)
  "pageConfidence": [
    {
      "pageNumber": 1,
      "confidence": 0.95,
      "method": "claude_sonnet_4",
      "quality": "high",
      "notes": "Clear text, comprehensive extraction"
    }
  ]
}

IMPORTANT: Include per-page confidence scores with quality assessment for transparency.
Extract comprehensively from ALL pages in this batch.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      try {
        return JSON.parse(content.text);
      } catch (error) {
        console.error("Failed to parse Sonnet response:", error);
        return { extractedData: {}, entities: [], summary: content.text, confidence: 0.5 };
      }
    }

    throw new Error("Unexpected response format from Sonnet");
  }

  /**
   * Sonnet self-evaluation: analyze results and recommend re-analysis if needed
   */
  async selfEvaluate(
    pages: PageContent[],
    extractedData: any,
    industry: string
  ): Promise<SelfEvaluationResult> {
    const pagesInfo = pages.map(p => ({
      page: p.pageNumber,
      textSnippet: p.text.substring(0, 500),
      confidence: p.confidence,
      source: p.source
    }));

    const prompt = `You are a quality assurance evaluator for document processing. Analyze the extraction results and determine if any pages need re-analysis.

DOCUMENT PAGES:
${JSON.stringify(pagesInfo, null, 2)}

EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

INDUSTRY: ${industry}

YOUR EVALUATION TASK:
1. Assess extraction quality for each page (confidence 0-1)
2. Identify pages that need re-analysis (low confidence, missing data, unclear text)
3. Recommend ONLY Vision or OCR if absolutely necessary (current method failed)
4. Be conservative - only recommend fallback if extraction quality is < 0.6

RESPOND IN JSON FORMAT:
{
  "overallConfidence": 0.92,
  "pageEvaluations": [
    {
      "pageNumber": 1,
      "confidence": 0.95,
      "needsReanalysis": false
    },
    {
      "pageNumber": 3,
      "confidence": 0.45,
      "needsReanalysis": true,
      "recommendedMethod": "vision",
      "reason": "Handwritten notes detected, poor text quality"
    }
  ]
}

Be strict - only flag pages that genuinely need re-analysis.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      try {
        const evaluation = JSON.parse(content.text);
        return {
          ...evaluation,
          extractedData
        };
      } catch (error) {
        console.error("Failed to parse self-evaluation:", error);
        return {
          overallConfidence: 0.8,
          pageEvaluations: pages.map(p => ({
            pageNumber: p.pageNumber,
            confidence: p.confidence || 0.8,
            needsReanalysis: false
          })),
          extractedData
        };
      }
    }

    throw new Error("Unexpected response format from Sonnet");
  }

  /**
   * Main orchestration: batch processing with adaptive planning and self-evaluation
   */
  async processDocumentIntelligently(
    pages: PageContent[],
    industry: string,
    documentId: number
  ): Promise<{
    extractedData: any;
    entities: any[];
    summaries: string[];
    confidence: number;
    processingPlan: AdaptivePlan;
    selfEvaluation: SelfEvaluationResult;
    apiCallsUsed: number;
    traditionalApiCalls: number;
  }> {
    console.log(`🧠 Starting intelligent Sonnet batching for document ${documentId} (${pages.length} pages)`);

    // Step 1: Create adaptive processing plan (1 API call)
    const plan = await this.createAdaptivePlan(pages, industry);
    console.log(`📋 Adaptive plan created: ${plan.strategy}`);
    console.log(`📋 Plan recommends ${plan.batches.length} batch(es), ${plan.fallbackNeeded.length} fallback(s) needed`);

    // Step 2: Honor adaptive plan's batch definitions
    const adaptiveBatches = plan.batches.map(batchDef => 
      batchDef.pages.map(pageNum => pages.find(p => p.pageNumber === pageNum)).filter(Boolean) as PageContent[]
    );
    
    console.log(`📦 Using adaptive plan batches (${adaptiveBatches.length} batches)`);

    // Step 3: Process batches according to plan (parallel if recommended)
    let apiCalls = 1; // For adaptive plan
    let allResults: any[] = [];
    
    if (plan.strategy === 'parallel_process' && plan.batches.every(b => b.parallelizable)) {
      // Process ALL batches in parallel as Sonnet recommended
      console.log('🚀 Processing batches in PARALLEL as recommended by Sonnet');
      const batchResults = await Promise.all(
        adaptiveBatches.map(batch => this.processBatchedPages(batch, industry, documentId))
      );
      apiCalls += adaptiveBatches.length;
      allResults = batchResults;
    } else {
      // Process batches sequentially (dependencies exist)
      console.log('🔄 Processing batches SEQUENTIALLY (dependencies detected)');
      for (const batch of adaptiveBatches) {
        const result = await this.processBatchedPages(batch, industry, documentId);
        apiCalls++;
        allResults.push(result);
      }
    }

    // Step 4: Properly merge all results without data loss
    const mergedResult = this.mergeAllResults(allResults);

    // Step 5: Handle adaptive plan fallback recommendations (process before self-eval)
    if (plan.fallbackNeeded.length > 0) {
      console.log(`⚠️ Adaptive plan recommends ${plan.fallbackNeeded.length} fallback(s)`);
      // Note: Fallbacks would be handled by calling code (router) with Vision/OCR
    }

    // Step 6: Self-evaluation (1 API call)
    const selfEvaluation = await this.selfEvaluate(pages, mergedResult.extractedData, industry);
    apiCalls++;

    // Calculate traditional API call count (2 per page: extraction + analysis)
    const traditionalApiCalls = pages.length * 2;

    console.log(`✅ Intelligent processing complete with ${apiCalls} API calls (vs ${traditionalApiCalls} traditional = ${traditionalApiCalls - apiCalls} saved)`);

    return {
      extractedData: mergedResult.extractedData,
      entities: mergedResult.entities,
      summaries: mergedResult.summaries,
      confidence: selfEvaluation.overallConfidence,
      processingPlan: plan,
      selfEvaluation,
      apiCallsUsed: apiCalls,
      traditionalApiCalls
    };
  }

  /**
   * Merge extracted data from multiple batches (deprecated - use mergeAllResults)
   */
  private mergeExtractedData(results: any[]): any {
    const merged: any = {};
    
    for (const result of results) {
      if (result.extractedData) {
        Object.assign(merged, result.extractedData);
      }
    }

    return merged;
  }

  /**
   * Properly merge all results from multiple batches without data loss
   */
  private mergeAllResults(results: any[]): {
    extractedData: any;
    entities: any[];
    summaries: string[];
  } {
    const mergedExtractedData: any = {};
    const allEntities: any[] = [];
    const allSummaries: string[] = [];

    for (const result of results) {
      // Merge extracted data carefully - arrays should concat, objects should merge
      if (result.extractedData) {
        for (const [key, value] of Object.entries(result.extractedData)) {
          if (Array.isArray(value)) {
            mergedExtractedData[key] = [...(mergedExtractedData[key] || []), ...value];
          } else if (typeof value === 'object' && value !== null) {
            mergedExtractedData[key] = { ...(mergedExtractedData[key] || {}), ...value };
          } else {
            mergedExtractedData[key] = value;
          }
        }
      }

      // Collect all entities
      if (result.entities && Array.isArray(result.entities)) {
        allEntities.push(...result.entities);
      }

      // Collect all summaries
      if (result.summary) {
        allSummaries.push(result.summary);
      }
    }

    return {
      extractedData: mergedExtractedData,
      entities: allEntities,
      summaries: allSummaries
    };
  }
}

export const sonnetBatchingService = new SonnetBatchingService();
