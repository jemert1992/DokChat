import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import { DocumentProcessor } from "./services/documentProcessor";
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

  // Initialize services
  const documentProcessor = new DocumentProcessor();
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

  const httpServer = createServer(app);
  return httpServer;
}
