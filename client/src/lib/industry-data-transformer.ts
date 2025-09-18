// Industry-specific data transformers for professional document analysis display

export interface ProcessedInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  icon: string;
  details?: string[];
  actions?: string[];
  confidence?: number;
  source?: string;
  metadata?: any;
}

export interface ProcessedEntity {
  id: string;
  type: string;
  value: string;
  category: string;
  icon: string;
  importance: 'high' | 'medium' | 'low';
  context?: string;
  relatedInsights?: string[];
}

export interface TransformedData {
  insights: ProcessedInsight[];
  entities: ProcessedEntity[];
  summary: {
    title: string;
    description: string;
    score?: number;
    status?: 'excellent' | 'good' | 'needs-attention' | 'critical';
  };
  recommendations: string[];
  complianceStatus?: {
    compliant: boolean;
    standards: string[];
    issues: string[];
  };
}

// Transform raw AI data based on industry
export function transformDataForIndustry(
  rawData: any,
  industry: string
): TransformedData {
  const transformer = industryTransformers[industry] || industryTransformers.general;
  return transformer(rawData);
}

const industryTransformers: Record<string, (data: any) => TransformedData> = {
  medical: transformMedicalData,
  legal: transformLegalData,
  logistics: transformLogisticsData,
  finance: transformFinanceData,
  real_estate: transformRealEstateData,
  general: transformGeneralData,
};

function transformMedicalData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Extract clinical findings from AI results
  if (data?.openai) {
    // Clinical findings
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        if (entity.type === 'diagnosis' || entity.type === 'condition') {
          insights.push({
            id: `clinical-${index}`,
            category: 'Clinical Findings',
            title: 'Diagnosis Identified',
            description: entity.value,
            severity: entity.confidence > 0.8 ? 'critical' : 'warning',
            icon: 'fas fa-stethoscope',
            details: [`Confidence: ${Math.round(entity.confidence * 100)}%`],
            actions: ['Review with physician', 'Update patient record'],
            confidence: entity.confidence,
          });
        } else if (entity.type === 'medication') {
          insights.push({
            id: `med-${index}`,
            category: 'Medications',
            title: 'Medication Detected',
            description: entity.value,
            severity: 'info',
            icon: 'fas fa-pills',
            details: ['Check for interactions', 'Verify dosage'],
            confidence: entity.confidence,
          });
        }
        
        // Add to entities
        entities.push({
          id: `entity-${index}`,
          type: entity.type,
          value: entity.value,
          category: getClinicalCategory(entity.type),
          icon: getClinicalIcon(entity.type),
          importance: entity.confidence > 0.8 ? 'high' : 'medium',
          context: 'Extracted from patient record',
        });
      });
    }

    // HIPAA Compliance
    if (data.openai.compliance) {
      const isCompliant = data.openai.compliance.status === 'compliant';
      insights.push({
        id: 'hipaa-compliance',
        category: 'Compliance',
        title: 'HIPAA Compliance Status',
        description: isCompliant ? 'Document is HIPAA compliant' : 'HIPAA compliance issues detected',
        severity: isCompliant ? 'success' : 'critical',
        icon: 'fas fa-shield-alt',
        details: data.openai.compliance.issues || [],
        actions: isCompliant ? [] : ['Review PHI handling', 'Apply redaction if needed'],
      });
    }

    // Lab results
    if (data.openai.insights) {
      data.openai.insights.forEach((insight: string, index: number) => {
        if (insight.toLowerCase().includes('lab') || insight.toLowerCase().includes('result')) {
          insights.push({
            id: `lab-${index}`,
            category: 'Lab Results',
            title: 'Lab Finding',
            description: insight,
            severity: 'info',
            icon: 'fas fa-flask',
            actions: ['Review with specialist'],
          });
        }
      });
    }
  }

  // Process Gemini results for additional clinical context
  if (data?.gemini) {
    if (data.gemini.insights) {
      data.gemini.insights.forEach((insight: string) => {
        if (insight.toLowerCase().includes('treatment') || insight.toLowerCase().includes('recommendation')) {
          recommendations.push(`Clinical recommendation: ${insight}`);
        }
      });
    }
  }

  // Generate professional summary
  const summary = {
    title: 'Clinical Document Analysis',
    description: data?.consensus?.summary || 'Comprehensive medical record analysis completed',
    score: Math.round((data?.openai?.aiConfidence || 0.85) * 100),
    status: determineHealthStatus(insights) as 'excellent' | 'good' | 'needs-attention' | 'critical',
  };

  return {
    insights,
    entities,
    summary,
    recommendations: recommendations.length > 0 ? recommendations : [
      'Schedule follow-up appointment',
      'Update electronic health records',
      'Review with care team',
    ],
    complianceStatus: {
      compliant: !insights.some(i => i.id === 'hipaa-compliance' && i.severity === 'critical'),
      standards: ['HIPAA', 'HL7 FHIR', 'FDA CFR Part 11'],
      issues: insights.filter(i => i.severity === 'critical').map(i => i.title),
    },
  };
}

function transformLegalData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Extract contract terms and legal entities
  if (data?.openai) {
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        if (entity.type === 'party' || entity.type === 'organization') {
          entities.push({
            id: `party-${index}`,
            type: 'Legal Party',
            value: entity.value,
            category: 'Parties & Entities',
            icon: 'fas fa-user-tie',
            importance: 'high',
            context: 'Contract party',
          });
        } else if (entity.type === 'date' || entity.type === 'deadline') {
          insights.push({
            id: `deadline-${index}`,
            category: 'Important Dates',
            title: 'Key Date Identified',
            description: entity.value,
            severity: 'warning',
            icon: 'fas fa-calendar-alt',
            details: ['Add to calendar', 'Set reminder'],
            confidence: entity.confidence,
          });
        } else if (entity.type === 'monetary' || entity.type === 'amount') {
          insights.push({
            id: `financial-${index}`,
            category: 'Financial Terms',
            title: 'Monetary Amount',
            description: entity.value,
            severity: 'info',
            icon: 'fas fa-dollar-sign',
            confidence: entity.confidence,
          });
        }
      });
    }

    // Contract clauses and risks
    if (data.openai.insights) {
      data.openai.insights.forEach((insight: string, index: number) => {
        if (insight.toLowerCase().includes('risk') || insight.toLowerCase().includes('liability')) {
          insights.push({
            id: `risk-${index}`,
            category: 'Risk Assessment',
            title: 'Legal Risk Identified',
            description: insight,
            severity: 'critical',
            icon: 'fas fa-exclamation-triangle',
            actions: ['Review with legal counsel', 'Request clarification'],
          });
        } else if (insight.toLowerCase().includes('clause') || insight.toLowerCase().includes('term')) {
          insights.push({
            id: `clause-${index}`,
            category: 'Contract Terms',
            title: 'Key Clause',
            description: insight,
            severity: 'info',
            icon: 'fas fa-file-contract',
            actions: ['Review terms', 'Negotiate if needed'],
          });
        }
      });
    }
  }

  // Privilege and compliance
  const hasPrivilegedContent = data?.openai?.compliance?.issues?.some((issue: string) => 
    issue.toLowerCase().includes('privilege')
  );

  if (hasPrivilegedContent) {
    insights.push({
      id: 'privilege-protection',
      category: 'Compliance',
      title: 'Attorney-Client Privilege',
      description: 'Document contains privileged information',
      severity: 'critical',
      icon: 'fas fa-lock',
      details: ['Restricted access required', 'Do not share externally'],
      actions: ['Apply privilege protection', 'Limit distribution'],
    });
  }

  const summary = {
    title: 'Legal Document Intelligence',
    description: data?.consensus?.summary || 'Comprehensive legal analysis completed',
    score: Math.round((data?.openai?.aiConfidence || 0.88) * 100),
    status: (insights.some(i => i.severity === 'critical') ? 'needs-attention' : 'good') as 'needs-attention' | 'good',
  };

  return {
    insights,
    entities,
    summary,
    recommendations: recommendations.length > 0 ? recommendations : [
      'Schedule legal review',
      'Verify all party signatures',
      'Check jurisdiction requirements',
      'Set calendar reminders for key dates',
    ],
    complianceStatus: {
      compliant: !hasPrivilegedContent,
      standards: ['Attorney-Client Privilege', 'Work Product Doctrine', 'Bar Ethics Rules'],
      issues: insights.filter(i => i.severity === 'critical').map(i => i.title),
    },
  };
}

function transformLogisticsData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Extract shipping and customs information
  if (data?.openai) {
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        if (entity.type === 'location' || entity.type === 'port') {
          entities.push({
            id: `location-${index}`,
            type: 'Shipping Location',
            value: entity.value,
            category: 'Route Information',
            icon: 'fas fa-map-marker-alt',
            importance: 'high',
            context: 'Shipping route point',
          });
        } else if (entity.type === 'tracking' || entity.type === 'shipment_id') {
          entities.push({
            id: `tracking-${index}`,
            type: 'Tracking Number',
            value: entity.value,
            category: 'Shipment Details',
            icon: 'fas fa-barcode',
            importance: 'high',
            context: 'Track shipment status',
          });
        }
      });
    }

    // Customs and compliance
    if (data.openai.compliance) {
      const customsCompliant = data.openai.compliance.status === 'compliant';
      insights.push({
        id: 'customs-compliance',
        category: 'Customs',
        title: 'Customs Clearance Status',
        description: customsCompliant ? 'Ready for customs clearance' : 'Customs issues detected',
        severity: customsCompliant ? 'success' : 'critical',
        icon: 'fas fa-passport',
        details: data.openai.compliance.issues || ['All documentation complete'],
        actions: customsCompliant ? [] : ['Review customs forms', 'Update HS codes'],
      });
    }

    // Multi-language processing
    if (data.openai.insights) {
      const hasMultiLanguage = data.openai.insights.some((i: string) => 
        i.toLowerCase().includes('language') || i.toLowerCase().includes('translation')
      );
      if (hasMultiLanguage) {
        insights.push({
          id: 'multi-language',
          category: 'Processing',
          title: 'Multi-Language Document',
          description: 'Successfully processed multiple languages',
          severity: 'success',
          icon: 'fas fa-language',
          details: ['Translation verified', 'All languages processed'],
        });
      }
    }
  }

  // Gemini shipping optimization
  if (data?.gemini?.insights) {
    data.gemini.insights.forEach((insight: string, index: number) => {
      if (insight.toLowerCase().includes('route') || insight.toLowerCase().includes('optimization')) {
        insights.push({
          id: `optimization-${index}`,
          category: 'Route Optimization',
          title: 'Shipping Recommendation',
          description: insight,
          severity: 'info',
          icon: 'fas fa-route',
          actions: ['Consider alternative route', 'Update shipping plan'],
        });
      }
    });
  }

  const summary = {
    title: 'Logistics Intelligence Report',
    description: data?.consensus?.summary || 'International shipping document processed',
    score: Math.round((data?.openai?.aiConfidence || 0.87) * 100),
    status: (insights.some(i => i.severity === 'critical') ? 'needs-attention' : 'good') as 'needs-attention' | 'good',
  };

  return {
    insights,
    entities,
    summary,
    recommendations: [
      'Verify customs documentation',
      'Track shipment progress',
      'Monitor delivery timeline',
      'Update consignee information',
    ],
    complianceStatus: {
      compliant: !insights.some(i => i.severity === 'critical'),
      standards: ['WCO Framework', 'C-TPAT', 'AEO Standards'],
      issues: insights.filter(i => i.severity === 'critical').map(i => i.title),
    },
  };
}

function transformFinanceData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Initialize fraud risk flag
  let fraudRisk = false;

  // Extract financial data
  if (data?.openai) {
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        if (entity.type === 'account' || entity.type === 'account_number') {
          entities.push({
            id: `account-${index}`,
            type: 'Account',
            value: maskAccountNumber(entity.value),
            category: 'Financial Accounts',
            icon: 'fas fa-university',
            importance: 'high',
            context: 'Sensitive financial data',
          });
        } else if (entity.type === 'amount' || entity.type === 'monetary') {
          entities.push({
            id: `amount-${index}`,
            type: 'Transaction Amount',
            value: entity.value,
            category: 'Financial Data',
            icon: 'fas fa-money-bill-wave',
            importance: 'high',
            context: 'Financial transaction',
          });
        }
      });
    }

    // Fraud detection
    if (data.openai.insights) {
      fraudRisk = data.openai.insights.some((i: string) => 
        i.toLowerCase().includes('fraud') || i.toLowerCase().includes('suspicious')
      );
    }

    if (fraudRisk) {
      insights.push({
        id: 'fraud-alert',
        category: 'Security',
        title: 'Fraud Risk Alert',
        description: 'Suspicious patterns detected',
        severity: 'critical',
        icon: 'fas fa-shield-alt',
        details: ['Review transaction history', 'Verify account holder'],
        actions: ['Flag for review', 'Contact security team', 'Freeze account if necessary'],
      });
    }

    // Compliance checks
    if (data.openai.compliance) {
      const amlCompliant = data.openai.compliance.status === 'compliant';
      insights.push({
        id: 'aml-compliance',
        category: 'Compliance',
        title: 'AML/KYC Status',
        description: amlCompliant ? 'Passed AML/KYC checks' : 'AML/KYC issues detected',
        severity: amlCompliant ? 'success' : 'critical',
        icon: 'fas fa-check-shield',
        details: data.openai.compliance.issues || ['All checks passed'],
        actions: amlCompliant ? [] : ['Review KYC documentation', 'Run enhanced due diligence'],
      });
    }

    // Risk assessment
    if (data.openai.insights) {
      data.openai.insights.forEach((insight: string, index: number) => {
        if (insight.toLowerCase().includes('risk')) {
          insights.push({
            id: `risk-${index}`,
            category: 'Risk Assessment',
            title: 'Risk Factor',
            description: insight,
            severity: 'warning',
            icon: 'fas fa-chart-line',
            actions: ['Monitor closely', 'Update risk profile'],
          });
        }
      });
    }
  }

  const summary = {
    title: 'Financial Analysis Report',
    description: data?.consensus?.summary || 'Comprehensive financial document analysis',
    score: Math.round((data?.openai?.aiConfidence || 0.91) * 100),
    status: (fraudRisk ? 'critical' : 'good') as 'critical' | 'good',
  };

  return {
    insights,
    entities,
    summary,
    recommendations: [
      'Verify transaction authenticity',
      'Update risk assessment',
      'Monitor for unusual activity',
      'Complete regulatory reporting',
    ],
    complianceStatus: {
      compliant: !insights.some(i => i.severity === 'critical'),
      standards: ['SOX', 'Basel III', 'KYC/AML', 'GDPR'],
      issues: insights.filter(i => i.severity === 'critical').map(i => i.title),
    },
  };
}

function transformRealEstateData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Extract property and transaction data
  if (data?.openai) {
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        if (entity.type === 'property' || entity.type === 'address') {
          entities.push({
            id: `property-${index}`,
            type: 'Property Address',
            value: entity.value,
            category: 'Property Details',
            icon: 'fas fa-home',
            importance: 'high',
            context: 'Subject property',
          });
        } else if (entity.type === 'price' || entity.type === 'amount') {
          insights.push({
            id: `price-${index}`,
            category: 'Financial Terms',
            title: 'Purchase Price',
            description: entity.value,
            severity: 'info',
            icon: 'fas fa-tag',
            details: ['Market analysis recommended'],
            confidence: entity.confidence,
          });
        } else if (entity.type === 'party' || entity.type === 'buyer' || entity.type === 'seller') {
          entities.push({
            id: `party-${index}`,
            type: entity.type === 'buyer' ? 'Buyer' : entity.type === 'seller' ? 'Seller' : 'Party',
            value: entity.value,
            category: 'Transaction Parties',
            icon: 'fas fa-handshake',
            importance: 'high',
            context: 'Transaction participant',
          });
        }
      });
    }

    // Fair Housing compliance
    if (data.openai.compliance) {
      const fairHousingCompliant = !data.openai.compliance.issues?.some((i: string) => 
        i.toLowerCase().includes('discriminat') || i.toLowerCase().includes('fair housing')
      );
      
      insights.push({
        id: 'fair-housing',
        category: 'Compliance',
        title: 'Fair Housing Act Compliance',
        description: fairHousingCompliant ? 'Document complies with Fair Housing Act' : 'Fair Housing concerns detected',
        severity: fairHousingCompliant ? 'success' : 'critical',
        icon: 'fas fa-balance-scale',
        details: fairHousingCompliant ? [] : ['Review for discriminatory language', 'Ensure equal opportunity'],
        actions: fairHousingCompliant ? [] : ['Legal review required', 'Update language'],
      });
    }

    // Property disclosures
    if (data.openai.insights) {
      const hasDisclosures = data.openai.insights.some((i: string) => 
        i.toLowerCase().includes('disclosure')
      );
      
      if (hasDisclosures) {
        insights.push({
          id: 'disclosures',
          category: 'Property Disclosures',
          title: 'Required Disclosures',
          description: 'Property disclosures identified',
          severity: 'warning',
          icon: 'fas fa-clipboard-list',
          details: ['Review all disclosures', 'Ensure completeness'],
          actions: ['Verify disclosure signatures', 'Add to closing checklist'],
        });
      }
    }
  }

  // Transaction timeline
  if (data?.gemini?.insights) {
    data.gemini.insights.forEach((insight: string, index: number) => {
      if (insight.toLowerCase().includes('closing') || insight.toLowerCase().includes('deadline')) {
        insights.push({
          id: `timeline-${index}`,
          category: 'Transaction Timeline',
          title: 'Important Deadline',
          description: insight,
          severity: 'warning',
          icon: 'fas fa-clock',
          actions: ['Add to calendar', 'Notify all parties'],
        });
      }
    });
  }

  const summary = {
    title: 'Real Estate Transaction Analysis',
    description: data?.consensus?.summary || 'Property transaction document analyzed',
    score: Math.round((data?.openai?.aiConfidence || 0.89) * 100),
    status: (insights.some(i => i.severity === 'critical') ? 'needs-attention' : 'good') as 'needs-attention' | 'good',
  };

  return {
    insights,
    entities,
    summary,
    recommendations: [
      'Complete property inspection',
      'Verify all required disclosures',
      'Schedule closing appointment',
      'Review title insurance',
      'Confirm financing approval',
    ],
    complianceStatus: {
      compliant: !insights.some(i => i.severity === 'critical'),
      standards: ['Fair Housing Act', 'RESPA', 'TRID', 'State Real Estate Laws'],
      issues: insights.filter(i => i.severity === 'critical').map(i => i.title),
    },
  };
}

function transformGeneralData(data: any): TransformedData {
  const insights: ProcessedInsight[] = [];
  const entities: ProcessedEntity[] = [];
  const recommendations: string[] = [];

  // Extract general entities and insights
  if (data?.openai) {
    if (data.openai.keyEntities) {
      data.openai.keyEntities.forEach((entity: any, index: number) => {
        entities.push({
          id: `entity-${index}`,
          type: formatEntityType(entity.type),
          value: entity.value,
          category: getGeneralCategory(entity.type),
          icon: getGeneralIcon(entity.type),
          importance: entity.confidence > 0.8 ? 'high' : entity.confidence > 0.6 ? 'medium' : 'low',
          context: `Extracted with ${Math.round(entity.confidence * 100)}% confidence`,
        });
      });
    }

    if (data.openai.insights) {
      data.openai.insights.forEach((insight: string, index: number) => {
        insights.push({
          id: `insight-${index}`,
          category: 'Key Information',
          title: 'Important Finding',
          description: insight,
          severity: 'info',
          icon: 'fas fa-info-circle',
          actions: ['Review details', 'Take appropriate action'],
        });
      });
    }

    if (data.openai.compliance) {
      insights.push({
        id: 'compliance-status',
        category: 'Document Status',
        title: 'Processing Complete',
        description: `Document processed with ${data.openai.compliance.status} status`,
        severity: data.openai.compliance.status === 'compliant' ? 'success' : 'warning',
        icon: 'fas fa-check-circle',
        details: data.openai.compliance.issues || [],
      });
    }
  }

  const summary = {
    title: 'Business Document Analysis',
    description: data?.consensus?.summary || 'Document analysis completed successfully',
    score: Math.round((data?.openai?.aiConfidence || 0.85) * 100),
    status: 'good' as const,
  };

  return {
    insights,
    entities,
    summary,
    recommendations: [
      'Review extracted information',
      'Verify key data points',
      'Update relevant systems',
      'Archive processed document',
    ],
    complianceStatus: {
      compliant: true,
      standards: ['General Business Standards'],
      issues: [],
    },
  };
}

// Helper functions
function getClinicalCategory(type: string): string {
  const categories: Record<string, string> = {
    diagnosis: 'Diagnoses',
    condition: 'Medical Conditions',
    medication: 'Medications',
    procedure: 'Procedures',
    lab: 'Lab Results',
    allergy: 'Allergies',
    vital: 'Vital Signs',
  };
  return categories[type] || 'Clinical Data';
}

function getClinicalIcon(type: string): string {
  const icons: Record<string, string> = {
    diagnosis: 'fas fa-stethoscope',
    condition: 'fas fa-heartbeat',
    medication: 'fas fa-pills',
    procedure: 'fas fa-procedures',
    lab: 'fas fa-flask',
    allergy: 'fas fa-allergies',
    vital: 'fas fa-pulse',
  };
  return icons[type] || 'fas fa-notes-medical';
}

function getGeneralCategory(type: string): string {
  const categories: Record<string, string> = {
    person: 'People',
    organization: 'Organizations',
    location: 'Locations',
    date: 'Dates & Times',
    monetary: 'Financial',
    percentage: 'Statistics',
    email: 'Contact Info',
    phone: 'Contact Info',
    url: 'References',
  };
  return categories[type] || 'General Information';
}

function getGeneralIcon(type: string): string {
  const icons: Record<string, string> = {
    person: 'fas fa-user',
    organization: 'fas fa-building',
    location: 'fas fa-map-marker-alt',
    date: 'fas fa-calendar',
    monetary: 'fas fa-dollar-sign',
    percentage: 'fas fa-percent',
    email: 'fas fa-envelope',
    phone: 'fas fa-phone',
    url: 'fas fa-link',
  };
  return icons[type] || 'fas fa-tag';
}

function formatEntityType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function maskAccountNumber(value: string): string {
  if (value.length > 4) {
    return '****' + value.slice(-4);
  }
  return value;
}

function determineHealthStatus(insights: ProcessedInsight[]): 'excellent' | 'good' | 'needs-attention' | 'critical' {
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  
  if (criticalCount > 0) return 'critical';
  if (warningCount > 2) return 'needs-attention';
  if (warningCount > 0) return 'good';
  return 'excellent';
}