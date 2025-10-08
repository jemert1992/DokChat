import OpenAI from "openai";
import { getIndustryPrompt } from './industryPrompts';

export interface DocumentAnalysisResult {
  summary: string;
  keyEntities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  insights: string[];
  compliance: {
    status: string;
    issues: string[];
    recommendations: string[];
  };
  confidence: number;
  processingNotes: string[];
  industrySpecificFindings?: string[];
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeDocument(text: string, industry: string): Promise<DocumentAnalysisResult> {
    try {
      const prompt = this.generateIndustryPrompt(text, industry);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert document analysis AI specialized in extracting structured information from documents across various industries. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: result.summary || "Document analysis completed",
        keyEntities: result.keyEntities || [],
        insights: result.insights || [],
        compliance: result.compliance || {
          status: "compliant",
          issues: [],
          recommendations: []
        },
        confidence: result.confidence || 0.9,
        processingNotes: result.processingNotes || [],
        industrySpecificFindings: result.industrySpecificFindings || []
      };

    } catch (error) {
      console.error("Error in OpenAI document analysis:", error);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateIndustryPrompt(text: string, industry: string): string {
    const industryConfig = getIndustryPrompt(industry);
    
    const basePrompt = `${industryConfig.systemPrompt}

${industryConfig.analysisPrompt}

For ${industryConfig.entityTypes.join(', ')} extraction and ${industryConfig.complianceChecks.join(', ')} compliance assessment.

Analyze the following document and extract structured information. Respond with JSON in this exact format:

{
  "summary": "Brief summary of the document",
  "keyEntities": [
    {
      "type": "entity_type",
      "value": "extracted_value", 
      "confidence": 0.95
    }
  ],
  "insights": ["insight1", "insight2"],
  "compliance": {
    "status": "compliant|non-compliant|needs-review",
    "issues": ["issue1", "issue2"],
    "recommendations": ["recommendation1", "recommendation2"]
  },
  "confidence": 0.9,
  "processingNotes": ["note1", "note2"]
}

Industry: ${industry}

Document text:
${text}`;

    switch (industry) {
      case 'medical':
        return `${basePrompt}

Focus on:
- Patient information extraction
- Medical terminology and diagnoses
- HIPAA compliance requirements
- Clinical insights and recommendations
- Medication and treatment information`;

      case 'legal':
        return `${basePrompt}

Focus on:
- Contract terms and clauses
- Legal entities and parties
- Dates and deadlines
- Risk assessment
- Legal compliance requirements`;

      case 'logistics':
        return `${basePrompt}

Focus on:
- Shipping information and tracking
- Customs and compliance data
- Transportation details
- Delivery confirmations
- International trade requirements`;

      case 'finance':
        return `${basePrompt}

Focus on:
- Financial amounts and transactions
- Risk indicators
- Regulatory compliance
- Fraud detection signals
- Financial entity information`;

      default:
        return `${basePrompt}

Focus on:
- General business information
- Key dates and amounts
- Contact information
- Document classification
- Data extraction opportunities`;
    }
  }
}
