import { storage } from '../storage';
import type { 
  InsertUserOnboardingProfile, 
  UserOnboardingProfile,
  User 
} from '@shared/schema';

interface OnboardingQuestion {
  id: string;
  type: 'select' | 'multiselect' | 'text' | 'boolean' | 'range';
  question: string;
  description?: string;
  options?: { value: string; label: string; description?: string }[];
  required: boolean;
  industrySpecific: boolean;
  condition?: (answers: Record<string, any>) => boolean;
}

interface IndustryOnboardingFlow {
  industry: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  questions: OnboardingQuestion[];
  defaultProfile: Partial<InsertUserOnboardingProfile>;
}

export class SmartOnboardingService {
  private industryFlows: Record<string, IndustryOnboardingFlow> = {
    medical: {
      industry: 'medical',
      title: 'Healthcare Professional Setup',
      description: 'Let\'s customize DOKTECH for your medical practice and compliance needs.',
      estimatedTime: 5,
      questions: [
        {
          id: 'role',
          type: 'select',
          question: 'What is your primary role in healthcare?',
          description: 'This helps us customize terminology and workflows',
          options: [
            { value: 'physician', label: 'Physician/Doctor', description: 'Primary care or specialist physician' },
            { value: 'nurse', label: 'Registered Nurse', description: 'RN or advanced practice nurse' },
            { value: 'administrator', label: 'Healthcare Administrator', description: 'Hospital or clinic administrator' },
            { value: 'technician', label: 'Medical Technician', description: 'Lab tech, radiology tech, etc.' },
            { value: 'researcher', label: 'Medical Researcher', description: 'Clinical research professional' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'orgSize',
          type: 'select',
          question: 'What size is your healthcare organization?',
          options: [
            { value: 'solo', label: 'Solo Practice', description: '1-2 healthcare providers' },
            { value: 'small', label: 'Small Practice', description: '3-10 healthcare providers' },
            { value: 'medium', label: 'Medium Practice/Clinic', description: '11-50 healthcare providers' },
            { value: 'large', label: 'Large Healthcare System', description: '50+ healthcare providers' },
            { value: 'hospital', label: 'Hospital/Medical Center', description: 'Full-service hospital facility' }
          ],
          required: true,
          industrySpecific: false
        },
        {
          id: 'documentTypes',
          type: 'multiselect',
          question: 'Which types of medical documents do you work with most?',
          description: 'Select all that apply to optimize your experience',
          options: [
            { value: 'patient_records', label: 'Patient Medical Records' },
            { value: 'lab_results', label: 'Laboratory Results' },
            { value: 'imaging_reports', label: 'Imaging Reports (X-ray, MRI, CT)' },
            { value: 'discharge_summaries', label: 'Discharge Summaries' },
            { value: 'clinical_notes', label: 'Clinical Notes & Progress Notes' },
            { value: 'prescriptions', label: 'Prescriptions & Medication Lists' },
            { value: 'insurance_forms', label: 'Insurance & Billing Forms' },
            { value: 'consent_forms', label: 'Patient Consent Forms' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'complianceRequirements',
          type: 'multiselect',
          question: 'Which compliance requirements are most important to your practice?',
          options: [
            { value: 'hipaa', label: 'HIPAA Privacy & Security' },
            { value: 'hitech', label: 'HITECH Act Compliance' },
            { value: 'meaningful_use', label: 'Meaningful Use Requirements' },
            { value: 'joint_commission', label: 'Joint Commission Standards' },
            { value: 'cms', label: 'CMS Quality Measures' },
            { value: 'state_regulations', label: 'State Medical Board Regulations' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'experienceLevel',
          type: 'select',
          question: 'How would you describe your experience with medical document processing?',
          options: [
            { value: 'beginner', label: 'New to Digital Processing', description: 'Mostly paper-based workflows' },
            { value: 'intermediate', label: 'Some Digital Experience', description: 'Basic EMR/EHR usage' },
            { value: 'advanced', label: 'Experienced User', description: 'Comfortable with health IT systems' },
            { value: 'expert', label: 'Health IT Expert', description: 'Advanced knowledge of health informatics' }
          ],
          required: true,
          industrySpecific: false
        },
        {
          id: 'integrationNeeds',
          type: 'multiselect',
          question: 'Which systems would you like to integrate with DOKTECH?',
          description: 'We can help you connect with your existing healthcare systems',
          options: [
            { value: 'epic', label: 'Epic EMR' },
            { value: 'cerner', label: 'Cerner EMR' },
            { value: 'allscripts', label: 'Allscripts' },
            { value: 'athenahealth', label: 'athenahealth' },
            { value: 'practice_fusion', label: 'Practice Fusion' },
            { value: 'lab_systems', label: 'Laboratory Information Systems' },
            { value: 'pacs', label: 'PACS (Medical Imaging)' },
            { value: 'billing', label: 'Medical Billing Systems' }
          ],
          required: false,
          industrySpecific: true
        }
      ],
      defaultProfile: {
        organizationSize: 'medium',
        documentVolume: 'medium',
        experienceLevel: 'intermediate',
        preferredWorkflow: 'real_time',
        complianceRequirements: ['hipaa'],
        successMetrics: ['patient_care_quality', 'processing_speed', 'compliance_score']
      }
    },
    legal: {
      industry: 'legal',
      title: 'Legal Professional Setup',
      description: 'Let\'s configure DOKTECH for your legal practice and document needs.',
      estimatedTime: 4,
      questions: [
        {
          id: 'role',
          type: 'select',
          question: 'What is your role in the legal profession?',
          options: [
            { value: 'attorney', label: 'Attorney/Lawyer', description: 'Licensed practicing attorney' },
            { value: 'paralegal', label: 'Paralegal', description: 'Legal assistant/paralegal' },
            { value: 'legal_admin', label: 'Legal Administrator', description: 'Law firm administrator' },
            { value: 'law_clerk', label: 'Law Clerk', description: 'Law clerk or legal intern' },
            { value: 'compliance_officer', label: 'Compliance Officer', description: 'Corporate legal compliance' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'practiceArea',
          type: 'multiselect',
          question: 'What areas of law do you primarily practice?',
          description: 'Select all areas that apply to your practice',
          options: [
            { value: 'corporate', label: 'Corporate Law' },
            { value: 'litigation', label: 'Litigation' },
            { value: 'real_estate', label: 'Real Estate Law' },
            { value: 'family', label: 'Family Law' },
            { value: 'criminal', label: 'Criminal Law' },
            { value: 'intellectual_property', label: 'Intellectual Property' },
            { value: 'employment', label: 'Employment Law' },
            { value: 'contract', label: 'Contract Law' },
            { value: 'bankruptcy', label: 'Bankruptcy Law' },
            { value: 'personal_injury', label: 'Personal Injury' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'documentTypes',
          type: 'multiselect',
          question: 'Which legal documents do you work with most frequently?',
          options: [
            { value: 'contracts', label: 'Contracts & Agreements' },
            { value: 'briefs', label: 'Legal Briefs & Motions' },
            { value: 'discovery', label: 'Discovery Documents' },
            { value: 'pleadings', label: 'Pleadings & Court Filings' },
            { value: 'deposition', label: 'Depositions & Transcripts' },
            { value: 'wills_estates', label: 'Wills & Estate Documents' },
            { value: 'corporate_filings', label: 'Corporate Filings' },
            { value: 'regulatory_docs', label: 'Regulatory Documents' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'clientConfidentiality',
          type: 'select',
          question: 'What level of client confidentiality do you typically handle?',
          options: [
            { value: 'standard', label: 'Standard Attorney-Client Privilege' },
            { value: 'high_profile', label: 'High-Profile Cases' },
            { value: 'government', label: 'Government/Classified Material' },
            { value: 'corporate_sensitive', label: 'Corporate Trade Secrets' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'firmSize',
          type: 'select',
          question: 'What size is your legal organization?',
          options: [
            { value: 'solo', label: 'Solo Practice', description: '1 attorney' },
            { value: 'small', label: 'Small Firm', description: '2-10 attorneys' },
            { value: 'medium', label: 'Medium Firm', description: '11-50 attorneys' },
            { value: 'large', label: 'Large Firm', description: '50+ attorneys' },
            { value: 'corporate', label: 'Corporate Legal Dept', description: 'In-house legal team' }
          ],
          required: true,
          industrySpecific: false
        }
      ],
      defaultProfile: {
        organizationSize: 'small',
        documentVolume: 'high',
        experienceLevel: 'advanced',
        preferredWorkflow: 'batch',
        complianceRequirements: ['attorney_client_privilege', 'bar_regulations'],
        successMetrics: ['document_accuracy', 'processing_speed', 'client_satisfaction']
      }
    },
    logistics: {
      industry: 'logistics',
      title: 'Supply Chain Professional Setup',
      description: 'Let\'s optimize DOKTECH for your logistics and supply chain operations.',
      estimatedTime: 4,
      questions: [
        {
          id: 'role',
          type: 'select',
          question: 'What is your role in logistics and supply chain?',
          options: [
            { value: 'logistics_manager', label: 'Logistics Manager' },
            { value: 'supply_chain_analyst', label: 'Supply Chain Analyst' },
            { value: 'customs_broker', label: 'Customs Broker' },
            { value: 'freight_forwarder', label: 'Freight Forwarder' },
            { value: 'warehouse_manager', label: 'Warehouse Manager' },
            { value: 'procurement_specialist', label: 'Procurement Specialist' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'operationType',
          type: 'multiselect',
          question: 'What types of logistics operations do you manage?',
          options: [
            { value: 'international_shipping', label: 'International Shipping' },
            { value: 'domestic_transport', label: 'Domestic Transportation' },
            { value: 'customs_clearance', label: 'Customs Clearance' },
            { value: 'warehousing', label: 'Warehousing & Distribution' },
            { value: 'freight_forwarding', label: 'Freight Forwarding' },
            { value: 'last_mile', label: 'Last Mile Delivery' },
            { value: 'reverse_logistics', label: 'Reverse Logistics/Returns' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'documentTypes',
          type: 'multiselect',
          question: 'Which shipping documents do you handle regularly?',
          options: [
            { value: 'bill_of_lading', label: 'Bill of Lading' },
            { value: 'commercial_invoice', label: 'Commercial Invoices' },
            { value: 'packing_list', label: 'Packing Lists' },
            { value: 'customs_declaration', label: 'Customs Declarations' },
            { value: 'certificate_origin', label: 'Certificate of Origin' },
            { value: 'insurance_docs', label: 'Insurance Documents' },
            { value: 'manifest', label: 'Cargo Manifests' },
            { value: 'delivery_receipts', label: 'Delivery Receipts' }
          ],
          required: true,
          industrySpecific: true
        },
        {
          id: 'tradeRegions',
          type: 'multiselect',
          question: 'Which trade regions do you primarily work with?',
          options: [
            { value: 'north_america', label: 'North America (NAFTA/USMCA)' },
            { value: 'europe', label: 'European Union' },
            { value: 'asia_pacific', label: 'Asia-Pacific' },
            { value: 'latin_america', label: 'Latin America' },
            { value: 'middle_east', label: 'Middle East' },
            { value: 'africa', label: 'Africa' }
          ],
          required: true,
          industrySpecific: true
        }
      ],
      defaultProfile: {
        organizationSize: 'medium',
        documentVolume: 'very_high',
        experienceLevel: 'intermediate',
        preferredWorkflow: 'batch',
        complianceRequirements: ['customs_regulations', 'trade_compliance'],
        successMetrics: ['delivery_speed', 'customs_accuracy', 'cost_efficiency']
      }
    }
  };

  async startOnboarding(userId: string, industry: string): Promise<IndustryOnboardingFlow | null> {
    const flow = this.industryFlows[industry];
    if (!flow) return null;

    // Create initial onboarding profile
    try {
      await storage.createOnboardingProfile({
        userId,
        industrySpecificRole: null,
        organizationSize: flow.defaultProfile.organizationSize || 'medium',
        documentVolume: flow.defaultProfile.documentVolume || 'medium',
        primaryUseCases: [],
        complianceRequirements: flow.defaultProfile.complianceRequirements || [],
        integrationNeeds: [],
        experienceLevel: flow.defaultProfile.experienceLevel || 'intermediate',
        preferredWorkflow: flow.defaultProfile.preferredWorkflow || 'real_time',
        priorityFeatures: [],
        painPoints: [],
        successMetrics: flow.defaultProfile.successMetrics || [],
        onboardingCompleted: false,
        onboardingStep: 1,
        preferences: {}
      });
    } catch (error) {
      console.error('Error creating onboarding profile:', error);
    }

    return flow;
  }

  async updateOnboardingStep(userId: string, step: number, answers: Record<string, any>): Promise<void> {
    try {
      const profile = await storage.getOnboardingProfile(userId);
      if (!profile) return;

      const updates: Partial<UserOnboardingProfile> = {
        onboardingStep: step,
        preferences: { 
          ...profile.preferences as any, 
          ...answers 
        },
        updatedAt: new Date()
      };

      // Map specific answers to profile fields
      if (answers.role) {
        updates.industrySpecificRole = answers.role;
      }
      
      if (answers.orgSize || answers.firmSize) {
        updates.organizationSize = answers.orgSize || answers.firmSize;
      }

      if (answers.documentTypes) {
        updates.primaryUseCases = Array.isArray(answers.documentTypes) ? answers.documentTypes : [answers.documentTypes];
      }

      if (answers.complianceRequirements) {
        updates.complianceRequirements = Array.isArray(answers.complianceRequirements) ? answers.complianceRequirements : [answers.complianceRequirements];
      }

      if (answers.integrationNeeds) {
        updates.integrationNeeds = Array.isArray(answers.integrationNeeds) ? answers.integrationNeeds : [answers.integrationNeeds];
      }

      if (answers.experienceLevel) {
        updates.experienceLevel = answers.experienceLevel;
      }

      await storage.updateOnboardingProfile(userId, updates);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  }

  async completeOnboarding(userId: string): Promise<UserOnboardingProfile | null> {
    try {
      const profile = await storage.completeOnboarding(userId);
      
      // Initialize other intelligent systems based on onboarding data
      await this.initializeIntelligentSystems(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return null;
    }
  }

  private async initializeIntelligentSystems(userId: string, profile: UserOnboardingProfile): Promise<void> {
    try {
      // Initialize interface adaptations
      await storage.createInterfaceAdaptation({
        userId,
        industry: profile.preferences?.industry || 'general',
        adaptationLevel: this.getAdaptationLevel(profile.experienceLevel),
        hiddenFeatures: this.getHiddenFeatures(profile),
        emphasizedFeatures: this.getEmphasizedFeatures(profile),
        customTerminology: this.getCustomTerminology(profile),
        layoutPreferences: this.getLayoutPreferences(profile),
        automationLevel: this.getAutomationLevel(profile.experienceLevel),
        learningMode: profile.experienceLevel === 'beginner' || profile.experienceLevel === 'intermediate',
        adaptationScore: 0.5
      });

      // Initialize AI optimizations based on industry
      const user = await storage.getUser(userId);
      if (user?.industry) {
        await this.initializeAIOptimizations(userId, user.industry, profile);
      }

    } catch (error) {
      console.error('Error initializing intelligent systems:', error);
    }
  }

  private getAdaptationLevel(experienceLevel?: string | null): string {
    switch (experienceLevel) {
      case 'beginner': return 'aggressive';
      case 'intermediate': return 'medium';
      case 'advanced': return 'medium';
      case 'expert': return 'minimal';
      default: return 'medium';
    }
  }

  private getHiddenFeatures(profile: UserOnboardingProfile): string[] {
    const hidden = [];
    
    if (profile.experienceLevel === 'beginner') {
      hidden.push('advanced_analytics', 'api_integrations', 'custom_workflows');
    }
    
    if (profile.documentVolume === 'low') {
      hidden.push('batch_processing', 'high_volume_tools');
    }

    return hidden;
  }

  private getEmphasizedFeatures(profile: UserOnboardingProfile): string[] {
    const emphasized = [];
    
    if (profile.complianceRequirements && profile.complianceRequirements.length > 0) {
      emphasized.push('compliance_dashboard', 'security_features');
    }
    
    if (profile.primaryUseCases?.includes('patient_records') || 
        profile.primaryUseCases?.includes('contracts')) {
      emphasized.push('document_security', 'access_controls');
    }

    return emphasized;
  }

  private getCustomTerminology(profile: UserOnboardingProfile): Record<string, string> {
    const terminology: Record<string, string> = {};
    
    if (profile.industrySpecificRole === 'physician') {
      terminology['documents'] = 'Patient Records';
      terminology['analysis'] = 'Clinical Analysis';
      terminology['processing'] = 'Record Processing';
    } else if (profile.industrySpecificRole === 'attorney') {
      terminology['documents'] = 'Legal Documents';
      terminology['analysis'] = 'Document Review';
      terminology['processing'] = 'Case Preparation';
    }

    return terminology;
  }

  private getLayoutPreferences(profile: UserOnboardingProfile): Record<string, any> {
    return {
      densityLevel: profile.experienceLevel === 'expert' ? 'compact' : 'comfortable',
      showAdvancedControls: profile.experienceLevel === 'advanced' || profile.experienceLevel === 'expert',
      emphasizeCompliance: (profile.complianceRequirements?.length || 0) > 2
    };
  }

  private getAutomationLevel(experienceLevel?: string | null): string {
    switch (experienceLevel) {
      case 'beginner': return 'high';
      case 'intermediate': return 'medium';
      case 'advanced': return 'medium';
      case 'expert': return 'minimal';
      default: return 'medium';
    }
  }

  private async initializeAIOptimizations(userId: string, industry: string, profile: UserOnboardingProfile): Promise<void> {
    const optimizations = [
      {
        userId,
        industry,
        documentType: null,
        modelType: 'ocr',
        optimizationLevel: profile.experienceLevel === 'expert' ? 'custom' : 'standard',
        confidenceThreshold: this.getConfidenceThreshold(industry, 'ocr'),
        complianceMode: (profile.complianceRequirements?.length || 0) > 0,
        accuracyWeighting: industry === 'medical' ? 0.9 : 0.8,
        speedWeighting: profile.documentVolume === 'very_high' ? 0.3 : 0.2
      },
      {
        userId,
        industry,
        documentType: null,
        modelType: 'nlp',
        optimizationLevel: profile.experienceLevel === 'expert' ? 'custom' : 'standard',
        confidenceThreshold: this.getConfidenceThreshold(industry, 'nlp'),
        complianceMode: (profile.complianceRequirements?.length || 0) > 0,
        accuracyWeighting: industry === 'legal' ? 0.95 : 0.8,
        speedWeighting: profile.documentVolume === 'very_high' ? 0.3 : 0.2
      }
    ];

    for (const optimization of optimizations) {
      await storage.createAIOptimization(optimization);
    }
  }

  private getConfidenceThreshold(industry: string, modelType: string): number {
    const thresholds: Record<string, Record<string, number>> = {
      medical: { ocr: 0.85, nlp: 0.8, classification: 0.9 },
      legal: { ocr: 0.9, nlp: 0.85, classification: 0.8 },
      logistics: { ocr: 0.7, nlp: 0.75, classification: 0.7 },
      finance: { ocr: 0.85, nlp: 0.8, classification: 0.85 }
    };

    return thresholds[industry]?.[modelType] || 0.7;
  }

  async getOnboardingProgress(userId: string): Promise<{ profile: UserOnboardingProfile | null; flow: IndustryOnboardingFlow | null }> {
    try {
      const profile = await storage.getOnboardingProfile(userId);
      if (!profile) return { profile: null, flow: null };

      const user = await storage.getUser(userId);
      const flow = user?.industry ? this.industryFlows[user.industry] : null;

      return { profile, flow };
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return { profile: null, flow: null };
    }
  }

  getIndustryFlow(industry: string): IndustryOnboardingFlow | null {
    return this.industryFlows[industry] || null;
  }

  getAllIndustryFlows(): IndustryOnboardingFlow[] {
    return Object.values(this.industryFlows);
  }
}

export const smartOnboardingService = new SmartOnboardingService();