import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import { DocumentProcessor } from "./services/documentProcessor";
import { WebSocketService } from "./services/websocketService";
import { IndustryConfigService } from "./services/industryConfig";
import { industrySelectionSchema } from "@shared/schema";
import { randomUUID } from "crypto";

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueName = `${randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Create HTTP server first
  const httpServer = createServer(app);
  
  // Initialize services with server
  const websocketService = new WebSocketService(httpServer);
  const documentProcessor = new DocumentProcessor(websocketService);
  const industryConfigService = new IndustryConfigService();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Industry selection route
  app.put('/api/user/industry', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = industrySelectionSchema.parse(req.body);
      
      const user = await storage.updateUserIndustry(
        userId,
        validatedData.industry,
        validatedData.company
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user industry:", error);
      res.status(400).json({ message: "Invalid industry selection" });
    }
  });

  // Industry configuration route
  app.get('/api/industry/:industry/config', isAuthenticated, async (req, res) => {
    try {
      const { industry } = req.params;
      const config = await industryConfigService.getIndustryConfig(industry);
      res.json(config);
    } catch (error) {
      console.error("Error fetching industry config:", error);
      res.status(500).json({ message: "Failed to fetch industry configuration" });
    }
  });

  // Document upload route
  app.post('/api/documents/upload', isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { industry, documentType } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create document record
      const document = await storage.createDocument({
        userId,
        filename: file.filename,
        originalFilename: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        industry: industry || user.industry,
        documentType: documentType || 'general',
        status: 'uploaded',
        processingProgress: 0,
      });

      // Start processing asynchronously
      documentProcessor.processDocument(document.id).catch(error => {
        console.error(`Error processing document ${document.id}:`, error);
        storage.updateDocumentStatus(document.id, 'error', 0, error.message);
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get user documents
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const documents = await storage.getUserDocuments(userId, limit);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get document details with analysis
  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user owns the document
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get analysis data
      const analyses = await storage.getDocumentAnalyses(documentId);
      const entities = await storage.getDocumentEntities(documentId);

      res.json({
        ...document,
        analyses,
        entities,
      });
    } catch (error) {
      console.error("Error fetching document details:", error);
      res.status(500).json({ message: "Failed to fetch document details" });
    }
  });

  // Get document processing status
  app.get('/api/documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        id: document.id,
        status: document.status,
        progress: document.processingProgress,
        message: document.processingMessage,
      });
    } catch (error) {
      console.error("Error fetching document status:", error);
      res.status(500).json({ message: "Failed to fetch document status" });
    }
  });

  // Dashboard statistics
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserDocuments(userId, 1000);

      const stats = {
        documentsProcessed: documents.length,
        avgConfidence: documents.length > 0 
          ? documents.reduce((sum, doc) => sum + (doc.aiConfidence || 0), 0) / documents.length
          : 0,
        avgProcessingTime: 2.3, // This would be calculated from actual processing times
        complianceScore: 98.7, // This would be industry-specific
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Advanced Analytics API
  app.get('/api/analytics/advanced', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { industry } = req.query;
      
      const documents = await storage.getUserDocuments(userId, 1000);
      
      // Generate mock advanced analytics data
      // In production, this would aggregate real data from the database
      const analyticsData = {
        processingTrends: [
          { date: '2025-09-01', documentsProcessed: 12, avgConfidence: 94.2, processingTime: 2.1 },
          { date: '2025-09-02', documentsProcessed: 18, avgConfidence: 96.1, processingTime: 1.9 },
          { date: '2025-09-03', documentsProcessed: 15, avgConfidence: 93.8, processingTime: 2.3 },
          { date: '2025-09-04', documentsProcessed: 22, avgConfidence: 95.7, processingTime: 2.0 },
          { date: '2025-09-05', documentsProcessed: 19, avgConfidence: 94.9, processingTime: 1.8 },
        ],
        modelPerformance: [
          { model: 'openai', accuracy: 94.2, usage: 45, avgTime: 1.8 },
          { model: 'gemini', accuracy: 92.7, usage: 38, avgTime: 2.1 },
          { model: 'anthropic', accuracy: 95.1, usage: 31, avgTime: 2.3 },
        ],
        industryInsights: [
          { category: 'Patient Information', count: 23, confidence: 96.2 },
          { category: 'Clinical Data', count: 18, confidence: 93.8 },
          { category: 'Medication Records', count: 15, confidence: 94.5 },
          { category: 'Lab Results', count: 12, confidence: 97.1 },
        ],
        complianceMetrics: [
          { type: 'HIPAA Compliance', score: 98.5, issues: 2 },
          { type: 'Data Privacy', score: 96.8, issues: 1 },
          { type: 'Medical Standards', score: 94.2, issues: 3 },
          { type: 'Security Protocol', score: 99.1, issues: 0 },
        ],
        entityDistribution: [
          { type: 'patient_info', count: 45, confidence: 94.8 },
          { type: 'diagnosis', count: 32, confidence: 92.3 },
          { type: 'medication', count: 28, confidence: 96.1 },
          { type: 'lab_result', count: 21, confidence: 97.4 },
          { type: 'provider_info', count: 19, confidence: 93.7 },
        ],
        processingStages: [
          { stage: 'ocr', avgTime: 0.8, successRate: 98.2 },
          { stage: 'ai_analysis', avgTime: 1.2, successRate: 94.7 },
          { stage: 'entity_extraction', avgTime: 0.6, successRate: 96.3 },
          { stage: 'consensus', avgTime: 0.4, successRate: 97.8 },
          { stage: 'saving', avgTime: 0.2, successRate: 99.5 },
        ]
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      res.status(500).json({ message: "Failed to fetch advanced analytics" });
    }
  });

  return httpServer;
}
