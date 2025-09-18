import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import ModernHeader from "@/components/modern-header";
import IndustryCapabilities from "@/components/template-cards";
import ModernAnalyticsWidgets from "@/components/modern-analytics-widgets";
import DashboardStats from "@/components/dashboard-stats";
import DocumentUploadZone from "@/components/document-upload-zone";
import RecentActivity from "@/components/recent-activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getIndustryConfig } from "@/lib/industry-config";
import type { User, Document } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isConnected, processingUpdates } = useWebSocket();
  const [activeView, setActiveView] = useState("capabilities"); // capabilities, analytics, documents

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

  const { data: stats, isLoading: statsLoading } = useQuery<{
    documentsProcessed: number;
    avgConfidence: number;
    avgProcessingTime: number;
    complianceScore: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
    retry: false,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const industryConfig = getIndustryConfig(user.industry || 'general');

  const handleCreateNew = () => {
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
      uploadZone.scrollIntoView({ behavior: 'smooth' });
      uploadZone.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        uploadZone.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  const handleStartProcessing = () => {
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
      uploadZone.scrollIntoView({ behavior: 'smooth' });
      uploadZone.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        uploadZone.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar 
          user={user} 
          currentPage={activeView} 
          onNavigate={(view: string) => setActiveView(view)}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-h-screen">
          <ModernHeader user={user} onCreateNew={handleCreateNew} />

          <div className="px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Processing Status Banner */}
              {processingUpdates.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <i className="fas fa-sync-alt animate-spin text-white"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            Processing {processingUpdates.length} document{processingUpdates.length > 1 ? 's' : ''}...
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            AI analysis in progress with real-time updates
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <i className="fas fa-circle text-xs mr-1.5 animate-pulse"></i>
                        {isConnected ? 'Live' : 'Connecting...'}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      {processingUpdates.slice(0, 2).map((update) => (
                        <div key={update.documentId} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">
                            Document {update.documentId}: {update.message}
                          </span>
                          <div className="flex items-center space-x-2">
                            {update.stage && (
                              <Badge variant="outline" className="text-xs">
                                {update.stage.replace('_', ' ')}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {update.progress}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Toggle Navigation */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
                <button
                  onClick={() => setActiveView("capabilities")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === "capabilities"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                  data-testid="view-capabilities"
                >
                  <i className="fas fa-layer-group mr-2"></i>
                  Capabilities
                </button>
                <button
                  onClick={() => setActiveView("analytics")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === "analytics"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                  data-testid="view-analytics"
                >
                  <i className="fas fa-chart-line mr-2"></i>
                  Analytics
                </button>
                <button
                  onClick={() => setActiveView("documents")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === "documents"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                  data-testid="view-documents"
                >
                  <i className="fas fa-folder-open mr-2"></i>
                  Documents
                </button>
              </div>

              {/* Main Content Based on Active View */}
              {activeView === "capabilities" && (
                <IndustryCapabilities 
                  userIndustry={user.industry || 'general'} 
                  onStartProcessing={handleStartProcessing}
                />
              )}

              {activeView === "analytics" && (
                <div className="space-y-8">
                  {/* Performance Stats */}
                  <DashboardStats 
                    stats={stats} 
                    isLoading={statsLoading} 
                    industry={user.industry || 'general'} 
                  />

                  {/* Modern Analytics Widgets */}
                  <ModernAnalyticsWidgets 
                    industry={user.industry || 'general'}
                    stats={stats}
                    isLoading={statsLoading}
                  />
                </div>
              )}

              {activeView === "documents" && (
                <div className="space-y-8">
                  {/* Upload and Activity */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <DocumentUploadZone 
                      industry={user.industry || 'general'}
                      onUploadComplete={() => {
                        // Refresh documents and switch to analytics view
                        window.location.reload();
                      }}
                    />
                    <RecentActivity 
                      documents={documents || []} 
                      isLoading={documentsLoading}
                      onDocumentClick={(documentId) => setLocation(`/document/${documentId}`)}
                    />
                  </div>

                  {/* Document Library */}
                  <Card data-testid="document-library">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {industryConfig.documentLibraryLabel}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and analyze your {industryConfig.name.toLowerCase()} documents
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="px-3 py-1">
                            <i className="fas fa-database mr-1.5"></i>
                            {documents?.length || 0} documents
                          </Badge>
                        </div>
                      </div>

                      {documents && documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {documents.slice(0, 6).map((document) => (
                            <div
                              key={document.id}
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setLocation(`/document/${document.id}`)}
                            >
                              <div className="flex items-center space-x-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  document.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 
                                  document.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                                  'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <i className={`fas fa-file-alt ${
                                    document.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                                    document.status === 'processing' ? 'text-blue-600 dark:text-blue-400' : 
                                    'text-gray-500'
                                  }`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {document.originalFilename}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <Badge variant="secondary" className="text-xs">
                                      {document.status === 'completed' ? 'Ready' : 
                                       document.status === 'processing' ? 'Processing' : 
                                       document.status || 'Unknown'}
                                    </Badge>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                {document.aiConfidence && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    <i className="fas fa-brain mr-1"></i>
                                    {Math.round(document.aiConfidence * 100)}% AI confidence
                                  </div>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-xs h-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/document/${document.id}`);
                                  }}
                                  data-testid={`view-document-${document.id}`}
                                >
                                  View <i className="fas fa-arrow-right ml-1"></i>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <i className="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                          <p>No documents uploaded yet</p>
                          <Button 
                            className="mt-4" 
                            onClick={handleCreateNew}
                          >
                            Upload your first document
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}