import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { verificationResults, decisionLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';

const UNCERTAINTY_THRESHOLD = 0.3; // Flag for manual review if uncertainty > 30%

interface VerificationResult {
  verifiedExtraction: any;
  uncertaintyScore: number;
  discrepancies: Array<{
    field: string;
    originalValue: any;
    verifiedValue: any;
    confidence: number;
    reason: string;
  }>;
  needsManualReview: boolean;
  reviewReason?: string;
}

class VerificationService {
  private anthropic: Anthropic;
  private verificationModel = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for verification service');
    }
    this.anthropic = new Anthropic({ apiKey });
    console.log('🔍 Verification Service initialized with Sonnet 4.5');
  }

  /**
   * Perform second-pass verification on extracted data
   */
  async verifyExtraction(
    documentId: number,
    originalExtraction: any,
    documentText: string,
    industry: string
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Starting verification for document ${documentId}...`);
    
    // Log decision: Starting verification
    await this.logDecision(documentId, null, 'verification_start', 
      'Initiating second-pass verification',
      'Performing auto-QA check to validate extracted data against source document',
      { originalExtraction, industry }
    );

    try {
      // Step 1: Verification pass using Sonnet in verification mode
      const verificationPrompt = this.buildVerificationPrompt(originalExtraction, documentText, industry);
      
      const response = await this.anthropic.messages.create({
        model: this.verificationModel,
        max_tokens: 4096,
        temperature: 0.1, // Lower temperature for more deterministic verification
        system: this.getVerificationSystemPrompt(industry),
        messages: [{
          role: 'user',
          content: verificationPrompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from verification model');
      }

      const verificationData = this.parseVerificationResponse(content.text);
      
      // Log decision: Verification complete
      await this.logDecision(documentId, null, 'verification_analysis',
        'Verification analysis completed',
        `Analyzed ${Object.keys(originalExtraction).length} fields, found ${verificationData.discrepancies.length} discrepancies`,
        { originalExtraction },
        { verificationData },
        verificationData.confidence,
        this.verificationModel,
        Date.now() - startTime
      );

      // Step 2: Calculate uncertainty score
      const uncertaintyScore = this.calculateUncertaintyScore(verificationData.discrepancies);
      
      // Step 3: Determine if manual review is needed
      const needsManualReview = uncertaintyScore > UNCERTAINTY_THRESHOLD;
      const reviewReason = needsManualReview 
        ? this.generateReviewReason(verificationData.discrepancies, uncertaintyScore)
        : undefined;

      if (needsManualReview) {
        await this.logDecision(documentId, null, 'manual_review_flag',
          'Flagged for manual review',
          `Uncertainty score ${(uncertaintyScore * 100).toFixed(1)}% exceeds threshold ${(UNCERTAINTY_THRESHOLD * 100)}%`,
          { uncertaintyScore, threshold: UNCERTAINTY_THRESHOLD },
          { reviewReason, discrepancies: verificationData.discrepancies }
        );
      }

      console.log(`✅ Verification complete: ${verificationData.discrepancies.length} discrepancies, uncertainty ${(uncertaintyScore * 100).toFixed(1)}%`);

      return {
        verifiedExtraction: verificationData.verifiedData,
        uncertaintyScore,
        discrepancies: verificationData.discrepancies,
        needsManualReview,
        reviewReason
      };

    } catch (error) {
      console.error('Verification error:', error);
      
      await this.logDecision(documentId, null, 'verification_error',
        'Verification failed',
        `Error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalExtraction },
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  /**
   * Store verification results in database
   */
  async storeVerificationResult(
    documentId: number,
    originalExtraction: any,
    verificationResult: VerificationResult,
    crossCheckModel?: string
  ): Promise<number> {
    const [result] = await db.insert(verificationResults).values({
      documentId,
      originalExtraction,
      verifiedExtraction: verificationResult.verifiedExtraction,
      discrepancies: verificationResult.discrepancies,
      uncertaintyScore: verificationResult.uncertaintyScore,
      needsManualReview: verificationResult.needsManualReview,
      reviewReason: verificationResult.reviewReason,
      verificationModel: this.verificationModel,
      crossCheckModel,
      verificationStatus: verificationResult.needsManualReview ? 'needs_review' : 'verified'
    }).returning({ id: verificationResults.id });

    return result.id;
  }

  /**
   * Log Sonnet's decision trail for debugging and tuning
   */
  async logDecision(
    documentId: number,
    verificationId: number | null,
    stage: string,
    decision: string,
    reasoning: string,
    inputData?: any,
    outputData?: any,
    confidence?: number,
    modelUsed: string = this.verificationModel,
    processingTime?: number
  ): Promise<void> {
    await db.insert(decisionLogs).values({
      documentId,
      verificationId,
      stage,
      decision,
      reasoning,
      inputData,
      outputData,
      confidence,
      modelUsed,
      processingTime
    });
  }

  /**
   * Build verification prompt for Sonnet
   */
  private buildVerificationPrompt(originalExtraction: any, documentText: string, industry: string): string {
    return `You are performing a VERIFICATION CHECK on previously extracted data. Your role is to validate accuracy, not to extract new information.

ORIGINAL EXTRACTION (to be verified):
${JSON.stringify(originalExtraction, null, 2)}

SOURCE DOCUMENT TEXT:
${documentText}

INDUSTRY CONTEXT: ${industry}

VERIFICATION TASK:
1. Compare each extracted field against the source document
2. Identify discrepancies, errors, or uncertainties
3. For each field, assign a confidence score (0.0 - 1.0)
4. Flag fields that need human review

Return your verification in this JSON format:
{
  "verifiedData": { /* corrected/verified extraction */ },
  "discrepancies": [
    {
      "field": "field_name",
      "originalValue": "original value",
      "verifiedValue": "corrected value",
      "confidence": 0.85,
      "reason": "explanation of discrepancy"
    }
  ],
  "confidence": 0.92 /* overall confidence in verification */
}

Be thorough and conservative - flag uncertainties rather than making assumptions.`;
  }

  /**
   * Get system prompt for verification mode
   */
  private getVerificationSystemPrompt(industry: string): string {
    return `You are a specialized verification AI for ${industry} document analysis. Your role is to perform quality assurance checks on extracted data.

VERIFICATION PRINCIPLES:
1. Accuracy over completeness - verify what can be confirmed
2. Conservative approach - flag uncertainties for human review
3. Evidence-based - only confirm what's in the source text
4. Industry-aware - apply ${industry}-specific validation rules

WHAT TO CHECK:
- Numerical accuracy (amounts, dates, IDs)
- Name spelling and formatting
- Completeness of required fields
- Logical consistency across fields
- Industry-specific validation rules

OUTPUT REQUIREMENTS:
- Return valid JSON only
- Be explicit about confidence levels
- Document reasons for discrepancies
- Flag ambiguous cases for review`;
  }

  /**
   * Parse verification response from Sonnet
   */
  private parseVerificationResponse(responseText: string): {
    verifiedData: any;
    discrepancies: Array<any>;
    confidence: number;
  } {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in verification response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verifiedData: parsed.verifiedData || {},
      discrepancies: parsed.discrepancies || [],
      confidence: parsed.confidence || 0.5
    };
  }

  /**
   * Calculate uncertainty score from discrepancies
   */
  private calculateUncertaintyScore(discrepancies: Array<any>): number {
    if (discrepancies.length === 0) {
      return 0;
    }

    // Weight discrepancies by their confidence deficit
    const totalUncertainty = discrepancies.reduce((sum, disc) => {
      return sum + (1 - (disc.confidence || 0.5));
    }, 0);

    return Math.min(totalUncertainty / discrepancies.length, 1.0);
  }

  /**
   * Generate human-readable review reason
   */
  private generateReviewReason(discrepancies: Array<any>, uncertaintyScore: number): string {
    const highUncertaintyFields = discrepancies
      .filter(d => (d.confidence || 0) < 0.7)
      .map(d => d.field);

    if (highUncertaintyFields.length === 0) {
      return `High overall uncertainty (${(uncertaintyScore * 100).toFixed(1)}%) requires manual verification`;
    }

    return `Low confidence in ${highUncertaintyFields.length} field(s): ${highUncertaintyFields.slice(0, 3).join(', ')}${highUncertaintyFields.length > 3 ? '...' : ''}`;
  }

  /**
   * Get verification results for a document
   */
  async getVerificationResults(documentId: number) {
    return await db
      .select()
      .from(verificationResults)
      .where(eq(verificationResults.documentId, documentId))
      .orderBy(verificationResults.createdAt);
  }

  /**
   * Get decision logs for a document
   */
  async getDecisionLogs(documentId: number) {
    return await db
      .select()
      .from(decisionLogs)
      .where(eq(decisionLogs.documentId, documentId))
      .orderBy(decisionLogs.createdAt);
  }

  /**
   * Mark verification as reviewed
   */
  async markAsReviewed(verificationId: number, userId: string, reviewNotes?: string) {
    await db
      .update(verificationResults)
      .set({
        verificationStatus: 'reviewed',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes
      })
      .where(eq(verificationResults.id, verificationId));
  }
}

export const verificationService = new VerificationService();
