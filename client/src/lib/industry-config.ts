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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'medical-ai', icon: 'fas fa-heartbeat', label: 'Medical AI', path: '/industry/medical', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add new medical documents' },
          { id: 'recent-documents', icon: 'fas fa-file-medical', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'legal-ai', icon: 'fas fa-gavel', label: 'Legal AI', path: '/industry/legal', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add legal documents' },
          { id: 'recent-documents', icon: 'fas fa-file-contract', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'logistics-ai', icon: 'fas fa-truck', label: 'Logistics AI', path: '/industry/logistics', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add shipping documents' },
          { id: 'recent-documents', icon: 'fas fa-clipboard-list', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'finance-ai', icon: 'fas fa-chart-line', label: 'Finance AI', path: '/industry/finance', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add financial documents' },
          { id: 'recent-documents', icon: 'fas fa-file-invoice-dollar', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'real-estate-ai', icon: 'fas fa-building', label: 'Real Estate AI', view: 'capabilities', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add property documents' },
          { id: 'recent-documents', icon: 'fas fa-file-contract', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
        label: 'MAIN',
        priority: 1,
        items: [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/', action: 'navigate', badge: null },
          { id: 'industry-selection', icon: 'fas fa-th', label: 'Industry Selection', view: 'capabilities', action: 'navigate', badge: null }
        ]
      },
      {
        label: 'DOCUMENTS',
        priority: 2,
        items: [
          { id: 'upload-documents', icon: 'fas fa-upload', label: 'Upload Documents', action: 'focus-upload', badge: null, description: 'Add documents for processing' },
          { id: 'recent-documents', icon: 'fas fa-folder-open', label: 'Recent Documents', action: 'scroll-to-activity', badge: null }
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
