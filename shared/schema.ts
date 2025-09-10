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

// Chat messages table for document conversations
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  confidence: real("confidence"),
  model: varchar("model", { length: 20 }), // 'openai' or 'gemini'
  createdAt: timestamp("created_at").defaultNow(),
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

// Medical Industry Tables
export const medicalDocuments = pgTable("medical_documents", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  patientMrn: varchar("patient_mrn", { length: 50 }),
  phiDetected: boolean("phi_detected").default(false),
  clinicalSignificance: varchar("clinical_significance", { length: 20 }),
  hipaaCompliant: boolean("hipaa_compliant").default(true),
  providerId: varchar("provider_id", { length: 50 }),
  facilityId: varchar("facility_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalEntities = pgTable("medical_entities", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // medication, diagnosis, procedure, etc.
  entityValue: text("entity_value").notNull(),
  medicalCode: varchar("medical_code", { length: 50 }), // ICD-10, CPT, etc.
  confidenceScore: real("confidence_score"),
  clinicalContext: text("clinical_context"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patientSummaries = pgTable("patient_summaries", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  patientDemographics: jsonb("patient_demographics"),
  medicalHistory: jsonb("medical_history"),
  currentMedications: jsonb("current_medications"),
  allergies: jsonb("allergies"),
  vitalSigns: jsonb("vital_signs"),
  clinicalNotes: text("clinical_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legal Industry Tables
export const legalDocuments = pgTable("legal_documents", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  caseNumber: varchar("case_number", { length: 100 }),
  privilegeLevel: varchar("privilege_level", { length: 50 }).default('attorney_client'),
  legalSignificance: varchar("legal_significance", { length: 20 }),
  confidentialityLevel: varchar("confidentiality_level", { length: 50 }).default('confidential'),
  jurisdiction: varchar("jurisdiction", { length: 100 }),
  practiceArea: varchar("practice_area", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractAnalysis = pgTable("contract_analysis", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  contractType: varchar("contract_type", { length: 100 }),
  parties: jsonb("parties"),
  keyTerms: jsonb("key_terms"),
  obligations: jsonb("obligations"),
  importantDates: jsonb("important_dates"),
  governingLaw: varchar("governing_law", { length: 100 }),
  riskScore: real("risk_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const legalEntities = pgTable("legal_entities", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // party, court, statute, case_citation
  entityValue: text("entity_value").notNull(),
  legalContext: text("legal_context"),
  jurisdiction: varchar("jurisdiction", { length: 100 }),
  confidenceScore: real("confidence_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Logistics Industry Tables
export const logisticsDocuments = pgTable("logistics_documents", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  shipmentId: varchar("shipment_id", { length: 100 }),
  originCountry: varchar("origin_country", { length: 50 }),
  destinationCountry: varchar("destination_country", { length: 50 }),
  carrier: varchar("carrier", { length: 100 }),
  customsStatus: varchar("customs_status", { length: 50 }).default('pending'),
  complianceVerified: boolean("compliance_verified").default(false),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shipmentData = pgTable("shipment_data", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  shipperInfo: jsonb("shipper_info"),
  consigneeInfo: jsonb("consignee_info"),
  cargoDetails: jsonb("cargo_details"),
  shippingTerms: jsonb("shipping_terms"),
  customsInfo: jsonb("customs_info"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customsCompliance = pgTable("customs_compliance", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  hsCode: varchar("hs_code", { length: 20 }),
  dutyRate: real("duty_rate"),
  taxAmount: real("tax_amount"),
  complianceStatus: varchar("compliance_status", { length: 50 }).default('pending'),
  regulatoryFlags: jsonb("regulatory_flags"),
  certifications: jsonb("certifications"),
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

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Medical Industry Types
export type InsertMedicalDocument = typeof medicalDocuments.$inferInsert;
export type MedicalDocument = typeof medicalDocuments.$inferSelect;

export type InsertMedicalEntity = typeof medicalEntities.$inferInsert;
export type MedicalEntity = typeof medicalEntities.$inferSelect;

export type InsertPatientSummary = typeof patientSummaries.$inferInsert;
export type PatientSummary = typeof patientSummaries.$inferSelect;

// Legal Industry Types
export type InsertLegalDocument = typeof legalDocuments.$inferInsert;
export type LegalDocument = typeof legalDocuments.$inferSelect;

export type InsertContractAnalysis = typeof contractAnalysis.$inferInsert;
export type ContractAnalysis = typeof contractAnalysis.$inferSelect;

export type InsertLegalEntity = typeof legalEntities.$inferInsert;
export type LegalEntity = typeof legalEntities.$inferSelect;

// Logistics Industry Types
export type InsertLogisticsDocument = typeof logisticsDocuments.$inferInsert;
export type LogisticsDocument = typeof logisticsDocuments.$inferSelect;

export type InsertShipmentData = typeof shipmentData.$inferInsert;
export type ShipmentData = typeof shipmentData.$inferSelect;

export type InsertCustomsCompliance = typeof customsCompliance.$inferInsert;
export type CustomsCompliance = typeof customsCompliance.$inferSelect;

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
  industry: z.enum(['medical', 'legal', 'logistics', 'finance', 'real_estate', 'general']),
  company: z.string().optional(),
});

// Dashboard Analytics Types
export interface DashboardStats {
  documentsProcessed: number;
  avgConfidence: number;
  avgProcessingTime: number;
  complianceScore: number;
}

export interface ComplianceAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  documentId?: number;
  timestamp?: string;
}

export interface IndustryAnalytics {
  industryBreakdown: Record<string, number>;
  documentTypeDistribution: Record<string, number>;
  processingTimeByIndustry: Record<string, number>;
  complianceMetrics: Record<string, number>;
  errorRates: Record<string, number>;
  languageDistribution: Record<string, number>;
  volumeTrends: Array<{
    date: string;
    volume: number;
    avgProcessingTime: number;
  }>;
}

export interface MedicalAnalytics extends IndustryAnalytics {
  hipaaCompliantDocs: number;
  phiDetectionRate: number;
  clinicalAccuracy: number;
  patientRecordsProcessed: number;
  criticalAlerts: ComplianceAlert[];
  medicalEntities: {
    medications: number;
    diagnoses: number;
    procedures: number;
    allergies: number;
    vitalSigns: number;
  };
}

export interface LegalAnalytics extends IndustryAnalytics {
  contractsReviewed: number;
  privilegeProtection: number;
  citationAccuracy: number;
  contractRisks: Array<{
    contract: string;
    risk: 'Low' | 'Medium' | 'High';
    issues: string[];
  }>;
  privilegeAlerts: ComplianceAlert[];
  legalEntities: {
    parties: number;
    caseCitations: number;
    statutes: number;
    contractTerms: number;
    obligations: number;
  };
}

export interface LogisticsAnalytics extends IndustryAnalytics {
  shipmentsProcessed: number;
  customsAccuracy: number;
  multiLanguageOCR: number;
  tradeCompliance: number;
  customsAlerts: ComplianceAlert[];
  shipmentStatus: Array<{
    id: string;
    origin: string;
    destination: string;
    status: string;
    eta: string;
  }>;
  logisticsEntities: {
    shipments: number;
    hsCodes: number;
    certificates: number;
    carriers: number;
    ports: number;
  };
}

export interface FinanceAnalytics extends IndustryAnalytics {
  documentsAnalyzed: number;
  fraudDetectionRate: number;
  riskAssessment: number;
  portfolioAnalysis: Array<{
    category: string;
    processed: number;
    approved: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  }>;
  riskAlerts: ComplianceAlert[];
  financialEntities: {
    transactions: number;
    accounts: number;
    institutions: number;
    riskIndicators: number;
    complianceFlags: number;
  };
  riskMetrics: {
    creditRisk: number;
    operationalRisk: number;
    marketRisk: number;
    liquidityRisk: number;
  };
  complianceMetrics: {
    soxCompliance: number;
    pciDssCompliance: number;
    gdprCompliance: number;
    baselIIICompliance: number;
  };
}

export interface RealEstateAnalytics extends IndustryAnalytics {
  transactionsProcessed: number;
  contractAccuracy: number;
  complianceAlerts: ComplianceAlert[];
  activeTransactions: Array<{
    address: string;
    type: 'Purchase' | 'Sale' | 'Lease';
    status: string;
    closing: string;
    value: string;
  }>;
  realEstateEntities: {
    properties: number;
    buyers: number;
    sellers: number;
    agents: number;
    lenders: number;
  };
  complianceMetrics: {
    fairHousingCompliance: number;
    respaCompliance: number;
    tridCompliance: number;
    stateRegCompliance: number;
  };
}

// Zod schemas for dashboard analytics validation
export const dashboardStatsSchema = z.object({
  documentsProcessed: z.number(),
  avgConfidence: z.number(),
  avgProcessingTime: z.number(),
  complianceScore: z.number(),
});

export const complianceAlertSchema = z.object({
  type: z.string(),
  message: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  documentId: z.number().optional(),
  timestamp: z.string().optional(),
});

// Medical Analytics Validation Schema
export const medicalAnalyticsSchema = z.object({
  processed: z.number(),
  avgProcessingTime: z.number(),
  avgConfidence: z.number(),
  hipaaCompliantDocs: z.number(),
  phiDetectionRate: z.number(),
  clinicalAccuracy: z.number(),
  patientRecordsProcessed: z.number(),
  criticalAlerts: z.array(complianceAlertSchema),
  medicalEntities: z.object({
    medications: z.number(),
    diagnoses: z.number(),
    procedures: z.number(),
    allergies: z.number(),
    vitalSigns: z.number(),
  }),
  qualityMetrics: z.object({
    phiAccuracy: z.number(),
    codingAccuracy: z.number(),
    documentCompleteness: z.number(),
    clinicalRelevance: z.number(),
  }),
  complianceMetrics: z.object({
    hipaaCompliance: z.number(),
    hitech: z.number(),
    fdaCompliance: z.number(),
    hl7Compliance: z.number(),
  }),
});

// Legal Analytics Validation Schema
export const legalAnalyticsSchema = z.object({
  processed: z.number(),
  avgProcessingTime: z.number(),
  avgConfidence: z.number(),
  contractsReviewed: z.number(),
  privilegeProtection: z.number(),
  citationAccuracy: z.number(),
  contractRisks: z.array(z.object({
    contract: z.string(),
    risk: z.enum(['Low', 'Medium', 'High']),
    issues: z.array(z.string()),
  })),
  privilegeAlerts: z.array(complianceAlertSchema),
  legalEntities: z.object({
    parties: z.number(),
    caseCitations: z.number(),
    statutes: z.number(),
    contractTerms: z.number(),
    obligations: z.number(),
  }),
});

// Finance Analytics Validation Schema
export const financeAnalyticsSchema = z.object({
  processed: z.number(),
  avgProcessingTime: z.number(),
  avgConfidence: z.number(),
  documentsAnalyzed: z.number(),
  fraudDetectionRate: z.number(),
  riskAssessment: z.number(),
  portfolioAnalysis: z.array(z.object({
    category: z.string(),
    processed: z.number(),
    approved: z.number(),
    riskLevel: z.enum(['Low', 'Medium', 'High']),
  })),
  riskAlerts: z.array(complianceAlertSchema),
  financialEntities: z.object({
    transactions: z.number(),
    accounts: z.number(),
    institutions: z.number(),
    riskIndicators: z.number(),
    complianceFlags: z.number(),
  }),
  riskMetrics: z.object({
    creditRisk: z.number(),
    operationalRisk: z.number(),
    marketRisk: z.number(),
    liquidityRisk: z.number(),
  }),
  complianceMetrics: z.object({
    soxCompliance: z.number(),
    pciDssCompliance: z.number(),
    gdprCompliance: z.number(),
    baselIIICompliance: z.number(),
  }),
});

// Logistics Analytics Validation Schema
export const logisticsAnalyticsSchema = z.object({
  processed: z.number(),
  avgProcessingTime: z.number(),
  avgConfidence: z.number(),
  shipmentsTracked: z.number(),
  customsCompliance: z.number(),
  deliveryAccuracy: z.number(),
  customsAlerts: z.array(complianceAlertSchema),
  logisticsEntities: z.object({
    shipments: z.number(),
    consignees: z.number(),
    hsCodes: z.number(),
    transportModes: z.number(),
    destinations: z.number(),
  }),
});

// Real Estate Analytics Validation Schema
export const realEstateAnalyticsSchema = z.object({
  processed: z.number(),
  avgProcessingTime: z.number(),
  avgConfidence: z.number(),
  dealsProcessed: z.number(),
  titleAccuracy: z.number(),
  complianceRate: z.number(),
  complianceAlerts: z.array(complianceAlertSchema),
  realEstateEntities: z.object({
    properties: z.number(),
    mortgages: z.number(),
    buyers: z.number(),
    sellers: z.number(),
    legalDescriptions: z.number(),
  }),
});
