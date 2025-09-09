export interface IndustryConfig {
  name: string;
  icon: string;
  color: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  userTitle: string;
  documentLibraryLabel: string;
  uploadDescription: string;
  documentTypes: string[];
  processingRules: {
    requiresCompliance: boolean;
    complianceStandards: string[];
    customValidation: boolean;
  };
  statLabels: {
    stat1: string;
    stat2: string;
    stat3: string;
    stat4: string;
  };
}

export class IndustryConfigService {
  private configs: Record<string, IndustryConfig> = {
    medical: {
      name: 'Medical',
      icon: 'fas fa-heartbeat',
      color: 'teal',
      dashboardTitle: 'Medical Dashboard',
      dashboardSubtitle: 'Manage your patient documents and clinical analysis',
      userTitle: 'Medical Professional',
      documentLibraryLabel: 'Patient Records',
      uploadDescription: 'Upload patient records, lab results, or clinical documents',
      documentTypes: ['patient_records', 'lab_results', 'imaging_reports', 'clinical_notes'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['HIPAA'],
        customValidation: true,
      },
      statLabels: {
        stat1: 'Patient Records',
        stat2: 'HIPAA Compliance',
        stat3: 'Processing Time',
        stat4: 'Clinical Accuracy',
      },
    },
    legal: {
      name: 'Legal',
      icon: 'fas fa-gavel',
      color: 'blue-900',
      dashboardTitle: 'Legal Dashboard',
      dashboardSubtitle: 'Manage your legal documents and contract analysis',
      userTitle: 'Legal Professional',
      documentLibraryLabel: 'Case Documents',
      uploadDescription: 'Upload contracts, briefs, or legal documents',
      documentTypes: ['contracts', 'briefs', 'depositions', 'case_law'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['Attorney-Client Privilege'],
        customValidation: true,
      },
      statLabels: {
        stat1: 'Documents Reviewed',
        stat2: 'Contract Accuracy',
        stat3: 'Analysis Time',
        stat4: 'Compliance Score',
      },
    },
    logistics: {
      name: 'Logistics',
      icon: 'fas fa-truck',
      color: 'orange',
      dashboardTitle: 'Logistics Dashboard',
      dashboardSubtitle: 'Manage your shipping documents and customs forms',
      userTitle: 'Logistics Professional',
      documentLibraryLabel: 'Shipping Documents',
      uploadDescription: 'Upload bills of lading, customs forms, or invoices',
      documentTypes: ['bills_of_lading', 'customs_declarations', 'proof_of_delivery', 'invoices'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['Customs Regulations'],
        customValidation: true,
      },
      statLabels: {
        stat1: 'Shipments Processed',
        stat2: 'Customs Accuracy',
        stat3: 'Processing Speed',
        stat4: 'Compliance Rate',
      },
    },
    finance: {
      name: 'Finance',
      icon: 'fas fa-chart-line',
      color: 'green',
      dashboardTitle: 'Finance Dashboard',
      dashboardSubtitle: 'Manage your financial documents and risk analysis',
      userTitle: 'Finance Professional',
      documentLibraryLabel: 'Financial Records',
      uploadDescription: 'Upload financial statements, reports, or applications',
      documentTypes: ['financial_statements', 'loan_applications', 'bank_statements', 'audit_reports'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['SOX', 'GDPR'],
        customValidation: true,
      },
      statLabels: {
        stat1: 'Documents Analyzed',
        stat2: 'Risk Accuracy',
        stat3: 'Analysis Time',
        stat4: 'Fraud Detection',
      },
    },
    general: {
      name: 'General Business',
      icon: 'fas fa-briefcase',
      color: 'blue',
      dashboardTitle: 'Business Dashboard',
      dashboardSubtitle: 'Manage your business documents and data extraction',
      userTitle: 'Business Professional',
      documentLibraryLabel: 'Document Library',
      uploadDescription: 'Upload invoices, contracts, or business documents',
      documentTypes: ['business_plans', 'invoices', 'contracts', 'reports', 'correspondence'],
      processingRules: {
        requiresCompliance: false,
        complianceStandards: [],
        customValidation: false,
      },
      statLabels: {
        stat1: 'Documents Processed',
        stat2: 'Extraction Accuracy',
        stat3: 'Processing Time',
        stat4: 'Quality Score',
      },
    },
  };

  async getIndustryConfig(industry: string): Promise<IndustryConfig> {
    const config = this.configs[industry];
    if (!config) {
      throw new Error(`Unknown industry: ${industry}`);
    }
    return config;
  }

  getAllIndustries(): string[] {
    return Object.keys(this.configs);
  }

  getIndustryDocumentTypes(industry: string): string[] {
    const config = this.configs[industry];
    return config ? config.documentTypes : [];
  }
}
