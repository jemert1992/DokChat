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

// User storage table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  googleId: varchar("google_id").unique(),
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

// Chat sessions for multi-document conversations
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  industry: varchar("industry", { length: 50 }).notNull(),
  documentIds: jsonb("document_ids").notNull(), // Array of document IDs
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table for document conversations
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id),
  documentId: integer("document_id").references(() => documents.id),
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

// OCR Cache for document deduplication and cost savings
export const ocrCache = pgTable("ocr_cache", {
  id: serial("id").primaryKey(),
  documentHash: varchar("document_hash", { length: 64 }).notNull().unique(),
  extractedText: text("extracted_text").notNull(),
  ocrConfidence: real("ocr_confidence").notNull(),
  pageCount: integer("page_count").notNull(),
  metadata: jsonb("metadata"),
  cacheHits: integer("cache_hits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Document classification results
export const documentClassifications = pgTable("document_classifications", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  complexity: varchar("complexity", { length: 20 }).notNull(),
  hasTable: boolean("has_table").default(false),
  hasChart: boolean("has_chart").default(false),
  hasHandwriting: boolean("has_handwriting").default(false),
  language: varchar("language", { length: 10 }).notNull(),
  pageCount: integer("page_count").notNull(),
  recommendedProcessor: varchar("recommended_processor", { length: 50 }).notNull(),
  confidence: real("confidence").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// API cost tracking
export const apiCostTracking = pgTable("api_cost_tracking", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  service: varchar("service", { length: 50 }).notNull(), // 'vision_api', 'gemini', 'claude', etc.
  operation: varchar("operation", { length: 50 }).notNull(), // 'ocr', 'analysis', 'classification', etc.
  costUsd: real("cost_usd").notNull(),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processing Metrics - Detailed page/section level tracking
export const processingMetrics = pgTable("processing_metrics", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  pageNumber: integer("page_number"),
  sectionName: varchar("section_name", { length: 255 }),
  processingMethod: varchar("processing_method", { length: 50 }).notNull(), // 'vision', 'sonnet', 'nlp', 'ocr'
  confidence: real("confidence").notNull(),
  textExtracted: integer("text_extracted"),
  errors: jsonb("errors"), // Array of error objects
  unresolvedFields: jsonb("unresolved_fields"), // Array of field names that couldn't be extracted
  processingTime: integer("processing_time"), // milliseconds
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processing Reports - AI-generated summaries
export const processingReports = pgTable("processing_reports", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // 'quality', 'error_summary', 'confidence_breakdown'
  overallConfidence: real("overall_confidence"),
  methodBreakdown: jsonb("method_breakdown"), // { vision: 0.95, sonnet: 0.92, nlp: 0.88, ocr: 0.75 }
  errorSummary: text("error_summary"), // AI-generated summary of all errors
  unresolvedFieldsSummary: text("unresolved_fields_summary"), // AI-generated summary of unresolved fields
  recommendations: jsonb("recommendations"), // AI suggestions for improvement
  pageMetrics: jsonb("page_metrics"), // Per-page confidence breakdown
  sectionMetrics: jsonb("section_metrics"), // Per-section confidence breakdown
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

export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertProcessingMetric = typeof processingMetrics.$inferInsert;
export type ProcessingMetric = typeof processingMetrics.$inferSelect;

export type InsertProcessingReport = typeof processingReports.$inferInsert;
export type ProcessingReport = typeof processingReports.$inferSelect;

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

// =============================================================================
// REAL-TIME COLLABORATION FEATURES (Task 11)
// =============================================================================

// Teams for workspace collaboration
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 50 }).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team membership with roles
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 50 }).default('member'), // owner, admin, editor, viewer, guest
  permissions: jsonb("permissions").default({}),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document sharing and permissions
export const documentShares = pgTable("document_shares", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  userId: varchar("user_id").references(() => users.id),
  sharedBy: varchar("shared_by").references(() => users.id).notNull(),
  sharedWithEmail: varchar("shared_with_email", { length: 255 }), // Email address for external sharing
  shareToken: varchar("share_token", { length: 255 }).unique(), // Unique token for share link
  accessLevel: varchar("access_level", { length: 50 }).default('view'), // view, comment, edit, manage
  permissions: jsonb("permissions").default({}),
  message: text("message"), // Optional message from sharer
  accessedAt: timestamp("accessed_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_share_document").on(table.documentId),
  index("idx_share_token").on(table.shareToken),
  index("idx_share_email").on(table.sharedWithEmail),
]);

// Document comments and annotations
export const documentComments = pgTable("document_comments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"), // for reply threading - self-reference handled later
  content: text("content").notNull(),
  commentType: varchar("comment_type", { length: 50 }).default('general'), // general, annotation, suggestion, issue
  position: jsonb("position"), // page, coordinates, text selection range
  metadata: jsonb("metadata").default({}),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  mentions: varchar("mentions").array(), // array of mentioned user IDs
  reactions: jsonb("reactions").default({}), // emoji reactions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document versions and revision history
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  changes: jsonb("changes").notNull(), // diff data
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"),
  metadata: jsonb("metadata").default({}),
  fileSnapshot: varchar("file_snapshot", { length: 500 }), // path to version file
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Active collaboration sessions and presence
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").notNull(), // WebSocket connection ID
  status: varchar("status", { length: 50 }).default('active'), // active, idle, disconnected
  activity: varchar("activity", { length: 50 }).default('viewing'), // viewing, editing, commenting
  cursorPosition: jsonb("cursor_position"), // current cursor location
  selection: jsonb("selection"), // current text selection
  metadata: jsonb("metadata").default({}),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document annotations and highlights
export const documentAnnotations = pgTable("document_annotations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  annotationType: varchar("annotation_type", { length: 50 }).notNull(), // highlight, note, bookmark, tag
  content: text("content"),
  position: jsonb("position").notNull(), // coordinates, page, text range
  style: jsonb("style").default({}), // color, opacity, etc.
  tags: varchar("tags").array(), // searchable tags
  isPrivate: boolean("is_private").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity logs for collaboration tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  teamId: integer("team_id").references(() => teams.id),
  activityType: varchar("activity_type", { length: 100 }).notNull(), // document_view, comment_add, share_document, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences and delivery
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // comment_mention, document_shared, team_invite, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}), // notification payload
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  deliveryMethod: varchar("delivery_method", { length: 50 }).default('in_app'), // in_app, email, webhook
  priority: varchar("priority", { length: 20 }).default('normal'), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaboration feature type exports
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type DocumentShare = typeof documentShares.$inferSelect;
export type InsertDocumentShare = typeof documentShares.$inferInsert;
export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = typeof documentComments.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = typeof collaborationSessions.$inferInsert;
export type DocumentAnnotation = typeof documentAnnotations.$inferSelect;
export type InsertDocumentAnnotation = typeof documentAnnotations.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// =============================================================================
// ADVANCED SECURITY & COMPLIANCE FRAMEWORK
// =============================================================================

// Roles and permissions for RBAC system
export const securityRoles = pgTable("security_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 50 }).notNull(),
  level: varchar("level", { length: 50 }).notNull(), // basic, standard, enterprise, executive
  permissions: jsonb("permissions").notNull().default('{}'),
  isSystemRole: boolean("is_system_role").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permission definitions
export const securityPermissions = pgTable("security_permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // document, user, team, system, compliance
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, share, audit
  industry: varchar("industry", { length: 50 }),
  complianceLevel: varchar("compliance_level", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User role assignments
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => securityRoles.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comprehensive audit logs
export const securityAuditLogs = pgTable("security_audit_logs", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  documentId: integer("document_id").references(() => documents.id),
  teamId: integer("team_id").references(() => teams.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  outcome: varchar("outcome", { length: 50 }).notNull(), // success, failure, warning
  severity: varchar("severity", { length: 20 }).default('info'), // low, info, warning, high, critical
  riskScore: integer("risk_score").default(0),
  complianceRelevant: boolean("compliance_relevant").default(false),
  industry: varchar("industry", { length: 50 }),
  eventData: jsonb("event_data").notNull().default('{}'),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id"),
  correlationId: varchar("correlation_id"),
  parentEventId: varchar("parent_event_id"),
  isSecurityEvent: boolean("is_security_event").default(false),
  isTamperProof: boolean("is_tamper_proof").default(false),
  checksum: varchar("checksum", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_document").on(table.documentId),
  index("idx_audit_event_type").on(table.eventType),
  index("idx_audit_created_at").on(table.createdAt),
  index("idx_audit_compliance").on(table.complianceRelevant),
  index("idx_audit_security").on(table.isSecurityEvent),
]);

// Document classification and encryption metadata
export const documentSecurity = pgTable("document_security", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull().unique(),
  classificationLevel: varchar("classification_level", { length: 50 }).notNull(), // public, internal, confidential, restricted, top_secret
  sensitivityTags: varchar("sensitivity_tags").array(),
  encryptionStatus: varchar("encryption_status", { length: 50 }).default('encrypted'),
  encryptionMethod: varchar("encryption_method", { length: 100 }),
  keyId: varchar("key_id", { length: 255 }),
  retentionPolicy: varchar("retention_policy", { length: 100 }),
  retentionPeriodDays: integer("retention_period_days"),
  destructionDate: timestamp("destruction_date"),
  complianceLabels: varchar("compliance_labels").array(),
  accessRestrictions: jsonb("access_restrictions").default('{}'),
  watermarkData: jsonb("watermark_data").default('{}'),
  dlpPolicies: varchar("dlp_policies").array(),
  isRedacted: boolean("is_redacted").default(false),
  redactionReason: text("redaction_reason"),
  originalHash: varchar("original_hash", { length: 255 }),
  currentHash: varchar("current_hash", { length: 255 }),
  integrityVerified: boolean("integrity_verified").default(true),
  lastIntegrityCheck: timestamp("last_integrity_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance rules engine
export const complianceRules = pgTable("compliance_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 50 }).notNull(),
  standard: varchar("standard", { length: 100 }).notNull(), // HIPAA, SOX, GDPR, etc.
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // access_control, data_retention, audit_requirement
  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high, critical
  conditions: jsonb("conditions").notNull(),
  actions: jsonb("actions").notNull(),
  violations: jsonb("violations").default('{}'),
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  lastEvaluated: timestamp("last_evaluated"),
  evaluationCount: integer("evaluation_count").default(0),
  violationCount: integer("violation_count").default(0),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance monitoring results
export const complianceMonitoring = pgTable("compliance_monitoring", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => complianceRules.id).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  userId: varchar("user_id").references(() => users.id),
  evaluationResult: varchar("evaluation_result", { length: 50 }).notNull(), // compliant, non_compliant, warning, error
  violationType: varchar("violation_type", { length: 100 }),
  violationSeverity: varchar("violation_severity", { length: 20 }),
  violationDetails: jsonb("violation_details").default('{}'),
  remediation: jsonb("remediation").default('{}'),
  remediationStatus: varchar("remediation_status", { length: 50 }).default('pending'),
  alertSent: boolean("alert_sent").default(false),
  alertLevel: varchar("alert_level", { length: 20 }),
  reportedTo: varchar("reported_to").array(),
  evaluatedAt: timestamp("evaluated_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_compliance_rule").on(table.ruleId),
  index("idx_compliance_document").on(table.documentId),
  index("idx_compliance_result").on(table.evaluationResult),
  index("idx_compliance_evaluated").on(table.evaluatedAt),
]);

// Multi-factor authentication settings
export const userMFASettings = pgTable("user_mfa_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  isEnabled: boolean("is_enabled").default(false),
  methods: jsonb("methods").default('{}'), // TOTP, SMS, email, hardware_key
  backupCodes: varchar("backup_codes").array(),
  recoveryEmail: varchar("recovery_email"),
  phoneNumber: varchar("phone_number"),
  totpSecret: varchar("totp_secret"),
  lastUsedMethod: varchar("last_used_method"),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  enforcedByPolicy: boolean("enforced_by_policy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SSO configuration
export const ssoConfigurations = pgTable("sso_configurations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(), // SAML, OIDC, OAuth
  domain: varchar("domain", { length: 255 }),
  industry: varchar("industry", { length: 50 }),
  configuration: jsonb("configuration").notNull(),
  metadata: jsonb("metadata").default('{}'),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API security monitoring
export const apiSecurityLogs = pgTable("api_security_logs", {
  id: serial("id").primaryKey(),
  apiKeyId: varchar("api_key_id"),
  userId: varchar("user_id").references(() => users.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"),
  requestSize: integer("request_size"),
  responseSize: integer("response_size"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  rateLimitHit: boolean("rate_limit_hit").default(false),
  suspiciousActivity: boolean("suspicious_activity").default(false),
  securityFlags: varchar("security_flags").array(),
  requestPayload: jsonb("request_payload"),
  errorDetails: jsonb("error_details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_api_endpoint").on(table.endpoint),
  index("idx_api_user").on(table.userId),
  index("idx_api_created").on(table.createdAt),
  index("idx_api_suspicious").on(table.suspiciousActivity),
]);

// Security policies
export const securityPolicies = pgTable("security_policies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 50 }).notNull(),
  policyType: varchar("policy_type", { length: 100 }).notNull(), // password, session, access, data_handling
  rules: jsonb("rules").notNull(),
  enforcement: varchar("enforcement", { length: 50 }).default('warn'), // warn, block, audit
  applicableRoles: varchar("applicable_roles").array(),
  exceptions: jsonb("exceptions").default('{}'),
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document access tracking
export const documentAccessLogs = pgTable("document_access_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accessType: varchar("access_type", { length: 50 }).notNull(), // view, download, edit, share, delete
  accessMethod: varchar("access_method", { length: 50 }), // web, api, mobile
  duration: integer("duration"), // in seconds
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location"),
  deviceInfo: jsonb("device_info"),
  wasAuthorized: boolean("was_authorized").default(true),
  authorizationMethod: varchar("authorization_method", { length: 100 }),
  complianceFlags: varchar("compliance_flags").array(),
  sensitiveDataAccessed: boolean("sensitive_data_accessed").default(false),
  redactionApplied: boolean("redaction_applied").default(false),
  watermarkApplied: boolean("watermark_applied").default(false),
  accessedAt: timestamp("accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_doc_access_document").on(table.documentId),
  index("idx_doc_access_user").on(table.userId),
  index("idx_doc_access_type").on(table.accessType),
  index("idx_doc_access_time").on(table.accessedAt),
]);

// Security incidents and threats
export const securityIncidents = pgTable("security_incidents", {
  id: serial("id").primaryKey(),
  incidentId: varchar("incident_id").notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(), // unauthorized_access, data_breach, malware, phishing
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  status: varchar("status", { length: 50 }).default('open'), // open, investigating, contained, resolved
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  affectedUsers: varchar("affected_users").array(),
  affectedDocuments: integer("affected_documents").array(),
  detectionMethod: varchar("detection_method", { length: 100 }),
  detectedAt: timestamp("detected_at").notNull(),
  containedAt: timestamp("contained_at"),
  resolvedAt: timestamp("resolved_at"),
  investigator: varchar("investigator").references(() => users.id),
  impactAssessment: jsonb("impact_assessment").default('{}'),
  remediationSteps: jsonb("remediation_steps").default('{}'),
  notificationsSent: jsonb("notifications_sent").default('{}'),
  regulatoryReported: boolean("regulatory_reported").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data breach notifications
export const breachNotifications = pgTable("breach_notifications", {
  id: serial("id").primaryKey(),
  incidentId: varchar("incident_id").references(() => securityIncidents.incidentId).notNull(),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // regulatory, customer, internal
  recipient: varchar("recipient", { length: 255 }).notNull(),
  recipientType: varchar("recipient_type", { length: 50 }).notNull(), // regulator, customer, employee
  notificationMethod: varchar("notification_method", { length: 50 }), // email, mail, website
  content: text("content").notNull(),
  sentAt: timestamp("sent_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  isRequired: boolean("is_required").default(true),
  timelineMet: boolean("timeline_met").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security framework type exports
export type SecurityRole = typeof securityRoles.$inferSelect;
export type InsertSecurityRole = typeof securityRoles.$inferInsert;
export type SecurityPermission = typeof securityPermissions.$inferSelect;
export type InsertSecurityPermission = typeof securityPermissions.$inferInsert;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = typeof userRoleAssignments.$inferInsert;
export type SecurityAuditLog = typeof securityAuditLogs.$inferSelect;
export type InsertSecurityAuditLog = typeof securityAuditLogs.$inferInsert;
export type DocumentSecurity = typeof documentSecurity.$inferSelect;
export type InsertDocumentSecurity = typeof documentSecurity.$inferInsert;
export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = typeof complianceRules.$inferInsert;
export type ComplianceMonitoring = typeof complianceMonitoring.$inferSelect;
export type InsertComplianceMonitoring = typeof complianceMonitoring.$inferInsert;
export type UserMFASettings = typeof userMFASettings.$inferSelect;
export type InsertUserMFASettings = typeof userMFASettings.$inferInsert;
export type SSOConfiguration = typeof ssoConfigurations.$inferSelect;
export type InsertSSOConfiguration = typeof ssoConfigurations.$inferInsert;
export type APISecurityLog = typeof apiSecurityLogs.$inferSelect;
export type InsertAPISecurityLog = typeof apiSecurityLogs.$inferInsert;
export type SecurityPolicy = typeof securityPolicies.$inferSelect;
export type InsertSecurityPolicy = typeof securityPolicies.$inferInsert;
export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type InsertDocumentAccessLog = typeof documentAccessLogs.$inferInsert;
export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = typeof securityIncidents.$inferInsert;
export type BreachNotification = typeof breachNotifications.$inferSelect;
export type InsertBreachNotification = typeof breachNotifications.$inferInsert;

// =============================================================================
// INDUSTRY-INTELLIGENT CUSTOMIZATION TABLES
// =============================================================================

// User onboarding profiles for smart customization
export const userOnboardingProfiles = pgTable("user_onboarding_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  industrySpecificRole: varchar("industry_specific_role", { length: 100 }),
  organizationSize: varchar("organization_size", { length: 50 }), // small, medium, large, enterprise
  documentVolume: varchar("document_volume", { length: 50 }), // low, medium, high, very_high
  primaryUseCases: varchar("primary_use_cases").array(),
  complianceRequirements: varchar("compliance_requirements").array(),
  integrationNeeds: varchar("integration_needs").array(),
  experienceLevel: varchar("experience_level", { length: 50 }), // beginner, intermediate, advanced, expert
  preferredWorkflow: varchar("preferred_workflow", { length: 50 }), // batch, real_time, hybrid
  priorityFeatures: varchar("priority_features").array(),
  painPoints: varchar("pain_points").array(),
  successMetrics: varchar("success_metrics").array(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(1),
  lastActive: timestamp("last_active").defaultNow(),
  preferences: jsonb("preferences").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User behavior tracking for adaptive intelligence
export const userBehaviorPatterns = pgTable("user_behavior_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 100 }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // upload, analyze, download, chat, etc.
  eventDetails: jsonb("event_details").default('{}'),
  documentType: varchar("document_type", { length: 100 }),
  timeSpent: integer("time_spent"), // seconds
  actionSequence: varchar("action_sequence").array(),
  completionStatus: varchar("completion_status", { length: 50 }), // completed, abandoned, error
  frustrationIndicators: varchar("frustration_indicators").array(),
  successIndicators: varchar("success_indicators").array(),
  contextualData: jsonb("contextual_data").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_behavior_user").on(table.userId),
  index("idx_behavior_event").on(table.eventType),
  index("idx_behavior_document").on(table.documentType),
  index("idx_behavior_time").on(table.createdAt),
]);

// Industry-specific document recommendations
export const documentRecommendations = pgTable("document_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  industry: varchar("industry", { length: 50 }).notNull(),
  recommendationType: varchar("recommendation_type", { length: 100 }).notNull(), // upload_suggestion, analysis_type, workflow_optimization
  documentType: varchar("document_type", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(),
  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high, urgent
  relevanceScore: real("relevance_score").default(0.5),
  actionRequired: boolean("action_required").default(false),
  dismissed: boolean("dismissed").default(false),
  acted: boolean("acted").default(false),
  contextualData: jsonb("contextual_data").default('{}'),
  expiresAt: timestamp("expires_at"),
  dismissedAt: timestamp("dismissed_at"),
  actedAt: timestamp("acted_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_recommendations_user").on(table.userId),
  index("idx_recommendations_industry").on(table.industry),
  index("idx_recommendations_priority").on(table.priority),
  index("idx_recommendations_active").on(table.dismissed, table.acted),
]);

// Contextual help and guidance tracking
export const contextualGuidance = pgTable("contextual_guidance", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  guidanceType: varchar("guidance_type", { length: 100 }).notNull(), // tooltip, help_card, tutorial, suggestion
  pageContext: varchar("page_context", { length: 100 }).notNull(),
  elementContext: varchar("element_context", { length: 200 }),
  industrySpecific: boolean("industry_specific").default(true),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  actionSuggested: varchar("action_suggested", { length: 500 }),
  helpfulness: integer("helpfulness"), // 1-5 rating
  viewed: boolean("viewed").default(false),
  interacted: boolean("interacted").default(false),
  completed: boolean("completed").default(false),
  dismissed: boolean("dismissed").default(false),
  viewedAt: timestamp("viewed_at"),
  interactedAt: timestamp("interacted_at"),
  completedAt: timestamp("completed_at"),
  dismissedAt: timestamp("dismissed_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_guidance_user").on(table.userId),
  index("idx_guidance_context").on(table.pageContext),
  index("idx_guidance_type").on(table.guidanceType),
]);

// AI model optimization settings per industry/user
export const aiModelOptimizations = pgTable("ai_model_optimizations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  industry: varchar("industry", { length: 50 }).notNull(),
  documentType: varchar("document_type", { length: 100 }),
  modelType: varchar("model_type", { length: 50 }).notNull(), // ocr, nlp, classification, extraction
  optimizationLevel: varchar("optimization_level", { length: 50 }).default('standard'), // basic, standard, advanced, custom
  confidenceThreshold: real("confidence_threshold").default(0.7),
  customPrompts: jsonb("custom_prompts").default('{}'),
  processingPreferences: jsonb("processing_preferences").default('{}'),
  accuracyWeighting: real("accuracy_weighting").default(0.8),
  speedWeighting: real("speed_weighting").default(0.2),
  costWeighting: real("cost_weighting").default(0.1),
  complianceMode: boolean("compliance_mode").default(false),
  retentionPolicy: varchar("retention_policy", { length: 100 }),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  lastOptimized: timestamp("last_optimized"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_opt_industry").on(table.industry),
  index("idx_ai_opt_user").on(table.userId),
  index("idx_ai_opt_document_type").on(table.documentType),
]);

// Smart analytics configurations
export const smartAnalyticsConfigs = pgTable("smart_analytics_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  industry: varchar("industry", { length: 50 }).notNull(),
  configName: varchar("config_name", { length: 200 }).notNull(),
  dashboardLayout: jsonb("dashboard_layout").default('{}'),
  preferredMetrics: varchar("preferred_metrics").array(),
  alertThresholds: jsonb("alert_thresholds").default('{}'),
  reportingFrequency: varchar("reporting_frequency", { length: 50 }).default('weekly'),
  complianceTracking: jsonb("compliance_tracking").default('{}'),
  customKPIs: jsonb("custom_kpis").default('{}'),
  visualizationPreferences: jsonb("visualization_preferences").default('{}'),
  dataRetentionSettings: jsonb("data_retention_settings").default('{}'),
  sharingSettings: jsonb("sharing_settings").default('{}'),
  automationRules: jsonb("automation_rules").default('{}'),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_analytics_user").on(table.userId),
  index("idx_analytics_industry").on(table.industry),
]);

// Interface adaptation settings
export const interfaceAdaptations = pgTable("interface_adaptations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  industry: varchar("industry", { length: 50 }).notNull(),
  adaptationLevel: varchar("adaptation_level", { length: 50 }).default('medium'), // minimal, medium, aggressive, expert
  hiddenFeatures: varchar("hidden_features").array(),
  emphasizedFeatures: varchar("emphasized_features").array(),
  customTerminology: jsonb("custom_terminology").default('{}'),
  layoutPreferences: jsonb("layout_preferences").default('{}'),
  colorSchemeOverrides: jsonb("color_scheme_overrides").default('{}'),
  accessibilitySettings: jsonb("accessibility_settings").default('{}'),
  workflowShortcuts: jsonb("workflow_shortcuts").default('{}'),
  notificationPreferences: jsonb("notification_preferences").default('{}'),
  automationLevel: varchar("automation_level", { length: 50 }).default('medium'), // minimal, medium, high, full
  learningMode: boolean("learning_mode").default(true),
  lastAdaptation: timestamp("last_adaptation"),
  adaptationScore: real("adaptation_score").default(0.5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verification results for auto-QA second-pass validation
export const verificationResults = pgTable("verification_results", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  originalExtraction: jsonb("original_extraction").notNull(),
  verifiedExtraction: jsonb("verified_extraction").notNull(),
  discrepancies: jsonb("discrepancies").default('[]'),
  uncertaintyScore: real("uncertainty_score").notNull(),
  needsManualReview: boolean("needs_manual_review").default(false),
  reviewReason: text("review_reason"),
  verificationModel: varchar("verification_model", { length: 50 }).default('claude-sonnet-4-verification'),
  crossCheckModel: varchar("cross_check_model", { length: 50 }),
  verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_verification_document").on(table.documentId),
  index("idx_verification_status").on(table.verificationStatus),
  index("idx_verification_manual_review").on(table.needsManualReview),
]);

// Decision logs for Sonnet's reasoning trail
export const decisionLogs = pgTable("decision_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  verificationId: integer("verification_id").references(() => verificationResults.id),
  stage: varchar("stage", { length: 100 }).notNull(),
  decision: text("decision").notNull(),
  reasoning: text("reasoning").notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  confidence: real("confidence"),
  modelUsed: varchar("model_used", { length: 50 }).notNull(),
  processingTime: integer("processing_time"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_decision_document").on(table.documentId),
  index("idx_decision_stage").on(table.stage),
  index("idx_decision_verification").on(table.verificationId),
]);

// Type exports for intelligent customization
export type UserOnboardingProfile = typeof userOnboardingProfiles.$inferSelect;
export type InsertUserOnboardingProfile = typeof userOnboardingProfiles.$inferInsert;
export type UserBehaviorPattern = typeof userBehaviorPatterns.$inferSelect;
export type InsertUserBehaviorPattern = typeof userBehaviorPatterns.$inferInsert;
export type DocumentRecommendation = typeof documentRecommendations.$inferSelect;
export type InsertDocumentRecommendation = typeof documentRecommendations.$inferInsert;
export type ContextualGuidance = typeof contextualGuidance.$inferSelect;
export type InsertContextualGuidance = typeof contextualGuidance.$inferInsert;
export type AIModelOptimization = typeof aiModelOptimizations.$inferSelect;
export type InsertAIModelOptimization = typeof aiModelOptimizations.$inferInsert;
export type SmartAnalyticsConfig = typeof smartAnalyticsConfigs.$inferSelect;
export type InsertSmartAnalyticsConfig = typeof smartAnalyticsConfigs.$inferInsert;
export type InterfaceAdaptation = typeof interfaceAdaptations.$inferSelect;
export type InsertInterfaceAdaptation = typeof interfaceAdaptations.$inferInsert;

// Type exports for verification and decision logging
export type VerificationResult = typeof verificationResults.$inferSelect;
export type InsertVerificationResult = typeof verificationResults.$inferInsert;
export type DecisionLog = typeof decisionLogs.$inferSelect;
export type InsertDecisionLog = typeof decisionLogs.$inferInsert;
