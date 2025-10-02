import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getIndustryConfig } from "@/lib/industry-config";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DocumentUploadZoneProps {
  industry: string;
  onUploadComplete?: () => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
}

export default function DocumentUploadZone({ industry, onUploadComplete }: DocumentUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'comprehensive'>('quick');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const industryConfig = getIndustryConfig(industry);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('industry', industry);
      formData.append('analysisMode', analysisMode);
      
      const response = await apiRequest('POST', '/api/documents/upload-bulk', formData);
      return response.json();
    },
    onSuccess: (data) => {
      const count = data.documents ? data.documents.length : 1;
      toast({
        title: "Upload Successful",
        description: `${count} document${count > 1 ? 's have' : ' has'} been uploaded and ${count > 1 ? 'are' : 'is'} being processed.`,
      });
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      onUploadComplete?.();
      setUploadProgresses([]);
      setIsUploading(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
      setUploadProgresses([]);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const progresses: UploadProgress[] = [];

    // Validate all files
    Array.from(files).forEach(file => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: `Invalid File Type: ${file.name}`,
          description: "Please upload PDF, DOC, DOCX, JPG, or PNG files only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: `File Too Large: ${file.name}`,
          description: "Please upload files smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
      progresses.push({
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgresses(progresses);

    // Simulate upload progress for each file
    const progressInterval = setInterval(() => {
      setUploadProgresses(prev => prev.map(p => {
        if (p.status === 'completed' || p.progress >= 90) {
          return p;
        }
        return {
          ...p,
          progress: Math.min(90, p.progress + Math.random() * 20)
        };
      }));
      
      // Clear interval when all files reach 90%
      setUploadProgresses(prev => {
        const allReached90 = prev.every(p => p.progress >= 90 || p.status === 'completed');
        if (allReached90) {
          clearInterval(progressInterval);
        }
        return prev;
      });
    }, 200);

    uploadMutation.mutate(validFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-950 animate-fadeIn hover-lift">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Documents</h2>
          <p className="text-gray-600 dark:text-gray-400">Powerful AI analysis for {industry} documents</p>
          <Badge className="mt-2 bg-green-100 text-green-800" variant="secondary">
            <i className="fas fa-layer-group mr-2"></i>
            Bulk Upload Enabled - Select Multiple Files
          </Badge>
        </div>

        {/* Analysis Mode Toggle */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="analysis-mode" className="text-sm font-medium">
                Analysis Mode: <span className="font-bold text-primary">
                  {analysisMode === 'quick' ? '⚡ Quick Analysis' : '🔬 Comprehensive Analysis'}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground">
                {analysisMode === 'quick' 
                  ? 'Fast processing (30-60 seconds) with essential extractions' 
                  : 'Detailed analysis (3-5 minutes) with advanced AI features'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="analysis-mode" className="text-xs">Quick</Label>
              <Switch
                id="analysis-mode"
                checked={analysisMode === 'comprehensive'}
                onCheckedChange={(checked) => setAnalysisMode(checked ? 'comprehensive' : 'quick')}
                data-testid="switch-analysis-mode"
              />
              <Label htmlFor="analysis-mode" className="text-xs">Comprehensive</Label>
            </div>
          </div>
        </div>
        
        <div
          id="upload-zone"
          className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer min-h-[300px] flex flex-col items-center justify-center ${
            isDragOver 
              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 scale-105 shadow-lg' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:shadow-md'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="upload-zone"
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            <i className="fas fa-cloud-upload-alt text-blue-600 dark:text-blue-400 text-4xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 max-w-md" data-testid="upload-description">
            {industryConfig.uploadDescription}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4">
            <i className="fas fa-info-circle mr-2"></i>
            Select or drop multiple files for bulk upload
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Badge variant="secondary" className="px-3 py-1">
              <i className="fas fa-file-pdf mr-2 text-red-500"></i>
              PDF
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <i className="fas fa-file-word mr-2 text-blue-500"></i>
              DOC/DOCX
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <i className="fas fa-file-image mr-2 text-green-500"></i>
              JPG/PNG
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Max 50MB per file
            </Badge>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => handleFileSelect(e.target.files)}
          data-testid="file-input"
        />

        {/* Upload Progress for Multiple Files */}
        {isUploading && uploadProgresses.length > 0 && (
          <div className="mt-4 space-y-3 animate-slideIn" data-testid="upload-progress">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Uploading {uploadProgresses.length} document{uploadProgresses.length > 1 ? 's' : ''}<span className="loading-dots"></span>
              </span>
            </div>
            {uploadProgresses.map((file, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[200px]">{file.fileName}</span>
                  <span data-testid={`progress-percentage-${index}`} className="font-semibold">
                    {Math.round(file.progress)}%
                  </span>
                </div>
                <Progress value={file.progress} className="h-2 transition-all duration-300" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}