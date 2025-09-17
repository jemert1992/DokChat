import { storage } from '../storage';
import type { 
  InsertDocumentRecommendation,
  DocumentRecommendation,
  UserOnboardingProfile,
  UserBehaviorPattern,
  User,
  Document
} from '@shared/schema';

interface DocumentTypeProfile {
  industry: string;
  documentType: string;
  commonNames: string[];
  description: string;
  processingHints: string[];
  requiredFields: string[];
  complianceConsiderations: string[];
  suggestedAnalysis: string[];
  priority: number;
}

interface RecommendationContext {
  userId: string;
  industry: string;
  userProfile?: UserOnboardingProfile;
  recentBehavior?: UserBehaviorPattern[];
  existingDocuments?: Document[];
  timeOfDay?: number;
  dayOfWeek?: number;
}

export class DocumentIntelligenceService {
  private documentProfiles: Record<string, DocumentTypeProfile[]> = {
    medical: [
      {
        industry: 'medical',
        documentType: 'patient_records',
        commonNames: ['Patient Record', 'Medical Record', 'Patient Chart', 'EMR Export'],
        description: 'Complete patient medical records with history, diagnoses, and treatment plans',
        processingHints: [
          'Look for PHI (Protected Health Information) and ensure HIPAA compliance',
          'Extract patient demographics, medical history, and current medications',
          'Identify diagnostic codes (ICD-10) and procedure codes (CPT)'
        ],
        requiredFields: ['patient_name', 'patient_id', 'date_of_birth', 'medical_record_number'],
        complianceConsiderations: ['HIPAA Privacy Rule', 'HITECH Act', 'State medical privacy laws'],
        suggestedAnalysis: ['phi_detection', 'medical_entity_extraction', 'clinical_summary'],
        priority: 10
      },
      {
        industry: 'medical',
        documentType: 'lab_results',
        commonNames: ['Lab Report', 'Laboratory Results', 'Blood Work', 'Pathology Report'],
        description: 'Laboratory test results and diagnostic reports',
        processingHints: [
          'Extract test names, values, reference ranges, and critical flags',
          'Identify abnormal results and clinical significance',
          'Look for ordering physician and lab facility information'
        ],
        requiredFields: ['patient_identifier', 'test_date', 'ordering_physician'],
        complianceConsiderations: ['Clinical Laboratory Improvement Amendments (CLIA)', 'HIPAA'],
        suggestedAnalysis: ['test_result_extraction', 'critical_value_detection', 'trend_analysis'],
        priority: 9
      },
      {
        industry: 'medical',
        documentType: 'imaging_reports',
        commonNames: ['Radiology Report', 'X-ray Report', 'MRI Report', 'CT Scan Report'],
        description: 'Medical imaging reports and radiological findings',
        processingHints: [
          'Extract imaging findings, impressions, and recommendations',
          'Identify anatomical locations and pathological findings',
          'Look for comparison studies and follow-up recommendations'
        ],
        requiredFields: ['patient_identifier', 'study_date', 'modality', 'radiologist'],
        complianceConsiderations: ['HIPAA', 'ACR Guidelines', 'DICOM standards'],
        suggestedAnalysis: ['radiology_extraction', 'finding_classification', 'report_summarization'],
        priority: 8
      }
    ],
    legal: [
      {
        industry: 'legal',
        documentType: 'contracts',
        commonNames: ['Contract', 'Agreement', 'Legal Agreement', 'Service Contract'],
        description: 'Legal contracts and agreements between parties',
        processingHints: [
          'Extract party information, key terms, and obligations',
          'Identify important dates, payment terms, and termination clauses',
          'Look for governing law and dispute resolution mechanisms'
        ],
        requiredFields: ['parties', 'effective_date', 'governing_law'],
        complianceConsiderations: ['Attorney-client privilege', 'Contract law requirements'],
        suggestedAnalysis: ['contract_analysis', 'risk_assessment', 'obligation_extraction'],
        priority: 10
      },
      {
        industry: 'legal',
        documentType: 'legal_briefs',
        commonNames: ['Legal Brief', 'Motion', 'Pleading', 'Court Filing'],
        description: 'Legal briefs, motions, and court documents',
        processingHints: [
          'Extract case information, legal arguments, and citations',
          'Identify court jurisdiction and case numbers',
          'Look for procedural requirements and deadlines'
        ],
        requiredFields: ['case_number', 'court', 'filing_date', 'attorney'],
        complianceConsiderations: ['Court rules', 'Professional responsibility rules'],
        suggestedAnalysis: ['legal_citation_extraction', 'argument_analysis', 'precedent_identification'],
        priority: 9
      },
      {
        industry: 'legal',
        documentType: 'discovery_documents',
        commonNames: ['Discovery', 'Document Production', 'Deposition', 'Interrogatories'],
        description: 'Discovery documents and evidence materials',
        processingHints: [
          'Extract relevant facts and evidence',
          'Identify privileged information that should be protected',
          'Look for responsive documents and key witnesses'
        ],
        requiredFields: ['case_identifier', 'production_date', 'privilege_log'],
        complianceConsiderations: ['Attorney-client privilege', 'Work product doctrine', 'Discovery rules'],
        suggestedAnalysis: ['privilege_review', 'relevance_assessment', 'fact_extraction'],
        priority: 8
      }
    ],
    logistics: [
      {
        industry: 'logistics',
        documentType: 'bill_of_lading',
        commonNames: ['Bill of Lading', 'BOL', 'Shipping Bill', 'Waybill'],
        description: 'Bill of lading and shipping documents',
        processingHints: [
          'Extract shipper, consignee, and carrier information',
          'Identify cargo details, weight, and shipping terms',
          'Look for special handling instructions and hazmat information'
        ],
        requiredFields: ['shipper', 'consignee', 'carrier', 'cargo_description'],
        complianceConsiderations: ['DOT regulations', 'International shipping rules', 'Customs requirements'],
        suggestedAnalysis: ['shipment_tracking', 'compliance_check', 'route_optimization'],
        priority: 10
      },
      {
        industry: 'logistics',
        documentType: 'customs_documents',
        commonNames: ['Customs Declaration', 'Commercial Invoice', 'Certificate of Origin'],
        description: 'Customs and international trade documents',
        processingHints: [
          'Extract product classifications (HS codes) and values',
          'Identify country of origin and trade agreement benefits',
          'Look for duty rates and tax information'
        ],
        requiredFields: ['hs_code', 'country_of_origin', 'declared_value'],
        complianceConsiderations: ['Customs regulations', 'Trade agreements', 'Import/export controls'],
        suggestedAnalysis: ['customs_classification', 'duty_calculation', 'compliance_verification'],
        priority: 9
      }
    ]
  };

  async generateDocumentRecommendations(userId: string): Promise<DocumentRecommendation[]> {
    try {
      const context = await this.buildRecommendationContext(userId);
      if (!context.industry) return [];

      const recommendations: InsertDocumentRecommendation[] = [];

      // Get document profiles for the user's industry
      const industryProfiles = this.documentProfiles[context.industry] || [];

      // Generate recommendations based on different strategies
      recommendations.push(...await this.generateOnboardingRecommendations(context));
      recommendations.push(...await this.generateBehaviorBasedRecommendations(context));
      recommendations.push(...await this.generateComplianceRecommendations(context));
      recommendations.push(...await this.generateWorkflowRecommendations(context));

      // Save recommendations to database
      const savedRecommendations: DocumentRecommendation[] = [];
      for (const rec of recommendations) {
        try {
          const saved = await storage.createDocumentRecommendation(rec);
          savedRecommendations.push(saved);
        } catch (error) {
          console.error('Error saving recommendation:', error);
        }
      }

      return savedRecommendations;
    } catch (error) {
      console.error('Error generating document recommendations:', error);
      return [];
    }
  }

  private async buildRecommendationContext(userId: string): Promise<RecommendationContext> {
    const [user, profile, recentBehavior, existingDocuments] = await Promise.all([
      storage.getUser(userId),
      storage.getOnboardingProfile(userId),
      storage.getUserBehaviorPatterns(userId, 20),
      storage.getUserDocuments(userId, 10)
    ]);

    const now = new Date();
    return {
      userId,
      industry: user?.industry || 'general',
      userProfile: profile || undefined,
      recentBehavior: recentBehavior || [],
      existingDocuments: existingDocuments || [],
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay()
    };
  }

  private async generateOnboardingRecommendations(context: RecommendationContext): Promise<InsertDocumentRecommendation[]> {
    const recommendations: InsertDocumentRecommendation[] = [];

    if (!context.userProfile?.onboardingCompleted) {
      // New user - suggest getting started documents
      const industryProfiles = this.documentProfiles[context.industry] || [];
      const topProfile = industryProfiles.find(p => p.priority >= 9);

      if (topProfile) {
        recommendations.push({
          userId: context.userId,
          industry: context.industry,
          recommendationType: 'upload_suggestion',
          documentType: topProfile.documentType,
          title: `Get Started with ${topProfile.commonNames[0]}`,
          description: `Upload your first ${topProfile.commonNames[0].toLowerCase()} to see how DOKTECH can help streamline your ${context.industry} workflow.`,
          reason: `${topProfile.commonNames[0]} documents are commonly used in ${context.industry} and will give you a great introduction to DOKTECH's capabilities.`,
          priority: 'high',
          relevanceScore: 0.9,
          actionRequired: true,
          contextualData: {
            isOnboardingRecommendation: true,
            documentProfile: topProfile
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    } else if (context.userProfile?.primaryUseCases && context.userProfile.primaryUseCases.length > 0) {
      // Suggest documents based on stated use cases
      const useCases = context.userProfile.primaryUseCases;
      const industryProfiles = this.documentProfiles[context.industry] || [];

      for (const useCase of useCases) {
        const matchingProfile = industryProfiles.find(p => p.documentType === useCase);
        if (matchingProfile) {
          const hasThisDocType = context.existingDocuments?.some(d => d.documentType === useCase);
          
          if (!hasThisDocType) {
            recommendations.push({
              userId: context.userId,
              industry: context.industry,
              recommendationType: 'upload_suggestion',
              documentType: matchingProfile.documentType,
              title: `Upload ${matchingProfile.commonNames[0]}`,
              description: `Based on your profile, ${matchingProfile.commonNames[0].toLowerCase()} documents would be valuable to process.`,
              reason: `You indicated that ${useCase.replace('_', ' ')} is a primary use case for your workflow.`,
              priority: 'medium',
              relevanceScore: 0.7,
              contextualData: {
                isProfileBasedRecommendation: true,
                documentProfile: matchingProfile
              },
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            });
          }
        }
      }
    }

    return recommendations;
  }

  private async generateBehaviorBasedRecommendations(context: RecommendationContext): Promise<InsertDocumentRecommendation[]> {
    const recommendations: InsertDocumentRecommendation[] = [];

    if (!context.recentBehavior || context.recentBehavior.length === 0) {
      return recommendations;
    }

    // Analyze recent behavior patterns
    const behaviorAnalysis = await storage.analyzeUserPatterns(context.userId, 168); // Last week
    
    // Suggest documents based on processing patterns
    if (behaviorAnalysis.eventCounts.upload && behaviorAnalysis.completionRate > 0.8) {
      // User is actively uploading and successfully processing documents
      const mostProcessedType = Object.entries(behaviorAnalysis.documentTypeCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      if (mostProcessedType) {
        const [docType] = mostProcessedType;
        const industryProfiles = this.documentProfiles[context.industry] || [];
        const relatedProfiles = industryProfiles.filter(p => 
          p.documentType !== docType && 
          p.suggestedAnalysis.some(analysis => 
            industryProfiles.find(ip => ip.documentType === docType)?.suggestedAnalysis.includes(analysis)
          )
        );

        for (const relatedProfile of relatedProfiles.slice(0, 2)) {
          recommendations.push({
            userId: context.userId,
            industry: context.industry,
            recommendationType: 'workflow_optimization',
            documentType: relatedProfile.documentType,
            title: `Expand Your Workflow with ${relatedProfile.commonNames[0]}`,
            description: `Since you're successfully processing ${docType.replace('_', ' ')}, you might benefit from adding ${relatedProfile.commonNames[0].toLowerCase()}.`,
            reason: `Users who process ${docType.replace('_', ' ')} often benefit from also processing ${relatedProfile.documentType.replace('_', ' ')}.`,
            priority: 'medium',
            relevanceScore: 0.6,
            contextualData: {
              isBehaviorBasedRecommendation: true,
              relatedDocumentType: docType,
              documentProfile: relatedProfile
            },
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
          });
        }
      }
    }

    // Suggest process improvements based on abandonment patterns
    if (behaviorAnalysis.abandonedActions > 2) {
      recommendations.push({
        userId: context.userId,
        industry: context.industry,
        recommendationType: 'workflow_optimization',
        title: 'Optimize Your Document Processing',
        description: 'We noticed some incomplete processing sessions. Let us help you streamline your workflow.',
        reason: `Recent analysis shows ${behaviorAnalysis.abandonedActions} incomplete sessions. We can suggest optimizations.`,
        priority: 'high',
        relevanceScore: 0.8,
        actionRequired: true,
        contextualData: {
          isWorkflowOptimization: true,
          abandonedActions: behaviorAnalysis.abandonedActions,
          completionRate: behaviorAnalysis.completionRate
        },
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });
    }

    return recommendations;
  }

  private async generateComplianceRecommendations(context: RecommendationContext): Promise<InsertDocumentRecommendation[]> {
    const recommendations: InsertDocumentRecommendation[] = [];

    if (!context.userProfile?.complianceRequirements) {
      return recommendations;
    }

    const complianceRequirements = context.userProfile.complianceRequirements;

    // HIPAA compliance recommendations
    if (complianceRequirements.includes('hipaa') && context.industry === 'medical') {
      const hasPatientRecords = context.existingDocuments?.some(d => 
        d.documentType === 'patient_records' || d.documentType === 'medical_records'
      );

      if (hasPatientRecords) {
        recommendations.push({
          userId: context.userId,
          industry: context.industry,
          recommendationType: 'analysis_type',
          title: 'HIPAA Compliance Analysis',
          description: 'Ensure your patient records are fully HIPAA compliant with our specialized analysis.',
          reason: 'You have patient records and HIPAA compliance is marked as important for your practice.',
          priority: 'high',
          relevanceScore: 0.9,
          actionRequired: true,
          contextualData: {
            isComplianceRecommendation: true,
            complianceType: 'hipaa',
            analysisType: 'hipaa_compliance_check'
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    }

    // Legal privilege recommendations
    if (complianceRequirements.includes('attorney_client_privilege') && context.industry === 'legal') {
      const hasLegalDocs = context.existingDocuments?.some(d => 
        d.documentType?.includes('legal') || d.documentType?.includes('contract')
      );

      if (hasLegalDocs) {
        recommendations.push({
          userId: context.userId,
          industry: context.industry,
          recommendationType: 'analysis_type',
          title: 'Attorney-Client Privilege Review',
          description: 'Automatically identify and protect privileged communications in your legal documents.',
          reason: 'Attorney-client privilege protection is essential for your legal documents.',
          priority: 'high',
          relevanceScore: 0.85,
          actionRequired: true,
          contextualData: {
            isComplianceRecommendation: true,
            complianceType: 'attorney_client_privilege',
            analysisType: 'privilege_review'
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    }

    return recommendations;
  }

  private async generateWorkflowRecommendations(context: RecommendationContext): Promise<InsertDocumentRecommendation[]> {
    const recommendations: InsertDocumentRecommendation[] = [];

    // Time-based recommendations
    if (context.timeOfDay != null && context.dayOfWeek != null && 
        context.timeOfDay >= 9 && context.timeOfDay <= 17 && context.dayOfWeek >= 1 && context.dayOfWeek <= 5) {
      // Business hours - suggest productivity optimizations
      const hasHighVolume = context.userProfile?.documentVolume === 'high' || context.userProfile?.documentVolume === 'very_high';
      
      if (hasHighVolume && context.existingDocuments && context.existingDocuments.length > 5) {
        recommendations.push({
          userId: context.userId,
          industry: context.industry,
          recommendationType: 'workflow_optimization',
          title: 'Batch Processing Optimization',
          description: 'Process multiple documents simultaneously to save time and improve efficiency.',
          reason: 'Your high document volume could benefit from batch processing capabilities.',
          priority: 'medium',
          relevanceScore: 0.7,
          contextualData: {
            isWorkflowRecommendation: true,
            optimizationType: 'batch_processing',
            currentVolume: context.existingDocuments.length
          },
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        });
      }
    }

    // Integration recommendations based on stated needs
    if (context.userProfile?.integrationNeeds && context.userProfile.integrationNeeds.length > 0) {
      const integrationNeeds = context.userProfile.integrationNeeds;
      
      for (const integration of integrationNeeds.slice(0, 2)) {
        recommendations.push({
          userId: context.userId,
          industry: context.industry,
          recommendationType: 'workflow_optimization',
          title: `Connect with ${integration.toUpperCase()}`,
          description: `Streamline your workflow by integrating DOKTECH with your ${integration} system.`,
          reason: `You indicated ${integration} integration is important for your workflow.`,
          priority: 'medium',
          relevanceScore: 0.6,
          contextualData: {
            isIntegrationRecommendation: true,
            integrationType: integration
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    }

    return recommendations;
  }

  async detectDocumentType(extractedText: string, fileName: string, industry: string): Promise<{
    detectedType: string | null;
    confidence: number;
    suggestions: string[];
    processingHints: string[];
  }> {
    try {
      const industryProfiles = this.documentProfiles[industry] || [];
      const scores: Array<{ type: string; score: number; profile: DocumentTypeProfile }> = [];

      for (const profile of industryProfiles) {
        let score = 0;

        // Check file name
        for (const commonName of profile.commonNames) {
          const nameWords = commonName.toLowerCase().split(/\s+/);
          const fileNameLower = fileName.toLowerCase();
          
          for (const word of nameWords) {
            if (fileNameLower.includes(word)) {
              score += 0.3;
            }
          }
        }

        // Check content for required fields
        const textLower = extractedText.toLowerCase();
        for (const field of profile.requiredFields) {
          const fieldWords = field.replace(/_/g, ' ').toLowerCase();
          if (textLower.includes(fieldWords)) {
            score += 0.4;
          }
        }

        // Check for industry-specific keywords
        const industryKeywords = this.getIndustryKeywords(industry, profile.documentType);
        for (const keyword of industryKeywords) {
          if (textLower.includes(keyword.toLowerCase())) {
            score += 0.2;
          }
        }

        scores.push({ type: profile.documentType, score, profile });
      }

      // Sort by score
      scores.sort((a, b) => b.score - a.score);

      const topMatch = scores[0];
      const detectedType = topMatch && topMatch.score > 0.5 ? topMatch.type : null;
      const confidence = topMatch ? Math.min(topMatch.score, 1.0) : 0;

      // Generate suggestions
      const suggestions = scores
        .filter(s => s.score > 0.3)
        .slice(0, 3)
        .map(s => s.profile.commonNames[0]);

      // Get processing hints
      const processingHints = topMatch?.profile.processingHints || [];

      return {
        detectedType,
        confidence,
        suggestions,
        processingHints
      };
    } catch (error) {
      console.error('Error detecting document type:', error);
      return {
        detectedType: null,
        confidence: 0,
        suggestions: [],
        processingHints: []
      };
    }
  }

  private getIndustryKeywords(industry: string, documentType: string): string[] {
    const keywordMap: Record<string, Record<string, string[]>> = {
      medical: {
        patient_records: ['patient', 'diagnosis', 'treatment', 'physician', 'medical record', 'chart', 'history'],
        lab_results: ['laboratory', 'test result', 'blood work', 'specimen', 'reference range', 'abnormal'],
        imaging_reports: ['radiology', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'imaging', 'radiologist']
      },
      legal: {
        contracts: ['agreement', 'contract', 'party', 'whereas', 'terms', 'conditions', 'execute'],
        legal_briefs: ['court', 'motion', 'brief', 'plaintiff', 'defendant', 'jurisdiction', 'case'],
        discovery_documents: ['discovery', 'deposition', 'exhibit', 'evidence', 'witness', 'interrogatory']
      },
      logistics: {
        bill_of_lading: ['bill of lading', 'shipper', 'consignee', 'carrier', 'freight', 'cargo'],
        customs_documents: ['customs', 'hs code', 'tariff', 'duty', 'import', 'export', 'declaration']
      }
    };

    return keywordMap[industry]?.[documentType] || [];
  }

  async getUserRecommendations(userId: string, includeExpired: boolean = false): Promise<DocumentRecommendation[]> {
    try {
      return await storage.getUserRecommendations(userId, !includeExpired);
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      return [];
    }
  }

  async dismissRecommendation(recommendationId: number, userId: string): Promise<void> {
    try {
      await storage.dismissRecommendation(recommendationId, userId);
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  }

  async actOnRecommendation(recommendationId: number, userId: string): Promise<void> {
    try {
      await storage.actOnRecommendation(recommendationId, userId);
    } catch (error) {
      console.error('Error acting on recommendation:', error);
    }
  }

  getDocumentProfile(industry: string, documentType: string): DocumentTypeProfile | null {
    const industryProfiles = this.documentProfiles[industry];
    return industryProfiles?.find(p => p.documentType === documentType) || null;
  }

  getAllDocumentProfiles(industry: string): DocumentTypeProfile[] {
    return this.documentProfiles[industry] || [];
  }
}

export const documentIntelligenceService = new DocumentIntelligenceService();