import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  real,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  industry: varchar("industry", { length: 50 }).notNull().default('general'),
  company: varchar("company", { length: 200 }),
  role: varchar("role", { length: 50 }).default('user'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Industry configurations
export const industryConfigurations = pgTable("industry_configurations", {
  id: serial("id").primaryKey(),
  industry: varchar("industry", { length: 50 }).notNull().unique(),
  configData: jsonb("config_data").notNull(),
  documentTypes: jsonb("document_types").notNull(),
  processingRules: jsonb("processing_rules").notNull(),
  uiCustomizations: jsonb("ui_customizations").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 50 }).notNull(),
  documentType: varchar("document_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default('uploaded'),
  processingProgress: integer("processing_progress").default(0),
  processingStage: varchar("processing_stage", { length: 100 }),
  processingMessage: text("processing_message"),
  ocrConfidence: real("ocr_confidence"),
  aiConfidence: real("ai_confidence"),
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document analysis results
export const documentAnalysis = pgTable("document_analysis", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  analysisType: varchar("analysis_type", { length: 100 }).notNull(),
  analysisData: jsonb("analysis_data").notNull(),
  confidenceScore: real("confidence_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Extracted entities
export const extractedEntities = pgTable("extracted_entities", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityValue: text("entity_value").notNull(),
  confidenceScore: real("confidence_score"),
  locationData: jsonb("location_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document processing jobs
export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default('pending'),
  progress: integer("progress").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertDocumentAnalysis = typeof documentAnalysis.$inferInsert;
export type DocumentAnalysis = typeof documentAnalysis.$inferSelect;

export type InsertExtractedEntity = typeof extractedEntities.$inferInsert;
export type ExtractedEntity = typeof extractedEntities.$inferSelect;

export type InsertProcessingJob = typeof processingJobs.$inferInsert;
export type ProcessingJob = typeof processingJobs.$inferSelect;

export type InsertIndustryConfiguration = typeof industryConfigurations.$inferInsert;
export type IndustryConfiguration = typeof industryConfigurations.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const industrySelectionSchema = z.object({
  industry: z.enum(['medical', 'legal', 'logistics', 'finance', 'general']),
  company: z.string().optional(),
});
