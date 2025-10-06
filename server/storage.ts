import {
  users,
  documents,
  documentAnalysis,
  extractedEntities,
  processingJobs,
  industryConfigurations,
  ocrCache,
  documentClassifications,
  apiCostTracking,
  chatSessions,
  chatMessages,
  medicalDocuments,
  medicalEntities,
  patientSummaries,
  legalDocuments,
  contractAnalysis,
  legalEntities,
  logisticsDocuments,
  shipmentData,
  customsCompliance,
  // Collaboration tables
  teams,
  teamMembers,
  documentShares,
  documentComments,
  documentVersions,
  collaborationSessions,
  documentAnnotations,
  activityLogs,
  notifications,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type DocumentAnalysis,
  type InsertDocumentAnalysis,
  type ExtractedEntity,
  type InsertExtractedEntity,
  type ProcessingJob,
  type InsertProcessingJob,
  type IndustryConfiguration,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type MedicalDocument,
  type InsertMedicalDocument,
  type MedicalEntity,
  type InsertMedicalEntity,
  type PatientSummary,
  type InsertPatientSummary,
  type LegalDocument,
  type InsertLegalDocument,
  type ContractAnalysis,
  type InsertContractAnalysis,
  type LegalEntity,
  type InsertLegalEntity,
  type LogisticsDocument,
  type InsertLogisticsDocument,
  type ShipmentData,
  type InsertShipmentData,
  type CustomsCompliance,
  type InsertCustomsCompliance,
  // Collaboration types
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type DocumentShare,
  type InsertDocumentShare,
  type DocumentComment,
  type InsertDocumentComment,
  type DocumentVersion,
  type InsertDocumentVersion,
  type CollaborationSession,
  type InsertCollaborationSession,
  type DocumentAnnotation,
  type InsertDocumentAnnotation,
  type ActivityLog,
  type InsertActivityLog,
  type Notification,
  type InsertNotification,
  // Security & Compliance imports
  securityRoles,
  securityPermissions,
  userRoleAssignments,
  securityAuditLogs,
  documentSecurity,
  complianceRules,
  complianceMonitoring,
  userMFASettings,
  ssoConfigurations,
  apiSecurityLogs,
  securityPolicies,
  documentAccessLogs,
  securityIncidents,
  breachNotifications,
  type SecurityRole,
  type InsertSecurityRole,
  type SecurityPermission,
  type InsertSecurityPermission,
  type UserRoleAssignment,
  type InsertUserRoleAssignment,
  type SecurityAuditLog,
  type InsertSecurityAuditLog,
  type DocumentSecurity,
  type InsertDocumentSecurity,
  type ComplianceRule,
  type InsertComplianceRule,
  type ComplianceMonitoring,
  type InsertComplianceMonitoring,
  type UserMFASettings,
  type InsertUserMFASettings,
  type SSOConfiguration,
  type InsertSSOConfiguration,
  type APISecurityLog,
  type InsertAPISecurityLog,
  type SecurityPolicy,
  type InsertSecurityPolicy,
  type DocumentAccessLog,
  type InsertDocumentAccessLog,
  type SecurityIncident,
  type InsertSecurityIncident,
  type BreachNotification,
  type InsertBreachNotification,
  // Intelligent Customization imports
  userOnboardingProfiles,
  userBehaviorPatterns,
  documentRecommendations,
  contextualGuidance,
  aiModelOptimizations,
  smartAnalyticsConfigs,
  interfaceAdaptations,
  type UserOnboardingProfile,
  type InsertUserOnboardingProfile,
  type UserBehaviorPattern,
  type InsertUserBehaviorPattern,
  type DocumentRecommendation,
  type InsertDocumentRecommendation,
  type ContextualGuidance,
  type InsertContextualGuidance,
  type AIModelOptimization,
  type InsertAIModelOptimization,
  type SmartAnalyticsConfig,
  type InsertSmartAnalyticsConfig,
  type InterfaceAdaptation,
  type InsertInterfaceAdaptation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, asc, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for custom auth)
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserIndustry(userId: string, industry: string, company?: string): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByIds(ids: number[]): Promise<Document[]>;
  getUserDocuments(userId: string, limit?: number): Promise<Document[]>;
  getDocumentsByDateRange(startDate: Date, endDate: Date): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, progress?: number, message?: string): Promise<void>;
  updateDocumentAnalysis(id: number, extractedText: string, extractedData: any, ocrConfidence: number, aiConfidence: number): Promise<void>;
  
  // Analysis operations
  createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  getDocumentAnalyses(documentId: number): Promise<DocumentAnalysis[]>;
  
  // Entity operations
  createExtractedEntity(entity: InsertExtractedEntity): Promise<ExtractedEntity>;
  getDocumentEntities(documentId: number): Promise<ExtractedEntity[]>;
  
  // Processing job operations
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void>;
  getActiveProcessingJobs(documentId: number): Promise<ProcessingJob[]>;
  
  // Industry configuration operations
  getIndustryConfiguration(industry: string): Promise<IndustryConfiguration | undefined>;
  
  // OCR Cache operations
  getCachedOCR(documentHash: string): Promise<any | null>;
  cacheOCRResult(result: any): Promise<void>;
  deleteOldCachedOCR(cutoffDate: Date): Promise<number>;
  getOCRCacheCount(): Promise<number>;
  getOCRCacheHitStats(): Promise<{ cacheHits: number; totalPagesSaved: number }>;
  
  // Document classification operations
  saveDocumentClassification(classification: any): Promise<void>;
  getDocumentClassification(documentId: number): Promise<any | null>;
  
  // API cost tracking operations
  trackAPIcost(cost: any): Promise<void>;
  getAPIcostByDocument(documentId: number): Promise<any[]>;
  getAPIcostByUser(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getTotalAPICost(userId?: string): Promise<number>;
  
  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(documentId: number, limit?: number): Promise<ChatMessage[]>;
  clearChatHistory(documentId: number): Promise<void>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string, industry?: string, limit?: number): Promise<ChatSession[]>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession>;
  getSessionMessages(sessionId: number): Promise<ChatMessage[]>;
  saveSessionMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Medical industry operations
  createMedicalDocument(medDoc: InsertMedicalDocument): Promise<MedicalDocument>;
  createMedicalEntity(entity: InsertMedicalEntity): Promise<MedicalEntity>;
  createPatientSummary(summary: InsertPatientSummary): Promise<PatientSummary>;
  getMedicalEntities(documentId: number): Promise<MedicalEntity[]>;
  getPatientSummary(documentId: number): Promise<PatientSummary | undefined>;
  
  // Legal industry operations
  createLegalDocument(legalDoc: InsertLegalDocument): Promise<LegalDocument>;
  createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis>;
  createLegalEntity(entity: InsertLegalEntity): Promise<LegalEntity>;
  getLegalEntities(documentId: number): Promise<LegalEntity[]>;
  getContractAnalysis(documentId: number): Promise<ContractAnalysis | undefined>;
  
  // Logistics industry operations
  createLogisticsDocument(logDoc: InsertLogisticsDocument): Promise<LogisticsDocument>;
  createShipmentData(shipment: InsertShipmentData): Promise<ShipmentData>;
  createCustomsCompliance(customs: InsertCustomsCompliance): Promise<CustomsCompliance>;
  getShipmentData(documentId: number): Promise<ShipmentData | undefined>;
  getCustomsCompliance(documentId: number): Promise<CustomsCompliance | undefined>;
  
  // =============================================================================
  // COLLABORATION OPERATIONS
  // =============================================================================
  
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  
  // Team member operations
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMember(teamId: number, userId: string): Promise<TeamMember | undefined>;
  updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: string): Promise<void>;
  
  // Document sharing operations
  shareDocument(share: InsertDocumentShare): Promise<DocumentShare>;
  createDocumentShare(share: any): Promise<DocumentShare>; // Alias for shareDocument
  getDocumentShares(documentId: number): Promise<DocumentShare[]>;
  getUserDocumentShares(userId: string): Promise<DocumentShare[]>;
  getShareByToken(token: string): Promise<DocumentShare | undefined>;
  updateDocumentShare(id: number, updates: Partial<DocumentShare>): Promise<DocumentShare>;
  updateShareAccess(shareId: number): Promise<void>;
  revokeDocumentShare(id: number): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertDocumentComment): Promise<DocumentComment>;
  getDocumentComments(documentId: number, includeReplies?: boolean): Promise<DocumentComment[]>;
  getComment(id: number): Promise<DocumentComment | undefined>;
  updateComment(id: number, updates: Partial<DocumentComment>): Promise<DocumentComment>;
  deleteComment(id: number): Promise<void>;
  resolveComment(id: number, resolvedBy: string): Promise<DocumentComment>;
  
  // Version operations
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  getDocumentVersion(id: number): Promise<DocumentVersion | undefined>;
  
  // Collaboration session operations
  createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  getActiveCollaborationSessions(documentId: number): Promise<CollaborationSession[]>;
  getUserCollaborationSession(documentId: number, userId: string): Promise<CollaborationSession | undefined>;
  updateCollaborationSession(id: number, updates: Partial<CollaborationSession>): Promise<CollaborationSession>;
  endCollaborationSession(sessionId: string): Promise<void>;
  cleanupInactiveSessions(beforeDate: Date): Promise<void>;
  
  // Annotation operations
  createAnnotation(annotation: InsertDocumentAnnotation): Promise<DocumentAnnotation>;
  getDocumentAnnotations(documentId: number, userId?: string): Promise<DocumentAnnotation[]>;
  updateAnnotation(id: number, updates: Partial<DocumentAnnotation>): Promise<DocumentAnnotation>;
  deleteAnnotation(id: number): Promise<void>;
  
  // Activity log operations
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(filters: { userId?: string; documentId?: number; teamId?: number; limit?: number }): Promise<ActivityLog[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: number): Promise<void>;

  // =============================================================================
  // ADVANCED SECURITY & COMPLIANCE OPERATIONS
  // =============================================================================
  
  // RBAC Operations
  createSecurityRole(role: InsertSecurityRole): Promise<SecurityRole>;
  getSecurityRole(id: number): Promise<SecurityRole | undefined>;
  getSecurityRolesByIndustry(industry: string): Promise<SecurityRole[]>;
  assignUserRole(assignment: InsertUserRoleAssignment): Promise<UserRoleAssignment>;
  getUserRoles(userId: string): Promise<UserRoleAssignment[]>;
  checkUserPermission(userId: string, resource: string, action: string): Promise<boolean>;
  revokeUserRole(assignmentId: number): Promise<void>;
  
  // Security Permissions
  createSecurityPermission(permission: InsertSecurityPermission): Promise<SecurityPermission>;
  getSecurityPermissions(category?: string): Promise<SecurityPermission[]>;
  
  // Audit Operations
  logSecurityEvent(auditLog: InsertSecurityAuditLog): Promise<SecurityAuditLog>;
  getSecurityAuditLogs(filters: {
    userId?: string;
    documentId?: number;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    complianceRelevant?: boolean;
    limit?: number;
  }): Promise<SecurityAuditLog[]>;
  
  // Document Security Operations
  createDocumentSecurity(security: InsertDocumentSecurity): Promise<DocumentSecurity>;
  getDocumentSecurity(documentId: number): Promise<DocumentSecurity | undefined>;
  updateDocumentClassification(documentId: number, classification: string, sensitivityTags?: string[]): Promise<DocumentSecurity>;
  updateDocumentEncryption(documentId: number, encryptionData: Partial<DocumentSecurity>): Promise<DocumentSecurity>;
  
  // Compliance Operations
  createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule>;
  getComplianceRules(industry: string): Promise<ComplianceRule[]>;
  getActiveComplianceRules(industry: string): Promise<ComplianceRule[]>;
  evaluateCompliance(monitoring: InsertComplianceMonitoring): Promise<ComplianceMonitoring>;
  getComplianceViolations(filters: {
    industry?: string;
    severity?: string;
    resolved?: boolean;
    ruleId?: number;
    documentId?: number;
    limit?: number;
  }): Promise<ComplianceMonitoring[]>;
  updateComplianceViolation(id: number, updates: Partial<ComplianceMonitoring>): Promise<ComplianceMonitoring>;
  
  // Authentication & Authorization
  createMFASettings(settings: InsertUserMFASettings): Promise<UserMFASettings>;
  getUserMFASettings(userId: string): Promise<UserMFASettings | undefined>;
  updateMFASettings(userId: string, updates: Partial<UserMFASettings>): Promise<UserMFASettings>;
  
  // SSO Configuration
  createSSOConfiguration(config: InsertSSOConfiguration): Promise<SSOConfiguration>;
  getSSOConfigurations(domain?: string): Promise<SSOConfiguration[]>;
  updateSSOConfiguration(id: number, updates: Partial<SSOConfiguration>): Promise<SSOConfiguration>;
  
  // Security Monitoring
  logAPIAccess(log: InsertAPISecurityLog): Promise<APISecurityLog>;
  logDocumentAccess(log: InsertDocumentAccessLog): Promise<DocumentAccessLog>;
  getDocumentAccessHistory(documentId: number, limit?: number): Promise<DocumentAccessLog[]>;
  getUserAccessHistory(userId: string, limit?: number): Promise<DocumentAccessLog[]>;
  
  // Security Incidents
  getSecurityIncidents(filters: { 
    severity?: string; 
    status?: string; 
    type?: string;
    limit?: number 
  }): Promise<SecurityIncident[]>;
  createSecurityIncident(incident: InsertSecurityIncident): Promise<SecurityIncident>;
  updateSecurityIncident(incidentId: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident>;
  
  // Security Policies
  createSecurityPolicy(policy: InsertSecurityPolicy): Promise<SecurityPolicy>;
  getSecurityPolicies(industry: string): Promise<SecurityPolicy[]>;
  getActiveSecurityPolicies(industry: string): Promise<SecurityPolicy[]>;
  updateSecurityPolicy(id: number, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy>;
  
  // Breach Notifications
  createBreachNotification(notification: InsertBreachNotification): Promise<BreachNotification>;
  getBreachNotifications(incidentId: string): Promise<BreachNotification[]>;

  // =============================================================================
  // INTELLIGENT CUSTOMIZATION OPERATIONS
  // =============================================================================
  
  // User Onboarding Profile Operations
  createOnboardingProfile(profile: InsertUserOnboardingProfile): Promise<UserOnboardingProfile>;
  getOnboardingProfile(userId: string): Promise<UserOnboardingProfile | undefined>;
  updateOnboardingProfile(userId: string, updates: Partial<UserOnboardingProfile>): Promise<UserOnboardingProfile>;
  completeOnboarding(userId: string): Promise<UserOnboardingProfile>;
  
  // Behavior Pattern Operations
  trackBehaviorPattern(pattern: InsertUserBehaviorPattern): Promise<UserBehaviorPattern>;
  getUserBehaviorPatterns(userId: string, limit?: number): Promise<UserBehaviorPattern[]>;
  analyzeUserPatterns(userId: string, timeframeHours?: number): Promise<any>;
  
  // Document Recommendation Operations
  createDocumentRecommendation(recommendation: InsertDocumentRecommendation): Promise<DocumentRecommendation>;
  getUserRecommendations(userId: string, active?: boolean): Promise<DocumentRecommendation[]>;
  dismissRecommendation(recommendationId: number, userId: string): Promise<void>;
  actOnRecommendation(recommendationId: number, userId: string): Promise<void>;
  
  // Contextual Guidance Operations
  createContextualGuidance(guidance: InsertContextualGuidance): Promise<ContextualGuidance>;
  getContextualGuidance(userId: string, pageContext: string): Promise<ContextualGuidance[]>;
  markGuidanceViewed(guidanceId: number, userId: string): Promise<void>;
  markGuidanceCompleted(guidanceId: number, userId: string): Promise<void>;
  rateGuidanceHelpfulness(guidanceId: number, userId: string, rating: number): Promise<void>;
  
  // AI Model Optimization Operations
  createAIOptimization(optimization: InsertAIModelOptimization): Promise<AIModelOptimization>;
  getAIOptimizations(userId?: string, industry?: string): Promise<AIModelOptimization[]>;
  updateAIOptimization(id: number, updates: Partial<AIModelOptimization>): Promise<AIModelOptimization>;
  
  // Smart Analytics Configuration Operations
  createAnalyticsConfig(config: InsertSmartAnalyticsConfig): Promise<SmartAnalyticsConfig>;
  getUserAnalyticsConfigs(userId: string): Promise<SmartAnalyticsConfig[]>;
  updateAnalyticsConfig(id: number, updates: Partial<SmartAnalyticsConfig>): Promise<SmartAnalyticsConfig>;
  
  // Interface Adaptation Operations
  createInterfaceAdaptation(adaptation: InsertInterfaceAdaptation): Promise<InterfaceAdaptation>;
  getInterfaceAdaptation(userId: string): Promise<InterfaceAdaptation | undefined>;
  updateInterfaceAdaptation(userId: string, updates: Partial<InterfaceAdaptation>): Promise<InterfaceAdaptation>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserIndustry(userId: string, industry: string, company?: string): Promise<User> {
    const updateData: Partial<User> = {
      industry,
      updatedAt: new Date(),
    };
    
    if (company) {
      updateData.company = company;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values(document)
      .returning();
    return doc;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByIds(ids: number[]): Promise<Document[]> {
    if (ids.length === 0) return [];
    const { inArray } = await import('drizzle-orm');
    return await db
      .select()
      .from(documents)
      .where(inArray(documents.id, ids));
  }

  async getUserDocuments(userId: string, limit: number = 50): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit);
  }

  async getDocumentsByDateRange(startDate: Date, endDate: Date): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          gte(documents.createdAt, startDate),
          lte(documents.createdAt, endDate)
        )
      );
  }

  async updateDocumentStatus(id: number, status: string, progress?: number, message?: string): Promise<void> {
    const updateData: Partial<Document> = {
      status,
      updatedAt: new Date(),
    };
    
    if (progress !== undefined) {
      updateData.processingProgress = progress;
    }
    
    if (message) {
      updateData.processingMessage = message;
    }

    await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id));
  }

  async updateDocumentAnalysis(
    id: number,
    extractedText: string,
    extractedData: any,
    ocrConfidence: number,
    aiConfidence: number
  ): Promise<void> {
    await db
      .update(documents)
      .set({
        extractedText,
        extractedData,
        ocrConfidence,
        aiConfidence,
        status: 'completed',
        processingProgress: 100,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));
  }

  // Analysis operations
  async createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const [result] = await db
      .insert(documentAnalysis)
      .values(analysis)
      .returning();
    return result;
  }

  async getDocumentAnalyses(documentId: number): Promise<DocumentAnalysis[]> {
    return await db
      .select()
      .from(documentAnalysis)
      .where(eq(documentAnalysis.documentId, documentId))
      .orderBy(desc(documentAnalysis.createdAt));
  }

  // Entity operations
  async createExtractedEntity(entity: InsertExtractedEntity): Promise<ExtractedEntity> {
    const [result] = await db
      .insert(extractedEntities)
      .values(entity)
      .returning();
    return result;
  }

  async getDocumentEntities(documentId: number): Promise<ExtractedEntity[]> {
    return await db
      .select()
      .from(extractedEntities)
      .where(eq(extractedEntities.documentId, documentId))
      .orderBy(desc(extractedEntities.createdAt));
  }

  // Processing job operations
  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const [result] = await db
      .insert(processingJobs)
      .values(job)
      .returning();
    return result;
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void> {
    await db
      .update(processingJobs)
      .set(updates)
      .where(eq(processingJobs.id, id));
  }

  async getActiveProcessingJobs(documentId: number): Promise<ProcessingJob[]> {
    return await db
      .select()
      .from(processingJobs)
      .where(
        and(
          eq(processingJobs.documentId, documentId),
          eq(processingJobs.status, 'processing')
        )
      );
  }

  // Industry configuration operations
  async getIndustryConfiguration(industry: string): Promise<IndustryConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(industryConfigurations)
      .where(eq(industryConfigurations.industry, industry));
    return config;
  }

  // OCR Cache operations
  async getCachedOCR(documentHash: string): Promise<any | null> {
    const [cached] = await db
      .select()
      .from(ocrCache)
      .where(eq(ocrCache.documentHash, documentHash));
    
    if (cached) {
      // Update cache hit counter and last accessed time
      await db
        .update(ocrCache)
        .set({ 
          cacheHits: sql`${ocrCache.cacheHits} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(ocrCache.documentHash, documentHash));
    }
    
    return cached || null;
  }

  async cacheOCRResult(result: any): Promise<void> {
    await db
      .insert(ocrCache)
      .values({
        documentHash: result.documentHash,
        extractedText: result.extractedText,
        ocrConfidence: result.ocrConfidence,
        pageCount: result.pageCount,
        metadata: result.metadata || {},
        cacheHits: 0,
      })
      .onConflictDoNothing();
  }

  async deleteOldCachedOCR(cutoffDate: Date): Promise<number> {
    const result = await db
      .delete(ocrCache)
      .where(lt(ocrCache.createdAt, cutoffDate));
    return result.rowCount || 0;
  }

  async getOCRCacheCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ocrCache);
    return result[0]?.count || 0;
  }

  async getOCRCacheHitStats(): Promise<{ cacheHits: number; totalPagesSaved: number }> {
    const result = await db
      .select({
        totalHits: sql<number>`sum(${ocrCache.cacheHits})::int`,
        totalPages: sql<number>`sum(${ocrCache.cacheHits} * ${ocrCache.pageCount})::int`,
      })
      .from(ocrCache);
    
    return {
      cacheHits: result[0]?.totalHits || 0,
      totalPagesSaved: result[0]?.totalPages || 0,
    };
  }

  // Document classification operations
  async saveDocumentClassification(classification: any): Promise<void> {
    await db.insert(documentClassifications).values(classification);
  }

  async getDocumentClassification(documentId: number): Promise<any | null> {
    const [classification] = await db
      .select()
      .from(documentClassifications)
      .where(eq(documentClassifications.documentId, documentId))
      .orderBy(desc(documentClassifications.createdAt))
      .limit(1);
    return classification || null;
  }

  // API cost tracking operations
  async trackAPIcost(cost: any): Promise<void> {
    await db.insert(apiCostTracking).values(cost);
  }

  async getAPIcostByDocument(documentId: number): Promise<any[]> {
    return await db
      .select()
      .from(apiCostTracking)
      .where(eq(apiCostTracking.documentId, documentId))
      .orderBy(desc(apiCostTracking.createdAt));
  }

  async getAPIcostByUser(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const baseQuery = db
      .select()
      .from(apiCostTracking)
      .where(eq(apiCostTracking.userId, userId));
    
    if (startDate && endDate) {
      return await baseQuery
        .where(
          and(
            eq(apiCostTracking.userId, userId),
            gte(apiCostTracking.createdAt, startDate),
            lte(apiCostTracking.createdAt, endDate)
          )
        )
        .orderBy(desc(apiCostTracking.createdAt));
    }
    
    return await baseQuery.orderBy(desc(apiCostTracking.createdAt));
  }

  async getTotalAPICost(userId?: string): Promise<number> {
    const baseQuery = db
      .select({ total: sql<number>`sum(${apiCostTracking.estimatedCost})::float` })
      .from(apiCostTracking);
    
    if (userId) {
      const result = await baseQuery.where(eq(apiCostTracking.userId, userId));
      return result[0]?.total || 0;
    }
    
    const result = await baseQuery;
    return result[0]?.total || 0;
  }

  // Chat operations
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [savedMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return savedMessage;
  }

  async getChatHistory(documentId: number, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.documentId, documentId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return messages.reverse(); // Return in chronological order
  }

  async clearChatHistory(documentId: number): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.documentId, documentId));
  }

  // Chat session operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [result] = await db
      .insert(chatSessions)
      .values(session)
      .returning();
    return result;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));
    return session;
  }

  async getUserChatSessions(userId: string, industry?: string, limit?: number): Promise<ChatSession[]> {
    const conditions = [eq(chatSessions.userId, userId)];
    if (industry) {
      conditions.push(eq(chatSessions.industry, industry));
    }
    let query = db
      .select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.updatedAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession> {
    const [updated] = await db
      .update(chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return updated;
  }

  async getSessionMessages(sessionId: number): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt));
    return messages.reverse(); // Return in chronological order
  }

  async saveSessionMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [savedMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return savedMessage;
  }

  // Medical industry operations
  async createMedicalDocument(medDoc: InsertMedicalDocument): Promise<MedicalDocument> {
    const [result] = await db
      .insert(medicalDocuments)
      .values(medDoc)
      .returning();
    return result;
  }

  async createMedicalEntity(entity: InsertMedicalEntity): Promise<MedicalEntity> {
    const [result] = await db
      .insert(medicalEntities)
      .values(entity)
      .returning();
    return result;
  }

  async createPatientSummary(summary: InsertPatientSummary): Promise<PatientSummary> {
    const [result] = await db
      .insert(patientSummaries)
      .values(summary)
      .returning();
    return result;
  }

  async getMedicalEntities(documentId: number): Promise<MedicalEntity[]> {
    return await db
      .select()
      .from(medicalEntities)
      .where(eq(medicalEntities.documentId, documentId));
  }

  async getPatientSummary(documentId: number): Promise<PatientSummary | undefined> {
    const [result] = await db
      .select()
      .from(patientSummaries)
      .where(eq(patientSummaries.documentId, documentId));
    return result;
  }

  // Legal industry operations
  async createLegalDocument(legalDoc: InsertLegalDocument): Promise<LegalDocument> {
    const [result] = await db
      .insert(legalDocuments)
      .values(legalDoc)
      .returning();
    return result;
  }

  async createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis> {
    const [result] = await db
      .insert(contractAnalysis)
      .values(analysis)
      .returning();
    return result;
  }

  async createLegalEntity(entity: InsertLegalEntity): Promise<LegalEntity> {
    const [result] = await db
      .insert(legalEntities)
      .values(entity)
      .returning();
    return result;
  }

  async getLegalEntities(documentId: number): Promise<LegalEntity[]> {
    return await db
      .select()
      .from(legalEntities)
      .where(eq(legalEntities.documentId, documentId));
  }

  async getContractAnalysis(documentId: number): Promise<ContractAnalysis | undefined> {
    const [result] = await db
      .select()
      .from(contractAnalysis)
      .where(eq(contractAnalysis.documentId, documentId));
    return result;
  }

  // Logistics industry operations
  async createLogisticsDocument(logDoc: InsertLogisticsDocument): Promise<LogisticsDocument> {
    const [result] = await db
      .insert(logisticsDocuments)
      .values(logDoc)
      .returning();
    return result;
  }

  async createShipmentData(shipment: InsertShipmentData): Promise<ShipmentData> {
    const [result] = await db
      .insert(shipmentData)
      .values(shipment)
      .returning();
    return result;
  }

  async createCustomsCompliance(customs: InsertCustomsCompliance): Promise<CustomsCompliance> {
    const [result] = await db
      .insert(customsCompliance)
      .values(customs)
      .returning();
    return result;
  }

  async getShipmentData(documentId: number): Promise<ShipmentData | undefined> {
    const [result] = await db
      .select()
      .from(shipmentData)
      .where(eq(shipmentData.documentId, documentId));
    return result;
  }

  async getCustomsCompliance(documentId: number): Promise<CustomsCompliance | undefined> {
    const [result] = await db
      .select()
      .from(customsCompliance)
      .where(eq(customsCompliance.documentId, documentId));
    return result;
  }

  // =============================================================================
  // COLLABORATION OPERATIONS IMPLEMENTATION
  // =============================================================================

  // Team operations
  async createTeam(team: InsertTeam): Promise<Team> {
    const [result] = await db
      .insert(teams)
      .values(team)
      .returning();
    return result;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(and(
        eq(teamMembers.userId, userId),
        eq(teams.isActive, true)
      ))
      .then(results => results.map(result => result.teams));
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<void> {
    await db
      .update(teams)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teams.id, id));
  }

  // Team member operations
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [result] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    return result;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(asc(teamMembers.createdAt));
  }

  async getTeamMember(teamId: number, userId: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ));
    return member;
  }

  async updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember> {
    const [member] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ));
  }

  // Document sharing operations
  async shareDocument(share: InsertDocumentShare): Promise<DocumentShare> {
    const [result] = await db
      .insert(documentShares)
      .values(share)
      .returning();
    return result;
  }
  
  // Alias for shareDocument to support different naming conventions
  async createDocumentShare(share: any): Promise<DocumentShare> {
    return this.shareDocument(share);
  }
  
  // Get a share by its unique token
  async getShareByToken(token: string): Promise<DocumentShare | undefined> {
    const share = await db
      .select()
      .from(documentShares)
      .where(eq(documentShares.shareToken, token))
      .limit(1);
    return share[0];
  }
  
  // Update share access (set accessedAt timestamp)
  async updateShareAccess(shareId: number): Promise<void> {
    await db
      .update(documentShares)
      .set({ accessedAt: new Date() })
      .where(eq(documentShares.id, shareId));
  }

  async getDocumentShares(documentId: number): Promise<DocumentShare[]> {
    return await db
      .select()
      .from(documentShares)
      .where(and(
        eq(documentShares.documentId, documentId),
        eq(documentShares.isActive, true)
      ))
      .orderBy(desc(documentShares.createdAt));
  }

  async getUserDocumentShares(userId: string): Promise<DocumentShare[]> {
    return await db
      .select()
      .from(documentShares)
      .where(and(
        or(
          eq(documentShares.userId, userId),
          eq(documentShares.sharedBy, userId)
        ),
        eq(documentShares.isActive, true)
      ))
      .orderBy(desc(documentShares.createdAt));
  }

  async updateDocumentShare(id: number, updates: Partial<DocumentShare>): Promise<DocumentShare> {
    const [share] = await db
      .update(documentShares)
      .set(updates)
      .where(eq(documentShares.id, id))
      .returning();
    return share;
  }

  async revokeDocumentShare(id: number): Promise<void> {
    await db
      .update(documentShares)
      .set({ isActive: false })
      .where(eq(documentShares.id, id));
  }

  // Comment operations
  async createComment(comment: InsertDocumentComment): Promise<DocumentComment> {
    const results = await db
      .insert(documentComments)
      .values(comment)
      .returning();
    return results[0]!;
  }

  async getDocumentComments(documentId: number, includeReplies: boolean = true): Promise<DocumentComment[]> {
    if (includeReplies) {
      return await db
        .select()
        .from(documentComments)
        .where(eq(documentComments.documentId, documentId))
        .orderBy(asc(documentComments.createdAt));
    } else {
      return await db
        .select()
        .from(documentComments)
        .where(and(
          eq(documentComments.documentId, documentId),
          isNull(documentComments.parentId)
        ))
        .orderBy(asc(documentComments.createdAt));
    }
  }

  async getComment(id: number): Promise<DocumentComment | undefined> {
    const [comment] = await db
      .select()
      .from(documentComments)
      .where(eq(documentComments.id, id));
    return comment;
  }

  async updateComment(id: number, updates: Partial<DocumentComment>): Promise<DocumentComment> {
    const [comment] = await db
      .update(documentComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentComments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db
      .delete(documentComments)
      .where(eq(documentComments.id, id));
  }

  async resolveComment(id: number, resolvedBy: string): Promise<DocumentComment> {
    const [comment] = await db
      .update(documentComments)
      .set({
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(documentComments.id, id))
      .returning();
    return comment;
  }

  // Version operations
  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [result] = await db
      .insert(documentVersions)
      .values(version)
      .returning();
    return result;
  }

  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.isActive, true)
      ))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async getDocumentVersion(id: number): Promise<DocumentVersion | undefined> {
    const [version] = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.id, id));
    return version;
  }

  // Collaboration session operations
  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [result] = await db
      .insert(collaborationSessions)
      .values(session)
      .returning();
    return result;
  }

  async getActiveCollaborationSessions(documentId: number): Promise<CollaborationSession[]> {
    return await db
      .select()
      .from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.documentId, documentId),
        eq(collaborationSessions.status, 'active')
      ))
      .orderBy(desc(collaborationSessions.lastActivity));
  }

  async getUserCollaborationSession(documentId: number, userId: string): Promise<CollaborationSession | undefined> {
    const [session] = await db
      .select()
      .from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.documentId, documentId),
        eq(collaborationSessions.userId, userId),
        eq(collaborationSessions.status, 'active')
      ));
    return session;
  }

  async updateCollaborationSession(id: number, updates: Partial<CollaborationSession>): Promise<CollaborationSession> {
    const [session] = await db
      .update(collaborationSessions)
      .set({ ...updates, lastActivity: new Date() })
      .where(eq(collaborationSessions.id, id))
      .returning();
    return session;
  }

  async endCollaborationSession(sessionId: string): Promise<void> {
    await db
      .update(collaborationSessions)
      .set({ 
        status: 'disconnected',
        lastActivity: new Date()
      })
      .where(eq(collaborationSessions.sessionId, sessionId));
  }

  async cleanupInactiveSessions(beforeDate: Date): Promise<void> {
    await db
      .update(collaborationSessions)
      .set({ status: 'disconnected' })
      .where(and(
        eq(collaborationSessions.status, 'active'),
        lte(collaborationSessions.lastActivity, beforeDate)
      ));
  }

  // Annotation operations
  async createAnnotation(annotation: InsertDocumentAnnotation): Promise<DocumentAnnotation> {
    const [result] = await db
      .insert(documentAnnotations)
      .values(annotation)
      .returning();
    return result;
  }

  async getDocumentAnnotations(documentId: number, userId?: string): Promise<DocumentAnnotation[]> {
    const conditions = [eq(documentAnnotations.documentId, documentId)];
    
    if (userId) {
      conditions.push(
        or(
          eq(documentAnnotations.userId, userId),
          eq(documentAnnotations.isPrivate, false)
        )!
      );
    } else {
      conditions.push(eq(documentAnnotations.isPrivate, false));
    }

    return await db
      .select()
      .from(documentAnnotations)
      .where(and(...conditions))
      .orderBy(desc(documentAnnotations.createdAt));
  }

  async updateAnnotation(id: number, updates: Partial<DocumentAnnotation>): Promise<DocumentAnnotation> {
    const [annotation] = await db
      .update(documentAnnotations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentAnnotations.id, id))
      .returning();
    return annotation;
  }

  async deleteAnnotation(id: number): Promise<void> {
    await db
      .delete(documentAnnotations)
      .where(eq(documentAnnotations.id, id));
  }

  // Activity log operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db
      .insert(activityLogs)
      .values(activity)
      .returning();
    return result;
  }

  async getActivityLogs(filters: { 
    userId?: string; 
    documentId?: number; 
    teamId?: number; 
    limit?: number 
  }): Promise<ActivityLog[]> {
    const conditions = [];
    
    if (filters.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters.documentId) {
      conditions.push(eq(activityLogs.documentId, filters.documentId));
    }
    if (filters.teamId) {
      conditions.push(eq(activityLogs.teamId, filters.teamId));
    }

    const query = db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }

    return await query;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // =============================================================================
  // ADVANCED SECURITY & COMPLIANCE STORAGE IMPLEMENTATIONS
  // =============================================================================

  // RBAC Operations
  async createSecurityRole(role: InsertSecurityRole): Promise<SecurityRole> {
    const [result] = await db
      .insert(securityRoles)
      .values(role)
      .returning();
    return result;
  }

  async getSecurityRole(id: number): Promise<SecurityRole | undefined> {
    const [role] = await db
      .select()
      .from(securityRoles)
      .where(eq(securityRoles.id, id));
    return role;
  }

  async getSecurityRolesByIndustry(industry: string): Promise<SecurityRole[]> {
    return await db
      .select()
      .from(securityRoles)
      .where(and(
        eq(securityRoles.industry, industry),
        eq(securityRoles.isActive, true)
      ))
      .orderBy(securityRoles.level, securityRoles.name);
  }

  async assignUserRole(assignment: InsertUserRoleAssignment): Promise<UserRoleAssignment> {
    const [result] = await db
      .insert(userRoleAssignments)
      .values(assignment)
      .returning();
    return result;
  }

  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    return await db
      .select()
      .from(userRoleAssignments)
      .where(and(
        eq(userRoleAssignments.userId, userId),
        eq(userRoleAssignments.isActive, true),
        or(
          isNull(userRoleAssignments.expiresAt),
          gte(userRoleAssignments.expiresAt, new Date())
        )
      ))
      .orderBy(desc(userRoleAssignments.createdAt));
  }

  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    
    for (const roleAssignment of userRoles) {
      const role = await this.getSecurityRole(roleAssignment.roleId);
      if (role && role.permissions) {
        const permissions = role.permissions as any;
        if (permissions[resource] && permissions[resource].includes(action)) {
          return true;
        }
        // Check for wildcard permissions
        if (permissions['*'] && permissions['*'].includes('*')) {
          return true;
        }
      }
    }
    
    return false;
  }

  async revokeUserRole(assignmentId: number): Promise<void> {
    await db
      .update(userRoleAssignments)
      .set({ isActive: false })
      .where(eq(userRoleAssignments.id, assignmentId));
  }

  // Security Permissions
  async createSecurityPermission(permission: InsertSecurityPermission): Promise<SecurityPermission> {
    const [result] = await db
      .insert(securityPermissions)
      .values(permission)
      .returning();
    return result;
  }

  async getSecurityPermissions(category?: string): Promise<SecurityPermission[]> {
    if (category) {
      return await db
        .select()
        .from(securityPermissions)
        .where(and(
          eq(securityPermissions.isActive, true),
          eq(securityPermissions.category, category)
        ))
        .orderBy(securityPermissions.category, securityPermissions.name);
    }
    
    return await db
      .select()
      .from(securityPermissions)
      .where(eq(securityPermissions.isActive, true))
      .orderBy(securityPermissions.category, securityPermissions.name);
  }

  // Audit Operations
  async logSecurityEvent(auditLog: InsertSecurityAuditLog): Promise<SecurityAuditLog> {
    const [result] = await db
      .insert(securityAuditLogs)
      .values(auditLog)
      .returning();
    return result;
  }

  async getSecurityAuditLogs(filters: {
    userId?: string;
    documentId?: number;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    complianceRelevant?: boolean;
    limit?: number;
  }): Promise<SecurityAuditLog[]> {
    const conditions = [];
    
    if (filters.userId) {
      conditions.push(eq(securityAuditLogs.userId, filters.userId));
    }
    if (filters.documentId) {
      conditions.push(eq(securityAuditLogs.documentId, filters.documentId));
    }
    if (filters.eventType) {
      conditions.push(eq(securityAuditLogs.eventType, filters.eventType));
    }
    if (filters.startDate) {
      conditions.push(gte(securityAuditLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(securityAuditLogs.createdAt, filters.endDate));
    }
    if (filters.severity) {
      conditions.push(eq(securityAuditLogs.severity, filters.severity));
    }
    if (filters.complianceRelevant !== undefined) {
      conditions.push(eq(securityAuditLogs.complianceRelevant, filters.complianceRelevant));
    }

    const query = db
      .select()
      .from(securityAuditLogs)
      .orderBy(desc(securityAuditLogs.createdAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }

    return await query;
  }

  // Document Security Operations
  async createDocumentSecurity(security: InsertDocumentSecurity): Promise<DocumentSecurity> {
    const [result] = await db
      .insert(documentSecurity)
      .values(security)
      .returning();
    return result;
  }

  async getDocumentSecurity(documentId: number): Promise<DocumentSecurity | undefined> {
    const [result] = await db
      .select()
      .from(documentSecurity)
      .where(eq(documentSecurity.documentId, documentId));
    return result;
  }

  async updateDocumentClassification(
    documentId: number, 
    classification: string, 
    sensitivityTags?: string[]
  ): Promise<DocumentSecurity> {
    const updateData: any = {
      classificationLevel: classification,
      updatedAt: new Date()
    };
    
    if (sensitivityTags) {
      updateData.sensitivityTags = sensitivityTags;
    }

    const [result] = await db
      .update(documentSecurity)
      .set(updateData)
      .where(eq(documentSecurity.documentId, documentId))
      .returning();
    return result;
  }

  async updateDocumentEncryption(
    documentId: number, 
    encryptionData: Partial<DocumentSecurity>
  ): Promise<DocumentSecurity> {
    const [result] = await db
      .update(documentSecurity)
      .set({ ...encryptionData, updatedAt: new Date() })
      .where(eq(documentSecurity.documentId, documentId))
      .returning();
    return result;
  }

  // Compliance Operations
  async createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule> {
    const [result] = await db
      .insert(complianceRules)
      .values(rule)
      .returning();
    return result;
  }

  async getComplianceRules(industry: string): Promise<ComplianceRule[]> {
    return await db
      .select()
      .from(complianceRules)
      .where(eq(complianceRules.industry, industry))
      .orderBy(complianceRules.priority, desc(complianceRules.createdAt));
  }

  async getActiveComplianceRules(industry: string): Promise<ComplianceRule[]> {
    return await db
      .select()
      .from(complianceRules)
      .where(and(
        eq(complianceRules.industry, industry),
        eq(complianceRules.isActive, true),
        lte(complianceRules.effectiveFrom, new Date()),
        or(
          isNull(complianceRules.effectiveTo),
          gte(complianceRules.effectiveTo, new Date())
        )
      ))
      .orderBy(complianceRules.priority, desc(complianceRules.createdAt));
  }

  async evaluateCompliance(monitoring: InsertComplianceMonitoring): Promise<ComplianceMonitoring> {
    const [result] = await db
      .insert(complianceMonitoring)
      .values(monitoring)
      .returning();
    return result;
  }

  async getComplianceViolations(filters: {
    industry?: string;
    severity?: string;
    resolved?: boolean;
    ruleId?: number;
    documentId?: number;
    limit?: number;
  }): Promise<ComplianceMonitoring[]> {
    const conditions = [eq(complianceMonitoring.evaluationResult, 'non_compliant')];
    
    if (filters.ruleId) {
      conditions.push(eq(complianceMonitoring.ruleId, filters.ruleId));
    }
    if (filters.documentId) {
      conditions.push(eq(complianceMonitoring.documentId, filters.documentId));
    }
    if (filters.severity) {
      conditions.push(eq(complianceMonitoring.violationSeverity, filters.severity));
    }
    if (filters.resolved !== undefined) {
      if (filters.resolved) {
        conditions.push(eq(complianceMonitoring.remediationStatus, 'resolved'));
      } else {
        conditions.push(eq(complianceMonitoring.remediationStatus, 'pending'));
      }
    }

    const query = db
      .select()
      .from(complianceMonitoring)
      .where(and(...conditions))
      .orderBy(desc(complianceMonitoring.evaluatedAt));

    if (filters.limit) {
      query.limit(filters.limit);
    }

    return await query;
  }

  async updateComplianceViolation(id: number, updates: Partial<ComplianceMonitoring>): Promise<ComplianceMonitoring> {
    const [result] = await db
      .update(complianceMonitoring)
      .set(updates)
      .where(eq(complianceMonitoring.id, id))
      .returning();
    return result;
  }

  // Authentication & Authorization
  async createMFASettings(settings: InsertUserMFASettings): Promise<UserMFASettings> {
    const [result] = await db
      .insert(userMFASettings)
      .values(settings)
      .returning();
    return result;
  }

  async getUserMFASettings(userId: string): Promise<UserMFASettings | undefined> {
    const [result] = await db
      .select()
      .from(userMFASettings)
      .where(eq(userMFASettings.userId, userId));
    return result;
  }

  async updateMFASettings(userId: string, updates: Partial<UserMFASettings>): Promise<UserMFASettings> {
    const [result] = await db
      .update(userMFASettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userMFASettings.userId, userId))
      .returning();
    return result;
  }

  // SSO Configuration
  async createSSOConfiguration(config: InsertSSOConfiguration): Promise<SSOConfiguration> {
    const [result] = await db
      .insert(ssoConfigurations)
      .values(config)
      .returning();
    return result;
  }

  async getSSOConfigurations(domain?: string): Promise<SSOConfiguration[]> {
    if (domain) {
      return await db
        .select()
        .from(ssoConfigurations)
        .where(and(
          eq(ssoConfigurations.isActive, true),
          eq(ssoConfigurations.domain, domain)
        ))
        .orderBy(ssoConfigurations.isDefault, ssoConfigurations.name);
    }
    
    return await db
      .select()
      .from(ssoConfigurations)
      .where(eq(ssoConfigurations.isActive, true))
      .orderBy(ssoConfigurations.isDefault, ssoConfigurations.name);
  }

  async updateSSOConfiguration(id: number, updates: Partial<SSOConfiguration>): Promise<SSOConfiguration> {
    const [result] = await db
      .update(ssoConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ssoConfigurations.id, id))
      .returning();
    return result;
  }

  // Security Monitoring
  async logAPIAccess(log: InsertAPISecurityLog): Promise<APISecurityLog> {
    const [result] = await db
      .insert(apiSecurityLogs)
      .values(log)
      .returning();
    return result;
  }

  async logDocumentAccess(log: InsertDocumentAccessLog): Promise<DocumentAccessLog> {
    const [result] = await db
      .insert(documentAccessLogs)
      .values(log)
      .returning();
    return result;
  }

  async getDocumentAccessHistory(documentId: number, limit: number = 100): Promise<DocumentAccessLog[]> {
    return await db
      .select()
      .from(documentAccessLogs)
      .where(eq(documentAccessLogs.documentId, documentId))
      .orderBy(desc(documentAccessLogs.accessedAt))
      .limit(limit);
  }

  async getUserAccessHistory(userId: string, limit: number = 100): Promise<DocumentAccessLog[]> {
    return await db
      .select()
      .from(documentAccessLogs)
      .where(eq(documentAccessLogs.userId, userId))
      .orderBy(desc(documentAccessLogs.accessedAt))
      .limit(limit);
  }

  // Security Incidents
  async getSecurityIncidents(filters: { 
    severity?: string; 
    status?: string; 
    type?: string;
    limit?: number 
  }): Promise<SecurityIncident[]> {
    const conditions = [];
    
    if (filters.severity) {
      conditions.push(eq(securityIncidents.severity, filters.severity));
    }
    if (filters.status) {
      conditions.push(eq(securityIncidents.status, filters.status));
    }
    if (filters.type) {
      conditions.push(eq(securityIncidents.type, filters.type));
    }

    const query = db
      .select()
      .from(securityIncidents)
      .orderBy(desc(securityIncidents.detectedAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }

    return await query;
  }

  async createSecurityIncident(incident: InsertSecurityIncident): Promise<SecurityIncident> {
    const [result] = await db
      .insert(securityIncidents)
      .values(incident)
      .returning();
    return result;
  }

  async updateSecurityIncident(incidentId: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident> {
    const [result] = await db
      .update(securityIncidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(securityIncidents.incidentId, incidentId))
      .returning();
    return result;
  }

  // Security Policies
  async createSecurityPolicy(policy: InsertSecurityPolicy): Promise<SecurityPolicy> {
    const [result] = await db
      .insert(securityPolicies)
      .values(policy)
      .returning();
    return result;
  }

  async getSecurityPolicies(industry: string): Promise<SecurityPolicy[]> {
    return await db
      .select()
      .from(securityPolicies)
      .where(eq(securityPolicies.industry, industry))
      .orderBy(securityPolicies.version, desc(securityPolicies.createdAt));
  }

  async getActiveSecurityPolicies(industry: string): Promise<SecurityPolicy[]> {
    return await db
      .select()
      .from(securityPolicies)
      .where(and(
        eq(securityPolicies.industry, industry),
        eq(securityPolicies.isActive, true),
        lte(securityPolicies.effectiveFrom, new Date()),
        or(
          isNull(securityPolicies.effectiveTo),
          gte(securityPolicies.effectiveTo, new Date())
        )
      ))
      .orderBy(securityPolicies.version, desc(securityPolicies.createdAt));
  }

  async updateSecurityPolicy(id: number, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    const [result] = await db
      .update(securityPolicies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(securityPolicies.id, id))
      .returning();
    return result;
  }

  // Breach Notifications
  async createBreachNotification(notification: InsertBreachNotification): Promise<BreachNotification> {
    const [result] = await db
      .insert(breachNotifications)
      .values(notification)
      .returning();
    return result;
  }

  async getBreachNotifications(incidentId: string): Promise<BreachNotification[]> {
    return await db
      .select()
      .from(breachNotifications)
      .where(eq(breachNotifications.incidentId, incidentId))
      .orderBy(desc(breachNotifications.createdAt));
  }

  // =============================================================================
  // INTELLIGENT CUSTOMIZATION OPERATIONS IMPLEMENTATION
  // =============================================================================
  
  // User Onboarding Profile Operations
  async createOnboardingProfile(profile: InsertUserOnboardingProfile): Promise<UserOnboardingProfile> {
    const [result] = await db
      .insert(userOnboardingProfiles)
      .values(profile)
      .returning();
    return result;
  }

  async getOnboardingProfile(userId: string): Promise<UserOnboardingProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userOnboardingProfiles)
      .where(eq(userOnboardingProfiles.userId, userId));
    return profile;
  }

  async updateOnboardingProfile(userId: string, updates: Partial<UserOnboardingProfile>): Promise<UserOnboardingProfile> {
    const [result] = await db
      .update(userOnboardingProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userOnboardingProfiles.userId, userId))
      .returning();
    return result;
  }

  async completeOnboarding(userId: string): Promise<UserOnboardingProfile> {
    const [result] = await db
      .update(userOnboardingProfiles)
      .set({ 
        onboardingCompleted: true,
        updatedAt: new Date(),
        lastActive: new Date()
      })
      .where(eq(userOnboardingProfiles.userId, userId))
      .returning();
    return result;
  }
  
  // Behavior Pattern Operations
  async trackBehaviorPattern(pattern: InsertUserBehaviorPattern): Promise<UserBehaviorPattern> {
    const [result] = await db
      .insert(userBehaviorPatterns)
      .values(pattern)
      .returning();
    return result;
  }

  async getUserBehaviorPatterns(userId: string, limit: number = 100): Promise<UserBehaviorPattern[]> {
    return await db
      .select()
      .from(userBehaviorPatterns)
      .where(eq(userBehaviorPatterns.userId, userId))
      .orderBy(desc(userBehaviorPatterns.createdAt))
      .limit(limit);
  }

  async analyzeUserPatterns(userId: string, timeframeHours: number = 24): Promise<any> {
    const timeframe = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
    
    const patterns = await db
      .select()
      .from(userBehaviorPatterns)
      .where(and(
        eq(userBehaviorPatterns.userId, userId),
        gte(userBehaviorPatterns.createdAt, timeframe)
      ))
      .orderBy(desc(userBehaviorPatterns.createdAt));

    // Analyze patterns for insights
    const eventCounts: Record<string, number> = {};
    const documentTypeCounts: Record<string, number> = {};
    let totalTimeSpent = 0;
    let completedActions = 0;
    let abandonedActions = 0;

    patterns.forEach(pattern => {
      eventCounts[pattern.eventType] = (eventCounts[pattern.eventType] || 0) + 1;
      
      if (pattern.documentType) {
        documentTypeCounts[pattern.documentType] = (documentTypeCounts[pattern.documentType] || 0) + 1;
      }

      if (pattern.timeSpent) {
        totalTimeSpent += pattern.timeSpent;
      }

      if (pattern.completionStatus === 'completed') {
        completedActions++;
      } else if (pattern.completionStatus === 'abandoned') {
        abandonedActions++;
      }
    });

    return {
      totalPatterns: patterns.length,
      eventCounts,
      documentTypeCounts,
      totalTimeSpent,
      completedActions,
      abandonedActions,
      completionRate: patterns.length > 0 ? (completedActions / patterns.length) * 100 : 0,
      averageTimeSpent: patterns.length > 0 ? totalTimeSpent / patterns.length : 0,
      timeframe: timeframeHours
    };
  }
  
  // Document Recommendation Operations
  async createDocumentRecommendation(recommendation: InsertDocumentRecommendation): Promise<DocumentRecommendation> {
    const [result] = await db
      .insert(documentRecommendations)
      .values(recommendation)
      .returning();
    return result;
  }

  async getUserRecommendations(userId: string, active: boolean = true): Promise<DocumentRecommendation[]> {
    const conditions = [eq(documentRecommendations.userId, userId)];
    
    if (active) {
      conditions.push(
        eq(documentRecommendations.dismissed, false),
        eq(documentRecommendations.acted, false)
      );
    }

    return await db
      .select()
      .from(documentRecommendations)
      .where(and(...conditions))
      .orderBy(desc(documentRecommendations.priority), desc(documentRecommendations.createdAt));
  }

  async dismissRecommendation(recommendationId: number, userId: string): Promise<void> {
    await db
      .update(documentRecommendations)
      .set({ 
        dismissed: true,
        dismissedAt: new Date()
      })
      .where(and(
        eq(documentRecommendations.id, recommendationId),
        eq(documentRecommendations.userId, userId)
      ));
  }

  async actOnRecommendation(recommendationId: number, userId: string): Promise<void> {
    await db
      .update(documentRecommendations)
      .set({ 
        acted: true,
        actedAt: new Date()
      })
      .where(and(
        eq(documentRecommendations.id, recommendationId),
        eq(documentRecommendations.userId, userId)
      ));
  }
  
  // Contextual Guidance Operations
  async createContextualGuidance(guidance: InsertContextualGuidance): Promise<ContextualGuidance> {
    const [result] = await db
      .insert(contextualGuidance)
      .values(guidance)
      .returning();
    return result;
  }

  async getContextualGuidance(userId: string, pageContext: string): Promise<ContextualGuidance[]> {
    return await db
      .select()
      .from(contextualGuidance)
      .where(and(
        eq(contextualGuidance.userId, userId),
        eq(contextualGuidance.pageContext, pageContext),
        eq(contextualGuidance.dismissed, false)
      ))
      .orderBy(contextualGuidance.guidanceType);
  }

  async markGuidanceViewed(guidanceId: number, userId: string): Promise<void> {
    await db
      .update(contextualGuidance)
      .set({ 
        viewed: true,
        viewedAt: new Date()
      })
      .where(and(
        eq(contextualGuidance.id, guidanceId),
        eq(contextualGuidance.userId, userId)
      ));
  }

  async markGuidanceCompleted(guidanceId: number, userId: string): Promise<void> {
    await db
      .update(contextualGuidance)
      .set({ 
        completed: true,
        completedAt: new Date()
      })
      .where(and(
        eq(contextualGuidance.id, guidanceId),
        eq(contextualGuidance.userId, userId)
      ));
  }

  async rateGuidanceHelpfulness(guidanceId: number, userId: string, rating: number): Promise<void> {
    await db
      .update(contextualGuidance)
      .set({ 
        helpfulness: rating,
        interacted: true,
        interactedAt: new Date()
      })
      .where(and(
        eq(contextualGuidance.id, guidanceId),
        eq(contextualGuidance.userId, userId)
      ));
  }
  
  // AI Model Optimization Operations
  async createAIOptimization(optimization: InsertAIModelOptimization): Promise<AIModelOptimization> {
    const [result] = await db
      .insert(aiModelOptimizations)
      .values(optimization)
      .returning();
    return result;
  }

  async getAIOptimizations(userId?: string, industry?: string): Promise<AIModelOptimization[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(aiModelOptimizations.userId, userId));
    }
    
    if (industry) {
      conditions.push(eq(aiModelOptimizations.industry, industry));
    }

    conditions.push(eq(aiModelOptimizations.isActive, true));

    return await db
      .select()
      .from(aiModelOptimizations)
      .where(and(...conditions))
      .orderBy(desc(aiModelOptimizations.lastOptimized));
  }

  async updateAIOptimization(id: number, updates: Partial<AIModelOptimization>): Promise<AIModelOptimization> {
    const [result] = await db
      .update(aiModelOptimizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiModelOptimizations.id, id))
      .returning();
    return result;
  }
  
  // Smart Analytics Configuration Operations
  async createAnalyticsConfig(config: InsertSmartAnalyticsConfig): Promise<SmartAnalyticsConfig> {
    const [result] = await db
      .insert(smartAnalyticsConfigs)
      .values(config)
      .returning();
    return result;
  }

  async getUserAnalyticsConfigs(userId: string): Promise<SmartAnalyticsConfig[]> {
    return await db
      .select()
      .from(smartAnalyticsConfigs)
      .where(and(
        eq(smartAnalyticsConfigs.userId, userId),
        eq(smartAnalyticsConfigs.isActive, true)
      ))
      .orderBy(desc(smartAnalyticsConfigs.isDefault), desc(smartAnalyticsConfigs.createdAt));
  }

  async updateAnalyticsConfig(id: number, updates: Partial<SmartAnalyticsConfig>): Promise<SmartAnalyticsConfig> {
    const [result] = await db
      .update(smartAnalyticsConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smartAnalyticsConfigs.id, id))
      .returning();
    return result;
  }
  
  // Interface Adaptation Operations
  async createInterfaceAdaptation(adaptation: InsertInterfaceAdaptation): Promise<InterfaceAdaptation> {
    const [result] = await db
      .insert(interfaceAdaptations)
      .values(adaptation)
      .returning();
    return result;
  }

  async getInterfaceAdaptation(userId: string): Promise<InterfaceAdaptation | undefined> {
    const [adaptation] = await db
      .select()
      .from(interfaceAdaptations)
      .where(eq(interfaceAdaptations.userId, userId));
    return adaptation;
  }

  async updateInterfaceAdaptation(userId: string, updates: Partial<InterfaceAdaptation>): Promise<InterfaceAdaptation> {
    const [result] = await db
      .update(interfaceAdaptations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(interfaceAdaptations.userId, userId))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
