import { AdvancedSecurityService } from './advancedSecurityService';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

export class SecurityInitializer {
  private securityService: AdvancedSecurityService;

  constructor(securityService: AdvancedSecurityService) {
    this.securityService = securityService;
  }

  /**
   * Initialize complete security framework
   */
  async initializeSecurityFramework(): Promise<void> {
    console.log('🔐 Initializing Advanced Security & Compliance Framework...');

    try {
      // Initialize in order of dependencies
      await this.initializeDefaultRoles();
      await this.initializeDefaultPermissions();
      await this.initializeComplianceRules();
      await this.initializeSecurityPolicies();
      await this.initializeDefaultIncidentTypes();

      console.log('✅ Advanced Security & Compliance Framework initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize security framework:', error);
      throw error;
    }
  }

  /**
   * Initialize default security roles for all industries
   */
  private async initializeDefaultRoles(): Promise<void> {
    console.log('📋 Creating default security roles...');

    const industries = ['medical', 'legal', 'logistics', 'finance', 'real_estate', 'general'];
    
    for (const industry of industries) {
      const roles = this.getIndustryRoleDefinitions(industry);
      
      for (const roleDef of roles) {
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
          // Role might already exist
          console.warn(`Role ${industry}_${roleDef.name} might already exist`);
        }
      }
    }
  }

  /**
   * Initialize default security permissions
   */
  private async initializeDefaultPermissions(): Promise<void> {
    console.log('🔑 Creating default security permissions...');

    const permissions = [
      // Document permissions
      { name: 'documents:read', displayName: 'View Documents', category: 'document', resource: 'documents', action: 'read' },
      { name: 'documents:create', displayName: 'Create Documents', category: 'document', resource: 'documents', action: 'create' },
      { name: 'documents:update', displayName: 'Edit Documents', category: 'document', resource: 'documents', action: 'update' },
      { name: 'documents:delete', displayName: 'Delete Documents', category: 'document', resource: 'documents', action: 'delete' },
      { name: 'documents:share', displayName: 'Share Documents', category: 'document', resource: 'documents', action: 'share' },
      { name: 'documents:audit', displayName: 'Audit Documents', category: 'document', resource: 'documents', action: 'audit' },
      
      // User management permissions
      { name: 'users:read', displayName: 'View Users', category: 'user', resource: 'users', action: 'read' },
      { name: 'users:create', displayName: 'Create Users', category: 'user', resource: 'users', action: 'create' },
      { name: 'users:update', displayName: 'Edit Users', category: 'user', resource: 'users', action: 'update' },
      { name: 'users:delete', displayName: 'Delete Users', category: 'user', resource: 'users', action: 'delete' },
      { name: 'users:assign_roles', displayName: 'Assign User Roles', category: 'user', resource: 'users', action: 'assign_roles' },
      
      // Team management permissions
      { name: 'teams:read', displayName: 'View Teams', category: 'team', resource: 'teams', action: 'read' },
      { name: 'teams:create', displayName: 'Create Teams', category: 'team', resource: 'teams', action: 'create' },
      { name: 'teams:update', displayName: 'Edit Teams', category: 'team', resource: 'teams', action: 'update' },
      { name: 'teams:delete', displayName: 'Delete Teams', category: 'team', resource: 'teams', action: 'delete' },
      { name: 'teams:manage_members', displayName: 'Manage Team Members', category: 'team', resource: 'teams', action: 'manage_members' },
      
      // System permissions
      { name: 'system:access', displayName: 'System Access', category: 'system', resource: 'system', action: 'access' },
      { name: 'system:configure', displayName: 'System Configuration', category: 'system', resource: 'system', action: 'configure' },
      { name: 'system:audit', displayName: 'System Audit', category: 'system', resource: 'system', action: 'audit' },
      
      // Compliance permissions
      { name: 'compliance:view', displayName: 'View Compliance', category: 'compliance', resource: 'compliance', action: 'view' },
      { name: 'compliance:configure', displayName: 'Configure Compliance', category: 'compliance', resource: 'compliance', action: 'configure' },
      { name: 'compliance:audit', displayName: 'Audit Compliance', category: 'compliance', resource: 'compliance', action: 'audit' },
      { name: 'compliance:report', displayName: 'Generate Compliance Reports', category: 'compliance', resource: 'compliance', action: 'report' },
      
      // Security permissions
      { name: 'security:view', displayName: 'View Security', category: 'security', resource: 'security', action: 'view' },
      { name: 'security:configure', displayName: 'Configure Security', category: 'security', resource: 'security', action: 'configure' },
      { name: 'security:audit', displayName: 'Security Audit', category: 'security', resource: 'security', action: 'audit' },
      
      // Analytics permissions
      { name: 'analytics:view_basic', displayName: 'View Basic Analytics', category: 'analytics', resource: 'analytics', action: 'view_basic' },
      { name: 'analytics:view_detailed', displayName: 'View Detailed Analytics', category: 'analytics', resource: 'analytics', action: 'view_detailed' },
      { name: 'analytics:view_all', displayName: 'View All Analytics', category: 'analytics', resource: 'analytics', action: 'view_all' },
      { name: 'analytics:export', displayName: 'Export Analytics', category: 'analytics', resource: 'analytics', action: 'export' },
      
      // Collaboration permissions
      { name: 'collaboration:comment', displayName: 'Add Comments', category: 'collaboration', resource: 'collaboration', action: 'comment' },
      { name: 'collaboration:share', displayName: 'Share Documents', category: 'collaboration', resource: 'collaboration', action: 'share' },
      { name: 'collaboration:annotate', displayName: 'Add Annotations', category: 'collaboration', resource: 'collaboration', action: 'annotate' },
    ];

    for (const perm of permissions) {
      try {
        await storage.createSecurityPermission({
          name: perm.name,
          displayName: perm.displayName,
          description: `Permission to ${perm.displayName.toLowerCase()}`,
          category: perm.category,
          resource: perm.resource,
          action: perm.action,
          isActive: true,
        });
      } catch (error) {
        // Permission might already exist
        console.warn(`Permission ${perm.name} might already exist`);
      }
    }
  }

  /**
   * Initialize compliance rules for all industries
   */
  private async initializeComplianceRules(): Promise<void> {
    console.log('📊 Creating compliance rules...');

    const industries = ['medical', 'legal', 'finance', 'logistics', 'real_estate'];
    
    for (const industry of industries) {
      const rules = this.getComplianceRulesForIndustry(industry);
      
      for (const rule of rules) {
        try {
          await storage.createComplianceRule({
            name: rule.name,
            description: rule.description,
            industry,
            standard: rule.standard,
            ruleType: rule.ruleType,
            priority: rule.priority,
            conditions: rule.conditions,
            actions: rule.actions,
            isActive: true,
            effectiveFrom: new Date(),
            metadata: rule.metadata || {}
          });
        } catch (error) {
          console.warn(`Compliance rule ${rule.name} for ${industry} might already exist`);
        }
      }
    }
  }

  /**
   * Initialize security policies
   */
  private async initializeSecurityPolicies(): Promise<void> {
    console.log('🔒 Creating security policies...');

    const industries = ['medical', 'legal', 'finance', 'logistics', 'real_estate', 'general'];
    
    for (const industry of industries) {
      const policies = this.getSecurityPoliciesForIndustry(industry);
      
      for (const policy of policies) {
        try {
          await storage.createSecurityPolicy({
            name: policy.name,
            description: policy.description,
            industry,
            policyType: policy.policyType,
            rules: policy.rules,
            enforcement: policy.enforcement,
            applicableRoles: policy.applicableRoles,
            isActive: true,
            effectiveFrom: new Date(),
          });
        } catch (error) {
          console.warn(`Security policy ${policy.name} for ${industry} might already exist`);
        }
      }
    }
  }

  /**
   * Initialize default incident types
   */
  private async initializeDefaultIncidentTypes(): Promise<void> {
    console.log('⚠️ Creating default security incident types...');

    const incidentTypes = [
      {
        type: 'unauthorized_access',
        title: 'Unauthorized Access Attempt',
        description: 'User attempted to access resources without proper authorization'
      },
      {
        type: 'data_breach',
        title: 'Potential Data Breach',
        description: 'Sensitive data may have been exposed or accessed inappropriately'
      },
      {
        type: 'compliance_violation',
        title: 'Compliance Violation',
        description: 'Action violates industry compliance requirements'
      },
      {
        type: 'suspicious_activity',
        title: 'Suspicious User Activity',
        description: 'Unusual user behavior patterns detected'
      }
    ];

    // These would be used as templates for creating actual incidents
    console.log(`✅ ${incidentTypes.length} incident types configured`);
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
          documents: ['read', 'create', 'update', 'delete', 'share', 'audit'],
          users: ['read', 'create', 'update', 'assign_roles'],
          teams: ['read', 'create', 'update', 'delete', 'manage_members'],
          analytics: ['view_all', 'export'],
          compliance: ['view', 'configure'],
          security: ['view', 'configure'],
          system: ['access', 'configure']
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
              compliance: ['view', 'configure', 'audit', 'report'],
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

      default:
        return baseRoles;
    }
  }

  /**
   * Get compliance rules for industry
   */
  private getComplianceRulesForIndustry(industry: string) {
    switch (industry) {
      case 'medical':
        return [
          {
            name: 'HIPAA_PHI_Protection',
            description: 'Ensure PHI is properly protected and access is logged',
            standard: 'HIPAA',
            ruleType: 'access_control',
            priority: 'critical',
            conditions: {
              documentContains: ['patient', 'medical record', 'diagnosis'],
              accessRequires: ['medical_role']
            },
            actions: {
              logAccess: true,
              requireMFA: true,
              auditTrail: true
            }
          },
          {
            name: 'HIPAA_Data_Retention',
            description: 'Enforce HIPAA data retention requirements',
            standard: 'HIPAA',
            ruleType: 'data_retention',
            priority: 'high',
            conditions: {
              documentType: ['medical_record', 'patient_data'],
              retentionPeriod: 2555 // 7 years in days
            },
            actions: {
              enforceRetention: true,
              secureDestruction: true
            }
          }
        ];

      case 'legal':
        return [
          {
            name: 'Attorney_Client_Privilege',
            description: 'Protect attorney-client privileged communications',
            standard: 'Attorney_Client_Privilege',
            ruleType: 'access_control',
            priority: 'critical',
            conditions: {
              documentContains: ['attorney-client', 'privileged', 'confidential'],
              accessRequires: ['legal_role']
            },
            actions: {
              restrictAccess: true,
              logAccess: true,
              watermark: true
            }
          }
        ];

      case 'finance':
        return [
          {
            name: 'PCI_DSS_Compliance',
            description: 'Ensure PCI DSS compliance for payment data',
            standard: 'PCI_DSS',
            ruleType: 'access_control',
            priority: 'critical',
            conditions: {
              documentContains: ['credit card', 'payment', 'account number'],
              accessRequires: ['finance_role']
            },
            actions: {
              encrypt: true,
              logAccess: true,
              maskData: true
            }
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Get security policies for industry
   */
  private getSecurityPoliciesForIndustry(industry: string) {
    const basePolicies = [
      {
        name: 'Password_Policy',
        description: 'Enterprise password requirements',
        policyType: 'password',
        rules: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90,
          preventReuse: 5
        },
        enforcement: 'block',
        applicableRoles: ['*']
      },
      {
        name: 'Session_Policy',
        description: 'Session management and timeout policies',
        policyType: 'session',
        rules: {
          maxIdleTime: 30, // minutes
          maxSessionTime: 480, // 8 hours
          concurrentSessions: 3,
          requireReauth: true
        },
        enforcement: 'block',
        applicableRoles: ['*']
      }
    ];

    switch (industry) {
      case 'medical':
        return [
          ...basePolicies,
          {
            name: 'HIPAA_Access_Policy',
            description: 'HIPAA-compliant access controls',
            policyType: 'access',
            rules: {
              requireMFA: true,
              logAllAccess: true,
              minimumNeedToKnow: true,
              autoLockout: 15 // minutes
            },
            enforcement: 'block',
            applicableRoles: ['physician', 'nurse', 'admin']
          }
        ];

      case 'legal':
        return [
          ...basePolicies,
          {
            name: 'Legal_Privilege_Policy',
            description: 'Attorney-client privilege protection',
            policyType: 'access',
            rules: {
              privilegeProtection: true,
              confidentialityRequired: true,
              watermarkDocuments: true
            },
            enforcement: 'block',
            applicableRoles: ['attorney', 'paralegal']
          }
        ];

      default:
        return basePolicies;
    }
  }
}