import { OpenAIService, DocumentAnalysisResult } from './openaiService';
import { VisionService } from './visionService';
import { summarizeArticle as geminiSummarize, analyzeSentiment as geminiAnalyze, analyzeImage as geminiAnalyzeImage } from '../../gemini';
import { getIndustryPrompt } from './industryPrompts';
import Anthropic from '@anthropic-ai/sdk';

interface MultiAIResult {
  openai: DocumentAnalysisResult;
  gemini: {
    summary: string;
    sentiment: { rating: number; confidence: number };
    insights: string[];
  };
  anthropic?: {
    summary: string;
    analysis: string;
    confidence: number;
  };
  consensus: {
    summary: string;
    confidence: number;
    keyFindings: string[];
    recommendedModel: 'openai' | 'gemini' | 'anthropic';
  };
  ocrResults: {
    text: string;
    confidence: number;
    language: string;
    handwritingDetected: boolean;
  };
}

export class MultiAIService {
  private openaiService: OpenAIService;
  private visionService: VisionService;
  private anthropic: Anthropic | null;

  constructor() {
    this.openaiService = new OpenAIService();
    this.visionService = new VisionService();
    
    // Initialize Anthropic if API key is available
    this.anthropic = process.env.ANTHROPIC_API_KEY 
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  async analyzeDocument(
    text: string, 
    industry: string, 
    filePath?: string,
    mimeType?: string
  ): Promise<MultiAIResult> {
    const results: Partial<MultiAIResult> = {};

    try {
      // Enhanced OCR if it's an image or PDF
      if (filePath && this.isImageOrPDF(mimeType)) {
        const ocrResult = mimeType?.includes('pdf') 
          ? await this.visionService.extractTextFromPDF(filePath)
          : await this.visionService.extractTextFromImage(filePath);
        
        results.ocrResults = {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          language: ocrResult.language,
          handwritingDetected: ocrResult.handwritingDetected
        };

        // Use OCR text if available and more comprehensive
        if (ocrResult.text.length > text.length) {
          text = ocrResult.text;
        }
      } else {
        results.ocrResults = {
          text,
          confidence: 0.95,
          language: 'en',
          handwritingDetected: false
        };
      }

      // Run all AI analyses in parallel
      const [openaiResult, geminiResult, anthropicResult] = await Promise.allSettled([
        this.openaiService.analyzeDocument(text, industry),
        this.analyzeWithGemini(text, industry),
        this.anthropic ? this.analyzeWithAnthropic(text, industry) : Promise.resolve(null)
      ]);

      // Process OpenAI results
      if (openaiResult.status === 'fulfilled') {
        results.openai = openaiResult.value;
      } else {
        console.error('OpenAI analysis failed:', openaiResult.reason);
        results.openai = this.getFallbackAnalysis();
      }

      // Process Gemini results
      if (geminiResult.status === 'fulfilled') {
        results.gemini = geminiResult.value;
      } else {
        console.error('Gemini analysis failed:', geminiResult.reason);
        results.gemini = {
          summary: 'Analysis unavailable',
          sentiment: { rating: 3, confidence: 0.5 },
          insights: []
        };
      }

      // Process Anthropic results
      if (anthropicResult.status === 'fulfilled' && anthropicResult.value) {
        results.anthropic = anthropicResult.value;
      }

      // Generate consensus analysis
      results.consensus = this.generateConsensus(results as MultiAIResult);

      return results as MultiAIResult;

    } catch (error) {
      console.error('Error in multi-AI analysis:', error);
      throw new Error(`Multi-AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeWithGemini(text: string, industry: string) {
    try {
      const [summary, sentiment] = await Promise.all([
        geminiSummarize(text),
        geminiAnalyze(text)
      ]);

      // Generate industry-specific insights
      const insights = this.generateIndustryInsights(text, industry, 'gemini');

      return {
        summary,
        sentiment,
        insights
      };
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw error;
    }
  }

  private async analyzeWithAnthropic(text: string, industry: string) {
    if (!this.anthropic) return null;

    try {
      const industryConfig = getIndustryPrompt(industry);
      
      const prompt = `${industryConfig.systemPrompt}

${industryConfig.analysisPrompt}

Document to analyze:
${text}

Provide detailed analysis covering:
- Entity extraction for: ${industryConfig.entityTypes.join(', ')}
- Compliance checks for: ${industryConfig.complianceChecks.join(', ')}
- Risk assessment for: ${industryConfig.riskFactors.join(', ')}

Respond with JSON format:
{
  "summary": "Comprehensive summary of document",
  "analysis": "Detailed analysis with industry-specific insights",
  "confidence": 0.95,
  "entities": ["entity1", "entity2"],
  "complianceStatus": "assessment of compliance requirements",
  "riskFactors": ["risk1", "risk2"]
}`;

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      const result = JSON.parse(content.text);
      return {
        summary: result.summary || 'Analysis completed',
        analysis: result.analysis || 'No specific analysis available',
        confidence: result.confidence || 0.9,
        entities: result.entities || [],
        complianceStatus: result.complianceStatus || 'No compliance issues detected',
        riskFactors: result.riskFactors || []
      };

    } catch (error) {
      console.error('Anthropic analysis error:', error);
      throw error;
    }
  }

  private generateConsensus(results: MultiAIResult): MultiAIResult['consensus'] {
    const summaries = [
      results.openai?.summary,
      results.gemini?.summary,
      results.anthropic?.summary
    ].filter(Boolean);

    // Simple consensus: use the longest summary as base, incorporate key points from others
    const primarySummary = summaries.reduce((longest, current) => 
      (current && current.length > (longest?.length || 0)) ? current : longest
    , '') || 'Document analysis completed';

    // Calculate average confidence
    const confidences = [
      results.openai?.confidence || 0,
      results.gemini?.sentiment?.confidence || 0,
      results.anthropic?.confidence || 0
    ].filter(c => c > 0);

    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    // Combine key findings
    const keyFindings = [
      ...(results.openai?.insights || []),
      ...(results.gemini?.insights || []),
      ...(results.anthropic?.analysis ? [results.anthropic.analysis] : [])
    ].slice(0, 5); // Top 5 findings

    // Recommend best performing model
    const modelScores = {
      openai: (results.openai?.confidence || 0) * 0.4 + (results.openai?.insights.length || 0) * 0.1,
      gemini: (results.gemini?.sentiment?.confidence || 0) * 0.4 + (results.gemini?.insights.length || 0) * 0.1,
      anthropic: (results.anthropic?.confidence || 0) * 0.4 + (results.anthropic ? 0.2 : 0)
    };

    const recommendedModel = Object.entries(modelScores)
      .sort(([,a], [,b]) => b - a)[0][0] as 'openai' | 'gemini' | 'anthropic';

    return {
      summary: primarySummary,
      confidence: avgConfidence,
      keyFindings,
      recommendedModel
    };
  }

  private generateIndustryInsights(text: string, industry: string, model: string): string[] {
    // Generate basic insights based on industry and detected keywords
    const insights = [];
    
    switch (industry) {
      case 'medical':
        if (text.toLowerCase().includes('patient')) insights.push('Patient information detected');
        if (text.toLowerCase().includes('diagnosis')) insights.push('Medical diagnosis mentioned');
        break;
      case 'legal':
        if (text.toLowerCase().includes('contract')) insights.push('Contract document identified');
        if (text.toLowerCase().includes('agreement')) insights.push('Legal agreement detected');
        break;
      case 'finance':
        if (text.toLowerCase().includes('payment')) insights.push('Financial transaction referenced');
        if (text.toLowerCase().includes('account')) insights.push('Account information present');
        break;
      case 'logistics':
        if (text.toLowerCase().includes('shipping')) insights.push('Shipping information detected');
        if (text.toLowerCase().includes('delivery')) insights.push('Delivery details found');
        break;
    }

    insights.push(`Analyzed by ${model} model`);
    return insights;
  }

  private isImageOrPDF(mimeType?: string): boolean {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  private getFallbackAnalysis(): DocumentAnalysisResult {
    return {
      summary: 'Document processed with limited analysis',
      keyEntities: [],
      insights: ['Analysis completed with basic processing'],
      compliance: {
        status: 'unknown',
        issues: [],
        recommendations: []
      },
      confidence: 0.7,
      processingNotes: ['Fallback analysis used']
    };
  }
}