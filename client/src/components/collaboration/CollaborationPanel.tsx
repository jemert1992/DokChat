import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageCircle, 
  Share, 
  Clock, 
  Send, 
  Eye, 
  Edit,
  UserPlus,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CollaborationPanelProps {
  documentId: number;
  documentTitle: string;
}

interface PresenceInfo {
  userId: string;
  userName: string;
  status: 'active' | 'idle' | 'disconnected';
  activity: 'viewing' | 'editing' | 'commenting';
  cursorPosition?: { page: number; x: number; y: number };
  userColor: string;
  lastActivity: string;
}

interface Comment {
  id: number;
  content: string;
  userId: string;
  userName: string;
  commentType: 'general' | 'annotation' | 'suggestion' | 'issue';
  position?: {
    page?: number;
    coordinates?: { x: number; y: number };
    textRange?: { start: number; end: number };
  };
  isResolved: boolean;
  mentions: string[];
  replies?: Comment[];
  createdAt: string;
}

interface DocumentShare {
  id: number;
  userId?: string;
  teamId?: number;
  userName?: string;
  teamName?: string;
  accessLevel: 'view' | 'comment' | 'edit' | 'manage';
  sharedBy: string;
  expiresAt?: string;
  createdAt: string;
}

interface Version {
  id: number;
  versionNumber: number;
  title?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export default function CollaborationPanel({ documentId, documentTitle }: CollaborationPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('presence');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active presence
  const { data: presence = [], isLoading: presenceLoading } = useQuery<PresenceInfo[]>({
    queryKey: ['/api/documents', documentId, 'sessions'],
    enabled: isExpanded && !!documentId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/documents', documentId, 'comments'],
    enabled: isExpanded && !!documentId,
  });

  // Fetch shares
  const { data: shares = [], isLoading: sharesLoading } = useQuery<DocumentShare[]>({
    queryKey: ['/api/documents', documentId, 'shares'],
    enabled: isExpanded && !!documentId,
  });

  // Fetch versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<Version[]>({
    queryKey: ['/api/documents', documentId, 'versions'],
    enabled: isExpanded && !!documentId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; commentType: string }) => {
      return await apiRequest(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'comments'] });
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Comment Error",
        description: error.message || "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resolve comment mutation
  const resolveCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}/resolve`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'comments'] });
      toast({
        title: "Comment Resolved",
        description: "Comment has been marked as resolved.",
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({
      content: newComment,
      commentType: 'general'
    });
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'editing': return <Edit className="h-3 w-3" />;
      case 'commenting': return <MessageCircle className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'manage': return 'bg-red-100 text-red-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'comment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isExpanded) {
    return (
      <Card className="fixed right-4 top-20 w-16 shadow-lg" data-testid="collaboration-panel-collapsed">
        <CardContent className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full"
            data-testid="button-expand-collaboration"
          >
            <Users className="h-4 w-4" />
          </Button>
          {presence.length > 0 && (
            <Badge 
              variant="secondary" 
              className="mt-1 text-xs"
              data-testid="badge-active-users"
            >
              {presence.length}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed right-4 top-20 w-80 max-h-[80vh] shadow-lg" data-testid="collaboration-panel-expanded">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" data-testid="text-collaboration-title">
            Collaboration
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            data-testid="button-collapse-collaboration"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-collaboration">
            <TabsTrigger value="presence" data-testid="tab-presence">
              <Users className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="comments" data-testid="tab-comments">
              <MessageCircle className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="sharing" data-testid="tab-sharing">
              <Share className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="versions" data-testid="tab-versions">
              <Clock className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {/* Presence Tab */}
          <TabsContent value="presence" className="p-4" data-testid="content-presence">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium" data-testid="text-active-users-title">
                  Active Users ({presence.length})
                </h3>
                <Button size="sm" variant="outline" data-testid="button-invite-users">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
              </div>
              
              {presenceLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center space-x-2 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="h-4 bg-gray-200 rounded flex-1" />
                    </div>
                  ))}
                </div>
              ) : presence.length === 0 ? (
                <p className="text-sm text-gray-500" data-testid="text-no-active-users">
                  No other users active
                </p>
              ) : (
                <div className="space-y-2">
                  {presence.map((user) => (
                    <div 
                      key={user.userId} 
                      className="flex items-center space-x-2"
                      data-testid={`user-presence-${user.userId}`}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ backgroundColor: user.userColor }}>
                            {user.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
                          data-testid={`status-indicator-${user.userId}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-username-${user.userId}`}>
                          {user.userName}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getActivityIcon(user.activity)}
                          <span className="text-xs text-gray-500" data-testid={`text-activity-${user.userId}`}>
                            {user.activity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="p-4" data-testid="content-comments">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium" data-testid="text-comments-title">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Add comment form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none text-sm"
                  rows={2}
                  data-testid="textarea-new-comment"
                />
                <div className="flex justify-between">
                  <div className="text-xs text-gray-500">
                    Use @username to mention someone
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    data-testid="button-add-comment"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {addCommentMutation.isPending ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments list */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {commentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full" />
                          <div className="h-3 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="h-8 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center" data-testid="text-no-comments">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="space-y-2 p-2 border rounded-lg"
                      data-testid={`comment-${comment.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {comment.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium" data-testid={`text-comment-author-${comment.id}`}>
                            {comment.userName}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            data-testid={`badge-comment-type-${comment.id}`}
                          >
                            {comment.commentType}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!comment.isResolved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveCommentMutation.mutate(comment.id)}
                              data-testid={`button-resolve-comment-${comment.id}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm" data-testid={`text-comment-content-${comment.id}`}>
                        {comment.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span data-testid={`text-comment-time-${comment.id}`}>
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                        {comment.isResolved && (
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-resolved-${comment.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="p-4" data-testid="content-sharing">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium" data-testid="text-shares-title">
                  Document Access ({shares.length})
                </h3>
                <Button size="sm" variant="outline" data-testid="button-share-document">
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sharesLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full" />
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : shares.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center" data-testid="text-no-shares">
                    Document not shared with anyone
                  </p>
                ) : (
                  shares.map((share) => (
                    <div 
                      key={share.id} 
                      className="flex items-center justify-between p-2 border rounded"
                      data-testid={`share-${share.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {(share.userName || share.teamName || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-share-name-${share.id}`}>
                            {share.userName || share.teamName}
                          </p>
                          <p className="text-xs text-gray-500" data-testid={`text-share-type-${share.id}`}>
                            {share.teamId ? 'Team' : 'User'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`text-xs ${getAccessLevelColor(share.accessLevel)}`}
                        data-testid={`badge-access-level-${share.id}`}
                      >
                        {share.accessLevel}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="p-4" data-testid="content-versions">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium" data-testid="text-versions-title">
                  Version History ({versions.length})
                </h3>
                <Button size="sm" variant="outline" data-testid="button-create-version">
                  <Clock className="h-3 w-3 mr-1" />
                  Save Version
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-1 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    ))}
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center" data-testid="text-no-versions">
                    No versions saved yet
                  </p>
                ) : (
                  versions.map((version) => (
                    <div 
                      key={version.id} 
                      className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      data-testid={`version-${version.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-version-title-${version.id}`}>
                            {version.title || `Version ${version.versionNumber}`}
                          </p>
                          <p className="text-xs text-gray-500" data-testid={`text-version-author-${version.id}`}>
                            by {version.createdBy}
                          </p>
                        </div>
                        {version.isActive && (
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-active-version-${version.id}`}>
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1" data-testid={`text-version-time-${version.id}`}>
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.description && (
                        <p className="text-xs text-gray-600 mt-1" data-testid={`text-version-description-${version.id}`}>
                          {version.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}