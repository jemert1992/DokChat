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
    securityLevel: 'standard' | 'high' | 'maximum';
    auditRequirements: string[];
    dataRetention: number; // days
    multiLanguageSupport: boolean;
    customEntityTypes: string[];
  };
  entityTypes: {
    primary: string[];
    secondary: string[];
    codes: string[]; // ICD-10, CPT, HS codes, etc.
  };
  complianceFeatures: {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
    dataMinimization: boolean;
    anonymization: boolean;
  };
  statLabels: {
    stat1: string;
    stat2: string;
    stat3: string;
    stat4: string;
  };
  aiModels: {
    primary: string;
    secondary: string;
    specializedPrompts: boolean;
  };
  integrations: {
    external: string[];
    apis: string[];
    standards: string[];
  };
}

export class IndustryConfigService {
  private configs: Record<string, IndustryConfig> = {
    medical: {
      name: 'Medical',
      icon: 'fas fa-heartbeat',
      color: 'teal',
      dashboardTitle: 'Medical Dashboard',
      dashboardSubtitle: 'HIPAA-compliant patient document analysis and clinical decision support',
      userTitle: 'Medical Professional',
      documentLibraryLabel: 'Patient Records',
      uploadDescription: 'Upload patient records, lab results, imaging reports, or clinical documentation with automatic PHI detection',
      documentTypes: ['patient_records', 'lab_results', 'imaging_reports', 'clinical_notes', 'consent_forms', 'discharge_summaries', 'procedure_notes', 'pathology_reports'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['HIPAA', 'HL7_FHIR', 'FDA_CFR_Part_11'],
        customValidation: true,
        securityLevel: 'maximum',
        auditRequirements: ['access_logs', 'phi_detection', 'data_lineage', 'consent_tracking'],
        dataRetention: 2555, // 7 years as per HIPAA
        multiLanguageSupport: false,
        customEntityTypes: ['medications', 'diagnoses', 'procedures', 'allergies', 'vital_signs', 'lab_values'],
      },
      entityTypes: {
        primary: ['patient_demographics', 'medical_conditions', 'medications', 'procedures', 'allergies'],
        secondary: ['vital_signs', 'lab_results', 'provider_info', 'insurance_info'],
        codes: ['ICD-10', 'CPT', 'HCPCS', 'SNOMED_CT', 'LOINC', 'RxNorm'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: true,
        auditLogging: true,
        dataMinimization: true,
        anonymization: true,
      },
      statLabels: {
        stat1: 'Patient Records',
        stat2: 'HIPAA Compliance',
        stat3: 'Clinical Accuracy',
        stat4: 'PHI Detection Rate',
      },
      aiModels: {
        primary: 'openai',
        secondary: 'gemini',
        specializedPrompts: true,
      },
      integrations: {
        external: ['EHR_systems', 'LIS', 'HIS', 'PACS'],
        apis: ['HL7_FHIR', 'DICOM'],
        standards: ['HIPAA', 'HL7', 'SNOMED_CT'],
      },
    },
    legal: {
      name: 'Legal',
      icon: 'fas fa-gavel',
      color: 'blue-900',
      dashboardTitle: 'Legal Dashboard',
      dashboardSubtitle: 'Advanced legal document analysis with privilege protection and contract intelligence',
      userTitle: 'Legal Professional',
      documentLibraryLabel: 'Case Documents',
      uploadDescription: 'Upload contracts, briefs, pleadings, or legal correspondence with automatic privilege detection',
      documentTypes: ['contracts', 'briefs', 'pleadings', 'discovery_documents', 'case_law', 'legal_correspondence', 'depositions', 'expert_reports'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['Attorney_Client_Privilege', 'Work_Product_Doctrine', 'Bar_Ethics_Rules'],
        customValidation: true,
        securityLevel: 'maximum',
        auditRequirements: ['privilege_protection', 'access_control', 'document_lineage', 'confidentiality_levels'],
        dataRetention: 2555, // 7 years for legal records
        multiLanguageSupport: true,
        customEntityTypes: ['parties', 'jurisdictions', 'case_citations', 'statutes', 'contract_terms', 'obligations'],
      },
      entityTypes: {
        primary: ['parties', 'contract_terms', 'obligations', 'dates_deadlines', 'governing_law'],
        secondary: ['case_citations', 'statutes', 'legal_precedents', 'jurisdictions'],
        codes: ['case_citations', 'statute_citations', 'regulation_citations'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: true,
        auditLogging: true,
        dataMinimization: true,
        anonymization: false, // Legal docs require full attribution
      },
      statLabels: {
        stat1: 'Documents Reviewed',
        stat2: 'Contract Risk Score',
        stat3: 'Privilege Protection',
        stat4: 'Citation Accuracy',
      },
      aiModels: {
        primary: 'openai',
        secondary: 'gemini',
        specializedPrompts: true,
      },
      integrations: {
        external: ['practice_management', 'case_management', 'legal_research'],
        apis: ['court_records', 'legal_databases'],
        standards: ['legal_citation', 'court_filing'],
      },
    },
    logistics: {
      name: 'Logistics',
      icon: 'fas fa-truck',
      color: 'orange',
      dashboardTitle: 'Logistics Dashboard',
      dashboardSubtitle: 'High-volume international shipping document processing with customs automation',
      userTitle: 'Logistics Professional',
      documentLibraryLabel: 'Shipping Documents',
      uploadDescription: 'Upload bills of lading, customs declarations, commercial invoices with multi-language OCR support',
      documentTypes: ['bills_of_lading', 'customs_declarations', 'commercial_invoices', 'packing_lists', 'proof_of_delivery', 'air_waybills', 'sea_waybills', 'certificates_of_origin'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['WCO_Framework', 'C-TPAT', 'AEO', 'International_Trade_Regulations'],
        customValidation: true,
        securityLevel: 'high',
        auditRequirements: ['customs_compliance', 'duty_calculations', 'origin_verification', 'trade_sanctions'],
        dataRetention: 1825, // 5 years for customs records
        multiLanguageSupport: true,
        customEntityTypes: ['shipper_info', 'consignee_info', 'cargo_details', 'customs_codes', 'incoterms'],
      },
      entityTypes: {
        primary: ['shipper_info', 'consignee_info', 'cargo_details', 'shipping_terms', 'customs_info'],
        secondary: ['tracking_numbers', 'port_info', 'vessel_info', 'container_numbers'],
        codes: ['HS_codes', 'commodity_codes', 'country_codes', 'port_codes'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: true,
        auditLogging: true,
        dataMinimization: false,
        anonymization: false, // Full traceability required
      },
      statLabels: {
        stat1: 'Shipments Processed',
        stat2: 'Customs Accuracy',
        stat3: 'Multi-Language OCR',
        stat4: 'Trade Compliance',
      },
      aiModels: {
        primary: 'gemini', // Better for multi-language
        secondary: 'openai',
        specializedPrompts: true,
      },
      integrations: {
        external: ['carrier_systems', 'customs_authorities', 'port_systems'],
        apis: ['tracking_apis', 'customs_apis', 'exchange_rate_apis'],
        standards: ['EDI', 'UN_EDIFACT', 'WCO_data_model'],
      },
    },
    finance: {
      name: 'Finance',
      icon: 'fas fa-chart-line',
      color: 'green',
      dashboardTitle: 'Finance Dashboard',
      dashboardSubtitle: 'Advanced financial document analysis with fraud detection and regulatory compliance',
      userTitle: 'Finance Professional',
      documentLibraryLabel: 'Financial Records',
      uploadDescription: 'Upload financial statements, loan applications, bank statements with automated fraud detection',
      documentTypes: ['financial_statements', 'loan_applications', 'bank_statements', 'audit_reports', 'tax_documents', 'investment_reports', 'insurance_claims'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['SOX', 'GDPR', 'PCI_DSS', 'Basel_III'],
        customValidation: true,
        securityLevel: 'high',
        auditRequirements: ['transaction_logs', 'risk_assessment', 'fraud_detection', 'regulatory_reporting'],
        dataRetention: 2555, // 7 years for financial records
        multiLanguageSupport: true,
        customEntityTypes: ['financial_metrics', 'risk_indicators', 'transaction_data', 'account_info'],
      },
      entityTypes: {
        primary: ['financial_data', 'transaction_details', 'account_numbers', 'monetary_amounts', 'dates'],
        secondary: ['risk_metrics', 'credit_scores', 'financial_ratios', 'regulatory_codes'],
        codes: ['SWIFT_codes', 'IBAN', 'routing_numbers', 'currency_codes'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: true,
        auditLogging: true,
        dataMinimization: true,
        anonymization: true,
      },
      statLabels: {
        stat1: 'Documents Analyzed',
        stat2: 'Fraud Detection Rate',
        stat3: 'Risk Assessment',
        stat4: 'Compliance Score',
      },
      aiModels: {
        primary: 'openai',
        secondary: 'gemini',
        specializedPrompts: true,
      },
      integrations: {
        external: ['banking_systems', 'credit_bureaus', 'regulatory_systems'],
        apis: ['financial_data_apis', 'fraud_detection_apis'],
        standards: ['ISO_20022', 'XBRL', 'FIX'],
      },
    },
    real_estate: {
      name: 'Real Estate',
      icon: 'fas fa-home',
      color: 'indigo',
      dashboardTitle: 'Real Estate Dashboard',
      dashboardSubtitle: 'Property transaction and real estate document intelligence with Fair Housing compliance',
      userTitle: 'Real Estate Professional',
      documentLibraryLabel: 'Property Documents',
      uploadDescription: 'Upload purchase contracts, leases, disclosures, inspection reports, or closing documents with compliance verification',
      documentTypes: ['purchase_contracts', 'lease_agreements', 'property_disclosures', 'inspection_reports', 'closing_documents', 'escrow_instructions', 'title_reports', 'appraisal_reports'],
      processingRules: {
        requiresCompliance: true,
        complianceStandards: ['Fair_Housing_Act', 'RESPA', 'TRID', 'State_Real_Estate_Laws'],
        customValidation: true,
        securityLevel: 'high',
        auditRequirements: ['fair_housing_compliance', 'disclosure_tracking', 'signature_verification', 'deadline_monitoring'],
        dataRetention: 2190, // 6 years for real estate transaction records
        multiLanguageSupport: true,
        customEntityTypes: ['property_address', 'buyer_seller_info', 'purchase_price', 'closing_date', 'agent_info', 'contingencies', 'inspection_info', 'lender_info'],
      },
      entityTypes: {
        primary: ['property_address', 'buyer_seller_info', 'purchase_price', 'closing_date', 'agent_info'],
        secondary: ['contingencies', 'inspection_info', 'lender_info', 'title_company', 'escrow_instructions'],
        codes: ['MLS_numbers', 'parcel_numbers', 'license_numbers', 'jurisdiction_codes'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: true,
        auditLogging: true,
        dataMinimization: true,
        anonymization: false, // Real estate requires full disclosure
      },
      statLabels: {
        stat1: 'Transactions Processed',
        stat2: 'Contract Accuracy',
        stat3: 'Deal Processing Time',
        stat4: 'Compliance Score',
      },
      aiModels: {
        primary: 'openai',
        secondary: 'gemini',
        specializedPrompts: true,
      },
      integrations: {
        external: ['MLS_systems', 'title_companies', 'escrow_services', 'lender_systems'],
        apis: ['property_data_apis', 'valuation_apis', 'compliance_apis'],
        standards: ['MISMO', 'RESO', 'NAR_standards'],
      },
    },
    general: {
      name: 'General Business',
      icon: 'fas fa-briefcase',
      color: 'blue',
      dashboardTitle: 'Business Dashboard',
      dashboardSubtitle: 'Versatile document processing for general business operations and data extraction',
      userTitle: 'Business Professional',
      documentLibraryLabel: 'Document Library',
      uploadDescription: 'Upload invoices, contracts, reports, or any business documents for intelligent analysis',
      documentTypes: ['business_plans', 'invoices', 'contracts', 'reports', 'correspondence', 'presentations', 'proposals', 'memos'],
      processingRules: {
        requiresCompliance: false,
        complianceStandards: [],
        customValidation: false,
        securityLevel: 'standard',
        auditRequirements: ['basic_logging'],
        dataRetention: 1095, // 3 years standard business retention
        multiLanguageSupport: true,
        customEntityTypes: ['contact_info', 'dates_deadlines', 'financial_data', 'entity_names'],
      },
      entityTypes: {
        primary: ['contact_info', 'dates_deadlines', 'financial_data', 'entity_names', 'addresses'],
        secondary: ['phone_numbers', 'email_addresses', 'urls', 'product_info'],
        codes: ['postal_codes', 'tax_ids', 'reference_numbers'],
      },
      complianceFeatures: {
        encryption: true,
        accessControl: false,
        auditLogging: false,
        dataMinimization: false,
        anonymization: false,
      },
      statLabels: {
        stat1: 'Documents Processed',
        stat2: 'Extraction Accuracy',
        stat3: 'Processing Speed',
        stat4: 'Quality Score',
      },
      aiModels: {
        primary: 'openai',
        secondary: 'gemini',
        specializedPrompts: false,
      },
      integrations: {
        external: ['crm_systems', 'erp_systems'],
        apis: ['business_data_apis'],
        standards: ['standard_formats'],
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
