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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
