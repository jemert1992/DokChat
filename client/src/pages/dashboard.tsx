import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import DocumentCardSkeleton from "@/components/DocumentCardSkeleton";
import LoadingSpinner from "@/components/LoadingSpinner";
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
  // Single linear flow - no tabs needed

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner 
          fullScreen 
          size="lg" 
          message="Loading your dashboard..." 
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const industryConfig = getIndustryConfig(user.industry || 'general');

  // Shared function for all upload CTAs to scroll to upload zone
  const scrollToUpload = () => {
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
      uploadZone.scrollIntoView({ behavior: 'smooth' });
      uploadZone.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'scale-105', 'transition-all');
      setTimeout(() => {
        uploadZone.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-75', 'scale-105');
      }, 3000);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar 
          user={user} 
          currentPage="dashboard"
        />

        {/* Main Content Area */}
        <div className="flex-1 min-h-screen ml-72 transition-all duration-300">
          <ModernHeader user={user} onCreateNew={scrollToUpload} />

          <div className="px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Processing Status Banner */}
              {processingUpdates.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 animate-slideIn shadow-medium">
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

              {/* Single Linear Flow - Upload First, Then Recent Documents */}
              
              {/* Hero Upload Zone - Always Visible at Top */}
              <DocumentUploadZone 
                industry={user.industry || 'general'}
                onUploadComplete={() => {
                  // Refresh documents after upload
                  window.location.reload();
                }}
              />
              
              {/* Recent Documents Grid */}
              <div className="space-y-6 animate-fadeIn" data-testid="recent-documents">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Recent Documents
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Your processed {industryConfig.name.toLowerCase()} documents
                    </p>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    <i className="fas fa-database mr-1.5"></i>
                    {documents?.length || 0} documents
                  </Badge>
                </div>

                {documentsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <DocumentCardSkeleton key={i} />
                    ))}
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-animation">
                    {documents.map((document) => (
                      <Card 
                        key={document.id}
                        className="hover:shadow-lg transition-all cursor-pointer group card-hover animate-scaleIn"
                        onClick={() => setLocation(`/document/${document.id}`)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              document.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 
                              document.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                              'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <i className={`fas fa-file-alt text-lg ${
                                document.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                                document.status === 'processing' ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 
                                'text-gray-500'
                              }`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {document.originalFilename}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {document.status === 'completed' ? 'Ready' : 
                                   document.status === 'processing' ? 'Processing' : 
                                   document.status || 'Pending'}
                                </Badge>
                                {document.aiConfidence && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {Math.round(document.aiConfidence * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(document.createdAt || '').toLocaleDateString()}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                              View <i className="fas fa-arrow-right ml-1"></i>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-50 dark:bg-gray-900/50 border-dashed">
                    <CardContent className="text-center py-16">
                      <i className="fas fa-inbox text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No documents yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Upload your first document to get started
                      </p>
                      <Button 
                        size="lg"
                        onClick={scrollToUpload}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <i className="fas fa-upload mr-2"></i>
                        Upload Documents
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Industry Capabilities - Secondary Position */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <IndustryCapabilities 
                  userIndustry={user.industry || 'general'} 
                  onStartProcessing={scrollToUpload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}