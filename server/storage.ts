import {
  users,
  documents,
  documentAnalysis,
  extractedEntities,
  processingJobs,
  industryConfigurations,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserIndustry(userId: string, industry: string, company?: string): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getUserDocuments(userId: string, limit?: number): Promise<Document[]>;
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

  async getUserDocuments(userId: string, limit: number = 50): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit);
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
}

export const storage = new DatabaseStorage();
