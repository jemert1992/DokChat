import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import DocumentUploadZone from "@/components/document-upload-zone";
import RecentActivity from "@/components/recent-activity";
import AdvancedAnalytics from "@/components/advanced-analytics";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getIndustryConfig } from "@/lib/industry-config";
import type { User, Document } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isConnected, processingUpdates } = useWebSocket();
  const [activeTab, setActiveTab] = useState("overview");

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

  const industryConfig = getIndustryConfig(user.industry || 'general');

  const handleNewDocument = () => {
    // Focus on the upload zone
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
      uploadZone.scrollIntoView({ behavior: 'smooth' });
      uploadZone.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
      setTimeout(() => {
        uploadZone.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
      }, 2000);
    }
  };

  return (
    <div className={`min-h-screen bg-background industry-${user.industry}`}>
      <div className="flex">
        <Sidebar user={user} currentPage="dashboard" />

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                  {industryConfig.dashboardTitle}
                </h1>
                <p className="text-muted-foreground" data-testid="text-dashboard-subtitle">
                  {industryConfig.dashboardSubtitle}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleNewDocument}
                  data-testid="button-new-document"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Document
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <i className="fas fa-bell"></i>
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Connection Status */}
            {processingUpdates.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-sync-alt animate-spin text-blue-600"></i>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {processingUpdates.length} document{processingUpdates.length > 1 ? 's' : ''} processing...
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    {isConnected ? 'Live Updates' : 'Connecting...'}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {processingUpdates.slice(0, 3).map((update) => (
                    <div key={update.documentId} className="flex items-center justify-between text-sm">
                      <span>Document {update.documentId}: {update.message}</span>
                      <div className="flex items-center space-x-2">
                        {update.stage && (
                          <Badge variant="secondary" className="text-xs">
                            {update.stage.replace('_', ' ')}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {update.progress}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {processingUpdates.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{processingUpdates.length - 3} more documents processing...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Main Dashboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
                <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <DashboardStats 
                  stats={stats} 
                  isLoading={statsLoading} 
                  industry={user.industry || 'general'} 
                />

                {/* Document Upload and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <DocumentUploadZone 
                    industry={user.industry || 'general'}
                    onUploadComplete={() => {
                      // Refresh documents list
                      window.location.reload();
                    }}
                  />
                  <RecentActivity 
                    documents={documents || []} 
                    isLoading={documentsLoading}
                    onDocumentClick={(documentId) => setLocation(`/document/${documentId}`)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <AdvancedAnalytics 
                  industry={user.industry || 'general'} 
                  userId={user.id}
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
                    <p className="text-muted-foreground">
                      Upload documents for AI-powered analysis with {industryConfig.name} optimization
                    </p>
                  </div>
                  <DocumentUploadZone 
                    industry={user.industry || 'general'}
                    onUploadComplete={() => {
                      // Switch to activity tab to see processing
                      setActiveTab("activity");
                      window.location.reload();
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Document Activity</h2>
                    <p className="text-muted-foreground">
                      Track processing status and view completed analysis
                    </p>
                  </div>
                  <RecentActivity 
                    documents={documents || []} 
                    isLoading={documentsLoading}
                    onDocumentClick={(documentId) => setLocation(`/document/${documentId}`)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
