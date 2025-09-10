import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import { DocumentProcessor } from "./services/documentProcessor";
import { WebSocketService } from "./services/websocketService";
import { IndustryConfigService } from "./services/industryConfig";
import { DocumentChatService } from "./services/documentChatService";
import { industrySelectionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import testAIEndpoints from "./test-ai-endpoints";

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
  const chatService = new DocumentChatService();

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
        industryInsights: industry === 'real_estate' ? [
          { category: 'Purchase Contracts', count: 28, confidence: 95.8 },
          { category: 'Lease Agreements', count: 22, confidence: 94.3 },
          { category: 'Disclosure Forms', count: 18, confidence: 96.7 },
          { category: 'Inspection Reports', count: 15, confidence: 93.2 },
          { category: 'Title Documents', count: 12, confidence: 97.4 },
        ] : industry === 'medical' ? [
          { category: 'Patient Information', count: 23, confidence: 96.2 },
          { category: 'Clinical Data', count: 18, confidence: 93.8 },
          { category: 'Medication Records', count: 15, confidence: 94.5 },
          { category: 'Lab Results', count: 12, confidence: 97.1 },
        ] : [
          { category: 'Business Contracts', count: 25, confidence: 94.8 },
          { category: 'Financial Records', count: 20, confidence: 96.1 },
          { category: 'Legal Documents', count: 16, confidence: 95.3 },
          { category: 'Compliance Forms', count: 14, confidence: 93.7 },
        ],
        complianceMetrics: industry === 'real_estate' ? [
          { type: 'Fair Housing Compliance', score: 97.2, issues: 1 },
          { type: 'Disclosure Requirements', score: 95.8, issues: 2 },
          { type: 'Title Insurance Standards', score: 98.9, issues: 0 },
          { type: 'Escrow Regulations', score: 96.4, issues: 1 },
        ] : industry === 'medical' ? [
          { type: 'HIPAA Compliance', score: 98.5, issues: 2 },
          { type: 'Data Privacy', score: 96.8, issues: 1 },
          { type: 'Medical Standards', score: 94.2, issues: 3 },
          { type: 'Security Protocol', score: 99.1, issues: 0 },
        ] : [
          { type: 'Regulatory Compliance', score: 96.3, issues: 2 },
          { type: 'Data Privacy', score: 95.7, issues: 1 },
          { type: 'Industry Standards', score: 94.8, issues: 3 },
          { type: 'Security Protocol', score: 98.2, issues: 1 },
        ],
        entityDistribution: industry === 'real_estate' ? [
          { type: 'property_address', count: 52, confidence: 97.1 },
          { type: 'buyer_seller_info', count: 48, confidence: 95.4 },
          { type: 'purchase_price', count: 41, confidence: 98.2 },
          { type: 'closing_date', count: 38, confidence: 96.8 },
          { type: 'agent_info', count: 35, confidence: 94.6 },
          { type: 'contingencies', count: 29, confidence: 93.1 },
        ] : industry === 'medical' ? [
          { type: 'patient_info', count: 45, confidence: 94.8 },
          { type: 'diagnosis', count: 32, confidence: 92.3 },
          { type: 'medication', count: 28, confidence: 96.1 },
          { type: 'lab_result', count: 21, confidence: 97.4 },
          { type: 'provider_info', count: 19, confidence: 93.7 },
        ] : [
          { type: 'contract_terms', count: 38, confidence: 95.2 },
          { type: 'financial_data', count: 32, confidence: 96.7 },
          { type: 'entity_names', count: 28, confidence: 94.8 },
          { type: 'dates_deadlines', count: 25, confidence: 97.1 },
          { type: 'contact_info', count: 22, confidence: 93.6 },
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

  // Chat endpoints
  const chatQuerySchema = z.object({
    question: z.string().min(1, "Question cannot be empty").max(1000, "Question too long"),
  });

  // Chat with document
  app.post('/api/documents/:id/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = parseInt(req.params.id);
      const { question } = chatQuerySchema.parse(req.body);

      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const response = await chatService.chatWithDocument(documentId, userId, question);
      res.json(response);
    } catch (error) {
      console.error("Error in document chat:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Chat failed" 
      });
    }
  });

  // Get chat history
  app.get('/api/documents/:id/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const history = await chatService.getChatHistory(documentId, userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get chat history" 
      });
    }
  });

  // Clear chat history
  app.delete('/api/documents/:id/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      await chatService.clearChatHistory(documentId, userId);
      res.json({ message: "Chat history cleared successfully" });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to clear chat history" 
      });
    }
  });

  // Add AI testing endpoints - ONLY in development with authentication
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  AI Test endpoints enabled in development mode');
    // Require authentication even in development for test endpoints
    app.use('/api/test', isAuthenticated, testAIEndpoints);
  } else {
    // In production, return 404 for any test endpoint requests
    app.use('/api/test*', (req, res) => {
      res.status(404).json({ message: 'Not found' });
    });
  }

  return httpServer;
}
