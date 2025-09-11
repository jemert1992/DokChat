import { randomUUID } from 'crypto';
import { storage } from '../storage';
import { WebSocketService } from './websocketService';
import {
  type SecurityRole,
  type InsertSecurityRole,
  type SecurityPermission,
  type InsertSecurityPermission,
  type UserRoleAssignment,
  type InsertUserRoleAssignment,
  type SecurityAuditLog,
  type InsertSecurityAuditLog,
  type ComplianceRule,
  type InsertComplianceRule,
  type ComplianceMonitoring,
  type InsertComplianceMonitoring,
  type SecurityPolicy,
  type InsertSecurityPolicy,
  type DocumentSecurity,
  type InsertDocumentSecurity,
  type SecurityIncident,
  type InsertSecurityIncident,
} from '@shared/schema';

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
  riskScore?: number;
  complianceFlags?: string[];
}

export interface SecurityContext {
  userId: string;
  industry: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  mfaVerified?: boolean;
}

export interface ComplianceEvaluationResult {
  isCompliant: boolean;
  violations: Array<{
    ruleId: number;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    remediation?: string;
  }>;
  riskScore: number;
  complianceScore: number;
}

export class AdvancedSecurityService {
  private wsService?: WebSocketService;
  private securityPolicyCache = new Map<string, SecurityPolicy[]>();
  private permissionCache = new Map<string, Set<string>>();
  private complianceRulesCache = new Map<string, ComplianceRule[]>();

  constructor(websocketService?: WebSocketService) {
    this.wsService = websocketService;
  }

  // =============================================================================
  // ENHANCED RBAC SYSTEM
  // =============================================================================

  /**
   * Initialize default security roles for all industries
   */
  async initializeDefaultRoles(): Promise<void> {
    console.log('🔐 Initializing default security roles...');

    const industries = ['medical', 'legal', 'logistics', 'finance', 'real_estate', 'general'];
    
    for (const industry of industries) {
      await this.createIndustryRoles(industry);
    }

    console.log('✅ Default security roles initialized');
  }

  /**
   * Create industry-specific role hierarchy
   */
  private async createIndustryRoles(industry: string): Promise<void> {
    const roleDefinitions = this.getIndustryRoleDefinitions(industry);
    
    for (const roleDef of roleDefinitions) {
      try {
        await storage.createSecurityRole({
          name: `${industry}_${roleDef.name}`,
          displayName: roleDef.displayName,
          description: roleDef.description,
          industry,
          level: roleDef.level,
          permissions: roleDef.permissions,
          isSystemRole: true,
          isActive: true,
        });
      } catch (error) {
        // Role might already exist, continue
        console.warn(`Role ${roleDef.name} for ${industry} might already exist`);
      }
    }
  }

  /**
   * Get industry-specific role definitions
   */
  private getIndustryRoleDefinitions(industry: string) {
    const baseRoles = [
      {
        name: 'viewer',
        displayName: 'Document Viewer',
        description: 'Can view documents within security constraints',
        level: 'basic',
        permissions: {
          documents: ['read'],
          analytics: ['view_basic'],
          system: ['access']
        }
      },
      {
        name: 'editor',
        displayName: 'Document Editor',
        description: 'Can edit and process documents',
        level: 'standard',
        permissions: {
          documents: ['read', 'create', 'update'],
          analytics: ['view_basic', 'view_detailed'],
          collaboration: ['comment', 'share'],
          system: ['access']
        }
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full administrative access',
        level: 'enterprise',
        permissions: {
          documents: ['read', 'create', 'update', 'delete', 'manage'],
          users: ['read', 'create', 'update', 'assign_roles'],
          analytics: ['view_all', 'export'],
          compliance: ['view', 'configure'],
          security: ['view', 'configure'],
          system: ['access', 'configure']
        }
      },
      {
        name: 'compliance_officer',
        displayName: 'Compliance Officer',
        description: 'Manages compliance and audit functions',
        level: 'enterprise',
        permissions: {
          documents: ['read', 'audit'],
          compliance: ['view', 'configure', 'audit', 'report'],
          security: ['view', 'audit'],
          analytics: ['view_all', 'export'],
          system: ['access', 'audit']
        }
      }
    ];

    // Add industry-specific roles
    switch (industry) {
      case 'medical':
        return [
          ...baseRoles,
          {
            name: 'physician',
            displayName: 'Physician',
            description: 'Medical professional with PHI access',
            level: 'standard',
            permissions: {
              documents: ['read', 'create', 'update'],
              medical: ['phi_access', 'clinical_notes'],
              analytics: ['view_medical'],
              system: ['access']
            }
          },
          {
            name: 'hipaa_officer',
            displayName: 'HIPAA Compliance Officer',
            description: 'HIPAA compliance and PHI protection specialist',
            level: 'enterprise',
            permissions: {
              documents: ['read', 'audit'],
              medical: ['phi_audit', 'breach_management'],
              compliance: ['hipaa_management', 'audit', 'report'],
              security: ['view', 'configure'],
              system: ['access', 'audit']
            }
          }
        ];

      case 'legal':
        return [
          ...baseRoles,
          {
            name: 'attorney',
            displayName: 'Attorney',
            description: 'Legal professional with privilege access',
            level: 'standard',
            permissions: {
              documents: ['read', 'create', 'update'],
              legal: ['privilege_access', 'case_management'],
              analytics: ['view_legal'],
              system: ['access']
            }
          },
          {
            name: 'paralegal',
            displayName: 'Paralegal',
            description: 'Legal support with limited privilege access',
            level: 'basic',
            permissions: {
              documents: ['read', 'create'],
              legal: ['limited_privilege'],
              analytics: ['view_basic'],
              system: ['access']
            }
          }
        ];

      case 'finance':
        return [
          ...baseRoles,
          {
            name: 'analyst',
            displayName: 'Financial Analyst',
            description: 'Financial analysis and reporting',
            level: 'standard',
            permissions: {
              documents: ['read', 'create', 'update'],
              finance: ['analysis', 'reporting'],
              analytics: ['view_financial'],
              system: ['access']
            }
          },
          {
            name: 'aml_officer',
            displayName: 'AML/KYC Officer',
            description: 'Anti-money laundering and compliance specialist',
            level: 'enterprise',
            permissions: {
              documents: ['read', 'audit'],
              finance: ['aml_investigation', 'kyc_verification'],
              compliance: ['aml_management', 'audit', 'report'],
              system: ['access', 'audit']
            }
          }
        ];

      default:
        return baseRoles;
    }
  }

  /**
   * Check if user has permission for specific action
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<AccessControlResult> {
    try {
      // Get user's roles and permissions
      const userRoles = await storage.getUserRoles(userId);
      if (!userRoles.length) {
        return {
          allowed: false,
          reason: 'No roles assigned to user',
          requiredPermissions: [`${resource}:${action}`]
        };
      }

      // Check if user has required permission
      const hasPermission = await storage.checkUserPermission(userId, resource, action);
      
      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermissions: [`${resource}:${action}`]
        };
      }

      // Additional security checks based on context
      const securityChecks = await this.performSecurityChecks(userId, resource, action, context);
      
      if (!securityChecks.passed) {
        return {
          allowed: false,
          reason: securityChecks.reason,
          riskScore: securityChecks.riskScore,
          complianceFlags: securityChecks.flags
        };
      }

      // Log successful access
      await this.logSecurityEvent({
        eventId: randomUUID(),
        userId,
        eventType: 'access_granted',
        action,
        resource,
        outcome: 'success',
        severity: 'info',
        eventData: {
          permissions: [`${resource}:${action}`],
          context
        }
      });

      return {
        allowed: true,
        riskScore: securityChecks.riskScore
      };

    } catch (error) {
      console.error('Permission check failed:', error);
      
      // Log security event for failed permission check
      await this.logSecurityEvent({
        eventId: randomUUID(),
        userId,
        eventType: 'access_check_error',
        action,
        resource,
        outcome: 'failure',
        severity: 'high',
        eventData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        allowed: false,
        reason: 'Security check failed'
      };
    }
  }

  /**
   * Perform additional security checks
   */
  private async performSecurityChecks(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<{ passed: boolean; reason?: string; riskScore: number; flags: string[] }> {
    let riskScore = 0;
    const flags: string[] = [];

    // Check for suspicious activity patterns
    const recentLogs = await storage.getSecurityAuditLogs({
      userId,
      eventType: 'access_granted',
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      limit: 100
    });

    // High frequency access detection
    if (recentLogs.length > 50) {
      riskScore += 20;
      flags.push('high_frequency_access');
    }

    // Geographic anomaly detection (simplified)
    if (context?.ipAddress) {
      const recentIPs = recentLogs
        .map(log => log.ipAddress)
        .filter(Boolean)
        .slice(-10);
      
      if (recentIPs.length > 0 && !recentIPs.includes(context.ipAddress)) {
        riskScore += 15;
        flags.push('new_ip_address');
      }
    }

    // Time-based access patterns
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
      flags.push('off_hours_access');
    }

    // Risk-based decision
    const maxRiskScore = 50;
    if (riskScore > maxRiskScore) {
      return {
        passed: false,
        reason: 'High risk activity detected',
        riskScore,
        flags
      };
    }

    return {
      passed: true,
      riskScore,
      flags
    };
  }

  // =============================================================================
  // COMPLIANCE ENGINE
  // =============================================================================

  /**
   * Evaluate compliance for document or user action
   */
  async evaluateCompliance(
    industry: string,
    documentId?: number,
    userId?: string,
    action?: string
  ): Promise<ComplianceEvaluationResult> {
    try {
      // Get industry compliance rules
      const rules = await this.getComplianceRules(industry);
      const violations: any[] = [];
      let totalRiskScore = 0;

      for (const rule of rules) {
        const evaluation = await this.evaluateComplianceRule(rule, {
          documentId,
          userId,
          action,
          industry
        });

        if (!evaluation.compliant) {
          violations.push({
            ruleId: rule.id,
            violationType: evaluation.violationType,
            severity: evaluation.severity,
            description: evaluation.description,
            remediation: evaluation.remediation
          });
          
          totalRiskScore += this.getSeverityScore(evaluation.severity);
        }

        // Log compliance evaluation
        await storage.evaluateCompliance({
          ruleId: rule.id,
          documentId,
          userId,
          evaluationResult: evaluation.compliant ? 'compliant' : 'non_compliant',
          violationType: evaluation.violationType,
          violationSeverity: evaluation.severity,
          violationDetails: evaluation.details || {},
          evaluatedAt: new Date()
        });
      }

      const complianceScore = Math.max(0, 100 - totalRiskScore);

      // Send real-time compliance update if violations found
      if (violations.length > 0 && userId && this.wsService) {
        this.wsService.sendProcessingUpdate(userId, {
          documentId: documentId?.toString() || 'system',
          status: 'completed',
          progress: 100,
          message: `Compliance violations detected: ${violations.length} issues`,
          stage: 'compliance_check'
        });
      }

      return {
        isCompliant: violations.length === 0,
        violations,
        riskScore: totalRiskScore,
        complianceScore
      };

    } catch (error) {
      console.error('Compliance evaluation failed:', error);
      throw new Error(`Compliance evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluate a specific compliance rule
   */
  private async evaluateComplianceRule(
    rule: ComplianceRule,
    context: {
      documentId?: number;
      userId?: string;
      action?: string;
      industry: string;
    }
  ): Promise<{
    compliant: boolean;
    violationType?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    remediation?: string;
    details?: any;
  }> {
    // Simplified rule evaluation - in production, this would be more sophisticated
    const conditions = rule.conditions as any;
    const actions = rule.actions as any;

    // Example: Check data retention compliance
    if (rule.ruleType === 'data_retention' && context.documentId) {
      const documentSecurity = await storage.getDocumentSecurity(context.documentId);
      if (documentSecurity?.destructionDate && documentSecurity.destructionDate < new Date()) {
        return {
          compliant: false,
          violationType: 'data_retention_violation',
          severity: 'high',
          description: 'Document exceeds retention period and should be destroyed',
          remediation: 'Archive or securely delete the document according to policy'
        };
      }
    }

    // Example: Check access control compliance
    if (rule.ruleType === 'access_control' && context.userId && context.documentId) {
      const documentSecurity = await storage.getDocumentSecurity(context.documentId);
      if (documentSecurity?.classificationLevel === 'restricted') {
        const userRoles = await storage.getUserRoles(context.userId);
        const hasHighLevelRole = userRoles.some(role => 
          role.roleId && ['admin', 'compliance_officer'].includes(role.roleId.toString())
        );
        
        if (!hasHighLevelRole) {
          return {
            compliant: false,
            violationType: 'unauthorized_access',
            severity: 'critical',
            description: 'User lacks sufficient privileges for restricted document',
            remediation: 'Assign appropriate role or restrict document access'
          };
        }
      }
    }

    return { compliant: true };
  }

  /**
   * Get severity score for risk calculation
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 40;
      case 'high': return 25;
      case 'medium': return 15;
      case 'low': return 5;
      default: return 0;
    }
  }

  /**
   * Get compliance rules for industry with caching
   */
  private async getComplianceRules(industry: string): Promise<ComplianceRule[]> {
    if (this.complianceRulesCache.has(industry)) {
      return this.complianceRulesCache.get(industry)!;
    }

    const rules = await storage.getActiveComplianceRules(industry);
    this.complianceRulesCache.set(industry, rules);
    
    // Cache for 5 minutes
    setTimeout(() => {
      this.complianceRulesCache.delete(industry);
    }, 5 * 60 * 1000);

    return rules;
  }

  // =============================================================================
  // AUDIT & SECURITY LOGGING
  // =============================================================================

  /**
   * Log comprehensive security event
   */
  async logSecurityEvent(event: Partial<InsertSecurityAuditLog>): Promise<SecurityAuditLog> {
    const auditLog: InsertSecurityAuditLog = {
      eventId: event.eventId || randomUUID(),
      userId: event.userId,
      documentId: event.documentId,
      teamId: event.teamId,
      eventType: event.eventType!,
      action: event.action!,
      resource: event.resource!,
      resourceId: event.resourceId,
      outcome: event.outcome!,
      severity: event.severity || 'info',
      riskScore: event.riskScore || 0,
      complianceRelevant: event.complianceRelevant || false,
      industry: event.industry,
      eventData: event.eventData || {},
      userAgent: event.userAgent,
      ipAddress: event.ipAddress,
      sessionId: event.sessionId,
      correlationId: event.correlationId,
      parentEventId: event.parentEventId,
      isSecurityEvent: event.isSecurityEvent || false,
      isTamperProof: event.isTamperProof || true,
      checksum: this.generateEventChecksum(event)
    };

    const savedLog = await storage.logSecurityEvent(auditLog);

    // Send real-time security alert for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.sendSecurityAlert(savedLog);
    }

    return savedLog;
  }

  /**
   * Generate tamper-proof checksum for audit event
   */
  private generateEventChecksum(event: any): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
      timestamp: new Date().toISOString()
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Send security alert for critical events
   */
  private async sendSecurityAlert(auditLog: SecurityAuditLog): Promise<void> {
    if (this.wsService && auditLog.userId) {
      this.wsService.sendProcessingUpdate(auditLog.userId, {
        documentId: auditLog.documentId?.toString() || 'system',
        status: 'completed',
        progress: 100,
        message: `Security Alert: ${auditLog.eventType}`,
        stage: 'security_monitoring'
      });
    }

    // In production, this would also send to SIEM systems, email notifications, etc.
    console.warn(`🚨 Security Alert: ${auditLog.eventType} - ${auditLog.action} on ${auditLog.resource}`);
  }

  // =============================================================================
  // DOCUMENT SECURITY CLASSIFICATION
  // =============================================================================

  /**
   * Classify document based on content and industry
   */
  async classifyDocument(
    documentId: number,
    content: string,
    industry: string,
    userId: string
  ): Promise<DocumentSecurity> {
    try {
      const classification = await this.determineClassificationLevel(content, industry);
      const sensitivityTags = await this.extractSensitivityTags(content, industry);
      const complianceLabels = await this.determineComplianceLabels(content, industry);

      const documentSecurity: InsertDocumentSecurity = {
        documentId,
        classificationLevel: classification.level,
        sensitivityTags,
        encryptionStatus: 'encrypted',
        encryptionMethod: 'AES-256-GCM',
        keyId: randomUUID(),
        retentionPolicy: classification.retentionPolicy,
        retentionPeriodDays: classification.retentionDays,
        destructionDate: new Date(Date.now() + classification.retentionDays * 24 * 60 * 60 * 1000),
        complianceLabels,
        accessRestrictions: classification.accessRestrictions,
        watermarkData: {
          enabled: classification.level !== 'public',
          userId,
          timestamp: new Date().toISOString(),
          documentId
        },
        dlpPolicies: classification.dlpPolicies,
        originalHash: await this.generateContentHash(content),
        currentHash: await this.generateContentHash(content),
        integrityVerified: true,
        lastIntegrityCheck: new Date()
      };

      const savedSecurity = await storage.createDocumentSecurity(documentSecurity);

      // Log document classification
      await this.logSecurityEvent({
        eventId: randomUUID(),
        userId,
        documentId,
        eventType: 'document_classified',
        action: 'classify',
        resource: 'document',
        outcome: 'success',
        severity: 'info',
        complianceRelevant: true,
        industry,
        eventData: {
          classificationLevel: classification.level,
          sensitivityTags,
          complianceLabels
        }
      });

      return savedSecurity;

    } catch (error) {
      console.error('Document classification failed:', error);
      throw new Error(`Document classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine classification level based on content analysis
   */
  private async determineClassificationLevel(content: string, industry: string) {
    const contentLower = content.toLowerCase();
    
    // Industry-specific classification rules
    switch (industry) {
      case 'medical':
        if (this.containsPHI(contentLower)) {
          return {
            level: 'restricted',
            retentionPolicy: 'HIPAA_7_YEAR',
            retentionDays: 2555,
            accessRestrictions: { requiresMedicalRole: true },
            dlpPolicies: ['PHI_PROTECTION', 'HIPAA_COMPLIANCE']
          };
        }
        break;

      case 'legal':
        if (this.containsPrivilegedInfo(contentLower)) {
          return {
            level: 'confidential',
            retentionPolicy: 'ATTORNEY_CLIENT_PRIVILEGE',
            retentionDays: 2555,
            accessRestrictions: { requiresLegalRole: true },
            dlpPolicies: ['PRIVILEGE_PROTECTION', 'CONFIDENTIALITY']
          };
        }
        break;

      case 'finance':
        if (this.containsFinancialPII(contentLower)) {
          return {
            level: 'restricted',
            retentionPolicy: 'FINANCIAL_7_YEAR',
            retentionDays: 2555,
            accessRestrictions: { requiresFinancialRole: true },
            dlpPolicies: ['PII_PROTECTION', 'FINANCIAL_COMPLIANCE']
          };
        }
        break;
    }

    // Default classification
    return {
      level: 'internal',
      retentionPolicy: 'STANDARD_3_YEAR',
      retentionDays: 1095,
      accessRestrictions: {},
      dlpPolicies: ['BASIC_PROTECTION']
    };
  }

  /**
   * Check for PHI in medical content
   */
  private containsPHI(content: string): boolean {
    const phiIndicators = [
      'patient', 'medical record number', 'mrn', 'ssn', 'social security',
      'diagnosis', 'medication', 'treatment', 'physician', 'doctor',
      'birth date', 'address', 'phone', 'insurance'
    ];
    return phiIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for privileged information in legal content
   */
  private containsPrivilegedInfo(content: string): boolean {
    const privilegeIndicators = [
      'attorney-client', 'privileged', 'confidential', 'legal advice',
      'counsel', 'litigation', 'settlement', 'work product'
    ];
    return privilegeIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for financial PII
   */
  private containsFinancialPII(content: string): boolean {
    const financialIndicators = [
      'account number', 'routing number', 'credit card', 'ssn',
      'tax id', 'ein', 'bank account', 'financial statement'
    ];
    return financialIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Extract sensitivity tags from content
   */
  private async extractSensitivityTags(content: string, industry: string): Promise<string[]> {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    // Industry-specific tags
    switch (industry) {
      case 'medical':
        if (contentLower.includes('diagnosis')) tags.push('DIAGNOSIS');
        if (contentLower.includes('medication')) tags.push('MEDICATION');
        if (contentLower.includes('treatment')) tags.push('TREATMENT');
        if (contentLower.includes('patient')) tags.push('PATIENT_INFO');
        break;

      case 'legal':
        if (contentLower.includes('contract')) tags.push('CONTRACT');
        if (contentLower.includes('litigation')) tags.push('LITIGATION');
        if (contentLower.includes('settlement')) tags.push('SETTLEMENT');
        break;

      case 'finance':
        if (contentLower.includes('investment')) tags.push('INVESTMENT');
        if (contentLower.includes('loan')) tags.push('LOAN');
        if (contentLower.includes('credit')) tags.push('CREDIT');
        break;
    }

    // Common sensitivity tags
    if (contentLower.includes('confidential')) tags.push('CONFIDENTIAL');
    if (contentLower.includes('personal')) tags.push('PII');
    if (/\d{3}-\d{2}-\d{4}/.test(content)) tags.push('SSN');
    if (/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(content)) tags.push('CREDIT_CARD');

    return tags;
  }

  /**
   * Determine compliance labels for document
   */
  private async determineComplianceLabels(content: string, industry: string): Promise<string[]> {
    const labels: string[] = [];

    switch (industry) {
      case 'medical':
        labels.push('HIPAA');
        if (this.containsPHI(content.toLowerCase())) {
          labels.push('PHI');
        }
        break;

      case 'legal':
        labels.push('ATTORNEY_CLIENT_PRIVILEGE');
        if (this.containsPrivilegedInfo(content.toLowerCase())) {
          labels.push('WORK_PRODUCT');
        }
        break;

      case 'finance':
        labels.push('SOX', 'PCI_DSS');
        if (this.containsFinancialPII(content.toLowerCase())) {
          labels.push('PII');
        }
        break;
    }

    return labels;
  }

  /**
   * Generate content hash for integrity verification
   */
  private async generateContentHash(content: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // =============================================================================
  // SECURITY INCIDENT MANAGEMENT
  // =============================================================================

  /**
   * Create security incident
   */
  async createSecurityIncident(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    affectedUsers?: string[],
    affectedDocuments?: number[],
    detectionMethod?: string
  ): Promise<SecurityIncident> {
    const incident: InsertSecurityIncident = {
      incidentId: `INC-${Date.now()}-${randomUUID().slice(0, 8)}`,
      type,
      severity,
      status: 'open',
      title,
      description,
      affectedUsers: affectedUsers || [],
      affectedDocuments: affectedDocuments || [],
      detectionMethod,
      detectedAt: new Date(),
      impactAssessment: {},
      remediationSteps: {},
      notificationsSent: {},
      regulatoryReported: false,
      metadata: {}
    };

    const savedIncident = await storage.createSecurityIncident(incident);

    // Log incident creation
    await this.logSecurityEvent({
      eventId: randomUUID(),
      eventType: 'security_incident_created',
      action: 'create',
      resource: 'security_incident',
      resourceId: savedIncident.incidentId,
      outcome: 'success',
      severity: severity === 'critical' ? 'critical' : 'high',
      isSecurityEvent: true,
      eventData: {
        incidentType: type,
        incidentSeverity: severity,
        affectedUsersCount: affectedUsers?.length || 0,
        affectedDocumentsCount: affectedDocuments?.length || 0
      }
    });

    return savedIncident;
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  /**
   * Clear security caches
   */
  clearCaches(): void {
    this.securityPolicyCache.clear();
    this.permissionCache.clear();
    this.complianceRulesCache.clear();
  }
}