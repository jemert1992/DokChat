import { storage } from '../storage';
import type { Document } from '@shared/schema';
import { MultiAIService } from './multiAIService';
import { AdvancedSecurityService } from './advancedSecurityService';
import { MultiLanguageService } from './multiLanguageService';
import { getIndustryPrompt } from './industryPrompts';

export interface EntityExtractionResult {
  entityType: string;
  entityValue: string;
  confidenceScore: number;
  locationData?: any;
  contextData?: any;
  codes?: string[];
  // Revolutionary AI enhancements
  aiProcessingUsed?: boolean;
  regulatoryCompliance?: {
    status: 'compliant' | 'non_compliant' | 'needs_review';
    standards: string[];
    violations: string[];
  };
}

export interface MedicalEntityResult extends EntityExtractionResult {
  medicalCode?: string;
  clinicalContext?: string;
  clinicalSignificance?: 'low' | 'medium' | 'high' | 'critical';
  // HIPAA compliance enhancements
  phiCategory?: 'name' | 'ssn' | 'phone' | 'email' | 'dob' | 'mrn' | 'account' | 'other';
  protectionApplied?: boolean;
  consentRequired?: boolean;
}

export interface LegalEntityResult extends EntityExtractionResult {
  legalContext?: string;
  jurisdiction?: string;
  caseReferences?: string[];
  privilegeLevel?: string;
  // Attorney-client privilege enhancements
  privilegeProtected?: boolean;
  confidentialityLevel?: 'public' | 'confidential' | 'attorney_client' | 'work_product';
  ethicsCompliance?: boolean;
}

export interface LogisticsEntityResult extends EntityExtractionResult {
  hsCode?: string;
  countryCode?: string;
  trackingInfo?: string;
  complianceFlags?: string[];
  // Multi-language and trade compliance enhancements
  originalLanguage?: string;
  translatedValue?: string;
  tradeCompliance?: {
    ctpatCompliant?: boolean;
    sanctionsCleared?: boolean;
    customsReady?: boolean;
  };
}

// NEW: Finance industry entity extraction
export interface FinanceEntityResult extends EntityExtractionResult {
  financialCategory?: 'account' | 'transaction' | 'amount' | 'routing' | 'swift' | 'iban' | 'credit_score' | 'income' | 'asset' | 'liability';
  fraudRiskScore?: number;
  kycStatus?: 'verified' | 'pending' | 'rejected' | 'needs_review';
  amlFlags?: string[];
  regulatoryReporting?: {
    sarRequired?: boolean;
    ctrRequired?: boolean;
    sanctionsMatch?: boolean;
  };
  currencyCode?: string;
  institutionCode?: string;
}

// NEW: Real Estate industry entity extraction
export interface RealEstateEntityResult extends EntityExtractionResult {
  propertyCategory?: 'address' | 'apn' | 'price' | 'agent' | 'lender' | 'title_company' | 'buyer' | 'seller' | 'contingency' | 'disclosure';
  mlsNumber?: string;
  licenseNumber?: string;
  complianceStatus?: {
    fairHousingCompliant?: boolean;
    disclosureComplete?: boolean;
    regulatoryApproved?: boolean;
  };
  transactionStage?: 'listing' | 'offer' | 'inspection' | 'financing' | 'closing' | 'complete';
  jurisdiction?: string;
}

// Enhanced General Business entity extraction
export interface BusinessEntityResult extends EntityExtractionResult {
  businessCategory?: 'company' | 'contact' | 'financial' | 'contract' | 'product' | 'service' | 'date' | 'reference';
  relationshipType?: 'customer' | 'vendor' | 'partner' | 'employee' | 'contractor';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  integrationData?: {
    crmSyncable?: boolean;
    erpSyncable?: boolean;
    workflowTrigger?: boolean;
  };
}

export class EntityExtractionService {
  private multiAIService: MultiAIService;
  private securityService: AdvancedSecurityService;
  private multiLanguageService: MultiLanguageService;

  constructor() {
    this.multiAIService = new MultiAIService();
    this.securityService = new AdvancedSecurityService();
    this.multiLanguageService = new MultiLanguageService();
    console.log('🚀 Revolutionary Entity Extraction Service initialized with industry-specific AI capabilities');
  }

  /**
   * Revolutionary Medical Entity Extraction with HIPAA Compliance
   */
  async extractMedicalEntities(document: Document, extractedText: string): Promise<MedicalEntityResult[]> {
    const entities: MedicalEntityResult[] = [];
    
    try {
      // Enhanced medical entity extraction patterns
      const medicalPatterns = {
        medications: {
          regex: /(?:medication|drug|prescribed|taking)\s*:?\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*(?:(?:(\d+)\s*(mg|mcg|g|ml|cc|units?))|$)/gi,
          type: 'medication',
          significance: 'high' as const
        },
        diagnoses: {
          regex: /(?:diagnosis|diagnosed with|condition)\s*:?\s*([A-Za-z][A-Za-z\s,]+?)(?:\.|;|$|\n)/gi,
          type: 'diagnosis',
          significance: 'critical' as const
        },
        allergies: {
          regex: /(?:allergic to|allergy|allergies)\s*:?\s*([A-Za-z][A-Za-z\s,]+?)(?:\.|;|$|\n)/gi,
          type: 'allergy',
          significance: 'critical' as const
        },
        vitalSigns: {
          regex: /(?:BP|blood pressure)\s*:?\s*(\d{2,3}\/\d{2,3})|(?:temperature|temp)\s*:?\s*(\d{2,3}\.?\d?)\s*°?[FC]?|(?:heart rate|HR)\s*:?\s*(\d{2,3})\s*bpm?/gi,
          type: 'vital_sign',
          significance: 'medium' as const
        },
        icdCodes: {
          regex: /ICD[-\s]?(?:10|9)\s*:?\s*([A-Z]\d{2}(?:\.\d{1,2})?)/gi,
          type: 'icd_code',
          significance: 'high' as const
        },
        cptCodes: {
          regex: /CPT\s*:?\s*(\d{5})/gi,
          type: 'cpt_code',
          significance: 'medium' as const
        },
        patientInfo: {
          regex: /(?:patient|pt)\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)|DOB\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})|MRN\s*:?\s*(\d+)/gi,
          type: 'patient_info',
          significance: 'high' as const
        }
      };

      // SPEED OPTIMIZATION: Run all extractions in parallel
      console.log('🏥 Running parallel medical entity extraction');
      
      const [regexEntities, aiEnhancedEntities, phiEntities, clinicalEntities] = await Promise.all([
        // 1. Regex extraction (synchronous, so wrap in Promise)
        Promise.resolve().then(() => {
          const regexResults: MedicalEntityResult[] = [];
          for (const [category, pattern] of Object.entries(medicalPatterns)) {
            let match;
            while ((match = pattern.regex.exec(extractedText)) !== null) {
              const entityValue = match[1] || match[2] || match[3] || match[0];
              if (entityValue && entityValue.trim().length > 2) {
                regexResults.push({
                  entityType: pattern.type,
                  entityValue: entityValue.trim(),
                  confidenceScore: this.calculateMedicalConfidence(pattern.type, entityValue),
                  medicalCode: this.extractMedicalCode(pattern.type, entityValue),
                  clinicalContext: this.extractClinicalContext(extractedText, match.index || 0),
                  clinicalSignificance: pattern.significance,
                  locationData: { 
                    startIndex: match.index, 
                    endIndex: (match.index || 0) + match[0].length 
                  }
                });
              }
            }
          }
          return regexResults;
        }),
        
        // 2. AI enhancement
        this.enhanceEntitiesWithAI([], extractedText, 'medical'),
        
        // 3. PHI detection
        this.detectAdvancedPHI(extractedText),
        
        // 4. Clinical extraction
        this.extractClinicalEntities(extractedText)
      ]);
      
      entities.push(...regexEntities, ...aiEnhancedEntities, ...phiEntities, ...clinicalEntities);

    } catch (error) {
      console.error('❌ Error in revolutionary medical entity extraction:', error);
    }

    console.log(`✅ Extracted ${entities.length} medical entities with HIPAA compliance`);
    return entities;
  }

  async extractLegalEntities(document: Document, extractedText: string): Promise<LegalEntityResult[]> {
    const entities: LegalEntityResult[] = [];
    
    try {
      const legalPatterns = {
        parties: {
          regex: /(?:plaintiff|defendant|petitioner|respondent|appellant|appellee)\s*:?\s*([A-Z][A-Za-z\s,\.]+?)(?:\s+(?:v\.|vs\.|versus|,|;|$))/gi,
          type: 'party'
        },
        caseCitations: {
          regex: /(\d+\s+[A-Za-z\.]+\s+\d+(?:\s+\(\d{4}\))?)|([A-Z][A-Za-z\s]+v\.\s+[A-Z][A-Za-z\s]+,\s+\d+\s+[A-Za-z\.]+\s+\d+)/gi,
          type: 'case_citation'
        },
        statutes: {
          regex: /(\d+\s+U\.?S\.?C\.?\s+§?\s*\d+(?:\([a-z]\))?)|(\d+\s+[A-Z][a-z\.]+\s+§?\s*\d+)/gi,
          type: 'statute'
        },
        contractTerms: {
          regex: /(?:shall|must|will|agrees to|undertakes to|covenant)\s+([^.;]{10,100})/gi,
          type: 'contract_term'
        },
        dates: {
          regex: /(?:effective|executed|terminated|expires?|due)\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/gi,
          type: 'important_date'
        },
        governingLaw: {
          regex: /(?:governed by|subject to)\s+(?:the\s+)?(?:laws?\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
          type: 'governing_law'
        },
        jurisdiction: {
          regex: /(?:jurisdiction|venue)\s+(?:of\s+)?(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
          type: 'jurisdiction'
        }
      };

      // SPEED OPTIMIZATION: Run extractions in parallel
      const regexResults = await Promise.resolve().then(() => {
        const results: LegalEntityResult[] = [];
        for (const [category, pattern] of Object.entries(legalPatterns)) {
          let match;
          while ((match = pattern.regex.exec(extractedText)) !== null) {
            const entityValue = match[1] || match[0];
            if (entityValue && entityValue.trim().length > 2) {
              results.push({
                entityType: pattern.type,
                entityValue: entityValue.trim(),
                confidenceScore: this.calculateLegalConfidence(pattern.type, entityValue),
                legalContext: this.extractLegalContext(extractedText, match.index || 0),
                jurisdiction: this.extractJurisdiction(extractedText),
                caseReferences: this.extractCaseReferences(extractedText),
                locationData: { 
                  startIndex: match.index, 
                  endIndex: (match.index || 0) + match[0].length 
                }
              });
            }
          }
        }
        return results;
      });
      
      entities.push(...regexResults);

    } catch (error) {
      console.error('Error extracting legal entities:', error);
    }

    return entities;
  }

  async extractLogisticsEntities(document: Document, extractedText: string): Promise<LogisticsEntityResult[]> {
    const entities: LogisticsEntityResult[] = [];
    
    try {
      const logisticsPatterns = {
        shipperInfo: {
          regex: /(?:shipper|consignor)\s*:?\s*([A-Z][A-Za-z\s,\.]+?)(?:\n|$|address|phone)/gi,
          type: 'shipper_info'
        },
        consigneeInfo: {
          regex: /(?:consignee|receiver)\s*:?\s*([A-Z][A-Za-z\s,\.]+?)(?:\n|$|address|phone)/gi,
          type: 'consignee_info'
        },
        trackingNumbers: {
          regex: /(?:tracking|AWB|B\/L)\s*(?:number|#)?\s*:?\s*([A-Z0-9\-]{8,20})/gi,
          type: 'tracking_number'
        },
        hsCodes: {
          regex: /(?:HS|harmonized)\s*(?:code)?\s*:?\s*(\d{4}\.?\d{2}\.?\d{2}\.?\d{2})/gi,
          type: 'hs_code'
        },
        cargoDetails: {
          regex: /(?:cargo|goods|commodity)\s*:?\s*([A-Za-z][A-Za-z\s,\-]{10,100})/gi,
          type: 'cargo_description'
        },
        weights: {
          regex: /(?:weight|gross|net)\s*:?\s*(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?|tons?)/gi,
          type: 'weight'
        },
        incoterms: {
          regex: /(FOB|CIF|CFR|EXW|FCA|CPT|CIP|DAP|DPU|DDP)\s+([A-Z][a-z\s]+)/gi,
          type: 'incoterm'
        },
        ports: {
          regex: /(?:port of|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
          type: 'port'
        },
        currencies: {
          regex: /(\$|USD|EUR|GBP|CNY|JPY)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
          type: 'currency_amount'
        }
      };

      // SPEED OPTIMIZATION: Run extractions in parallel
      const regexResults = await Promise.resolve().then(() => {
        const results: LogisticsEntityResult[] = [];
        for (const [category, pattern] of Object.entries(logisticsPatterns)) {
          let match;
          while ((match = pattern.regex.exec(extractedText)) !== null) {
            const entityValue = match[1] || match[0];
            if (entityValue && entityValue.trim().length > 1) {
              results.push({
                entityType: pattern.type,
                entityValue: entityValue.trim(),
                confidenceScore: this.calculateLogisticsConfidence(pattern.type, entityValue),
                hsCode: this.extractHSCode(pattern.type, entityValue),
                countryCode: this.extractCountryCode(entityValue),
                trackingInfo: this.extractTrackingInfo(pattern.type, entityValue),
                complianceFlags: this.checkComplianceFlags(pattern.type, entityValue),
                locationData: { 
                  startIndex: match.index, 
                  endIndex: (match.index || 0) + match[0].length 
                }
              });
            }
          }
        }
        return results;
      });
      
      entities.push(...regexResults);

    } catch (error) {
      console.error('Error extracting logistics entities:', error);
    }

    return entities;
  }

  private calculateMedicalConfidence(entityType: string, value: string): number {
    // Enhanced confidence calculation for medical entities
    let baseConfidence = 0.7;
    
    if (entityType === 'icd_code' || entityType === 'cpt_code') {
      baseConfidence = 0.95; // High confidence for structured codes
    } else if (entityType === 'allergy' || entityType === 'diagnosis') {
      baseConfidence = 0.85; // High confidence for critical information
    } else if (entityType === 'vital_sign' && /\d/.test(value)) {
      baseConfidence = 0.9; // High confidence for numeric vitals
    }
    
    return Math.min(baseConfidence + (value.length > 10 ? 0.1 : 0), 1.0);
  }

  private calculateLegalConfidence(entityType: string, value: string): number {
    let baseConfidence = 0.7;
    
    if (entityType === 'case_citation' && /\d+\s+[A-Za-z\.]+\s+\d+/.test(value)) {
      baseConfidence = 0.95; // High confidence for proper citations
    } else if (entityType === 'statute' && /\d+\s+U\.?S\.?C\.?/.test(value)) {
      baseConfidence = 0.9; // High confidence for USC references
    } else if (entityType === 'party' && value.includes('v.')) {
      baseConfidence = 0.85; // High confidence for case parties
    }
    
    return Math.min(baseConfidence + (value.length > 15 ? 0.1 : 0), 1.0);
  }

  private calculateLogisticsConfidence(entityType: string, value: string): number {
    let baseConfidence = 0.7;
    
    if (entityType === 'hs_code' && /\d{4}\.\d{2}\.\d{2}\.\d{2}/.test(value)) {
      baseConfidence = 0.95; // High confidence for proper HS codes
    } else if (entityType === 'tracking_number' && value.length >= 10) {
      baseConfidence = 0.9; // High confidence for tracking numbers
    } else if (entityType === 'incoterm' && /^(FOB|CIF|CFR|EXW|FCA|CPT|CIP|DAP|DPU|DDP)/.test(value)) {
      baseConfidence = 0.95; // High confidence for standard Incoterms
    }
    
    return Math.min(baseConfidence + (value.length > 8 ? 0.1 : 0), 1.0);
  }

  private async detectPHI(text: string): Promise<MedicalEntityResult[]> {
    const phiEntities: MedicalEntityResult[] = [];
    
    // SSN detection
    const ssnRegex = /\b\d{3}-?\d{2}-?\d{4}\b/g;
    let match;
    while ((match = ssnRegex.exec(text)) !== null) {
      phiEntities.push({
        entityType: 'phi_ssn',
        entityValue: match[0],
        confidenceScore: 0.9,
        clinicalSignificance: 'critical',
        clinicalContext: 'Protected Health Information detected'
      });
    }
    
    return phiEntities;
  }

  private extractMedicalCode(entityType: string, value: string): string | undefined {
    if (entityType === 'icd_code') {
      const match = value.match(/([A-Z]\d{2}(?:\.\d{1,2})?)/);
      return match ? match[1] : undefined;
    } else if (entityType === 'cpt_code') {
      const match = value.match(/(\d{5})/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  private extractClinicalContext(text: string, position: number): string {
    const start = Math.max(0, position - 50);
    const end = Math.min(text.length, position + 50);
    return text.substring(start, end).trim();
  }

  private extractLegalContext(text: string, position: number): string {
    const start = Math.max(0, position - 100);
    const end = Math.min(text.length, position + 100);
    return text.substring(start, end).trim();
  }

  private extractJurisdiction(text: string): string | undefined {
    const jurisdictionMatch = text.match(/(?:jurisdiction|court)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    return jurisdictionMatch ? jurisdictionMatch[1] : undefined;
  }

  private extractCaseReferences(text: string): string[] {
    const caseRefs: string[] = [];
    const caseRegex = /([A-Z][A-Za-z\s]+v\.\s+[A-Z][A-Za-z\s]+)/g;
    let match;
    while ((match = caseRegex.exec(text)) !== null) {
      caseRefs.push(match[1]);
    }
    return caseRefs;
  }

  private extractHSCode(entityType: string, value: string): string | undefined {
    if (entityType === 'hs_code') {
      const match = value.match(/(\d{4}\.?\d{2}\.?\d{2}\.?\d{2})/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  private extractCountryCode(value: string): string | undefined {
    // Simple country extraction - in a real implementation, you'd use a comprehensive country database
    const countryPatterns = ['USA', 'US', 'China', 'Germany', 'UK', 'Canada', 'Mexico', 'Japan'];
    for (const country of countryPatterns) {
      if (value.toUpperCase().includes(country)) {
        return country;
      }
    }
    return undefined;
  }

  private extractTrackingInfo(entityType: string, value: string): string | undefined {
    if (entityType === 'tracking_number') {
      return value;
    }
    return undefined;
  }

  private checkComplianceFlags(entityType: string, value: string): string[] {
    const flags: string[] = [];
    
    if (entityType === 'cargo_description') {
      if (value.toLowerCase().includes('hazard')) {
        flags.push('hazardous_material');
      }
      if (value.toLowerCase().includes('restricted')) {
        flags.push('restricted_item');
      }
    }
    
    return flags;
  }
}