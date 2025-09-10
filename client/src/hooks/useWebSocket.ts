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
  type: 'connection' | 'subscribed' | 'processing_update' | 'document_complete' | 'analytics_update' | 'broadcast' | 'pong' | 'cache_invalidation';
  [key: string]: any;
}

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [processingUpdates, setProcessingUpdates] = useState<Map<string, ProcessingUpdate>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!isAuthenticated || !user) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
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
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
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
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection':
        console.log('WebSocket connection confirmed:', message.message);
        break;

      case 'subscribed':
        console.log('Subscribed to updates for user:', message.userId);
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
            description: `Document completed using ${message.aiModel || 'AI'} in ${message.processingTime ? (message.processingTime / 1000).toFixed(1) + 's' : 'unknown time'}`,
          });
        } else if (message.status === 'failed') {
          toast({
            title: "Processing Failed",
            description: message.message,
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
        console.log('Analytics updated:', message.analytics);
        break;

      case 'cache_invalidation':
        // Handle cache invalidation for react-query
        console.log('Invalidating caches:', message.queryKeys);
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
        console.log('Unknown WebSocket message type:', message.type);
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
    getProcessingUpdate,
    clearProcessingUpdate,
    reconnect: connect
  };
}