// Industry-specific AI analysis prompts based on comprehensive research requirements

export interface IndustryPromptConfig {
  systemPrompt: string;
  analysisPrompt: string;
  entityTypes: string[];
  complianceChecks: string[];
  riskFactors: string[];
  // Enhanced capabilities for revolutionary industry processing
  advancedProcessingRules: {
    requiresPHIDetection?: boolean;
    requiresPrivilegeProtection?: boolean;
    requiresMultiLanguageOCR?: boolean;
    requiresFraudDetection?: boolean;
    requiresRegulatoryCompliance?: boolean;
    customEntityExtraction?: boolean;
  };
  industrySpecificModels: {
    primaryModel: 'openai' | 'gemini' | 'anthropic';
    specializedCapabilities: string[];
    confidenceThreshold: number;
  };
  regulatoryFramework: {
    standards: string[];
    auditRequirements: string[];
    complianceMonitoring: string[];
  };
  integrationRequirements: {
    externalSystems: string[];
    apiEndpoints: string[];
    dataExchangeStandards: string[];
  };
}

export const industryPrompts: Record<string, IndustryPromptConfig> = {
  real_estate: {
    systemPrompt: `You are a revolutionary real estate document intelligence system with advanced AI capabilities that exceed industry leaders. You have deep expertise in property transactions, real estate law, Fair Housing compliance, title insurance, escrow regulations, and MLS data standards. You provide property transaction intelligence with regulatory compliance verification.`,
    analysisPrompt: `Perform comprehensive real estate document analysis with revolutionary AI capabilities:

🏠 PROPERTY TRANSACTION INTELLIGENCE:
- Extract comprehensive property details: address, APN, lot size, square footage, bedrooms, bathrooms, property type, zoning
- Identify all parties: buyers, sellers, agents, brokers, lenders, title companies, escrow agents with license verification
- Extract financial data: purchase price, loan amounts, down payment, closing costs, property taxes, HOA fees, estimated payments
- Identify all dates and deadlines: offer expiration, inspection periods, loan approval deadlines, closing date, possession date
- Detect contingencies: inspection, appraisal, loan approval, sale of other property, HOA approval

📋 REGULATORY COMPLIANCE VERIFICATION:
- Fair Housing Act compliance: Check for discriminatory language, protected class references, accessibility requirements
- State-specific disclosure requirements: Natural hazards, lead paint, mold, pest inspection, HOA documents
- Title insurance standards: Chain of title, liens, encumbrances, easements, CC&Rs
- Escrow regulations: Proper handling of funds, document execution, timeline compliance
- Local ordinances: Building codes, permit requirements, zoning compliance

🔍 ADVANCED RISK ASSESSMENT:
- Flag unusual contract terms, non-standard clauses, or potentially problematic language
- Identify missing required disclosures or signatures
- Detect conflicting dates, impossible timelines, or unrealistic conditions
- Alert to potential title issues, lien problems, or property condition concerns
- Assess fair housing compliance risks

📊 TRANSACTION WORKFLOW OPTIMIZATION:
- Determine document type and transaction stage
- Identify next required actions and pending items
- Generate timeline and milestone tracking
- Suggest workflow improvements and automation opportunities

Provide industry-leading analysis with precision confidence scoring and actionable insights.`,
    entityTypes: [
      'property_address', 'apn_parcel_number', 'mls_number', 'property_details', 'zoning_info',
      'buyer_info', 'seller_info', 'agent_info', 'broker_info', 'lender_info', 'title_company',
      'escrow_agent', 'purchase_price', 'loan_amount', 'down_payment', 'closing_costs',
      'property_taxes', 'hoa_fees', 'closing_date', 'possession_date', 'inspection_period',
      'loan_approval_deadline', 'contingencies', 'disclosures', 'signatures', 'license_numbers'
    ],
    complianceChecks: [
      'Fair Housing Act Compliance', 'State Disclosure Requirements', 'Title Insurance Standards',
      'Escrow Regulations', 'Local Building Codes', 'Zoning Compliance', 'HOA Requirements',
      'Natural Hazard Disclosures', 'Lead Paint Disclosures', 'Accessibility Compliance'
    ],
    riskFactors: [
      'Discriminatory language', 'Missing required disclosures', 'Incomplete signatures',
      'Conflicting dates', 'Title issues', 'Lien problems', 'Inspection contingency risks',
      'Financing contingency risks', 'Unusual contract terms', 'Non-standard clauses'
    ],
    advancedProcessingRules: {
      requiresRegulatoryCompliance: true,
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'openai',
      specializedCapabilities: ['property_valuation', 'regulatory_compliance', 'contract_analysis'],
      confidenceThreshold: 0.85
    },
    regulatoryFramework: {
      standards: ['Fair_Housing_Act', 'RESPA', 'TRID', 'State_Real_Estate_Laws'],
      auditRequirements: ['fair_housing_monitoring', 'disclosure_tracking', 'signature_verification'],
      complianceMonitoring: ['transaction_timeline', 'regulatory_adherence', 'document_completeness']
    },
    integrationRequirements: {
      externalSystems: ['MLS_systems', 'title_companies', 'escrow_services', 'lender_platforms'],
      apiEndpoints: ['property_data_api', 'valuation_api', 'compliance_monitoring_api'],
      dataExchangeStandards: ['MISMO', 'RESO', 'TRID_XML']
    }
  },

  medical: {
    systemPrompt: `You are a revolutionary HIPAA-compliant medical AI system that exceeds industry standards with advanced clinical intelligence, PHI protection, and medical terminology understanding. You provide clinical decision support with HL7 FHIR integration and enterprise-grade security that surpasses leading healthcare platforms.`,
    analysisPrompt: `Perform comprehensive medical document analysis with revolutionary healthcare AI:

🏥 ADVANCED CLINICAL INTELLIGENCE:
- Extract patient demographics: MRN, name, DOB, gender, address, phone, emergency contacts (with PHI protection)
- Identify medical conditions: Primary diagnoses, secondary diagnoses, comorbidities with ICD-10 codes
- Process medications: Current medications, dosages, frequencies, routes, prescribing providers with RxNorm codes
- Analyze lab results: Test names, values, reference ranges, abnormal flags with LOINC codes
- Extract vital signs: Blood pressure, heart rate, temperature, respiratory rate, oxygen saturation, pain scores
- Identify procedures: CPT codes, procedure dates, providers, outcomes, complications
- Process allergies: Allergens, reaction types, severity levels, onset dates

🛡️ MAXIMUM PHI PROTECTION (HIPAA COMPLIANCE):
- Automatically detect all Protected Health Information (PHI) elements
- Implement data minimization and anonymization where appropriate
- Maintain audit trails for all PHI access and processing
- Ensure encryption at rest and in transit
- Monitor for unauthorized PHI exposure or access attempts

🩺 CLINICAL DECISION SUPPORT:
- Identify drug-drug interactions, drug-allergy conflicts, duplicate therapies
- Flag critical lab values, vital sign abnormalities, or concerning trends
- Detect missing required information for clinical care
- Identify potential medication dosing errors or contraindications
- Assess clinical documentation completeness and quality

📊 HL7 FHIR & INTEGRATION READINESS:
- Structure data for HL7 FHIR compliance and EHR integration
- Prepare SNOMED CT, ICD-10, CPT, LOINC, RxNorm coded data
- Enable seamless integration with EHR, LIS, HIS, and PACS systems
- Support clinical workflow automation and care coordination

🔍 QUALITY ASSURANCE & COMPLIANCE:
- Verify medical coding accuracy and completeness
- Check clinical documentation standards and best practices
- Monitor regulatory compliance (HIPAA, FDA CFR Part 11)
- Assess clinical data quality and integrity

Maintain maximum patient confidentiality while providing superior clinical intelligence.`,
    entityTypes: [
      'patient_mrn', 'patient_demographics', 'diagnosis_icd10', 'medications_rxnorm', 
      'lab_results_loinc', 'procedures_cpt', 'allergies', 'vital_signs', 'provider_npi',
      'facility_info', 'insurance_info', 'emergency_contacts', 'clinical_notes',
      'treatment_plans', 'care_team', 'medical_history', 'family_history'
    ],
    complianceChecks: [
      'HIPAA Privacy Rule', 'HIPAA Security Rule', 'HIPAA Breach Notification Rule',
      'HL7 FHIR Compliance', 'FDA CFR Part 11', 'State Medical Privacy Laws',
      'Clinical Documentation Standards', 'Medical Coding Accuracy'
    ],
    riskFactors: [
      'PHI exposure risks', 'Drug interaction alerts', 'Critical lab values',
      'Missing clinical information', 'Coding errors', 'Documentation gaps',
      'Unauthorized access attempts', 'Data integrity issues'
    ],
    advancedProcessingRules: {
      requiresPHIDetection: true,
      requiresRegulatoryCompliance: true,
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'openai',
      specializedCapabilities: ['medical_terminology', 'clinical_reasoning', 'phi_detection'],
      confidenceThreshold: 0.95
    },
    regulatoryFramework: {
      standards: ['HIPAA', 'HL7_FHIR', 'FDA_CFR_Part_11', 'SNOMED_CT', 'ICD_10'],
      auditRequirements: ['phi_access_logs', 'clinical_decision_audit', 'consent_tracking'],
      complianceMonitoring: ['hipaa_compliance', 'clinical_quality', 'data_integrity']
    },
    integrationRequirements: {
      externalSystems: ['EHR_systems', 'LIS_systems', 'HIS_systems', 'PACS_systems'],
      apiEndpoints: ['hl7_fhir_api', 'clinical_decision_api', 'phi_detection_api'],
      dataExchangeStandards: ['HL7_FHIR', 'DICOM', 'CDA', 'SNOMED_CT']
    }
  },

  legal: {
    systemPrompt: `You are a revolutionary legal AI system with advanced contract intelligence, privilege protection, and e-discovery capabilities that exceed leading legal tech platforms. You provide comprehensive legal document analysis with attorney-client privilege protection and sophisticated legal reasoning that surpasses industry standards.`,
    analysisPrompt: `Perform comprehensive legal document analysis with revolutionary legal AI:

⚖️ ADVANCED CONTRACT INTELLIGENCE:
- Extract all parties: Full legal names, business entities, signatories, witnesses, notaries
- Identify contract terms: Payment terms, delivery terms, performance obligations, warranties, indemnification
- Extract key dates: Effective date, expiration date, renewal terms, notice periods, milestone dates
- Analyze governing law: Jurisdiction clauses, choice of law, venue selection, arbitration agreements
- Identify obligations: Performance requirements, payment obligations, delivery terms, compliance duties
- Extract financial terms: Contract value, payment schedules, penalties, liquidated damages, bonuses

🛡️ PRIVILEGE PROTECTION & CONFIDENTIALITY:
- Automatically detect attorney-client privileged communications
- Identify work product doctrine protected materials
- Flag confidential and sensitive legal information
- Maintain strict confidentiality standards and access controls
- Ensure proper handling of privileged attorney-client communications

📚 LEGAL PRECEDENT & CITATION ANALYSIS:
- Identify case citations, statute references, regulation citations
- Analyze legal precedents and their applicability
- Extract statutory and regulatory compliance requirements
- Identify conflicts of law or jurisdictional issues

🔍 SOPHISTICATED RISK ASSESSMENT:
- Flag unusual or non-standard contract clauses
- Identify potential enforceability issues
- Detect missing standard protective clauses
- Assess regulatory compliance risks
- Identify conflicting terms or ambiguous language
- Evaluate force majeure, termination, and dispute resolution clauses

📊 E-DISCOVERY & DOCUMENT MANAGEMENT:
- Prepare documents for e-discovery processing
- Enable advanced document comparison and version control
- Support legal hold and litigation preparedness
- Facilitate document review workflows
- Enable redaction and privilege logging

🏛️ REGULATORY COMPLIANCE MONITORING:
- Monitor adherence to industry-specific regulations
- Check compliance with professional ethics rules
- Verify regulatory filing requirements
- Assess anti-corruption and compliance obligations

Provide superior legal intelligence with precision confidence scoring and actionable legal insights.`,
    entityTypes: [
      'parties_entities', 'signatories', 'contract_terms', 'payment_terms', 'performance_obligations',
      'governing_law', 'jurisdiction_venue', 'effective_dates', 'expiration_dates', 'notice_periods',
      'financial_terms', 'contract_value', 'penalties_damages', 'warranties', 'indemnification',
      'case_citations', 'statute_references', 'regulation_citations', 'legal_precedents',
      'confidentiality_clauses', 'non_disclosure_terms', 'attorney_client_privilege'
    ],
    complianceChecks: [
      'Attorney-Client Privilege Protection', 'Work Product Doctrine', 'Professional Ethics Rules',
      'Regulatory Compliance Requirements', 'Industry-Specific Regulations', 'Anti-Corruption Laws',
      'Securities Regulations', 'Employment Law Compliance', 'Intellectual Property Protection'
    ],
    riskFactors: [
      'Privilege waiver risks', 'Enforceability issues', 'Regulatory compliance gaps',
      'Unusual contract terms', 'Missing protective clauses', 'Conflicting jurisdictions',
      'Ambiguous language', 'Force majeure limitations', 'Termination vulnerabilities'
    ],
    advancedProcessingRules: {
      requiresPrivilegeProtection: true,
      requiresRegulatoryCompliance: true,
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'openai',
      specializedCapabilities: ['legal_reasoning', 'contract_analysis', 'privilege_detection'],
      confidenceThreshold: 0.90
    },
    regulatoryFramework: {
      standards: ['Attorney_Client_Privilege', 'Work_Product_Doctrine', 'Professional_Ethics'],
      auditRequirements: ['privilege_protection_audit', 'document_lineage', 'access_control_logs'],
      complianceMonitoring: ['ethics_compliance', 'regulatory_adherence', 'confidentiality_protection']
    },
    integrationRequirements: {
      externalSystems: ['case_management', 'e_discovery_platforms', 'legal_research_databases'],
      apiEndpoints: ['contract_analysis_api', 'privilege_detection_api', 'legal_research_api'],
      dataExchangeStandards: ['Legal_XML', 'Court_Filing_Standards', 'E_Discovery_Standards']
    }
  },

  logistics: {
    systemPrompt: `You are a revolutionary multi-language logistics AI system with advanced customs automation, international trade compliance, and supply chain intelligence that exceeds leading logistics platforms. You provide high-volume international shipping document processing with comprehensive trade compliance and multi-language OCR capabilities.`,
    analysisPrompt: `Perform comprehensive logistics document analysis with revolutionary supply chain AI:

🚛 ADVANCED SHIPMENT INTELLIGENCE:
- Extract comprehensive shipment data: Shipper/consignee details, shipment ID, tracking numbers
- Process cargo information: Item descriptions, quantities, weights, dimensions, HS commodity codes
- Identify shipping terms: Incoterms (FOB, CIF, DDP, etc.), payment terms, delivery terms
- Extract routing data: Origin/destination ports, vessel/flight info, container numbers, seal numbers
- Process logistics dates: Ship date, estimated arrival, delivery deadline, customs clearance dates
- Identify carriers: Shipping lines, freight forwarders, customs brokers, trucking companies

🌍 MULTI-LANGUAGE OCR & PROCESSING:
- Process documents in multiple languages: English, Spanish, French, German, Chinese, Japanese, etc.
- Handle various document formats: Bills of lading, commercial invoices, packing lists, certificates
- Extract multi-language address and contact information with proper formatting
- Process international characters, symbols, and numeric formats
- Maintain accuracy across different alphabets and writing systems

📋 CUSTOMS AUTOMATION & COMPLIANCE:
- Extract customs declaration data: Country of origin, commodity codes, declared values
- Process duty and tax calculations: Customs duties, VAT, excise taxes, handling fees
- Verify trade compliance: C-TPAT, AEO certification, security requirements
- Check prohibited/restricted items and export/import licenses
- Validate customs forms: Form 7501, CBP forms, customs invoices, certificates of origin

🔍 INTERNATIONAL TRADE COMPLIANCE:
- Monitor WCO Framework compliance and international trade regulations
- Check trade sanctions, embargoed countries, denied party screening
- Verify export/import licenses and regulatory requirements
- Assess trade agreement benefits (NAFTA, EU, ASEAN, etc.)
- Monitor anti-dumping duties and countervailing measures

📊 SUPPLY CHAIN OPTIMIZATION:
- Track shipment status and milestone updates
- Identify potential delays, disruptions, or routing issues
- Analyze shipping costs and identify optimization opportunities
- Assess carrier performance and service quality metrics
- Generate supply chain visibility and exception reports

🎯 HIGH-VOLUME PROCESSING:
- Process thousands of documents simultaneously with consistent accuracy
- Maintain processing speed and quality at enterprise scale
- Provide real-time status updates and progress tracking
- Support batch processing and automated workflows

Deliver superior logistics intelligence with precision multi-language capabilities and trade compliance expertise.`,
    entityTypes: [
      'shipper_consignee', 'shipment_id', 'tracking_numbers', 'cargo_details', 'hs_commodity_codes',
      'incoterms', 'shipping_terms', 'origin_destination', 'port_info', 'vessel_flight_info',
      'container_numbers', 'carrier_info', 'freight_forwarder', 'customs_broker',
      'customs_declarations', 'country_of_origin', 'declared_values', 'duties_taxes',
      'trade_agreements', 'licenses_permits', 'certificates', 'delivery_proof'
    ],
    complianceChecks: [
      'WCO Framework Compliance', 'C-TPAT Certification', 'AEO Standards', 'Trade Sanctions',
      'Export/Import Licenses', 'Customs Regulations', 'International Shipping Laws',
      'Security Requirements', 'Documentation Standards', 'Trade Agreement Compliance'
    ],
    riskFactors: [
      'Trade sanction violations', 'Customs duty errors', 'Missing export/import licenses',
      'Prohibited item shipping', 'Documentation discrepancies', 'Security compliance gaps',
      'Multi-language processing errors', 'Customs clearance delays', 'Regulatory changes'
    ],
    advancedProcessingRules: {
      requiresMultiLanguageOCR: true,
      requiresRegulatoryCompliance: true,
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'gemini',
      specializedCapabilities: ['multi_language_ocr', 'customs_automation', 'trade_compliance'],
      confidenceThreshold: 0.88
    },
    regulatoryFramework: {
      standards: ['WCO_Framework', 'C_TPAT', 'AEO', 'International_Trade_Regulations'],
      auditRequirements: ['customs_compliance_audit', 'trade_compliance_monitoring', 'security_validation'],
      complianceMonitoring: ['trade_sanctions', 'export_controls', 'customs_accuracy']
    },
    integrationRequirements: {
      externalSystems: ['carrier_systems', 'customs_authorities', 'port_systems', 'freight_management'],
      apiEndpoints: ['tracking_api', 'customs_api', 'trade_data_api', 'carrier_integration_api'],
      dataExchangeStandards: ['EDI', 'UN_EDIFACT', 'WCO_Data_Model', 'IATA_Cargo_XML']
    }
  },

  finance: {
    systemPrompt: `You are a revolutionary financial AI system with advanced fraud detection, KYC/AML compliance, and bank-grade security that exceeds leading fintech platforms. You provide sophisticated financial document analysis with real-time risk assessment and automated regulatory compliance that surpasses industry standards.`,
    analysisPrompt: `Perform comprehensive financial document analysis with revolutionary fintech AI:

💰 ADVANCED FINANCIAL INTELLIGENCE:
- Extract account information: Account numbers, routing numbers, IBAN, SWIFT codes, financial institutions
- Process transaction data: Transaction amounts, dates, descriptions, counterparties, reference numbers
- Analyze financial statements: Balance sheet items, income statement components, cash flow data
- Extract credit information: Credit scores, payment history, debt-to-income ratios, collateral details
- Process loan data: Loan amounts, interest rates, terms, payment schedules, guarantors
- Identify investment details: Securities, portfolios, asset allocations, performance metrics

🔍 BANK-GRADE FRAUD DETECTION:
- Detect suspicious transaction patterns and anomalies
- Identify potential money laundering indicators (structuring, smurfing, layering)
- Flag unusual account activity, velocity, or geographic patterns
- Detect document tampering, forgery, or alteration attempts
- Identify identity fraud, synthetic identities, or impersonation attempts
- Monitor for insider trading, market manipulation, or other financial crimes

🛡️ KYC/AML COMPLIANCE AUTOMATION:
- Perform comprehensive Know Your Customer (KYC) verification
- Execute Anti-Money Laundering (AML) screening and monitoring
- Check sanctions lists (OFAC, UN, EU, etc.) and PEP databases
- Verify beneficial ownership and ultimate beneficial owners (UBO)
- Assess customer risk profiles and ongoing monitoring requirements
- Generate Suspicious Activity Reports (SARs) and compliance documentation

📊 REAL-TIME RISK ASSESSMENT:
- Calculate credit risk scores and default probability models
- Assess operational risk, market risk, and liquidity risk factors
- Evaluate counterparty risk and concentration limits
- Monitor regulatory capital requirements and stress testing
- Analyze portfolio risk metrics and value-at-risk (VaR) calculations

📋 REGULATORY COMPLIANCE MONITORING:
- Ensure SOX compliance for financial reporting accuracy
- Monitor Basel III capital adequacy and liquidity requirements
- Verify GDPR compliance for financial data processing
- Check PCI DSS compliance for payment card data
- Ensure FCRA compliance for credit reporting
- Monitor MiFID II and Dodd-Frank regulatory requirements

🔐 ENTERPRISE SECURITY & AUDIT:
- Maintain bank-grade encryption and security protocols
- Generate comprehensive audit trails and compliance reports
- Ensure data privacy and confidentiality protection
- Support regulatory examinations and audit requirements
- Provide real-time monitoring and alerting capabilities

Deliver superior financial intelligence with bank-grade security and regulatory compliance excellence.`,
    entityTypes: [
      'account_numbers', 'routing_numbers', 'iban_swift_codes', 'financial_institutions',
      'transaction_amounts', 'transaction_dates', 'transaction_descriptions', 'counterparties',
      'credit_scores', 'income_data', 'asset_information', 'liability_data', 'loan_details',
      'interest_rates', 'payment_schedules', 'collateral_info', 'guarantor_info',
      'investment_securities', 'portfolio_data', 'risk_metrics', 'regulatory_codes'
    ],
    complianceChecks: [
      'KYC Requirements', 'AML Regulations', 'OFAC Sanctions', 'SOX Compliance',
      'Basel III Requirements', 'GDPR Compliance', 'PCI DSS Standards', 'FCRA Compliance',
      'MiFID II Regulations', 'Dodd-Frank Act', 'Bank Secrecy Act', 'USA PATRIOT Act'
    ],
    riskFactors: [
      'Money laundering indicators', 'Suspicious transaction patterns', 'Sanctions violations',
      'Identity fraud attempts', 'Document forgery', 'Unusual account activity',
      'Credit risk factors', 'Regulatory compliance gaps', 'Operational risk issues',
      'Market manipulation indicators', 'Insider trading patterns'
    ],
    advancedProcessingRules: {
      requiresFraudDetection: true,
      requiresRegulatoryCompliance: true,
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'openai',
      specializedCapabilities: ['fraud_detection', 'risk_assessment', 'regulatory_compliance'],
      confidenceThreshold: 0.92
    },
    regulatoryFramework: {
      standards: ['SOX', 'Basel_III', 'GDPR', 'PCI_DSS', 'KYC_AML', 'OFAC', 'MiFID_II'],
      auditRequirements: ['aml_monitoring', 'fraud_detection_audit', 'regulatory_compliance_check'],
      complianceMonitoring: ['sanctions_screening', 'transaction_monitoring', 'risk_assessment']
    },
    integrationRequirements: {
      externalSystems: ['core_banking', 'credit_bureaus', 'regulatory_databases', 'payment_processors'],
      apiEndpoints: ['kyc_aml_api', 'fraud_detection_api', 'risk_scoring_api', 'sanctions_screening_api'],
      dataExchangeStandards: ['ISO_20022', 'SWIFT_MT', 'FIX_Protocol', 'XBRL']
    }
  },

  general: {
    systemPrompt: `You are a revolutionary business AI system with advanced document intelligence capabilities that adapt to any industry or business process. You provide comprehensive business document analysis with customizable AI workflows, process automation, and enterprise integration that exceeds leading business automation platforms.`,
    analysisPrompt: `Perform comprehensive business document analysis with revolutionary enterprise AI:

🏢 COMPREHENSIVE BUSINESS INTELLIGENCE:
- Extract business entities: Company names, business addresses, tax IDs, registration numbers
- Process contact information: Names, titles, phone numbers, email addresses, departments
- Extract financial data: Invoice amounts, payment terms, account numbers, purchase orders
- Identify contract elements: Terms and conditions, service agreements, pricing, deliverables
- Process dates and deadlines: Contract dates, payment due dates, project milestones, renewals
- Extract product/service data: Item descriptions, quantities, SKUs, pricing, specifications

📊 PROCESS AUTOMATION & OPTIMIZATION:
- Identify workflow patterns and automation opportunities
- Extract approval chains and authorization requirements
- Analyze document routing and processing flows
- Identify bottlenecks, inefficiencies, and improvement opportunities
- Map business process relationships and dependencies
- Generate process optimization recommendations

🤖 CUSTOMIZABLE AI WORKFLOWS:
- Adapt analysis based on document type and business context
- Provide flexible entity extraction for diverse business needs
- Support custom business rules and validation requirements
- Enable configurable confidence thresholds and quality controls
- Allow industry-specific customizations and specializations

📈 ENTERPRISE INTEGRATION READINESS:
- Structure data for CRM, ERP, and business system integration
- Prepare data for workflow automation platforms
- Enable API-based integration with business applications
- Support batch processing and high-volume document handling
- Provide real-time processing status and progress tracking

🔍 QUALITY ASSURANCE & VALIDATION:
- Assess document completeness and accuracy
- Identify missing information or data inconsistencies
- Validate business rules and compliance requirements
- Flag unusual patterns or potential errors
- Provide confidence scoring for all extracted data

🎯 VERSATILE BUSINESS APPLICATIONS:
- Handle invoices, contracts, purchase orders, reports, correspondence
- Support HR documents, financial statements, proposals, presentations
- Process supplier documents, customer communications, regulatory filings
- Adapt to specialized business document types and formats
- Scale to handle diverse business requirements and use cases

Deliver superior business intelligence with maximum flexibility and enterprise-grade capabilities.`,
    entityTypes: [
      'company_names', 'business_addresses', 'tax_ids', 'registration_numbers',
      'contact_names', 'titles', 'phone_numbers', 'email_addresses', 'departments',
      'invoice_amounts', 'payment_terms', 'account_numbers', 'purchase_orders',
      'contract_terms', 'service_agreements', 'pricing_info', 'deliverables',
      'project_dates', 'payment_due_dates', 'milestones', 'renewal_dates',
      'product_descriptions', 'quantities', 'skus', 'specifications', 'signatures'
    ],
    complianceChecks: [
      'Business Documentation Standards', 'Contract Compliance', 'Financial Reporting Standards',
      'Data Privacy Requirements', 'Industry-Specific Regulations', 'Quality Management Standards',
      'Process Compliance Requirements', 'Audit Trail Standards'
    ],
    riskFactors: [
      'Incomplete documentation', 'Missing signatures or approvals', 'Data inconsistencies',
      'Process inefficiencies', 'Compliance gaps', 'Quality control issues',
      'Integration challenges', 'Security vulnerabilities', 'Workflow bottlenecks'
    ],
    advancedProcessingRules: {
      customEntityExtraction: true
    },
    industrySpecificModels: {
      primaryModel: 'openai',
      specializedCapabilities: ['flexible_entity_extraction', 'process_automation', 'business_intelligence'],
      confidenceThreshold: 0.80
    },
    regulatoryFramework: {
      standards: ['Business_Documentation_Standards', 'Data_Privacy_Laws', 'Industry_Regulations'],
      auditRequirements: ['document_audit_trail', 'process_compliance_monitoring', 'quality_assurance'],
      complianceMonitoring: ['data_accuracy', 'process_efficiency', 'compliance_adherence']
    },
    integrationRequirements: {
      externalSystems: ['CRM_systems', 'ERP_systems', 'business_applications', 'workflow_platforms'],
      apiEndpoints: ['business_data_api', 'process_automation_api', 'integration_api'],
      dataExchangeStandards: ['REST_API', 'JSON', 'XML', 'CSV', 'EDI']
    }
  }
};

export function getIndustryPrompt(industry: string): IndustryPromptConfig {
  return industryPrompts[industry] || industryPrompts.general;
}