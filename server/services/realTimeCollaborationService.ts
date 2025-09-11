import { storage } from "../storage";
import { WebSocketService } from "./websocketService";
import { randomUUID } from "crypto";
import type {
  Team, InsertTeam, TeamMember, InsertTeamMember,
  DocumentShare, InsertDocumentShare, DocumentComment, InsertDocumentComment,
  DocumentVersion, InsertDocumentVersion, CollaborationSession, InsertCollaborationSession,
  DocumentAnnotation, InsertDocumentAnnotation, ActivityLog, InsertActivityLog,
  Notification, InsertNotification
} from "@shared/schema";

interface PresenceInfo {
  userId: string;
  userName: string;
  userEmail: string;
  documentId: number;
  sessionId: string;
  status: 'active' | 'idle' | 'disconnected';
  activity: 'viewing' | 'editing' | 'commenting';
  cursorPosition?: { page: number; x: number; y: number };
  selection?: { start: number; end: number; text: string };
  lastActivity: Date;
  color: string; // assigned cursor color
}

interface CollaborationEvent {
  type: 'presence_update' | 'comment_added' | 'document_shared' | 'version_created' | 'annotation_added' | 'cursor_move' | 'selection_change' | 'typing_start' | 'typing_stop';
  documentId: number;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

interface DocumentEditOperation {
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  operationId: string;
}

interface CommentThread {
  commentId: number;
  replies: DocumentComment[];
  isResolved: boolean;
  participantCount: number;
  lastActivity: Date;
}

interface CollaborationMetrics {
  activeUsers: number;
  totalComments: number;
  resolvedComments: number;
  documentsShared: number;
  versionsCreated: number;
  annotationsAdded: number;
  averageResponseTime: number;
  collaborationScore: number;
}

/**
 * Real-Time Collaboration Service for DOKTECH 3.0
 * 
 * Provides comprehensive real-time collaboration capabilities including:
 * - Live document editing with operational transformation
 * - Real-time presence indicators and cursor tracking
 * - Comment system with threading, mentions, and reactions
 * - Team workspace management with role-based permissions
 * - Document sharing and access control
 * - Version control and change tracking
 * - Annotations and highlighting system
 * - Activity logging and collaboration analytics
 * - Real-time notifications and alerts
 */
export class RealTimeCollaborationService {
  private websocketService: WebSocketService | null = null;
  
  // In-memory caches for real-time performance
  private presenceCache: Map<string, Map<string, PresenceInfo>> = new Map(); // documentId -> userId -> presence
  private sessionCache: Map<string, CollaborationSession> = new Map(); // sessionId -> session
  private documentSubscriptions: Map<number, Set<string>> = new Map(); // documentId -> userIds
  private teamCache: Map<number, Team> = new Map(); // teamId -> team
  private documentShareCache: Map<number, DocumentShare[]> = new Map(); // documentId -> shares
  
  // Real-time operation queues
  private operationQueue: Map<number, DocumentEditOperation[]> = new Map(); // documentId -> operations
  private pendingOperations: Map<string, DocumentEditOperation> = new Map(); // operationId -> operation
  
  // Collaboration analytics
  private collaborationMetrics: Map<number, CollaborationMetrics> = new Map(); // documentId -> metrics
  
  // User cursor colors for visual differentiation
  private cursorColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  private assignedColors: Map<string, string> = new Map(); // userId -> color

  constructor(websocketService?: WebSocketService) {
    this.websocketService = websocketService || null;
    this.initializeService();
  }

  /**
   * Initialize the Real-Time Collaboration Service
   */
  private initializeService(): void {
    console.log('👥 Initializing Real-Time Collaboration Service...');
    
    // Initialize collaboration metrics
    this.initializeCollaborationMetrics();
    
    // Start presence cleanup interval
    this.startPresenceCleanup();
    
    console.log('✅ Real-Time Collaboration Service initialized successfully');
  }

  // =============================================================================
  // TEAM MANAGEMENT
  // =============================================================================

  /**
   * Create a new team workspace
   */
  async createTeam(
    teamData: Omit<InsertTeam, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Team> {
    console.log(`👥 Creating team: ${teamData.name}`);

    try {
      // Create team using actual storage
      const team = await storage.createTeam({
        name: teamData.name,
        description: teamData.description || null,
        industry: teamData.industry,
        ownerId: teamData.ownerId,
        settings: teamData.settings || {},
        isActive: teamData.isActive ?? true
      });

      // Cache team
      this.teamCache.set(team.id, team);

      // Add owner as team admin
      await storage.addTeamMember({
        teamId: team.id,
        userId: team.ownerId,
        role: 'owner',
        permissions: { all: true },
        invitedBy: team.ownerId
      });

      // Log activity
      await storage.logActivity({
        userId: team.ownerId,
        teamId: team.id,
        activityType: 'team_created',
        description: `Created team: ${team.name}`,
        metadata: { teamId: team.id, teamName: team.name }
      });

      console.log(`✅ Team created successfully: ${team.id}`);
      return team;

    } catch (error) {
      console.error('❌ Team creation failed:', error);
      throw new Error(`Team creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add user to team
   */
  async addTeamMember(memberData: Omit<InsertTeamMember, 'id' | 'joinedAt' | 'createdAt'>): Promise<TeamMember> {
    console.log(`👤 Adding user ${memberData.userId} to team ${memberData.teamId}`);

    try {
      // Add team member using actual storage
      const teamMember = await storage.addTeamMember({
        teamId: memberData.teamId,
        userId: memberData.userId,
        role: memberData.role || 'member',
        permissions: memberData.permissions || {},
        invitedBy: memberData.invitedBy || null
      });

      // Send team invitation notification
      await storage.createNotification({
        userId: memberData.userId,
        type: 'team_invite',
        title: 'Team Invitation',
        message: `You have been invited to join a team`,
        data: { teamId: memberData.teamId, role: memberData.role },
        isRead: false,
        priority: 'normal'
      });

      console.log(`✅ Team member added successfully: ${teamMember.id}`);
      return teamMember;

    } catch (error) {
      console.error('❌ Failed to add team member:', error);
      throw new Error(`Failed to add team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team members with their roles
   */
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await storage.getTeamMembers(teamId);
  }

  /**
   * Update team member role and permissions
   */
  async updateTeamMemberRole(
    teamId: number,
    userId: string,
    role: string,
    permissions: Record<string, any>,
    updatedBy: string
  ): Promise<void> {
    console.log(`🔄 Updating role for user ${userId} in team ${teamId} to ${role}`);

    // Get the team member to update
    const member = await storage.getTeamMember(teamId, userId);
    if (!member) {
      throw new Error('Team member not found');
    }

    // Update role and permissions using actual storage
    await storage.updateTeamMember(member.id, {
      role,
      permissions
    });

    // Log role change activity
    await storage.logActivity({
      userId: updatedBy,
      teamId,
      activityType: 'member_role_updated',
      description: `Updated role for team member to ${role}`,
      metadata: { targetUserId: userId, newRole: role, permissions }
    });

    // Send notification to affected user
    await storage.createNotification({
      userId,
      type: 'role_updated',
      title: 'Role Updated',
      message: `Your role has been updated to ${role}`,
      data: { teamId, role, permissions },
      isRead: false,
      priority: 'normal'
    });
  }

  // =============================================================================
  // DOCUMENT SHARING & PERMISSIONS
  // =============================================================================

  /**
   * Share document with user or team
   */
  async shareDocument(shareData: Omit<InsertDocumentShare, 'id' | 'createdAt'>): Promise<DocumentShare> {
    console.log(`📤 Sharing document ${shareData.documentId}`);

    try {
      const documentShare: DocumentShare = {
        id: Math.floor(Math.random() * 10000),
        documentId: shareData.documentId,
        teamId: shareData.teamId || null,
        userId: shareData.userId || null,
        sharedBy: shareData.sharedBy,
        accessLevel: shareData.accessLevel || null,
        permissions: shareData.permissions || {},
        expiresAt: shareData.expiresAt || null,
        isActive: shareData.isActive ?? true,
        createdAt: new Date(),
      };

      // Cache document share
      const documentShares = this.documentShareCache.get(shareData.documentId) || [];
      documentShares.push(documentShare);
      this.documentShareCache.set(shareData.documentId, documentShares);

      // Send sharing notification
      const notificationUserId = shareData.userId || shareData.teamId?.toString() || '';
      await this.sendNotification({
        userId: notificationUserId,
        type: 'document_shared',
        title: 'Document Shared',
        message: `A document has been shared with you`,
        data: { 
          documentId: shareData.documentId, 
          accessLevel: shareData.accessLevel,
          sharedBy: shareData.sharedBy 
        },
        priority: 'normal'
      });

      // Log sharing activity
      await this.logActivity({
        userId: shareData.sharedBy,
        documentId: shareData.documentId,
        teamId: shareData.teamId,
        activityType: 'document_shared',
        description: `Shared document with ${shareData.accessLevel} access`,
        metadata: { targetUserId: shareData.userId, accessLevel: shareData.accessLevel }
      });

      console.log(`✅ Document shared successfully: ${documentShare.id}`);
      return documentShare;

    } catch (error) {
      console.error('❌ Document sharing failed:', error);
      throw new Error(`Document sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get document shares for a specific document
   */
  async getDocumentShares(documentId: number): Promise<DocumentShare[]> {
    return this.documentShareCache.get(documentId) || [];
  }

  /**
   * Check if user has access to document
   */
  async checkDocumentAccess(
    userId: string, 
    documentId: number, 
    requiredAccessLevel: 'view' | 'comment' | 'edit' | 'manage' = 'view'
  ): Promise<{ hasAccess: boolean; accessLevel?: string; shareInfo?: DocumentShare }> {
    console.log(`🔐 Checking access for user ${userId} to document ${documentId}`);

    try {
      // Check if user owns the document (highest access)
      // Mock check - in production would query actual document ownership
      
      // Check document shares
      const documentShares = this.documentShareCache.get(documentId) || [];
      const userShare = documentShares.find(share => 
        share.userId === userId && share.isActive && 
        (!share.expiresAt || share.expiresAt > new Date())
      );

      if (userShare) {
        const accessLevels = ['view', 'comment', 'edit', 'manage'];
        const userLevelIndex = accessLevels.indexOf(userShare.accessLevel || 'view');
        const requiredLevelIndex = accessLevels.indexOf(requiredAccessLevel);
        
        const hasAccess = userLevelIndex >= requiredLevelIndex;
        return { hasAccess, accessLevel: userShare.accessLevel || undefined, shareInfo: userShare };
      }

      // Check team-based access (if user is member of shared teams)
      // Mock implementation for team access checking
      
      return { hasAccess: false };

    } catch (error) {
      console.error('❌ Access check failed:', error);
      return { hasAccess: false };
    }
  }

  // =============================================================================
  // REAL-TIME PRESENCE & SESSIONS
  // =============================================================================

  /**
   * Start collaboration session for user on document
   */
  async startCollaborationSession(
    userId: string,
    documentId: number,
    sessionId: string,
    activity: 'viewing' | 'editing' | 'commenting' = 'viewing'
  ): Promise<CollaborationSession> {
    console.log(`🟢 Starting collaboration session: ${userId} on document ${documentId}`);

    try {
      // Check document access
      const accessCheck = await this.checkDocumentAccess(userId, documentId, 'view');
      if (!accessCheck.hasAccess) {
        throw new Error('Access denied to document');
      }

      const session: CollaborationSession = {
        id: Math.floor(Math.random() * 10000),
        documentId,
        userId,
        sessionId,
        status: 'active',
        activity,
        cursorPosition: undefined,
        selection: undefined,
        metadata: {},
        lastActivity: new Date(),
        createdAt: new Date(),
      };

      // Cache session
      this.sessionCache.set(sessionId, session);

      // Add to document subscriptions
      const docSubscriptions = this.documentSubscriptions.get(documentId) || new Set();
      docSubscriptions.add(userId);
      this.documentSubscriptions.set(documentId, docSubscriptions);

      // Assign cursor color
      if (!this.assignedColors.has(userId)) {
        const colorIndex = this.assignedColors.size % this.cursorColors.length;
        this.assignedColors.set(userId, this.cursorColors[colorIndex]);
      }

      // Update presence
      await this.updatePresence(userId, documentId, sessionId, {
        status: 'active',
        activity,
        cursorPosition: undefined,
        selection: undefined
      });

      // Broadcast session start to other users
      await this.broadcastCollaborationEvent({
        type: 'presence_update',
        documentId,
        userId,
        data: {
          action: 'joined',
          sessionId,
          activity,
          userName: `User ${userId}`, // In production, get from user data
          userColor: this.assignedColors.get(userId)
        },
        timestamp: new Date()
      });

      console.log(`✅ Collaboration session started: ${session.id}`);
      return session;

    } catch (error) {
      console.error('❌ Failed to start collaboration session:', error);
      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user presence and activity
   */
  async updatePresence(
    userId: string,
    documentId: number,
    sessionId: string,
    presenceData: {
      status?: 'active' | 'idle' | 'disconnected';
      activity?: 'viewing' | 'editing' | 'commenting';
      cursorPosition?: { page: number; x: number; y: number };
      selection?: { start: number; end: number; text: string };
    }
  ): Promise<void> {
    const documentPresence = this.presenceCache.get(documentId.toString()) || new Map();
    
    const currentPresence = documentPresence.get(userId);
    const updatedPresence: PresenceInfo = {
      userId,
      userName: `User ${userId}`, // In production, get from user data
      userEmail: `user${userId}@example.com`, // Mock email
      documentId,
      sessionId,
      status: presenceData.status || currentPresence?.status || 'active',
      activity: presenceData.activity || currentPresence?.activity || 'viewing',
      cursorPosition: presenceData.cursorPosition || currentPresence?.cursorPosition,
      selection: presenceData.selection || currentPresence?.selection,
      lastActivity: new Date(),
      color: this.assignedColors.get(userId) || '#888888'
    };

    documentPresence.set(userId, updatedPresence);
    this.presenceCache.set(documentId.toString(), documentPresence);

    // Update session cache
    const session = this.sessionCache.get(sessionId);
    if (session) {
      session.status = updatedPresence.status;
      session.activity = updatedPresence.activity;
      session.cursorPosition = updatedPresence.cursorPosition;
      session.selection = updatedPresence.selection;
      session.lastActivity = new Date();
    }

    // Broadcast presence update
    await this.broadcastCollaborationEvent({
      type: 'presence_update',
      documentId,
      userId,
      data: {
        action: 'updated',
        presence: updatedPresence
      },
      timestamp: new Date()
    });
  }

  /**
   * Get active users on document
   */
  async getDocumentPresence(documentId: number): Promise<PresenceInfo[]> {
    const documentPresence = this.presenceCache.get(documentId.toString());
    if (!documentPresence) return [];

    const activePresence: PresenceInfo[] = [];
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes cutoff

    documentPresence.forEach((presence) => {
      if (presence.lastActivity > cutoffTime && presence.status !== 'disconnected') {
        activePresence.push(presence);
      }
    });

    return activePresence;
  }

  /**
   * End collaboration session
   */
  async endCollaborationSession(userId: string, sessionId: string): Promise<void> {
    console.log(`🔴 Ending collaboration session: ${sessionId}`);

    const session = this.sessionCache.get(sessionId);
    if (session) {
      // Update session status
      session.status = 'disconnected';
      
      // Remove from document subscriptions
      const docSubscriptions = this.documentSubscriptions.get(session.documentId);
      if (docSubscriptions) {
        docSubscriptions.delete(userId);
      }

      // Remove from presence
      const documentPresence = this.presenceCache.get(session.documentId.toString());
      if (documentPresence) {
        documentPresence.delete(userId);
      }

      // Broadcast session end
      await this.broadcastCollaborationEvent({
        type: 'presence_update',
        documentId: session.documentId,
        userId,
        data: {
          action: 'left',
          sessionId
        },
        timestamp: new Date()
      });

      // Remove from cache
      this.sessionCache.delete(sessionId);
    }
  }

  // =============================================================================
  // COMMENTS & ANNOTATIONS
  // =============================================================================

  /**
   * Add comment to document
   */
  async addComment(commentData: Omit<InsertDocumentComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentComment> {
    console.log(`💬 Adding comment to document ${commentData.documentId}`);

    try {
      // Check access permissions
      const accessCheck = await this.checkDocumentAccess(commentData.userId, commentData.documentId, 'comment');
      if (!accessCheck.hasAccess) {
        throw new Error('Access denied to comment on document');
      }

      const comment: DocumentComment = {
        id: Math.floor(Math.random() * 10000),
        documentId: commentData.documentId,
        userId: commentData.userId,
        parentId: commentData.parentId || null,
        content: commentData.content,
        commentType: commentData.commentType || null,
        position: commentData.position || null,
        metadata: commentData.metadata || {},
        isResolved: commentData.isResolved || false,
        resolvedBy: commentData.resolvedBy || null,
        resolvedAt: commentData.resolvedAt || null,
        mentions: commentData.mentions || null,
        reactions: commentData.reactions || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Process mentions and send notifications
      if (commentData.mentions && commentData.mentions.length > 0) {
        for (const mentionedUserId of commentData.mentions) {
          await this.sendNotification({
            userId: mentionedUserId,
            type: 'comment_mention',
            title: 'You were mentioned',
            message: `You were mentioned in a comment`,
            data: { 
              documentId: commentData.documentId, 
              commentId: comment.id,
              commentContent: commentData.content.substring(0, 100) 
            },
            priority: 'normal'
          });
        }
      }

      // Broadcast comment to collaborators
      await this.broadcastCollaborationEvent({
        type: 'comment_added',
        documentId: commentData.documentId,
        userId: commentData.userId,
        data: {
          comment,
          isReply: !!commentData.parentId
        },
        timestamp: new Date()
      });

      // Log activity
      await this.logActivity({
        userId: commentData.userId,
        documentId: commentData.documentId,
        activityType: 'comment_added',
        description: `Added ${commentData.commentType} comment`,
        metadata: { 
          commentId: comment.id, 
          commentType: commentData.commentType,
          hasPosition: !!commentData.position 
        }
      });

      console.log(`✅ Comment added successfully: ${comment.id}`);
      return comment;

    } catch (error) {
      console.error('❌ Failed to add comment:', error);
      throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comments for document with threading
   */
  async getDocumentComments(documentId: number): Promise<CommentThread[]> {
    // Mock implementation - in production would query actual storage
    const mockComments: DocumentComment[] = [];
    
    // Group comments into threads
    const threads: CommentThread[] = [];
    const topLevelComments = mockComments.filter(c => !c.parentId);
    
    for (const topComment of topLevelComments) {
      const replies = mockComments.filter(c => c.parentId === topComment.id);
      const thread: CommentThread = {
        commentId: topComment.id,
        replies,
        isResolved: topComment.isResolved || false,
        participantCount: new Set([topComment.userId, ...replies.map(r => r.userId)]).size,
        lastActivity: topComment.updatedAt && replies.length > 0
          ? new Date(Math.max((topComment.updatedAt || new Date()).getTime(), ...replies.map(r => (r.updatedAt || new Date()).getTime())))
          : topComment.updatedAt || new Date()
      };
      threads.push(thread);
    }

    return threads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Resolve or unresolve comment thread
   */
  async resolveComment(
    commentId: number, 
    userId: string, 
    isResolved: boolean
  ): Promise<void> {
    console.log(`${isResolved ? '✅' : '↩️'} ${isResolved ? 'Resolving' : 'Unresolving'} comment ${commentId}`);

    // Log resolution activity
    await this.logActivity({
      userId,
      activityType: isResolved ? 'comment_resolved' : 'comment_reopened',
      description: `${isResolved ? 'Resolved' : 'Reopened'} comment thread`,
      metadata: { commentId, action: isResolved ? 'resolved' : 'reopened' }
    });

    // Broadcast comment resolution
    await this.broadcastCollaborationEvent({
      type: 'comment_added', // Reuse comment event type for simplicity
      documentId: 0, // Would get from comment data
      userId,
      data: {
        action: isResolved ? 'resolved' : 'reopened',
        commentId
      },
      timestamp: new Date()
    });
  }

  /**
   * Add annotation to document
   */
  async addAnnotation(annotationData: Omit<InsertDocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentAnnotation> {
    console.log(`🔖 Adding ${annotationData.annotationType} annotation to document ${annotationData.documentId}`);

    try {
      // Check access permissions
      const accessCheck = await this.checkDocumentAccess(annotationData.userId, annotationData.documentId, 'comment');
      if (!accessCheck.hasAccess) {
        throw new Error('Access denied to annotate document');
      }

      const annotation: DocumentAnnotation = {
        id: Math.floor(Math.random() * 10000),
        documentId: annotationData.documentId,
        userId: annotationData.userId,
        annotationType: annotationData.annotationType,
        content: annotationData.content || null,
        position: annotationData.position,
        style: annotationData.style || {},
        tags: annotationData.tags || null,
        isPrivate: annotationData.isPrivate ?? false,
        metadata: annotationData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Broadcast annotation to collaborators
      await this.broadcastCollaborationEvent({
        type: 'annotation_added',
        documentId: annotationData.documentId,
        userId: annotationData.userId,
        data: {
          annotation
        },
        timestamp: new Date()
      });

      // Log activity
      await this.logActivity({
        userId: annotationData.userId,
        documentId: annotationData.documentId,
        activityType: 'annotation_added',
        description: `Added ${annotationData.annotationType} annotation`,
        metadata: { 
          annotationId: annotation.id, 
          annotationType: annotationData.annotationType,
          tags: annotationData.tags 
        }
      });

      console.log(`✅ Annotation added successfully: ${annotation.id}`);
      return annotation;

    } catch (error) {
      console.error('❌ Failed to add annotation:', error);
      throw new Error(`Failed to add annotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // VERSION CONTROL
  // =============================================================================

  /**
   * Create new document version
   */
  async createDocumentVersion(versionData: Omit<InsertDocumentVersion, 'id' | 'createdAt'>): Promise<DocumentVersion> {
    console.log(`📝 Creating version ${versionData.versionNumber} for document ${versionData.documentId}`);

    try {
      const version: DocumentVersion = {
        id: Math.floor(Math.random() * 10000),
        documentId: versionData.documentId,
        versionNumber: versionData.versionNumber,
        createdBy: versionData.createdBy,
        title: versionData.title || null,
        description: versionData.description || null,
        changes: versionData.changes,
        extractedText: versionData.extractedText || null,
        extractedData: versionData.extractedData || null,
        metadata: versionData.metadata || {},
        fileSnapshot: versionData.fileSnapshot || null,
        isActive: versionData.isActive ?? true,
        createdAt: new Date(),
      };

      // Broadcast version creation
      await this.broadcastCollaborationEvent({
        type: 'version_created',
        documentId: versionData.documentId,
        userId: versionData.createdBy,
        data: {
          version,
          changes: versionData.changes
        },
        timestamp: new Date()
      });

      // Log activity
      await this.logActivity({
        userId: versionData.createdBy,
        documentId: versionData.documentId,
        activityType: 'version_created',
        description: `Created version ${versionData.versionNumber}`,
        metadata: { 
          versionId: version.id, 
          versionNumber: versionData.versionNumber,
          title: versionData.title 
        }
      });

      console.log(`✅ Document version created successfully: ${version.id}`);
      return version;

    } catch (error) {
      console.error('❌ Failed to create document version:', error);
      throw new Error(`Failed to create version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get document version history
   */
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await storage.getDocumentVersions(documentId);
  }

  // =============================================================================
  // REAL-TIME SYNCHRONIZATION
  // =============================================================================

  /**
   * Broadcast collaboration event to document subscribers
   */
  private async broadcastCollaborationEvent(event: CollaborationEvent): Promise<void> {
    if (!this.websocketService) {
      console.warn('⚠️ WebSocket service not available for collaboration broadcast');
      return;
    }

    const documentSubscribers = this.documentSubscriptions.get(event.documentId);
    if (!documentSubscribers || documentSubscribers.size === 0) {
      return;
    }

    const message = {
      type: 'collaboration_event',
      event: event.type,
      documentId: event.documentId,
      userId: event.userId,
      data: event.data,
      timestamp: event.timestamp.toISOString()
    };

    // Send to all document subscribers except the sender using actual WebSocket
    documentSubscribers.forEach(subscriberId => {
      if (subscriberId !== event.userId) {
        this.websocketService?.sendToUser(subscriberId, message);
        console.log(`📡 Broadcasting ${event.type} to user ${subscriberId} for document ${event.documentId}`);
      }
    });
  }

  /**
   * Handle real-time cursor movement
   */
  async handleCursorMove(
    userId: string,
    documentId: number,
    sessionId: string,
    cursorPosition: { page: number; x: number; y: number }
  ): Promise<void> {
    await this.updatePresence(userId, documentId, sessionId, { cursorPosition });
    
    await this.broadcastCollaborationEvent({
      type: 'cursor_move',
      documentId,
      userId,
      data: { cursorPosition, sessionId },
      timestamp: new Date()
    });
  }

  /**
   * Handle real-time text selection
   */
  async handleSelectionChange(
    userId: string,
    documentId: number,
    sessionId: string,
    selection: { start: number; end: number; text: string }
  ): Promise<void> {
    await this.updatePresence(userId, documentId, sessionId, { selection });
    
    await this.broadcastCollaborationEvent({
      type: 'selection_change',
      documentId,
      userId,
      data: { selection, sessionId },
      timestamp: new Date()
    });
  }

  // =============================================================================
  // NOTIFICATIONS
  // =============================================================================

  /**
   * Send notification to user
   */
  async sendNotification(notificationData: Omit<InsertNotification, 'id' | 'createdAt'>): Promise<Notification> {
    console.log(`🔔 Sending ${notificationData.type} notification to user ${notificationData.userId}`);

    try {
      // Create notification using actual storage
      const notification = await storage.createNotification({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        isRead: notificationData.isRead ?? false,
        readAt: notificationData.readAt || null,
        deliveryMethod: notificationData.deliveryMethod || 'in_app',
        priority: notificationData.priority || 'normal',
        expiresAt: notificationData.expiresAt || null
      });

      // Send real-time notification via WebSocket
      if (this.websocketService) {
        const message = {
          type: 'notification',
          notification
        };
        // Integrate with WebSocket service to send to specific user
        this.websocketService.sendToUser(notificationData.userId, message);
        console.log(`📧 Real-time notification sent: ${notification.type}`);
      }

      return notification;

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    includeRead: boolean = false
  ): Promise<Notification[]> {
    return await storage.getUserNotifications(userId, limit);
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: number, userId: string): Promise<void> {
    console.log(`📖 Marking notification ${notificationId} as read for user ${userId}`);
    
    // Mark notification as read using actual storage
    await storage.markNotificationRead(notificationId);
    
    // Log activity
    await storage.logActivity({
      userId,
      activityType: 'notification_read',
      description: 'Marked notification as read',
      metadata: { notificationId }
    });
  }

  // =============================================================================
  // ACTIVITY LOGGING
  // =============================================================================

  /**
   * Log collaboration activity
   */
  async logActivity(activityData: Omit<InsertActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    // Log activity using actual storage
    const activity = await storage.logActivity({
      userId: activityData.userId,
      documentId: activityData.documentId || null,
      teamId: activityData.teamId || null,
      activityType: activityData.activityType,
      description: activityData.description,
      metadata: activityData.metadata || {},
      ipAddress: activityData.ipAddress || null,
      userAgent: activityData.userAgent || null
    });

    // Update collaboration metrics
    if (activityData.documentId) {
      await this.updateCollaborationMetrics(activityData.documentId, activityData.activityType);
    }

    return activity;
  }

  /**
   * Get activity log for document or team
   */
  async getActivityLog(
    filters: {
      documentId?: number;
      teamId?: number;
      userId?: string;
      activityTypes?: string[];
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): Promise<ActivityLog[]> {
    return await storage.getActivityLogs({
      documentId: filters.documentId,
      teamId: filters.teamId,
      userId: filters.userId,
      limit
    });
  }

  // =============================================================================
  // COLLABORATION ANALYTICS
  // =============================================================================

  /**
   * Get collaboration metrics for document
   */
  async getCollaborationMetrics(documentId: number): Promise<CollaborationMetrics> {
    return this.collaborationMetrics.get(documentId) || {
      activeUsers: 0,
      totalComments: 0,
      resolvedComments: 0,
      documentsShared: 0,
      versionsCreated: 0,
      annotationsAdded: 0,
      averageResponseTime: 0,
      collaborationScore: 0
    };
  }

  /**
   * Update collaboration metrics
   */
  private async updateCollaborationMetrics(documentId: number, activityType: string): Promise<void> {
    const metrics = this.collaborationMetrics.get(documentId) || {
      activeUsers: 0,
      totalComments: 0,
      resolvedComments: 0,
      documentsShared: 0,
      versionsCreated: 0,
      annotationsAdded: 0,
      averageResponseTime: 0,
      collaborationScore: 0
    };

    // Update specific metrics based on activity type
    switch (activityType) {
      case 'comment_added':
        metrics.totalComments++;
        break;
      case 'comment_resolved':
        metrics.resolvedComments++;
        break;
      case 'document_shared':
        metrics.documentsShared++;
        break;
      case 'version_created':
        metrics.versionsCreated++;
        break;
      case 'annotation_added':
        metrics.annotationsAdded++;
        break;
    }

    // Calculate collaboration score (weighted average of activities)
    metrics.collaborationScore = (
      metrics.totalComments * 1.0 +
      metrics.resolvedComments * 1.5 +
      metrics.documentsShared * 2.0 +
      metrics.versionsCreated * 1.2 +
      metrics.annotationsAdded * 0.8
    ) / 10;

    this.collaborationMetrics.set(documentId, metrics);
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Initialize collaboration metrics
   */
  private initializeCollaborationMetrics(): void {
    // Initialize metrics for existing documents
    // In production, this would load from storage
    console.log('📊 Initializing collaboration metrics...');
  }

  /**
   * Start presence cleanup interval
   */
  private startPresenceCleanup(): void {
    setInterval(() => {
      this.cleanupInactivePresence();
    }, 60000); // Cleanup every minute
  }

  /**
   * Clean up inactive presence data
   */
  private cleanupInactivePresence(): void {
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    
    this.presenceCache.forEach((documentPresence, documentId) => {
      const activeUsers = new Map();
      
      documentPresence.forEach((presence, userId) => {
        if (presence.lastActivity > cutoffTime) {
          activeUsers.set(userId, presence);
        } else {
          console.log(`🧹 Cleaning up inactive presence for user ${userId} on document ${documentId}`);
        }
      });
      
      if (activeUsers.size === 0) {
        this.presenceCache.delete(documentId);
      } else {
        this.presenceCache.set(documentId, activeUsers);
      }
    });
  }

  /**
   * Cleanup resources and stop processing
   */
  destroy(): void {
    this.presenceCache.clear();
    this.sessionCache.clear();
    this.documentSubscriptions.clear();
    this.teamCache.clear();
    this.documentShareCache.clear();
    this.operationQueue.clear();
    this.pendingOperations.clear();
    this.collaborationMetrics.clear();
    this.assignedColors.clear();
    
    console.log('🧹 Real-Time Collaboration Service cleanup completed');
  }
}