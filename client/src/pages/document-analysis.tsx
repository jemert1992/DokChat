import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Document, DocumentAnalysis, ExtractedEntity } from "@shared/schema";
import ExtractedDataDisplay from "@/components/ExtractedDataDisplay";
import DocumentChat from '@/components/DocumentChat';
import { useWebSocket } from "@/hooks/useWebSocket";
import { Loader2 } from "lucide-react";
// import CollaborationPanel from '@/components/collaboration/CollaborationPanel'; // Temporarily disabled
// import { useCollaboration } from '@/hooks/useCollaboration'; // Temporarily disabled

interface DocumentAnalysisProps {
  params: { id: string };
}

export default function DocumentAnalysis({ params }: DocumentAnalysisProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const documentId = params.id;

  // WebSocket for real-time progress updates
  const { processingUpdates } = useWebSocket();
  const progressUpdate = processingUpdates.find(u => u.documentId === documentId);

  // Collaboration temporarily disabled to prevent infinite loops during document processing
  const isConnected = false;
  const currentSession = null;
  const updatePresence = () => {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: document, isLoading: documentLoading, error } = useQuery<Document & {
    analyses?: DocumentAnalysis[];
    entities?: ExtractedEntity[];
  }>({
    queryKey: ["/api/documents", documentId],
    enabled: !!user && !!documentId,
    retry: false,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 3000 : false;
    },
  });

  const handleExport = () => {
    if (!document) return;
    
    const exportData = {
      document: document.originalFilename,
      analysisResults: document.extractedData,
      confidence: {
        ocr: document.ocrConfidence,
        ai: document.aiConfidence
      },
      entities: document.entities,
      extractedText: document.extractedText
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.originalFilename}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Document Analysis - ${document?.originalFilename}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Document analysis link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-exclamation-triangle text-destructive text-4xl mb-4"></i>
            <h2 className="text-xl font-bold text-foreground mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested document could not be found or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (documentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar user={user} currentPage="analysis" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading document analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  return (
    <div className={`min-h-screen bg-background industry-${user.industry}`}>
      <div className="flex">
        <Sidebar user={user} currentPage="analysis" />

        {/* Analysis Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-back"
                >
                  <i className="fas fa-arrow-left"></i>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-analysis-title">
                    Document Analysis
                  </h1>
                  <p className="text-muted-foreground" data-testid="text-document-name">
                    {document?.originalFilename}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleExport} data-testid="button-export">
                  <i className="fas fa-download mr-2"></i>
                  Export Results
                </Button>
                <Button variant="outline" onClick={handleShare} data-testid="button-share">
                  <i className="fas fa-share mr-2"></i>
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="p-6">
            {/* Status and Confidence Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 ${getStatusColor(document?.status || 'unknown')} rounded-full`}></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                        {document.status === 'processing' && progressUpdate?.status === 'processing' && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        {document.status === 'completed' ? 'Analysis Complete' : 
                         document.status === 'processing' ? 'Processing...' : 
                         'Analysis Failed'}
                        {document.status === 'processing' && progressUpdate?.status === 'processing' && (
                          <span className="text-sm font-normal text-blue-600">
                            {progressUpdate.progress}%
                          </span>
                        )}
                      </h3>
                      <p className="text-muted-foreground">
                        {document.status === 'processing' && progressUpdate?.message ? progressUpdate.message :
                         (document.status === 'completed' ? 'Document processed successfully with high confidence' :
                          document.status === 'processing' ? document.processingMessage || 'Processing document...' :
                          document.processingMessage || 'Processing failed')}
                      </p>
                      {document.status === 'processing' && progressUpdate?.status === 'processing' && (
                        <div className="mt-3">
                          <Progress value={progressUpdate.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  {document.status === 'completed' && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 mb-1" data-testid="text-confidence-score">
                        {Math.round((document.aiConfidence || 0) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Confidence Score</div>
                    </div>
                  )}
                </div>
                
                {document.status === 'completed' && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-xl font-semibold text-foreground">OCR Quality</div>
                      <div className="text-2xl font-bold text-blue-600" data-testid="text-ocr-confidence">
                        {Math.round((document.ocrConfidence || 0) * 100)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-xl font-semibold text-foreground">AI Analysis</div>
                      <div className="text-2xl font-bold text-green-600" data-testid="text-ai-confidence">
                        {Math.round((document.aiConfidence || 0) * 100)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-xl font-semibold text-foreground">Data Extraction</div>
                      <div className="text-2xl font-bold text-purple-600" data-testid="text-extraction-score">
                        {Math.round(((document.ocrConfidence || 0) + (document.aiConfidence || 0)) / 2 * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {document.status === 'completed' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Extracted Data */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <i className="fas fa-database text-primary mr-2"></i>
                      Extracted Data
                    </h3>
                    
                    <div className="space-y-4" data-testid="section-extracted-data">
                      {document.extractedData && typeof document.extractedData === 'object' ? (
                        <ExtractedDataDisplay data={document.extractedData} />
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                          <p>No structured data extracted</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Entities and Insights */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <i className="fas fa-lightbulb text-primary mr-2"></i>
                      Insights & Entities
                    </h3>
                    
                    <div className="space-y-4" data-testid="section-insights">
                      {document.entities && document.entities.length > 0 ? (
                        document.entities.map((entity: any, index: number) => (
                          <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                <i className="fas fa-tag text-white text-xs"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                                  {entity.entityType.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                  {entity.entityValue}
                                </p>
                                {entity.confidenceScore && (
                                  <Badge variant="secondary" className="mt-2">
                                    {Math.round(entity.confidenceScore * 100)}% confidence
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <i className="fas fa-lightbulb text-4xl mb-4 opacity-50"></i>
                          <p>No entities or insights extracted</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted Text Preview */}
                {document.extractedText && (
                  <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <i className="fas fa-file-alt text-primary mr-2"></i>
                          Extracted Text
                        </h3>
                        <Button variant="outline" size="sm" data-testid="button-view-full-text">
                          View Full Text
                        </Button>
                      </div>
                      
                      <div className="bg-accent/30 rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="section-extracted-text">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                          {document.extractedText}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {document.status === 'processing' && (
              <Card>
                <CardContent className="p-12 text-center">
                  {/* Large Spinning Loader */}
                  <Loader2 className="w-20 h-20 mx-auto mb-6 animate-spin text-primary" />
                  
                  {/* Processing Status */}
                  <h3 className="text-2xl font-bold text-foreground mb-3" data-testid="text-processing-title">
                    Processing Document
                  </h3>
                  
                  {/* Live Status Message from WebSocket */}
                  <p className="text-muted-foreground mb-6 text-lg" data-testid="text-processing-message">
                    {progressUpdate?.message || document.processingMessage || 'Starting document analysis...'}
                  </p>
                  
                  {/* Progress Bar with Percentage */}
                  <div className="max-w-md mx-auto mb-4">
                    <Progress 
                      value={progressUpdate?.progress || document.processingProgress || 0} 
                      className="h-3 mb-3" 
                      data-testid="progress-bar"
                    />
                    <p className="text-sm font-semibold text-primary" data-testid="text-progress-percentage">
                      {progressUpdate?.progress || document.processingProgress || 0}% complete
                    </p>
                  </div>
                  
                  {/* Processing Details */}
                  {progressUpdate?.message && (
                    <div className="mt-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        Real-time updates via Google Vision OCR and AI analysis
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {document.status === 'error' && (
              <Card>
                <CardContent className="p-6 text-center">
                  <i className="fas fa-exclamation-triangle text-destructive text-4xl mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Processing Failed</h3>
                  <p className="text-muted-foreground mb-4">
                    {document.processingMessage || 'An error occurred while processing your document.'}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Document Chat - Only show for completed documents */}
      {document && document.status === 'completed' && (
        <DocumentChat 
          documentId={parseInt(documentId)} 
          documentTitle={document.originalFilename} 
        />
      )}

      {/* Real-Time Collaboration Panel - Temporarily disabled to prevent infinite loops */}
      {/* {document && document.status === 'completed' && (
        <CollaborationPanel
          documentId={parseInt(documentId)}
          documentTitle={document.originalFilename}
        />
      )} */}
    </div>
  );
}
