export interface IndustryConfig {
  name: string;
  icon: string;
  color: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  userTitle: string;
  documentLibraryLabel: string;
  uploadDescription: string;
  statLabels: {
    stat1: string;
    stat2: string;
    stat3: string;
    stat4: string;
  };
}

const industryConfigs: Record<string, IndustryConfig> = {
  medical: {
    name: 'Medical',
    icon: 'fas fa-heartbeat',
    color: 'teal',
    dashboardTitle: 'Medical Dashboard',
    dashboardSubtitle: 'Manage your patient documents and clinical analysis',
    userTitle: 'Medical Professional',
    documentLibraryLabel: 'Patient Records',
    uploadDescription: 'Upload patient records, lab results, or clinical documents',
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
    statLabels: {
      stat1: 'Documents Analyzed',
      stat2: 'Risk Accuracy',
      stat3: 'Analysis Time',
      stat4: 'Fraud Detection',
    },
  },
  real_estate: {
    name: 'Real Estate',
    icon: 'fas fa-home',
    color: 'indigo',
    dashboardTitle: 'Real Estate Dashboard',
    dashboardSubtitle: 'Manage your property transactions and real estate documents',
    userTitle: 'Real Estate Professional',
    documentLibraryLabel: 'Property Documents',
    uploadDescription: 'Upload contracts, leases, disclosures, inspection reports, or closing documents',
    statLabels: {
      stat1: 'Transactions Processed',
      stat2: 'Contract Accuracy',
      stat3: 'Deal Processing Time',
      stat4: 'Compliance Score',
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
    statLabels: {
      stat1: 'Documents Processed',
      stat2: 'Extraction Accuracy',
      stat3: 'Processing Time',
      stat4: 'Quality Score',
    },
  },
};

export function getIndustryConfig(industry: string): IndustryConfig {
  return industryConfigs[industry] || industryConfigs.general;
}

export function getAllIndustries(): string[] {
  return Object.keys(industryConfigs);
}
