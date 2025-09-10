import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface ProcessingUpdate {
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  stage?: string;
  aiModel?: string;
  processingTime?: number;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info: any) => {
        // Add authentication verification here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      console.log('WebSocket client connected');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.removeClientFromAllUsers(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClientFromAllUsers(ws);
      });

      // Send initial connection confirmation
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connected to DOKTECH 3.0 processing updates'
        }));
      }
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'subscribe':
        this.subscribeUser(message.userId, ws);
        break;
      case 'unsubscribe':
        this.unsubscribeUser(message.userId, ws);
        break;
      case 'ping':
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private subscribeUser(userId: string, ws: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'subscribed',
        userId,
        message: 'Subscribed to document processing updates'
      }));
    }
  }

  private unsubscribeUser(userId: string, ws: WebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private removeClientFromAllUsers(ws: WebSocket) {
    this.clients.forEach((clients, userId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(userId);
      }
    });
  }

  // Public methods for sending updates
  sendProcessingUpdate(userId: string, update: ProcessingUpdate) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: 'processing_update',
        ...update,
        timestamp: new Date().toISOString()
      });

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        } else {
          // Clean up dead connections
          userClients.delete(ws);
        }
      });

      // Clean up empty user sets
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }

      // Invalidate documents cache on status changes (not on every progress update)
      if (update.status === 'completed' || update.status === 'failed') {
        this.sendCacheInvalidation(userId, ['/api/documents']);
      }
    }
  }

  sendDocumentComplete(userId: string, documentId: string, analysis: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: 'document_complete',
        documentId,
        analysis,
        timestamp: new Date().toISOString()
      });

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
      
      // Invalidate caches when document is complete
      this.invalidateDocumentCaches(userId, analysis?.industry);
    }
  }

  sendAnalyticsUpdate(userId: string, analytics: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: 'analytics_update',
        analytics,
        timestamp: new Date().toISOString()
      });

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Send cache invalidation signal for react-query
  sendCacheInvalidation(userId: string, queryKeys: string[]) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: 'cache_invalidation',
        queryKeys,
        timestamp: new Date().toISOString()
      });

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Helper method to invalidate analytics and documents cache when document changes
  invalidateDocumentCaches(userId: string, industry?: string) {
    const keysToInvalidate = [
      '/api/documents',
      '/api/dashboard/stats'
    ];
    
    if (industry) {
      keysToInvalidate.push(`/api/analytics/industry/${industry}`);
    }
    
    keysToInvalidate.push('/api/analytics/compliance-alerts');
    
    this.sendCacheInvalidation(userId, keysToInvalidate);
  }

  // Send system-wide notifications
  broadcast(message: any) {
    const broadcastMessage = JSON.stringify({
      type: 'broadcast',
      ...message,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((userClients) => {
      userClients.forEach((ws: WebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(broadcastMessage);
        }
      });
    });
  }

  // Get connection statistics
  getConnectionStats() {
    let totalConnections = 0;
    this.clients.forEach(userClients => {
      totalConnections += userClients.size;
    });

    return {
      totalUsers: this.clients.size,
      totalConnections,
      activeUsers: Array.from(this.clients.keys())
    };
  }
}