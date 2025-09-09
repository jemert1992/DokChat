import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@shared/schema";

interface RecentActivityProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentClick: (documentId: number) => void;
}

export default function RecentActivity({ documents, isLoading, onDocumentClick }: RecentActivityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle';
      case 'processing': return 'fas fa-clock';
      case 'error': return 'fas fa-exclamation-circle';
      default: return 'fas fa-file';
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
    if (mimeType.includes('word')) return 'fas fa-file-word';
    if (mimeType.includes('image')) return 'fas fa-file-image';
    return 'fas fa-file-alt';
  };

  const formatTimeAgo = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getConfidenceDisplay = (document: Document) => {
    if (document.status === 'completed' && document.aiConfidence) {
      return `${Math.round(document.aiConfidence * 100)}% confidence`;
    }
    if (document.status === 'processing') {
      return `${document.processingProgress || 0}% complete`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentDocuments = documents.slice(0, 5);

  return (
    <Card data-testid="recent-activity">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <Button variant="ghost" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {recentDocuments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8" data-testid="empty-state">
              <i className="fas fa-inbox text-4xl mb-4 opacity-50"></i>
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-2">Upload your first document to get started</p>
            </div>
          ) : (
            recentDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors cursor-pointer"
                onClick={() => onDocumentClick(document.id)}
                data-testid={`document-${document.id}`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className={`${getDocumentIcon(document.mimeType)} text-primary`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {document.originalFilename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(document.createdAt)} • {getConfidenceDisplay(document)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {document.status === 'processing' ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${
                        document.status === 'completed' ? 'bg-green-500' :
                        document.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></span>
                      <Badge 
                        variant={document.status === 'completed' ? 'default' : 'secondary'}
                        className={`text-xs ${getStatusColor(document.status || '')}`}
                      >
                        {document.status === 'completed' ? 'Complete' :
                         document.status === 'processing' ? 'Processing' :
                         document.status === 'error' ? 'Error' : 'Unknown'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
