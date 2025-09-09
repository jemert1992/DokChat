// Industry-specific AI analysis prompts based on comprehensive research requirements

export interface IndustryPromptConfig {
  systemPrompt: string;
  analysisPrompt: string;
  entityTypes: string[];
  complianceChecks: string[];
  riskFactors: string[];
}

export const industryPrompts: Record<string, IndustryPromptConfig> = {
  real_estate: {
    systemPrompt: `You are a real estate document analysis expert with deep knowledge of property transactions, real estate law, and industry compliance requirements including Fair Housing, Title Insurance, and Escrow regulations.`,
    analysisPrompt: `Analyze this real estate document for:
- CONTRACT INTELLIGENCE: Extract buyer/seller information, purchase price, property address, closing dates, contingencies, and key terms
- DEAL MANAGEMENT: Identify missing signatures, required disclosures, inspection requirements, and deadline tracking
- COMPLIANCE REVIEW: Check for Fair Housing compliance, disclosure requirements, title insurance standards, and escrow regulations
- ENTITY EXTRACTION: Find agent/realtor information, lender details, title company, escrow instructions
- RISK ASSESSMENT: Flag unusual clauses, missing standard language, regulatory risks, or potential legal issues
- TRANSACTION FLOW: Identify document type (purchase agreement, lease, disclosure, inspection, closing docs)

Provide structured analysis with confidence scores for each finding.`,
    entityTypes: [
      'property_address', 'buyer_seller_info', 'purchase_price', 'closing_date', 
      'agent_info', 'contingencies', 'inspection_info', 'lender_info', 
      'title_company', 'escrow_instructions', 'disclosure_requirements'
    ],
    complianceChecks: [
      'Fair Housing Compliance', 'Disclosure Requirements', 'Title Insurance Standards', 
      'Escrow Regulations', 'State Real Estate Laws', 'Local Ordinances'
    ],
    riskFactors: [
      'Missing required disclosures', 'Unusual contract terms', 'Incomplete signatures',
      'Deadline conflicts', 'Title issues', 'Inspection contingencies'
    ]
  },

  medical: {
    systemPrompt: `You are a medical document analysis expert with expertise in HIPAA compliance, clinical terminology, and healthcare documentation standards.`,
    analysisPrompt: `Analyze this medical document for:
- HIPAA COMPLIANCE: Ensure patient confidentiality and data protection standards
- CLINICAL DATA: Extract patient information, diagnoses, medications, lab results, treatment plans
- MEDICAL TERMINOLOGY: Interpret clinical jargon, abbreviations, and medical codes
- DECISION SUPPORT: Identify potential medication conflicts, missing information, or clinical inconsistencies
- QUALITY ASSURANCE: Check for completeness, accuracy, and standard medical documentation practices

Maintain strict confidentiality and provide medically accurate analysis.`,
    entityTypes: [
      'patient_info', 'diagnosis', 'medication', 'lab_result', 'provider_info',
      'treatment_plan', 'allergies', 'vital_signs', 'medical_history'
    ],
    complianceChecks: [
      'HIPAA Compliance', 'Medical Standards', 'Clinical Documentation',
      'Patient Privacy', 'Data Security'
    ],
    riskFactors: [
      'HIPAA violations', 'Incomplete patient data', 'Medication conflicts',
      'Missing signatures', 'Clinical inconsistencies'
    ]
  },

  legal: {
    systemPrompt: `You are a legal document analysis expert with expertise in contract law, litigation support, and legal risk assessment.`,
    analysisPrompt: `Analyze this legal document for:
- CONTRACT ANALYSIS: Extract key terms, parties, obligations, deadlines, and conditions
- LEGAL RISK ASSESSMENT: Identify potential legal issues, unusual clauses, or regulatory concerns
- ENTITY EXTRACTION: Find all parties, jurisdictions, governing law, and legal entities
- COMPLIANCE CHECK: Verify adherence to legal standards and regulatory requirements
- VERSION CONTROL: Track changes, amendments, and document versions
- CONFIDENTIALITY: Ensure proper handling of sensitive legal information

Provide thorough legal analysis with risk assessments.`,
    entityTypes: [
      'contract_parties', 'legal_terms', 'obligations', 'deadlines', 'governing_law',
      'jurisdiction', 'penalties', 'amendments', 'signatures'
    ],
    complianceChecks: [
      'Legal Standards', 'Regulatory Compliance', 'Contract Law',
      'Jurisdiction Requirements', 'Professional Standards'
    ],
    riskFactors: [
      'Unusual contract terms', 'Regulatory violations', 'Missing clauses',
      'Deadline conflicts', 'Jurisdiction issues'
    ]
  },

  logistics: {
    systemPrompt: `You are a logistics and shipping document expert with knowledge of international trade, customs regulations, and supply chain documentation.`,
    analysisPrompt: `Analyze this logistics document for:
- SHIPMENT PROCESSING: Extract shipping details, tracking numbers, delivery addresses, and timelines
- CUSTOMS COMPLIANCE: Verify customs forms, declarations, and international shipping requirements
- MULTI-LANGUAGE SUPPORT: Process documents in various languages and formats
- DELIVERY TRACKING: Extract proof of delivery, status updates, and logistics information
- REGULATORY COMPLIANCE: Check adherence to shipping regulations and international trade laws

Handle multi-language documents and international shipping complexities.`,
    entityTypes: [
      'shipment_details', 'tracking_numbers', 'delivery_address', 'customs_info',
      'shipping_costs', 'carrier_info', 'delivery_status', 'international_codes'
    ],
    complianceChecks: [
      'Customs Regulations', 'International Shipping Laws', 'Carrier Requirements',
      'Import/Export Compliance', 'Documentation Standards'
    ],
    riskFactors: [
      'Customs violations', 'Missing documentation', 'Incorrect declarations',
      'Shipping delays', 'International compliance issues'
    ]
  },

  finance: {
    systemPrompt: `You are a financial document analysis expert with expertise in fraud detection, regulatory compliance, and financial reporting.`,
    analysisPrompt: `Analyze this financial document for:
- FINANCIAL ENTITY EXTRACTION: Find account numbers, amounts, transaction details, and financial entities
- FRAUD DETECTION: Identify suspicious patterns, anomalies, or potential fraudulent activities
- REGULATORY COMPLIANCE: Check adherence to financial regulations and reporting standards
- RISK ASSESSMENT: Evaluate financial risks, credit worthiness, and compliance issues
- AUTOMATED REPORTING: Generate compliance reports and financial summaries

Maintain strict security and accuracy in financial analysis.`,
    entityTypes: [
      'financial_amounts', 'account_numbers', 'transaction_details', 'financial_entities',
      'dates', 'signatures', 'regulatory_codes', 'risk_indicators'
    ],
    complianceChecks: [
      'Financial Regulations', 'Anti-Money Laundering', 'Know Your Customer',
      'Reporting Standards', 'Audit Requirements'
    ],
    riskFactors: [
      'Fraudulent patterns', 'Regulatory violations', 'Suspicious transactions',
      'Missing documentation', 'Compliance gaps'
    ]
  },

  general: {
    systemPrompt: `You are a business document analysis expert with broad knowledge of various document types and business processes.`,
    analysisPrompt: `Analyze this business document for:
- DATA EXTRACTION: Extract structured information from various document formats
- PROCESS AUTOMATION: Identify workflow patterns and automation opportunities
- ENTITY RECOGNITION: Find key business entities, dates, amounts, and relationships
- QUALITY ASSESSMENT: Evaluate document completeness and accuracy
- WORKFLOW OPTIMIZATION: Suggest improvements to document processing workflows

Provide versatile analysis suitable for general business use.`,
    entityTypes: [
      'business_entities', 'dates', 'amounts', 'contact_info', 'addresses',
      'contract_terms', 'signatures', 'reference_numbers'
    ],
    complianceChecks: [
      'Business Standards', 'Documentation Requirements', 'Process Compliance',
      'Quality Standards', 'Workflow Standards'
    ],
    riskFactors: [
      'Incomplete information', 'Process inefficiencies', 'Missing signatures',
      'Data inconsistencies', 'Workflow bottlenecks'
    ]
  }
};

export function getIndustryPrompt(industry: string): IndustryPromptConfig {
  return industryPrompts[industry] || industryPrompts.general;
}