import { OpenAIService, DocumentAnalysisResult } from './openaiService';
import { MultiAIService } from './multiAIService';
import { VisionService } from './visionService';
import { AdvancedVisionService } from './advancedVisionService';

interface TemplateFreeFinding {
  entityType: string;
  entityValue: string; 
  confidence: number;
  context: string;
  position?: { page?: number; x?: number; y?: number };
  significance: 'critical' | 'high' | 'medium' | 'low';
}

interface StructuralElement {
  type: 'header' | 'table' | 'list' | 'paragraph' | 'form_field' | 'signature' | 'logo' | 'chart';
  content: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  children?: StructuralElement[];
}

interface TemplateFreDocumentStructure {
  documentCategory: string; // Auto-determined: 'contract', 'medical_record', 'invoice', etc.
  confidenceScore: number;
  language: string;
  structuralElements: StructuralElement[];
  keyValuePairs: { key: string; value: string; confidence: number }[];
  potentialIndustry: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'highly_complex';
  layoutType: 'form' | 'narrative' | 'tabular' | 'mixed' | 'visual_heavy';
}

interface TemplateFreProcessingResult {
  documentStructure: TemplateFreDocumentStructure;
  extractedFindings: TemplateFreeFinding[];
  intelligentSummary: string;
  suggestedActions: string[];
  processingStrategy: string;
  adaptiveConfidence: number;
  discoveredPatterns: string[];
  industryRecommendations: string[];
}

/**
 * Advanced Template-Free Document Processing Service
 * 
 * Uses GenAI and Vision Language Models to intelligently analyze ANY document
 * without requiring predefined templates, patterns, or industry knowledge.
 * 
 * Key innovations:
 * - Dynamic document structure discovery
 * - Adaptive entity extraction without predefined patterns
 * - Multi-modal analysis combining OCR, vision, and advanced reasoning
 * - Self-learning pattern recognition
 * - Context-aware significance scoring
 */
export class TemplateFreeExtractionService {
  private openaiService: OpenAIService;
  private multiAIService: MultiAIService;
  private visionService: VisionService;
  private advancedVisionService: AdvancedVisionService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.multiAIService = new MultiAIService();
    this.visionService = new VisionService();
    this.advancedVisionService = new AdvancedVisionService();
  }

  /**
   * Process any document without templates using advanced GenAI analysis
   */
  async processDocumentWithoutTemplates(
    filePath: string, 
    extractedText: string,
    mimeType: string,
    userId: string
  ): Promise<TemplateFreProcessingResult> {
    console.log('🔄 Starting template-free document analysis...');
    
    try {
      // Phase 1: Multi-modal structural analysis
      const structuralAnalysis = await this.performStructuralAnalysis(filePath, extractedText, mimeType);
      
      // Phase 2: Adaptive entity discovery
      const entityFindings = await this.discoverEntitiesAdaptively(extractedText, structuralAnalysis);
      
      // Phase 3: Contextual significance scoring
      const scoredFindings = await this.scoreEntitiesContextually(entityFindings, structuralAnalysis);
      
      // Phase 4: Generate intelligent processing strategy
      const processingStrategy = await this.generateAdaptiveStrategy(structuralAnalysis, scoredFindings);
      
      // Phase 5: Create comprehensive summary with recommendations
      const intelligentSummary = await this.generateIntelligentSummary(
        structuralAnalysis, 
        scoredFindings, 
        processingStrategy
      );

      const result: TemplateFreProcessingResult = {
        documentStructure: structuralAnalysis,
        extractedFindings: scoredFindings,
        intelligentSummary,
        suggestedActions: await this.generateAdaptiveActions(structuralAnalysis, scoredFindings),
        processingStrategy,
        adaptiveConfidence: this.calculateAdaptiveConfidence(structuralAnalysis, scoredFindings),
        discoveredPatterns: await this.identifyDocumentPatterns(extractedText, structuralAnalysis),
        industryRecommendations: await this.suggestIndustryConfiguration(structuralAnalysis, scoredFindings)
      };

      console.log(`✅ Template-free analysis completed with ${result.adaptiveConfidence}% confidence`);
      return result;

    } catch (error) {
      console.error('❌ Template-free processing failed:', error);
      throw new Error(`Template-free processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced structural analysis using Vision Language Models
   */
  private async performStructuralAnalysis(
    filePath: string, 
    extractedText: string, 
    mimeType: string
  ): Promise<TemplateFreDocumentStructure> {
    console.log('🔍 Performing advanced structural analysis...');

    let visionResults = null;
    if (mimeType.includes('image') || mimeType.includes('pdf')) {
      try {
        // Use public method for vision analysis
        visionResults = await this.visionService.extractTextFromImage(filePath);
      } catch (error) {
        console.warn('Vision analysis failed, using text-only analysis:', error);
      }
    }

    const structuralPrompt = `
    Analyze this document and determine its structure WITHOUT using predefined templates.
    
    TEXT CONTENT:
    ${extractedText.substring(0, 5000)} ${extractedText.length > 5000 ? '...[truncated]' : ''}
    
    ${visionResults ? `VISUAL ELEMENTS DETECTED: OCR confidence ${visionResults.confidence}, language: ${visionResults.language}` : ''}
    
    Provide a comprehensive structural analysis in JSON format:
    {
      "documentCategory": "string (intelligently determined: contract, medical_record, invoice, report, form, correspondence, etc.)",
      "confidenceScore": number (0-1),
      "language": "string",
      "structuralElements": [
        {
          "type": "header|table|list|paragraph|form_field|signature|logo|chart", 
          "content": "string",
          "confidence": number
        }
      ],
      "keyValuePairs": [{"key": "string", "value": "string", "confidence": number}],
      "potentialIndustry": "string (best guess: medical, legal, finance, logistics, real_estate, general)",
      "complexity": "simple|moderate|complex|highly_complex",
      "layoutType": "form|narrative|tabular|mixed|visual_heavy"
    }
    
    Focus on DISCOVERY and INTELLIGENCE rather than matching predefined patterns.
    `;

    try {
      const analysisResult = await this.openaiService.analyzeDocument(structuralPrompt, 'general');
      const analysisData = analysisResult.industrySpecificFindings?.[0] || analysisResult;
      
      // Parse the structural analysis from OpenAI
      let structuredData;
      try {
        structuredData = typeof analysisData === 'string' 
          ? JSON.parse(analysisData as string) 
          : analysisData;
      } catch (e) {
        // Fallback parsing
        structuredData = {
          documentCategory: 'document',
          confidenceScore: 0.7,
          language: 'en'
        };
      }

      return {
        documentCategory: structuredData.documentCategory || 'unknown',
        confidenceScore: structuredData.confidenceScore || 0.7,
        language: structuredData.language || 'en', 
        structuralElements: structuredData.structuralElements || [],
        keyValuePairs: structuredData.keyValuePairs || [],
        potentialIndustry: structuredData.potentialIndustry || 'general',
        complexity: structuredData.complexity || 'moderate',
        layoutType: structuredData.layoutType || 'mixed'
      };

    } catch (error) {
      console.error('Structural analysis failed:', error);
      // Fallback to basic analysis
      return {
        documentCategory: 'document',
        confidenceScore: 0.5,
        language: 'en',
        structuralElements: [{ type: 'paragraph', content: extractedText.substring(0, 200), confidence: 0.7 }],
        keyValuePairs: [],
        potentialIndustry: 'general',
        complexity: 'moderate',
        layoutType: 'mixed'
      };
    }
  }

  /**
   * Adaptive entity discovery without predefined patterns
   */
  private async discoverEntitiesAdaptively(
    extractedText: string, 
    structure: TemplateFreDocumentStructure
  ): Promise<TemplateFreeFinding[]> {
    console.log('🧠 Discovering entities adaptively...');

    const entityDiscoveryPrompt = `
    Intelligently extract ALL meaningful entities from this ${structure.documentCategory} document.
    
    DOCUMENT CONTEXT:
    - Category: ${structure.documentCategory}  
    - Potential Industry: ${structure.potentialIndustry}
    - Complexity: ${structure.complexity}
    - Layout: ${structure.layoutType}
    
    DOCUMENT TEXT:
    ${extractedText.substring(0, 8000)} ${extractedText.length > 8000 ? '...[truncated]' : ''}
    
    Discover entities WITHOUT using predefined templates. Instead, intelligently identify:
    
    1. **Critical Business Information**: Names, dates, amounts, IDs, references
    2. **Key Relationships**: Who, what, when, where, how much
    3. **Important Context**: Status, conditions, requirements, obligations  
    4. **Structural Data**: Tables, lists, forms, signatures
    5. **Domain-Specific Terms**: Technical terms, industry jargon, specialized codes
    
    Return JSON array of findings:
    [
      {
        "entityType": "string (dynamically determined: person, organization, date, amount, identifier, status, etc.)",
        "entityValue": "string (extracted value)",
        "confidence": number (0-1),
        "context": "string (surrounding context that gives this meaning)",
        "significance": "critical|high|medium|low"
      }
    ]
    
    Be COMPREHENSIVE but INTELLIGENT. Extract everything that has business value.
    `;

    try {
      // Use multiAI service for comprehensive entity discovery  
      const multiAIResult = await this.multiAIService.analyzeDocument(
        entityDiscoveryPrompt,
        structure.potentialIndustry
      );
      
      // Parse findings from multi-AI analysis
      let findings: TemplateFreeFinding[] = [];
      
      // Extract entities from OpenAI results
      if (multiAIResult.openai?.insights) {
        const openAIFindings = multiAIResult.openai.insights.map((insight: string) => ({
          entityType: 'insight',
          entityValue: insight,
          confidence: 0.8,
          context: 'OpenAI analysis',
          significance: 'medium' as const
        }));
        findings = findings.concat(openAIFindings);
      }
      
      // Extract entities from Gemini results  
      if (multiAIResult.gemini?.insights) {
        const geminiFindings = multiAIResult.gemini.insights.map((insight: string) => ({
          entityType: 'insight',
          entityValue: insight,
          confidence: 0.8,
          context: 'Gemini analysis',
          significance: 'medium' as const
        }));
        findings = findings.concat(geminiFindings);
      }
      
      // Extract entities from Anthropic results
      if (multiAIResult.anthropic?.analysis) {
        try {
          const anthropicFindings = JSON.parse(multiAIResult.anthropic.analysis);
          if (Array.isArray(anthropicFindings)) {
            findings = findings.concat(anthropicFindings);
          }
        } catch (parseError) {
          findings = findings.concat(this.extractEntitiesFromText(multiAIResult.anthropic.analysis));
        }
      }

      console.log(`🧠 Discovered ${findings.length} entities adaptively`);
      return findings;

    } catch (error) {
      console.error('Adaptive entity discovery failed:', error);
      // Fallback to basic pattern matching
      return this.fallbackEntityDiscovery(extractedText);
    }
  }

  /**
   * Score entities contextually based on document structure and content
   */
  private async scoreEntitiesContextually(
    findings: TemplateFreeFinding[],
    structure: TemplateFreDocumentStructure
  ): Promise<TemplateFreeFinding[]> {
    console.log('🎯 Scoring entities contextually...');

    const scoringPrompt = `
    Re-evaluate the significance of these extracted entities based on the document context.
    
    DOCUMENT CONTEXT:
    - Category: ${structure.documentCategory}
    - Industry: ${structure.potentialIndustry}  
    - Complexity: ${structure.complexity}
    
    ENTITIES TO SCORE:
    ${JSON.stringify(findings.slice(0, 50))} ${findings.length > 50 ? '...[truncated]' : ''}
    
    For each entity, determine contextual significance:
    - "critical": Essential for document purpose (amounts in contracts, patient IDs in medical records)
    - "high": Important supporting information (dates, parties, key terms)  
    - "medium": Relevant context (locations, references, secondary data)
    - "low": Background information (formatting, minor details)
    
    Return the entities with updated significance scores in JSON format.
    `;

    try {
      const scoringResult = await this.openaiService.analyzeDocument(scoringPrompt, structure.potentialIndustry);
      
      if (scoringResult.keyEntities && scoringResult.keyEntities.length > 0) {
        // Update findings with contextual scores
        return findings.map(finding => {
          const scored = scoringResult.keyEntities.find((e: any) => 
            e.value === finding.entityValue || e.type === finding.entityType
          );
          if (scored) {
            finding.significance = this.mapConfidenceToSignificance(scored.confidence);
            finding.confidence = Math.max(finding.confidence, scored.confidence);
          }
          return finding;
        });
      }

      return findings;
      
    } catch (error) {
      console.error('Contextual scoring failed:', error);
      return findings; // Return original findings if scoring fails
    }
  }

  /**
   * Generate adaptive processing strategy based on document analysis
   */
  private async generateAdaptiveStrategy(
    structure: TemplateFreDocumentStructure,
    findings: TemplateFreeFinding[]
  ): Promise<string> {
    const criticalFindings = findings.filter(f => f.significance === 'critical').length;
    const highFindings = findings.filter(f => f.significance === 'high').length;

    if (structure.complexity === 'highly_complex' || criticalFindings > 10) {
      return 'multi_pass_detailed_analysis';
    } else if (structure.layoutType === 'tabular' || highFindings > 5) {
      return 'structured_data_focused';
    } else if (structure.documentCategory === 'contract' || structure.potentialIndustry === 'legal') {
      return 'compliance_and_risk_focused';  
    } else if (structure.potentialIndustry === 'medical') {
      return 'privacy_and_accuracy_focused';
    } else {
      return 'balanced_comprehensive';
    }
  }

  /**
   * Generate intelligent summary with actionable insights
   */
  private async generateIntelligentSummary(
    structure: TemplateFreDocumentStructure,
    findings: TemplateFreeFinding[],
    strategy: string
  ): Promise<string> {
    const criticalEntities = findings.filter(f => f.significance === 'critical');
    const keyData = criticalEntities.map(e => `${e.entityType}: ${e.entityValue}`).join(', ');

    return `Template-free analysis of ${structure.documentCategory} document (${structure.complexity} complexity, ${Math.round(structure.confidenceScore * 100)}% confidence). Discovered ${findings.length} entities using ${strategy} strategy. Key findings: ${keyData}. Recommended for ${structure.potentialIndustry} industry processing.`;
  }

  // Helper methods

  private async generateAdaptiveActions(
    structure: TemplateFreDocumentStructure,
    findings: TemplateFreeFinding[]
  ): Promise<string[]> {
    const actions = ['Review extracted entities for accuracy'];
    
    if (structure.complexity === 'highly_complex') {
      actions.push('Consider human review for complex sections');
    }
    
    if (findings.some(f => f.entityType.includes('date'))) {
      actions.push('Validate and format all identified dates');
    }
    
    if (structure.potentialIndustry !== 'general') {
      actions.push(`Apply ${structure.potentialIndustry} industry-specific validation`);
    }

    return actions;
  }

  private calculateAdaptiveConfidence(
    structure: TemplateFreDocumentStructure,
    findings: TemplateFreeFinding[]
  ): number {
    const structuralConfidence = structure.confidenceScore;
    const avgFindingConfidence = findings.length > 0 
      ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length 
      : 0.5;
    
    return Math.round((structuralConfidence * 0.4 + avgFindingConfidence * 0.6) * 100);
  }

  private async identifyDocumentPatterns(
    extractedText: string,
    structure: TemplateFreDocumentStructure  
  ): Promise<string[]> {
    const patterns = [];
    
    if (extractedText.includes('TOTAL') || extractedText.includes('Amount Due')) {
      patterns.push('invoice_pattern');
    }
    if (extractedText.includes('Patient') || extractedText.includes('Diagnosis')) {
      patterns.push('medical_record_pattern');
    }  
    if (extractedText.includes('Agreement') || extractedText.includes('Terms')) {
      patterns.push('contract_pattern');
    }
    if (structure.layoutType === 'tabular') {
      patterns.push('structured_data_pattern');
    }

    return patterns;
  }

  private async suggestIndustryConfiguration(
    structure: TemplateFreDocumentStructure,
    findings: TemplateFreeFinding[]
  ): Promise<string[]> {
    const recommendations = [];
    
    if (structure.potentialIndustry === 'medical') {
      recommendations.push('Enable HIPAA compliance features');
      recommendations.push('Activate PHI detection algorithms');  
    }
    
    if (structure.potentialIndustry === 'legal') {
      recommendations.push('Enable privilege protection scanning');
      recommendations.push('Activate confidentiality level detection');
    }
    
    if (findings.some(f => f.entityType.includes('amount') || f.entityType.includes('currency'))) {
      recommendations.push('Enable financial fraud detection');
      recommendations.push('Activate currency normalization');
    }

    return recommendations;
  }

  // Utility methods
  
  private extractEntitiesFromText(text: string): TemplateFreeFinding[] {
    // Fallback basic pattern matching
    const findings: TemplateFreeFinding[] = [];
    
    // Basic patterns for common entities
    const patterns = [
      { type: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
      { type: 'phone', regex: /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g },
      { type: 'date', regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g },
      { type: 'currency', regex: /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g }
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          findings.push({
            entityType: pattern.type,
            entityValue: match,
            confidence: 0.7,
            context: 'Pattern matched extraction',
            significance: 'medium'
          });
        });
      }
    }

    return findings;
  }

  private convertGeminiEntitiesToFindings(entities: any[]): TemplateFreeFinding[] {
    return entities.map(entity => ({
      entityType: entity.type || 'unknown',
      entityValue: entity.value || '',
      confidence: entity.confidence || 0.7,
      context: 'Gemini AI extraction',
      significance: this.mapConfidenceToSignificance(entity.confidence || 0.7)
    }));
  }

  private mergeAndDeduplicateFindings(
    findings1: TemplateFreeFinding[], 
    findings2: TemplateFreeFinding[]
  ): TemplateFreeFinding[] {
    const merged = [...findings1];
    
    findings2.forEach(finding2 => {
      const duplicate = merged.find(f1 => 
        f1.entityValue === finding2.entityValue && f1.entityType === finding2.entityType
      );
      
      if (!duplicate) {
        merged.push(finding2);
      } else {
        // Keep higher confidence
        if (finding2.confidence > duplicate.confidence) {
          duplicate.confidence = finding2.confidence;
          duplicate.significance = finding2.significance;
        }
      }
    });

    return merged;
  }

  private fallbackEntityDiscovery(extractedText: string): TemplateFreeFinding[] {
    console.log('Using fallback entity discovery...');
    return this.extractEntitiesFromText(extractedText);
  }

  private mapConfidenceToSignificance(confidence: number): 'critical' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.8) return 'high'; 
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }
}