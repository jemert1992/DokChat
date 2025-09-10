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
import MedicalDashboard from "@/components/MedicalDashboard";
import LegalDashboard from "@/components/LegalDashboard";
import LogisticsDashboard from "@/components/LogisticsDashboard";
import RealEstateDashboard from "@/components/RealEstateDashboard";
import FinanceDashboard from "@/components/FinanceDashboard";
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

  // Render industry-specific dashboard component
  const renderIndustryDashboard = () => {
    const industry = user.industry || 'general';
    
    switch (industry) {
      case 'medical':
        return <MedicalDashboard documents={documents || []} isLoading={documentsLoading} />;
      case 'legal':
        return <LegalDashboard documents={documents || []} isLoading={documentsLoading} />;
      case 'logistics':
        return <LogisticsDashboard documents={documents || []} isLoading={documentsLoading} />;
      case 'real_estate':
        return <RealEstateDashboard documents={documents || []} isLoading={documentsLoading} />;
      case 'finance':
        return <FinanceDashboard documents={documents || []} isLoading={documentsLoading} />;
      case 'general':
      default:
        return (
          <div className="space-y-6" data-testid="general-business-dashboard">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">General Business Dashboard</h3>
              <p className="text-muted-foreground mb-8">
                Comprehensive document processing for general business operations. 
                Process invoices, contracts, reports, and business correspondence with AI-powered analysis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">Document Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract key information from business documents with high accuracy
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">Data Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically identify contacts, dates, financial data, and entities
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">Quality Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive quality scoring and processing performance metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="industry" data-testid="tab-industry">{industryConfig.name} Dashboard</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Advanced Analytics</TabsTrigger>
                <TabsTrigger value="upload" data-testid="tab-upload">Upload Documents</TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6" data-testid="content-overview">
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

              <TabsContent value="industry" className="space-y-6" data-testid="content-industry">
                {renderIndustryDashboard()}
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
