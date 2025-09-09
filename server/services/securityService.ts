import crypto from 'crypto';
import { storage } from '../storage';
import type { User } from '@shared/schema';

export interface SecurityLevel {
  level: 'standard' | 'high' | 'maximum';
  encryption: boolean;
  accessControl: boolean;
  auditLogging: boolean;
  dataMinimization: boolean;
  anonymization: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
  riskScore?: number;
}

export interface PHIDetectionResult {
  detected: boolean;
  phiTypes: string[];
  confidence: number;
  redactedText?: string;
  locations: Array<{
    type: string;
    start: number;
    end: number;
    value: string;
  }>;
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  securityLevel?: SecurityLevel;
}

export class SecurityService {
  private auditLogs: AuditLog[] = [];
  
  // Industry-specific security configurations
  private securityConfigurations = {
    medical: {
      level: 'maximum' as const,
      encryption: true,
      accessControl: true,
      auditLogging: true,
      dataMinimization: true,
      anonymization: true,
      requiresPHIDetection: true,
      retentionPeriod: 2555, // 7 years HIPAA requirement
      complianceStandards: ['HIPAA', 'HL7_FHIR', 'FDA_CFR_Part_11']
    },
    legal: {
      level: 'maximum' as const,
      encryption: true,
      accessControl: true,
      auditLogging: true,
      dataMinimization: true,
      anonymization: false, // Legal docs require full attribution
      requiresPrivilegeProtection: true,
      retentionPeriod: 2555, // 7 years for legal records
      complianceStandards: ['Attorney_Client_Privilege', 'Work_Product_Doctrine']
    },
    logistics: {
      level: 'high' as const,
      encryption: true,
      accessControl: true,
      auditLogging: true,
      dataMinimization: false,
      anonymization: false, // Full traceability required
      requiresCustomsCompliance: true,
      retentionPeriod: 1825, // 5 years for customs records
      complianceStandards: ['WCO_Framework', 'C-TPAT', 'AEO']
    },
    finance: {
      level: 'high' as const,
      encryption: true,
      accessControl: true,
      auditLogging: true,
      dataMinimization: true,
      anonymization: true,
      requiresFraudDetection: true,
      retentionPeriod: 2555, // 7 years for financial records
      complianceStandards: ['SOX', 'PCI_DSS', 'Basel_III']
    },
    general: {
      level: 'standard' as const,
      encryption: true,
      accessControl: false,
      auditLogging: false,
      dataMinimization: false,
      anonymization: false,
      retentionPeriod: 1095, // 3 years standard
      complianceStandards: []
    }
  };

  async detectPHI(text: string, industry: string = 'medical'): Promise<PHIDetectionResult> {
    if (industry !== 'medical') {
      return {
        detected: false,
        phiTypes: [],
        confidence: 0,
        locations: []
      };
    }

    const phiPatterns = {
      ssn: {
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        type: 'Social Security Number',
        riskLevel: 'critical'
      },
      phone: {
        pattern: /\b\d{3}-?\d{3}-?\d{4}\b/g,
        type: 'Phone Number',
        riskLevel: 'medium'
      },
      email: {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: 'Email Address',
        riskLevel: 'medium'
      },
      mrn: {
        pattern: /MRN\s*:?\s*(\d{6,10})/gi,
        type: 'Medical Record Number',
        riskLevel: 'high'
      },
      dateOfBirth: {
        pattern: /(?:DOB|date of birth)\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
        type: 'Date of Birth',
        riskLevel: 'high'
      },
      address: {
        pattern: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b[,\s]*[A-Za-z\s]*[,\s]*[A-Z]{2}\s*\d{5}/gi,
        type: 'Address',
        riskLevel: 'medium'
      }
    };

    const detectedPHI: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
      riskLevel: string;
    }> = [];

    let redactedText = text;
    const phiTypes: string[] = [];

    // Scan for PHI patterns
    Object.entries(phiPatterns).forEach(([key, pattern]) => {
      let match;
      while ((match = pattern.pattern.exec(text)) !== null) {
        detectedPHI.push({
          type: pattern.type,
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
          value: match[0],
          riskLevel: pattern.riskLevel
        });

        if (!phiTypes.includes(pattern.type)) {
          phiTypes.push(pattern.type);
        }

        // Redact the PHI
        const redactionLength = match[0].length;
        const redaction = '█'.repeat(Math.min(redactionLength, 10));
        redactedText = redactedText.replace(match[0], redaction);
      }
    });

    const confidence = detectedPHI.length > 0 ? 
      Math.min(0.85 + (detectedPHI.length * 0.05), 0.98) : 0;

    return {
      detected: detectedPHI.length > 0,
      phiTypes,
      confidence,
      redactedText: detectedPHI.length > 0 ? redactedText : undefined,
      locations: detectedPHI.map(phi => ({
        type: phi.type,
        start: phi.start,
        end: phi.end,
        value: phi.value
      }))
    };
  }

  async checkAccessControl(
    userId: string, 
    resource: string, 
    action: string, 
    industry: string
  ): Promise<AccessControlResult> {
    try {
      const securityConfig = this.securityConfigurations[industry as keyof typeof this.securityConfigurations];
      
      if (!securityConfig.accessControl) {
        return { allowed: true };
      }

      // Enhanced access control logic
      const user = await storage.getUser(userId);
      
      if (!user) {
        await this.logAuditEvent({
          userId,
          action: 'access_denied',
          resource,
          resourceId: '',
          success: false,
          details: { reason: 'user_not_found' }
        });
        
        return { 
          allowed: false, 
          reason: 'User not found',
          securityLevel: securityConfig
        };
      }

      // Industry-specific access control rules
      const accessRules = await this.getIndustryAccessRules(industry, user);
      const hasAccess = this.evaluateAccessRules(accessRules, action, resource);

      await this.logAuditEvent({
        userId,
        action: hasAccess ? 'access_granted' : 'access_denied',
        resource,
        resourceId: '',
        success: hasAccess,
        details: { 
          industry, 
          securityLevel: securityConfig.level,
          requiredRoles: accessRules.requiredRoles 
        }
      });

      return {
        allowed: hasAccess,
        reason: hasAccess ? undefined : 'Insufficient permissions for this industry',
        securityLevel: securityConfig
      };

    } catch (error) {
      console.error('Access control error:', error);
      return { 
        allowed: false, 
        reason: 'Access control system error' 
      };
    }
  }

  async encryptSensitiveData(data: string, industry: string): Promise<string> {
    const securityConfig = this.securityConfigurations[industry as keyof typeof this.securityConfigurations];
    
    if (!securityConfig.encryption) {
      return data;
    }

    try {
      // AES-256-GCM encryption for maximum security industries
      const algorithm = securityConfig.level === 'maximum' ? 'aes-256-gcm' : 'aes-256-cbc';
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Store encryption metadata for audit purposes
      const encryptionMeta = {
        algorithm,
        timestamp: new Date().toISOString(),
        industry,
        securityLevel: securityConfig.level
      };
      
      return JSON.stringify({
        data: encrypted,
        meta: encryptionMeta
      });
      
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  async anonymizeData(data: any, industry: string): Promise<any> {
    const securityConfig = this.securityConfigurations[industry as keyof typeof this.securityConfigurations];
    
    if (!securityConfig.anonymization) {
      return data;
    }

    try {
      const anonymized = { ...data };
      
      // Industry-specific anonymization rules
      if (industry === 'medical') {
        // Remove direct identifiers
        if (anonymized.patientName) anonymized.patientName = this.generateAnonymousId('PATIENT');
        if (anonymized.mrn) anonymized.mrn = this.generateAnonymousId('MRN');
        if (anonymized.ssn) delete anonymized.ssn;
        if (anonymized.dateOfBirth) anonymized.dateOfBirth = this.anonymizeDate(anonymized.dateOfBirth);
      } else if (industry === 'finance') {
        // Remove financial identifiers
        if (anonymized.accountNumber) anonymized.accountNumber = this.generateAnonymousId('ACCT');
        if (anonymized.ssn) delete anonymized.ssn;
        if (anonymized.creditCardNumber) delete anonymized.creditCardNumber;
      }
      
      return anonymized;
      
    } catch (error) {
      console.error('Anonymization error:', error);
      return data; // Return original if anonymization fails
    }
  }

  async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      riskScore: this.calculateRiskScore(event),
      ...event
    };

    this.auditLogs.push(auditLog);
    
    // In production, this would write to a secure audit log database
    console.log('AUDIT LOG:', JSON.stringify(auditLog, null, 2));
  }

  async getAuditLogs(
    userId?: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit: number = 100
  ): Promise<AuditLog[]> {
    let filteredLogs = [...this.auditLogs];
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }
    
    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getSecurityConfiguration(industry: string): SecurityLevel | undefined {
    const config = this.securityConfigurations[industry as keyof typeof this.securityConfigurations];
    if (!config) return undefined;
    
    return {
      level: config.level,
      encryption: config.encryption,
      accessControl: config.accessControl,
      auditLogging: config.auditLogging,
      dataMinimization: config.dataMinimization,
      anonymization: config.anonymization
    };
  }

  private async getIndustryAccessRules(industry: string, user: User): Promise<{
    requiredRoles: string[];
    allowedActions: string[];
    restrictions: string[];
  }> {
    // Industry-specific access control rules
    const accessRules = {
      medical: {
        requiredRoles: ['healthcare_provider', 'medical_administrator'],
        allowedActions: ['read_patient_data', 'write_clinical_notes', 'access_phi'],
        restrictions: ['hipaa_compliant_only']
      },
      legal: {
        requiredRoles: ['attorney', 'legal_professional', 'paralegal'],
        allowedActions: ['read_legal_docs', 'write_legal_analysis', 'access_privileged'],
        restrictions: ['attorney_client_privilege']
      },
      logistics: {
        requiredRoles: ['logistics_professional', 'customs_agent', 'freight_forwarder'],
        allowedActions: ['read_shipping_docs', 'write_customs_forms', 'process_shipments'],
        restrictions: ['trade_compliance_only']
      },
      finance: {
        requiredRoles: ['financial_analyst', 'accountant', 'auditor'],
        allowedActions: ['read_financial_data', 'analyze_transactions', 'generate_reports'],
        restrictions: ['sox_compliant_only']
      },
      general: {
        requiredRoles: ['business_user'],
        allowedActions: ['read_documents', 'upload_files', 'basic_analysis'],
        restrictions: []
      }
    };

    return accessRules[industry as keyof typeof accessRules] || accessRules.general;
  }

  private evaluateAccessRules(
    rules: { requiredRoles: string[]; allowedActions: string[]; restrictions: string[] },
    action: string,
    resource: string
  ): boolean {
    // Simplified access evaluation - in production would be more sophisticated
    return rules.allowedActions.includes(action) || action === 'read';
  }

  private calculateRiskScore(event: Omit<AuditLog, 'id' | 'timestamp'>): number {
    let riskScore = 0;
    
    // Failed access attempts increase risk
    if (!event.success) {
      riskScore += 30;
    }
    
    // High-value resources increase risk
    if (event.resource.includes('patient') || event.resource.includes('phi')) {
      riskScore += 20;
    }
    
    if (event.resource.includes('privileged') || event.resource.includes('legal')) {
      riskScore += 15;
    }
    
    // Administrative actions increase risk
    if (event.action.includes('delete') || event.action.includes('modify')) {
      riskScore += 25;
    }
    
    return Math.min(riskScore, 100);
  }

  private generateAnonymousId(prefix: string): string {
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}_${randomSuffix}`;
  }

  private anonymizeDate(date: string): string {
    // Convert to year only to maintain some utility while protecting privacy
    const dateObj = new Date(date);
    return dateObj.getFullYear().toString();
  }
}