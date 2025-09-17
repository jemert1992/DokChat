import { storage } from '../storage';
import type { 
  InsertContextualGuidance,
  ContextualGuidance,
  UserOnboardingProfile,
  User
} from '@shared/schema';

interface GuidanceRule {
  id: string;
  industry: string;
  pageContext: string;
  elementContext?: string;
  conditions: {
    userExperience?: string[];
    onboardingStep?: number[];
    hasDocuments?: boolean;
    documentTypes?: string[];
    complianceRequirements?: string[];
    organizationSize?: string[];
    timeOfDay?: number[];
    daysSinceLastActivity?: number;
  };
  guidance: {
    type: 'tooltip' | 'help_card' | 'tutorial' | 'suggestion' | 'notification';
    title: string;
    content: string;
    actionSuggested?: string;
    priority: 'low' | 'medium' | 'high';
    showOnce?: boolean;
    persistUntilInteraction?: boolean;
  };
}

export class ContextualGuidanceService {
  private guidanceRules: GuidanceRule[] = [
    // Medical Industry Guidance
    {
      id: 'medical_upload_first_time',
      industry: 'medical',
      pageContext: 'dashboard',
      elementContext: 'upload-zone',
      conditions: {
        userExperience: ['beginner'],
        hasDocuments: false
      },
      guidance: {
        type: 'help_card',
        title: 'Upload Your First Patient Record',
        content: 'Start by uploading a patient medical record. DOKTECH will automatically detect PHI (Protected Health Information) and ensure HIPAA compliance while extracting clinical insights.',
        actionSuggested: 'Click here to select a patient record file',
        priority: 'high',
        showOnce: false
      }
    },
    {
      id: 'medical_hipaa_compliance',
      industry: 'medical',
      pageContext: 'document-analysis',
      conditions: {
        complianceRequirements: ['hipaa'],
        documentTypes: ['patient_records', 'lab_results']
      },
      guidance: {
        type: 'notification',
        title: 'HIPAA Compliance Active',
        content: 'Your document is being processed with HIPAA compliance measures. PHI detection and secure handling protocols are automatically applied.',
        priority: 'medium',
        showOnce: true
      }
    },
    {
      id: 'medical_clinical_insights',
      industry: 'medical',
      pageContext: 'document-analysis',
      conditions: {
        userExperience: ['intermediate', 'advanced'],
        documentTypes: ['patient_records']
      },
      guidance: {
        type: 'suggestion',
        title: 'Enhanced Clinical Analysis Available',
        content: 'Based on this patient record, DOKTECH can extract medications, diagnoses, allergies, and vital signs. Enable advanced clinical analysis for comprehensive insights.',
        actionSuggested: 'Enable Advanced Clinical Analysis',
        priority: 'medium'
      }
    },
    {
      id: 'medical_integration_ehr',
      industry: 'medical',
      pageContext: 'dashboard',
      conditions: {
        organizationSize: ['medium', 'large', 'hospital'],
        daysSinceLastActivity: 7
      },
      guidance: {
        type: 'suggestion',
        title: 'Connect Your EHR System',
        content: 'Streamline your workflow by connecting DOKTECH with your Electronic Health Record system. This enables automatic data sync and reduces manual data entry.',
        actionSuggested: 'View EHR Integration Options',
        priority: 'medium'
      }
    },

    // Legal Industry Guidance
    {
      id: 'legal_contract_review',
      industry: 'legal',
      pageContext: 'dashboard',
      elementContext: 'upload-zone',
      conditions: {
        userExperience: ['beginner', 'intermediate'],
        hasDocuments: false
      },
      guidance: {
        type: 'help_card',
        title: 'Start with Contract Analysis',
        content: 'Upload a contract or legal agreement to see DOKTECH\'s powerful legal analysis capabilities. We\'ll extract key terms, identify risks, and highlight important clauses.',
        actionSuggested: 'Upload a contract document',
        priority: 'high'
      }
    },
    {
      id: 'legal_privilege_protection',
      industry: 'legal',
      pageContext: 'document-analysis',
      conditions: {
        complianceRequirements: ['attorney_client_privilege']
      },
      guidance: {
        type: 'notification',
        title: 'Attorney-Client Privilege Protected',
        content: 'This document is being processed with attorney-client privilege protection. Confidential communications are automatically identified and secured.',
        priority: 'high',
        showOnce: true,
        persistUntilInteraction: true
      }
    },
    {
      id: 'legal_risk_assessment',
      industry: 'legal',
      pageContext: 'document-analysis',
      conditions: {
        documentTypes: ['contracts'],
        userExperience: ['advanced', 'expert']
      },
      guidance: {
        type: 'suggestion',
        title: 'AI-Powered Risk Assessment',
        content: 'Enable comprehensive risk assessment to identify potential legal issues, unfavorable terms, and missing protective clauses in this contract.',
        actionSuggested: 'Run Risk Assessment',
        priority: 'medium'
      }
    },
    {
      id: 'legal_case_management',
      industry: 'legal',
      pageContext: 'dashboard',
      conditions: {
        documentTypes: ['legal_briefs', 'discovery_documents'],
        organizationSize: ['medium', 'large']
      },
      guidance: {
        type: 'suggestion',
        title: 'Case Management Integration',
        content: 'Connect DOKTECH with your case management system to automatically organize documents by case, track deadlines, and maintain chronological records.',
        actionSuggested: 'Explore Case Management Features',
        priority: 'medium'
      }
    },

    // Logistics Industry Guidance
    {
      id: 'logistics_shipping_docs',
      industry: 'logistics',
      pageContext: 'dashboard',
      elementContext: 'upload-zone',
      conditions: {
        hasDocuments: false
      },
      guidance: {
        type: 'help_card',
        title: 'Process Shipping Documents',
        content: 'Upload bills of lading, commercial invoices, or customs documents to streamline your supply chain operations. DOKTECH extracts shipping details and verifies compliance.',
        actionSuggested: 'Upload shipping documents',
        priority: 'high'
      }
    },
    {
      id: 'logistics_customs_compliance',
      industry: 'logistics',
      pageContext: 'document-analysis',
      conditions: {
        documentTypes: ['customs_documents', 'bill_of_lading']
      },
      guidance: {
        type: 'notification',
        title: 'Customs Compliance Check Active',
        content: 'DOKTECH is verifying customs compliance, checking HS codes, and validating trade documentation requirements for international shipments.',
        priority: 'medium',
        showOnce: true
      }
    },
    {
      id: 'logistics_tracking_optimization',
      industry: 'logistics',
      pageContext: 'dashboard',
      conditions: {
        documentTypes: ['bill_of_lading'],
        userExperience: ['intermediate', 'advanced']
      },
      guidance: {
        type: 'suggestion',
        title: 'Shipment Tracking Integration',
        content: 'Automatically extract tracking numbers and shipping details to integrate with your logistics management system for real-time shipment visibility.',
        actionSuggested: 'Enable Tracking Integration',
        priority: 'medium'
      }
    },

    // General Cross-Industry Guidance
    {
      id: 'general_behavior_tracking',
      industry: 'all',
      pageContext: 'dashboard',
      conditions: {
        daysSinceLastActivity: 1
      },
      guidance: {
        type: 'suggestion',
        title: 'Workflow Analytics Available',
        content: 'DOKTECH has been learning from your usage patterns. View personalized insights about your document processing workflow and optimization suggestions.',
        actionSuggested: 'View Workflow Analytics',
        priority: 'low'
      }
    },
    {
      id: 'general_batch_processing',
      industry: 'all',
      pageContext: 'dashboard',
      conditions: {
        hasDocuments: true,
        userExperience: ['advanced', 'expert']
      },
      guidance: {
        type: 'tooltip',
        title: 'Batch Processing Available',
        content: 'Process multiple similar documents simultaneously to save time. Select multiple files or drag a folder to enable batch processing.',
        priority: 'low'
      }
    },
    {
      id: 'general_ai_confidence',
      industry: 'all',
      pageContext: 'document-analysis',
      conditions: {
        userExperience: ['expert']
      },
      guidance: {
        type: 'tooltip',
        title: 'AI Confidence Indicators',
        content: 'Confidence scores show how certain our AI is about extracted data. Scores below 70% may need manual verification.',
        priority: 'low'
      }
    }
  ];

  async generateContextualGuidance(
    userId: string, 
    pageContext: string, 
    elementContext?: string
  ): Promise<ContextualGuidance[]> {
    try {
      const context = await this.buildGuidanceContext(userId);
      const applicableRules = this.findApplicableRules(context, pageContext, elementContext);
      
      const guidanceItems: InsertContextualGuidance[] = [];

      for (const rule of applicableRules) {
        // Check if this guidance was already shown recently
        const existingGuidance = await storage.getContextualGuidance(userId, pageContext);
        const alreadyShown = existingGuidance.some(g => 
          g.title === rule.guidance.title && 
          (rule.guidance.showOnce ? g.viewed : false)
        );

        if (!alreadyShown) {
          guidanceItems.push({
            userId,
            guidanceType: rule.guidance.type,
            pageContext,
            elementContext: elementContext || rule.elementContext || null,
            industrySpecific: rule.industry !== 'all',
            title: rule.guidance.title,
            content: rule.guidance.content,
            actionSuggested: rule.guidance.actionSuggested || null
          });
        }
      }

      // Save guidance items to database
      const savedGuidance: ContextualGuidance[] = [];
      for (const item of guidanceItems) {
        try {
          const saved = await storage.createContextualGuidance(item);
          savedGuidance.push(saved);
        } catch (error) {
          console.error('Error saving guidance:', error);
        }
      }

      return savedGuidance;
    } catch (error) {
      console.error('Error generating contextual guidance:', error);
      return [];
    }
  }

  private async buildGuidanceContext(userId: string) {
    const [user, profile, documents, behaviorAnalysis] = await Promise.all([
      storage.getUser(userId),
      storage.getOnboardingProfile(userId),
      storage.getUserDocuments(userId, 20),
      storage.analyzeUserPatterns(userId, 168) // Last week
    ]);

    const lastActivityDate = documents?.[0]?.createdAt;
    const daysSinceLastActivity = lastActivityDate 
      ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      user,
      profile,
      documents: documents || [],
      behaviorAnalysis,
      daysSinceLastActivity,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }

  private findApplicableRules(context: any, pageContext: string, elementContext?: string): GuidanceRule[] {
    const { user, profile, documents, daysSinceLastActivity, timeOfDay } = context;
    
    return this.guidanceRules.filter(rule => {
      // Check industry match
      if (rule.industry !== 'all' && rule.industry !== user?.industry) {
        return false;
      }

      // Check page context
      if (rule.pageContext !== pageContext) {
        return false;
      }

      // Check element context if specified
      if (rule.elementContext && rule.elementContext !== elementContext) {
        return false;
      }

      // Check conditions
      const conditions = rule.conditions;

      // User experience level
      if (conditions.userExperience && profile?.experienceLevel) {
        if (!conditions.userExperience.includes(profile.experienceLevel)) {
          return false;
        }
      }

      // Onboarding step
      if (conditions.onboardingStep && profile?.onboardingStep) {
        if (!conditions.onboardingStep.includes(profile.onboardingStep)) {
          return false;
        }
      }

      // Has documents
      if (conditions.hasDocuments !== undefined) {
        const hasDocuments = documents.length > 0;
        if (conditions.hasDocuments !== hasDocuments) {
          return false;
        }
      }

      // Document types
      if (conditions.documentTypes && documents.length > 0) {
        const userDocTypes = documents.map(d => d.documentType).filter(Boolean);
        const hasMatchingType = conditions.documentTypes.some(type => 
          userDocTypes.includes(type)
        );
        if (!hasMatchingType) {
          return false;
        }
      }

      // Compliance requirements
      if (conditions.complianceRequirements && profile?.complianceRequirements) {
        const hasMatchingCompliance = conditions.complianceRequirements.some(req =>
          profile.complianceRequirements?.includes(req)
        );
        if (!hasMatchingCompliance) {
          return false;
        }
      }

      // Organization size
      if (conditions.organizationSize && profile?.organizationSize) {
        if (!conditions.organizationSize.includes(profile.organizationSize)) {
          return false;
        }
      }

      // Time of day
      if (conditions.timeOfDay && !conditions.timeOfDay.includes(timeOfDay)) {
        return false;
      }

      // Days since last activity
      if (conditions.daysSinceLastActivity !== undefined) {
        if (daysSinceLastActivity < conditions.daysSinceLastActivity) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.guidance.priority] - priorityOrder[a.guidance.priority];
    });
  }

  async markGuidanceViewed(guidanceId: number, userId: string): Promise<void> {
    try {
      await storage.markGuidanceViewed(guidanceId, userId);
    } catch (error) {
      console.error('Error marking guidance as viewed:', error);
    }
  }

  async markGuidanceCompleted(guidanceId: number, userId: string): Promise<void> {
    try {
      await storage.markGuidanceCompleted(guidanceId, userId);
    } catch (error) {
      console.error('Error marking guidance as completed:', error);
    }
  }

  async rateGuidanceHelpfulness(guidanceId: number, userId: string, rating: number): Promise<void> {
    try {
      await storage.rateGuidanceHelpfulness(guidanceId, userId, rating);
    } catch (error) {
      console.error('Error rating guidance helpfulness:', error);
    }
  }

  async getContextualGuidance(userId: string, pageContext: string): Promise<ContextualGuidance[]> {
    try {
      return await storage.getContextualGuidance(userId, pageContext);
    } catch (error) {
      console.error('Error getting contextual guidance:', error);
      return [];
    }
  }

  // Real-time guidance based on user actions
  async generateActionBasedGuidance(
    userId: string, 
    action: string, 
    context: Record<string, any>
  ): Promise<ContextualGuidance | null> {
    try {
      const user = await storage.getUser(userId);
      const profile = await storage.getOnboardingProfile(userId);

      if (!user || !profile) return null;

      let guidance: InsertContextualGuidance | null = null;

      // Document upload guidance
      if (action === 'document_uploaded' && context.documentType) {
        if (user.industry === 'medical' && context.documentType === 'patient_records') {
          guidance = {
            userId,
            guidanceType: 'suggestion',
            pageContext: 'document-analysis',
            industrySpecific: true,
            title: 'HIPAA Compliance Check Recommended',
            content: 'For patient records, we recommend enabling our HIPAA compliance analysis to ensure all PHI is properly identified and protected.',
            actionSuggested: 'Enable HIPAA Analysis'
          };
        } else if (user.industry === 'legal' && context.documentType === 'contracts') {
          guidance = {
            userId,
            guidanceType: 'suggestion',
            pageContext: 'document-analysis',
            industrySpecific: true,
            title: 'Contract Risk Assessment Available',
            content: 'This contract can be analyzed for potential risks, unfavorable terms, and missing protective clauses.',
            actionSuggested: 'Run Risk Assessment'
          };
        }
      }

      // Processing completion guidance
      if (action === 'processing_completed' && context.confidence && context.confidence < 0.7) {
        guidance = {
          userId,
          guidanceType: 'notification',
          pageContext: 'document-analysis',
          industrySpecific: false,
          title: 'Low Confidence Detected',
          content: `Some extracted data has confidence below 70%. Review highlighted fields and consider manual verification for critical information.`,
          actionSuggested: 'Review Low Confidence Fields'
        };
      }

      if (guidance) {
        return await storage.createContextualGuidance(guidance);
      }

      return null;
    } catch (error) {
      console.error('Error generating action-based guidance:', error);
      return null;
    }
  }

  // Adaptive guidance based on user behavior patterns
  async generateAdaptiveGuidance(userId: string): Promise<ContextualGuidance[]> {
    try {
      const behaviorAnalysis = await storage.analyzeUserPatterns(userId, 168); // Last week
      const profile = await storage.getOnboardingProfile(userId);
      const user = await storage.getUser(userId);

      if (!user || !profile) return [];

      const adaptiveGuidance: InsertContextualGuidance[] = [];

      // Detect frustrated users (high abandonment rate)
      if (behaviorAnalysis.abandonedActions > 3 && behaviorAnalysis.completionRate < 0.5) {
        adaptiveGuidance.push({
          userId,
          guidanceType: 'help_card',
          pageContext: 'dashboard',
          industrySpecific: false,
          title: 'Need Help Getting Started?',
          content: 'We noticed you might be having trouble. Our support team can provide personalized assistance to help you get the most out of DOKTECH.',
          actionSuggested: 'Contact Support'
        });
      }

      // Suggest advanced features for power users
      if (behaviorAnalysis.totalPatterns > 50 && behaviorAnalysis.completionRate > 0.9) {
        if (profile.experienceLevel !== 'expert') {
          adaptiveGuidance.push({
            userId,
            guidanceType: 'suggestion',
            pageContext: 'dashboard',
            industrySpecific: false,
            title: 'Ready for Advanced Features?',
            content: 'Based on your usage patterns, you might be ready for advanced features like custom workflows, API integrations, and batch processing.',
            actionSuggested: 'Explore Advanced Features'
          });
        }
      }

      // Industry-specific adaptive guidance
      if (user.industry === 'medical' && behaviorAnalysis.documentTypeCounts.patient_records > 10) {
        adaptiveGuidance.push({
          userId,
          guidanceType: 'suggestion',
          pageContext: 'dashboard',
          industrySpecific: true,
          title: 'EHR Integration Recommended',
          content: 'You\'re processing many patient records. Connecting to your EHR system could automate data import and reduce manual work.',
          actionSuggested: 'Set Up EHR Integration'
        });
      }

      // Save adaptive guidance
      const savedGuidance: ContextualGuidance[] = [];
      for (const item of adaptiveGuidance) {
        try {
          const saved = await storage.createContextualGuidance(item);
          savedGuidance.push(saved);
        } catch (error) {
          console.error('Error saving adaptive guidance:', error);
        }
      }

      return savedGuidance;
    } catch (error) {
      console.error('Error generating adaptive guidance:', error);
      return [];
    }
  }
}

export const contextualGuidanceService = new ContextualGuidanceService();