import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

interface ProcessingUpdate {
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  stage?: string;
  aiModel?: string;
  processingTime?: number;
  timestamp: string;
}

interface DocumentComplete {
  documentId: string;
  analysis: any;
  timestamp: string;
}

interface WebSocketMessage {
  type: 'connection' | 'subscribed' | 'processing_update' | 'document_complete' | 'analytics_update' | 'realtime_analytics' | 'broadcast' | 'pong' | 'cache_invalidation';
  [key: string]: any;
}

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [processingUpdates, setProcessingUpdates] = useState<Map<string, ProcessingUpdate>>(new Map());
  const [realtimeAnalytics, setRealtimeAnalytics] = useState<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!isAuthenticated || !user) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = window.location.port || (protocol === "wss:" ? "443" : "5000");
      const wsUrl = `${protocol}//${host}:${port}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // WebSocket connected
        setIsConnected(true);
        
        // Subscribe to user's updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          userId: user.id
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          // Error parsing WebSocket message
        }
      };

      ws.onclose = (event) => {
        // WebSocket disconnected
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt to reconnect after delay if not a normal closure
        if (event.code !== 1000 && isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        // WebSocket error occurred
        setIsConnected(false);
      };

    } catch (error) {
      // Error creating WebSocket connection
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection':
        // WebSocket connection confirmed
        break;

      case 'subscribed':
        // Subscribed to updates for user
        break;

      case 'processing_update':
        const update: ProcessingUpdate = {
          documentId: message.documentId,
          status: message.status,
          progress: message.progress,
          message: message.message,
          stage: message.stage,
          aiModel: message.aiModel,
          processingTime: message.processingTime,
          timestamp: message.timestamp
        };
        
        setProcessingUpdates(prev => new Map(prev.set(message.documentId, update)));
        
        // Show toast for status changes
        if (message.status === 'completed') {
          toast({
            title: "Document Processed",
            description: `${message.documentName || 'Document'} completed using ${message.aiModel || 'AI'} in ${message.processingTime ? (message.processingTime / 1000).toFixed(0) : '?'}s`,
          });
        } else if (message.status === 'failed') {
          toast({
            title: "Processing Failed",
            description: `${message.documentName || 'Document'}: ${message.message}`,
            variant: "destructive",
          });
        }
        break;

      case 'document_complete':
        const docComplete: DocumentComplete = {
          documentId: message.documentId,
          analysis: message.analysis,
          timestamp: message.timestamp
        };
        
        // Remove from processing updates
        setProcessingUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(message.documentId);
          return newMap;
        });

        // Show success notification with analysis summary
        toast({
          title: "Analysis Complete",
          description: `Document analysis completed with ${message.analysis?.consensus?.confidence?.toFixed(1) || 'unknown'}% confidence`,
        });
        break;

      case 'analytics_update':
        // Handle analytics updates - could trigger dashboard refresh
        // Analytics updated
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            return typeof key === 'string' && key.startsWith('/api/analytics');
          }
        });
        break;

      case 'realtime_analytics':
        // Handle real-time analytics streaming data
        // Real-time analytics received
        setRealtimeAnalytics(message.data);
        break;

      case 'cache_invalidation':
        // Handle cache invalidation for react-query
        // Invalidating caches
        if (message.queryKeys && Array.isArray(message.queryKeys)) {
          message.queryKeys.forEach((queryKey: string) => {
            // For hierarchical keys, invalidate by prefix
            if (queryKey.includes('/api/analytics/industry/')) {
              queryClient.invalidateQueries({ 
                predicate: (query) => {
                  const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
                  return typeof key === 'string' && key.startsWith(queryKey);
                }
              });
            } else {
              // For exact matches
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            }
          });
        }
        break;

      case 'broadcast':
        // Handle system-wide broadcasts
        toast({
          title: message.title || "System Update",
          description: message.message || "System notification received",
        });
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        // Unknown WebSocket message type
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    setIsConnected(false);
    setProcessingUpdates(new Map());
    setRealtimeAnalytics(null);
  };

  // Subscribe to real-time analytics
  const subscribeToAnalytics = (metrics: string[] = ['all']) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_analytics',
        userId: user?.id,
        metrics
      }));
    }
  };

  // Unsubscribe from real-time analytics
  const unsubscribeFromAnalytics = (metrics?: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe_analytics',
        userId: user?.id,
        metrics
      }));
    }
  };

  const getProcessingUpdate = (documentId: string): ProcessingUpdate | undefined => {
    return processingUpdates.get(documentId);
  };

  const clearProcessingUpdate = (documentId: string) => {
    setProcessingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentId);
      return newMap;
    });
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user]);

  return {
    isConnected,
    processingUpdates: Array.from(processingUpdates.values()),
    realtimeAnalytics,
    getProcessingUpdate,
    clearProcessingUpdate,
    subscribeToAnalytics,
    unsubscribeFromAnalytics,
    reconnect: connect
  };
}