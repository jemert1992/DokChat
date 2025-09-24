export interface NavigationItem {
  id: string;
  icon: string;
  label: string;
  view?: string;
  path?: string;
  action: string;
  badge?: string | null;
  description?: string;
}

export interface NavigationSection {
  label: string;
  priority: number;
  items: NavigationItem[];
}

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: string;
  primary?: boolean;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  logoIcon: string;
  logoText: string;
  logoSubtext: string;
}

export interface IndustryConfig {
  name: string;
  icon: string;
  color: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  userTitle: string;
  documentLibraryLabel: string;
  uploadDescription: string;
  searchPlaceholder: string;
  branding: BrandingConfig;
  navigationSections: NavigationSection[];
  quickActions: QuickAction[];
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
    dashboardTitle: 'Clinical Intelligence Platform',
    dashboardSubtitle: 'AI-powered medical document analysis and patient data insights',
    userTitle: 'Healthcare Professional',
    documentLibraryLabel: 'Patient Records Archive',
    uploadDescription: 'Upload patient records, lab results, imaging reports, or clinical documents',
    searchPlaceholder: 'Search patients, diagnoses, medications...',
    branding: {
      primaryColor: 'teal-600',
      secondaryColor: 'teal-50',
      accentColor: 'emerald-500',
      gradientFrom: 'teal-600',
      gradientTo: 'emerald-600',
      logoIcon: 'fas fa-heartbeat',
      logoText: 'MedTech AI',
      logoSubtext: 'Clinical Intelligence'
    },
    navigationSections: [
      {
        label: 'CLINICAL WORKFLOW',
        priority: 1,
        items: [
          { id: 'patient-dashboard', icon: 'fas fa-user-md', label: 'Patient Dashboard', path: '/medical/patient-dashboard', action: 'navigate', badge: null },
          { id: 'clinical-analytics', icon: 'fas fa-chart-pulse', label: 'Clinical Analytics', path: '/medical/clinical-analytics', action: 'navigate', badge: 'INSIGHTS' },
          { id: 'patient-records', icon: 'fas fa-file-medical', label: 'Patient Records', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'MEDICAL INTELLIGENCE',
        priority: 2,
        items: [
          { id: 'upload-records', icon: 'fas fa-upload', label: 'Upload Medical Files', action: 'focus-upload', badge: null, description: 'Add new patient documents' },
          { id: 'lab-results', icon: 'fas fa-flask', label: 'Lab Results Analysis', action: 'scroll-to-activity', badge: null },
          { id: 'diagnostic-ai', icon: 'fas fa-brain', label: 'Diagnostic AI', path: '/medical/patient-dashboard', action: 'navigate', badge: 'AI' },
          { id: 'hipaa-compliance', icon: 'fas fa-shield-alt', label: 'HIPAA Compliance', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'PRACTICE MANAGEMENT',
        priority: 3,
        items: [
          { id: 'physician-profile', icon: 'fas fa-stethoscope', label: 'Physician Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'ehr-integrations', icon: 'fas fa-link', label: 'EHR Integrations', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-patient', icon: 'fas fa-plus-circle', label: 'New Patient', action: 'focus-upload', primary: true },
      { id: 'lab-upload', icon: 'fas fa-vial', label: 'Lab Results', action: 'focus-upload', primary: false },
      { id: 'imaging-upload', icon: 'fas fa-x-ray', label: 'Imaging', action: 'focus-upload', primary: false },
      { id: 'practice-settings', icon: 'fas fa-clinic-medical', label: 'Practice Settings', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Active Patients',
      stat2: 'HIPAA Compliance',
      stat3: 'Analysis Speed',
      stat4: 'Diagnostic Accuracy',
    },
  },
  legal: {
    name: 'Legal',
    icon: 'fas fa-gavel',
    color: 'blue-900',
    dashboardTitle: 'Legal Intelligence Platform',
    dashboardSubtitle: 'AI-powered contract analysis and legal document intelligence',
    userTitle: 'Legal Counsel',
    documentLibraryLabel: 'Legal Document Vault',
    uploadDescription: 'Upload contracts, briefs, pleadings, discovery documents, or legal precedents',
    searchPlaceholder: 'Search cases, clauses, statutes...',
    branding: {
      primaryColor: 'blue-900',
      secondaryColor: 'blue-50',
      accentColor: 'indigo-600',
      gradientFrom: 'blue-900',
      gradientTo: 'indigo-700',
      logoIcon: 'fas fa-balance-scale',
      logoText: 'LegalAI Pro',
      logoSubtext: 'Legal Intelligence'
    },
    navigationSections: [
      {
        label: 'LEGAL PRACTICE',
        priority: 1,
        items: [
          { id: 'case-management', icon: 'fas fa-folder-open', label: 'Case Management', path: '/legal/case-manager', action: 'navigate', badge: null },
          { id: 'contract-analytics', icon: 'fas fa-chart-bar', label: 'Contract Analytics', path: '/legal/contract-analysis', action: 'navigate', badge: 'INSIGHTS' },
          { id: 'document-vault', icon: 'fas fa-vault', label: 'Document Vault', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'LEGAL INTELLIGENCE',
        priority: 2,
        items: [
          { id: 'upload-legal', icon: 'fas fa-upload', label: 'Upload Legal Docs', action: 'focus-upload', badge: null, description: 'Add contracts and legal documents' },
          { id: 'contract-review', icon: 'fas fa-file-contract', label: 'Contract Review', action: 'scroll-to-activity', badge: null },
          { id: 'clause-analysis', icon: 'fas fa-search-plus', label: 'Clause Analysis', path: '/legal/contract-analysis', action: 'navigate', badge: 'AI' },
          { id: 'compliance-check', icon: 'fas fa-shield-check', label: 'Compliance Check', view: 'documents', action: 'navigate', badge: 'VERIFY' }
        ]
      },
      {
        label: 'FIRM MANAGEMENT',
        priority: 3,
        items: [
          { id: 'attorney-profile', icon: 'fas fa-user-tie', label: 'Attorney Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'legal-integrations', icon: 'fas fa-link', label: 'Legal Integrations', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-contract', icon: 'fas fa-file-signature', label: 'New Contract', action: 'focus-upload', primary: true },
      { id: 'brief-upload', icon: 'fas fa-gavel', label: 'Legal Brief', action: 'focus-upload', primary: false },
      { id: 'discovery-docs', icon: 'fas fa-search', label: 'Discovery', action: 'focus-upload', primary: false },
      { id: 'firm-settings', icon: 'fas fa-building-columns', label: 'Firm Settings', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Cases Active',
      stat2: 'Contract Accuracy',
      stat3: 'Review Speed',
      stat4: 'Compliance Score',
    },
  },
  logistics: {
    name: 'Logistics',
    icon: 'fas fa-truck',
    color: 'orange',
    dashboardTitle: 'Supply Chain Intelligence',
    dashboardSubtitle: 'AI-powered logistics optimization and shipping document processing',
    userTitle: 'Supply Chain Manager',
    documentLibraryLabel: 'Shipment Document Archive',
    uploadDescription: 'Upload bills of lading, customs forms, commercial invoices, or packing lists',
    searchPlaceholder: 'Search shipments, tracking, destinations...',
    branding: {
      primaryColor: 'orange-600',
      secondaryColor: 'orange-50',
      accentColor: 'amber-500',
      gradientFrom: 'orange-600',
      gradientTo: 'amber-600',
      logoIcon: 'fas fa-shipping-fast',
      logoText: 'LogisticsPro',
      logoSubtext: 'Supply Chain AI'
    },
    navigationSections: [
      {
        label: 'SHIPMENT OPERATIONS',
        priority: 1,
        items: [
          { id: 'shipment-tracking', icon: 'fas fa-map-marked-alt', label: 'Shipment Tracking', path: '/logistics/shipment-tracking', action: 'navigate', badge: null },
          { id: 'supply-analytics', icon: 'fas fa-chart-line', label: 'Supply Analytics', path: '/logistics/control-center', action: 'navigate', badge: 'LIVE' },
          { id: 'cargo-manifest', icon: 'fas fa-clipboard-list', label: 'Cargo Manifest', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'CUSTOMS & COMPLIANCE',
        priority: 2,
        items: [
          { id: 'upload-shipping', icon: 'fas fa-upload', label: 'Upload Ship Docs', action: 'focus-upload', badge: null, description: 'Add shipping and customs documents' },
          { id: 'customs-clearance', icon: 'fas fa-passport', label: 'Customs Clearance', action: 'scroll-to-activity', badge: null },
          { id: 'route-optimization', icon: 'fas fa-route', label: 'Route Optimization', path: '/logistics/control-center', action: 'navigate', badge: 'AI' },
          { id: 'compliance-audit', icon: 'fas fa-clipboard-check', label: 'Compliance Audit', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'FLEET MANAGEMENT',
        priority: 3,
        items: [
          { id: 'manager-profile', icon: 'fas fa-hard-hat', label: 'Manager Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'carrier-integrations', icon: 'fas fa-truck-loading', label: 'Carrier Network', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-shipment', icon: 'fas fa-plus-square', label: 'New Shipment', action: 'focus-upload', primary: true },
      { id: 'bol-upload', icon: 'fas fa-file-invoice', label: 'Bill of Lading', action: 'focus-upload', primary: false },
      { id: 'customs-form', icon: 'fas fa-passport', label: 'Customs Form', action: 'focus-upload', primary: false },
      { id: 'fleet-settings', icon: 'fas fa-cogs', label: 'Fleet Settings', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Active Shipments',
      stat2: 'Customs Accuracy',
      stat3: 'Transit Time',
      stat4: 'Delivery Success',
    },
  },
  finance: {
    name: 'Finance',
    icon: 'fas fa-chart-line',
    color: 'green',
    dashboardTitle: 'Financial Intelligence Hub',
    dashboardSubtitle: 'AI-powered financial analysis and risk assessment platform',
    userTitle: 'Financial Analyst',
    documentLibraryLabel: 'Financial Document Repository',
    uploadDescription: 'Upload financial statements, loan applications, credit reports, or regulatory filings',
    searchPlaceholder: 'Search transactions, portfolios, reports...',
    branding: {
      primaryColor: 'green-600',
      secondaryColor: 'green-50',
      accentColor: 'emerald-500',
      gradientFrom: 'green-600',
      gradientTo: 'emerald-600',
      logoIcon: 'fas fa-coins',
      logoText: 'FinanceAI',
      logoSubtext: 'Financial Intelligence'
    },
    navigationSections: [
      {
        label: 'FINANCIAL ANALYSIS',
        priority: 1,
        items: [
          { id: 'portfolio-dashboard', icon: 'fas fa-chart-pie', label: 'Portfolio Dashboard', path: '/finance/analytics-hub', action: 'navigate', badge: null },
          { id: 'risk-analytics', icon: 'fas fa-chart-area', label: 'Risk Analytics', path: '/finance/transaction-monitoring', action: 'navigate', badge: 'RISK' },
          { id: 'financial-records', icon: 'fas fa-file-invoice-dollar', label: 'Financial Records', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'RISK & COMPLIANCE',
        priority: 2,
        items: [
          { id: 'upload-financial', icon: 'fas fa-upload', label: 'Upload Financials', action: 'focus-upload', badge: null, description: 'Add financial statements and reports' },
          { id: 'credit-analysis', icon: 'fas fa-credit-card', label: 'Credit Analysis', action: 'scroll-to-activity', badge: null },
          { id: 'fraud-detection', icon: 'fas fa-shield-alt', label: 'Fraud Detection', path: '/finance/transaction-monitoring', action: 'navigate', badge: 'AI' },
          { id: 'regulatory-reports', icon: 'fas fa-balance-scale', label: 'Regulatory Reports', view: 'documents', action: 'navigate', badge: 'COMPLIANCE' }
        ]
      },
      {
        label: 'INSTITUTION SETTINGS',
        priority: 3,
        items: [
          { id: 'analyst-profile', icon: 'fas fa-user-chart', label: 'Analyst Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'banking-integrations', icon: 'fas fa-university', label: 'Banking APIs', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-analysis', icon: 'fas fa-calculator', label: 'New Analysis', action: 'focus-upload', primary: true },
      { id: 'loan-app', icon: 'fas fa-hand-holding-usd', label: 'Loan Application', action: 'focus-upload', primary: false },
      { id: 'credit-report', icon: 'fas fa-credit-card', label: 'Credit Report', action: 'focus-upload', primary: false },
      { id: 'institution-settings', icon: 'fas fa-university', label: 'Institution', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Portfolios Managed',
      stat2: 'Risk Accuracy',
      stat3: 'Analysis Speed',
      stat4: 'Fraud Prevention',
    },
  },
  real_estate: {
    name: 'Real Estate',
    icon: 'fas fa-home',
    color: 'indigo',
    dashboardTitle: 'Real Estate Transaction Hub',
    dashboardSubtitle: 'AI-powered property analysis and transaction document processing',
    userTitle: 'Real Estate Professional',
    documentLibraryLabel: 'Transaction Document Vault',
    uploadDescription: 'Upload purchase agreements, leases, property disclosures, inspection reports, or closing documents',
    searchPlaceholder: 'Search properties, clients, transactions...',
    branding: {
      primaryColor: 'indigo-600',
      secondaryColor: 'indigo-50',
      accentColor: 'purple-500',
      gradientFrom: 'indigo-600',
      gradientTo: 'purple-600',
      logoIcon: 'fas fa-building',
      logoText: 'PropTech AI',
      logoSubtext: 'Real Estate Intelligence'
    },
    navigationSections: [
      {
        label: 'PROPERTY MANAGEMENT',
        priority: 1,
        items: [
          { id: 'property-portfolio', icon: 'fas fa-building', label: 'Property Portfolio', view: 'capabilities', action: 'navigate', badge: null },
          { id: 'market-analytics', icon: 'fas fa-chart-line', label: 'Market Analytics', view: 'analytics', action: 'navigate', badge: 'TRENDS' },
          { id: 'transaction-vault', icon: 'fas fa-vault', label: 'Transaction Vault', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'TRANSACTION PROCESSING',
        priority: 2,
        items: [
          { id: 'upload-property', icon: 'fas fa-upload', label: 'Upload Property Docs', action: 'focus-upload', badge: null, description: 'Add transaction and property documents' },
          { id: 'contract-review', icon: 'fas fa-file-contract', label: 'Contract Review', action: 'scroll-to-activity', badge: null },
          { id: 'property-valuation', icon: 'fas fa-calculator', label: 'Property Valuation', view: 'analytics', action: 'navigate', badge: 'AI' },
          { id: 'disclosure-check', icon: 'fas fa-clipboard-check', label: 'Disclosure Check', view: 'documents', action: 'navigate', badge: 'VERIFY' }
        ]
      },
      {
        label: 'AGENCY MANAGEMENT',
        priority: 3,
        items: [
          { id: 'agent-profile', icon: 'fas fa-id-badge', label: 'Agent Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'mls-integrations', icon: 'fas fa-home', label: 'MLS Integrations', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-listing', icon: 'fas fa-plus-circle', label: 'New Listing', action: 'focus-upload', primary: true },
      { id: 'purchase-agreement', icon: 'fas fa-handshake', label: 'Purchase Agreement', action: 'focus-upload', primary: false },
      { id: 'inspection-report', icon: 'fas fa-search-plus', label: 'Inspection Report', action: 'focus-upload', primary: false },
      { id: 'agency-settings', icon: 'fas fa-building-columns', label: 'Agency Settings', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Active Listings',
      stat2: 'Deal Accuracy',
      stat3: 'Closing Speed',
      stat4: 'Market Value Accuracy',
    },
  },
  general: {
    name: 'General Business',
    icon: 'fas fa-briefcase',
    color: 'blue',
    dashboardTitle: 'Business Intelligence Platform',
    dashboardSubtitle: 'AI-powered business document processing and workflow automation',
    userTitle: 'Business Professional',
    documentLibraryLabel: 'Business Document Center',
    uploadDescription: 'Upload invoices, contracts, proposals, reports, or business correspondence',
    searchPlaceholder: 'Search documents, contacts, projects...',
    branding: {
      primaryColor: 'blue-600',
      secondaryColor: 'blue-50',
      accentColor: 'sky-500',
      gradientFrom: 'blue-600',
      gradientTo: 'sky-600',
      logoIcon: 'fas fa-brain',
      logoText: 'DOKTECH',
      logoSubtext: 'Business Intelligence'
    },
    navigationSections: [
      {
        label: 'BUSINESS OPERATIONS',
        priority: 1,
        items: [
          { id: 'business-overview', icon: 'fas fa-tachometer-alt', label: 'Business Overview', view: 'capabilities', action: 'navigate', badge: null },
          { id: 'document-analytics', icon: 'fas fa-chart-bar', label: 'Document Analytics', view: 'analytics', action: 'navigate', badge: 'INSIGHTS' },
          { id: 'document-center', icon: 'fas fa-folder-open', label: 'Document Center', view: 'documents', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENT INTELLIGENCE',
        priority: 2,
        items: [
          { id: 'upload-business', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add business documents for processing' },
          { id: 'document-processing', icon: 'fas fa-cogs', label: 'Document Processing', action: 'scroll-to-activity', badge: null },
          { id: 'data-extraction', icon: 'fas fa-brain', label: 'Data Extraction', view: 'analytics', action: 'navigate', badge: 'AI' },
          { id: 'workflow-automation', icon: 'fas fa-robot', label: 'Workflow Automation', view: 'documents', action: 'navigate', badge: 'AUTO' }
        ]
      },
      {
        label: 'ORGANIZATION SETTINGS',
        priority: 3,
        items: [
          { id: 'user-profile', icon: 'fas fa-user-circle', label: 'User Profile', view: 'profile', action: 'navigate', badge: null },
          { id: 'system-integrations', icon: 'fas fa-plug', label: 'Integrations', view: 'documents', action: 'navigate', badge: 'CONNECT' }
        ]
      }
    ],
    quickActions: [
      { id: 'new-document', icon: 'fas fa-plus', label: 'New Document', action: 'focus-upload', primary: true },
      { id: 'invoice-upload', icon: 'fas fa-file-invoice', label: 'Invoice', action: 'focus-upload', primary: false },
      { id: 'contract-upload', icon: 'fas fa-file-contract', label: 'Contract', action: 'focus-upload', primary: false },
      { id: 'org-settings', icon: 'fas fa-cog', label: 'Settings', action: 'profile', primary: false }
    ],
    statLabels: {
      stat1: 'Documents Processed',
      stat2: 'Extraction Accuracy',
      stat3: 'Processing Speed',
      stat4: 'Automation Rate',
    },
  },
};

export function getIndustryConfig(industry: string): IndustryConfig {
  return industryConfigs[industry] || industryConfigs.general;
}

export function getAllIndustries(): string[] {
  return Object.keys(industryConfigs);
}
