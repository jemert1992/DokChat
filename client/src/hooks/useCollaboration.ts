import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CollaborationSession {
  id: number;
  documentId: number;
  userId: string;
  sessionId: string;
  status: 'active' | 'idle' | 'disconnected';
  activity: 'viewing' | 'editing' | 'commenting';
  cursorPosition?: { page: number; x: number; y: number };
  selection?: { start: number; end: number; text: string };
  joinedAt: string;
  leftAt?: string;
}

interface CollaborationEvent {
  type: string;
  documentId: number;
  userId: string;
  data: any;
  timestamp: string;
}

interface UseCollaborationOptions {
  documentId: number;
  enabled?: boolean;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onCommentAdded?: (comment: any) => void;
  onPresenceUpdate?: (userId: string, presence: any) => void;
}

export function useCollaboration({
  documentId,
  enabled = true,
  onUserJoined,
  onUserLeft,
  onCommentAdded,
  onPresenceUpdate,
}: UseCollaborationOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Join collaboration session
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      status?: string;
      activity?: string;
      cursorPosition?: { page: number; x: number; y: number };
      selection?: { start: number; end: number; text: string };
    }) => {
      return await apiRequest<CollaborationSession>(`/api/documents/${documentId}/sessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      sessionIdRef.current = session.sessionId;
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Collaboration Error",
        description: "Failed to join collaboration session",
        variant: "destructive",
      });
    },
  });

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!enabled || !documentId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('📡 WebSocket connected for collaboration');
        setIsConnected(true);
        
        // Subscribe to document collaboration events
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe_document',
            documentId,
            timestamp: new Date().toISOString()
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleCollaborationEvent(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('📡 WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after a delay
        if (enabled) {
          setTimeout(() => {
            initializeWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, [enabled, documentId]);

  // Handle collaboration events
  const handleCollaborationEvent = useCallback((message: any) => {
    if (message.type === 'collaboration_event') {
      const event: CollaborationEvent = message;
      
      switch (event.type) {
        case 'user_joined':
          onUserJoined?.(event.userId);
          queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'sessions'] });
          break;
          
        case 'user_left':
          onUserLeft?.(event.userId);
          queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'sessions'] });
          break;
          
        case 'comment_added':
          onCommentAdded?.(event.data);
          queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'comments'] });
          break;
          
        case 'presence_update':
          onPresenceUpdate?.(event.userId, event.data);
          queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'sessions'] });
          break;
          
        case 'cursor_move':
        case 'selection_change':
          // Handle real-time cursor and selection updates
          onPresenceUpdate?.(event.userId, event.data);
          break;
      }
    } else if (message.type === 'notification') {
      // Handle real-time notifications
      toast({
        title: message.notification.title,
        description: message.notification.message,
      });
    }
  }, [documentId, onUserJoined, onUserLeft, onCommentAdded, onPresenceUpdate, queryClient, toast]);

  // Join collaboration session
  const joinSession = useCallback((options: {
    activity?: 'viewing' | 'editing' | 'commenting';
    cursorPosition?: { page: number; x: number; y: number };
  } = {}) => {
    joinSessionMutation.mutate({
      status: 'active',
      activity: options.activity || 'viewing',
      cursorPosition: options.cursorPosition,
    });
  }, [joinSessionMutation]);

  // Update presence
  const updatePresence = useCallback((updates: {
    activity?: 'viewing' | 'editing' | 'commenting';
    cursorPosition?: { page: number; x: number; y: number };
    selection?: { start: number; end: number; text: string };
  }) => {
    if (currentSession && wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'presence_update',
        documentId,
        sessionId: currentSession.sessionId,
        ...updates,
        timestamp: new Date().toISOString()
      }));
    }
  }, [currentSession, documentId, isConnected]);

  // Send cursor position
  const sendCursorPosition = useCallback((position: { page: number; x: number; y: number }) => {
    updatePresence({ cursorPosition: position });
  }, [updatePresence]);

  // Send text selection
  const sendTextSelection = useCallback((selection: { start: number; end: number; text: string }) => {
    updatePresence({ selection });
  }, [updatePresence]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe_document',
        documentId,
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      }));
    }
    
    setCurrentSession(null);
    sessionIdRef.current = null;
  }, [documentId, isConnected]);

  // Initialize on mount
  useEffect(() => {
    if (enabled && documentId) {
      initializeWebSocket();
      
      // Auto-join session
      joinSession();
    }

    // Cleanup on unmount
    return () => {
      leaveSession();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, documentId, initializeWebSocket, joinSession, leaveSession]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({ activity: 'idle' });
      } else {
        updatePresence({ activity: 'viewing' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updatePresence]);

  return {
    isConnected,
    currentSession,
    joinSession,
    leaveSession,
    updatePresence,
    sendCursorPosition,
    sendTextSelection,
    isJoining: joinSessionMutation.isPending,
  };
}

export default useCollaboration;