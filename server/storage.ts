import {
  users,
  documents,
  documentAnalysis,
  extractedEntities,
  processingJobs,
  industryConfigurations,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, asc, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserIndustry(userId: string, industry: string, company?: string): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
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
  
  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(documentId: number, limit?: number): Promise<ChatMessage[]>;
  clearChatHistory(documentId: number): Promise<void>;
  
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
  getDocumentShares(documentId: number): Promise<DocumentShare[]>;
  getUserDocumentShares(userId: string): Promise<DocumentShare[]>;
  updateDocumentShare(id: number, updates: Partial<DocumentShare>): Promise<DocumentShare>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
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
    const [result] = await db
      .insert(documentComments)
      .values(comment)
      .returning();
    return result;
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
        )
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
}

export const storage = new DatabaseStorage();
