import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import DocumentUploadZone from "@/components/document-upload-zone";
import RecentActivity from "@/components/recent-activity";
import { Button } from "@/components/ui/button";
import { getIndustryConfig } from "@/lib/industry-config";
import type { User, Document } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
            {/* Stats Cards */}
            <DashboardStats 
              stats={stats} 
              isLoading={statsLoading} 
              industry={user.industry || 'general'} 
            />

            {/* Document Upload and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
