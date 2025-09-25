import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Gavel, 
  FileText, 
  Shield, 
  Search,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Briefcase
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";

export default function LegalDashboard() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [showUploadContractDialog, setShowUploadContractDialog] = useState(false);
  const { toast } = useToast();

  // Fetch legal documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Mock case data - in production, this would come from the database
  const cases = [
    { id: "1", name: "Smith v. Johnson", caseNumber: "CV-2024-001", status: "Active", deadline: "2024-02-15", priority: "high" },
    { id: "2", name: "Corporate Merger ABC", caseNumber: "M&A-2024-002", status: "Review", deadline: "2024-03-01", priority: "medium" },
    { id: "3", name: "Patent Dispute XYZ", caseNumber: "IP-2024-003", status: "Discovery", deadline: "2024-02-28", priority: "high" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legal Case Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Contract analysis, case management, and compliance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            data-testid="button-new-case"
            onClick={() => {
              toast({
                title: "New Case",
                description: "Opening case creation form...",
              });
              setShowNewCaseDialog(true);
            }}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            New Case
          </Button>
          <Button 
            className="bg-blue-900 hover:bg-blue-800" 
            data-testid="button-upload-contract"
            onClick={() => {
              toast({
                title: "Upload Contract",
                description: "Opening contract upload dialog...",
              });
              setShowUploadContractDialog(true);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Upload Contract
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Cases</p>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-green-600 mt-1">+3 this week</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gavel className="h-6 w-6 text-blue-900" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contracts Reviewed</p>
                <p className="text-2xl font-bold">186</p>
                <p className="text-xs text-blue-600 mt-1">98% accuracy</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-orange-600 mt-1">2 urgent</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Score</p>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Analysis Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-900" />
            Contract Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start" 
              data-testid="button-extract-clauses"
              onClick={() => {
                toast({
                  title: "Clause Extraction",
                  description: "Analyzing contract for key clauses and terms...",
                });
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Extract Key Clauses
            </Button>
            <Button 
              variant="outline" 
              className="justify-start" 
              data-testid="button-risk-analysis"
              onClick={() => {
                toast({
                  title: "Risk Analysis",
                  description: "Performing comprehensive risk assessment...",
                });
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Analysis
            </Button>
            <Button 
              variant="outline" 
              className="justify-start" 
              data-testid="button-compliance-check"
              onClick={() => {
                toast({
                  title: "Compliance Check",
                  description: "Running regulatory compliance validation...",
                });
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Compliance Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Cases</span>
                <Badge variant="outline">{cases.length} cases</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {cases.map((case_) => (
                  <div
                    key={case_.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                      selectedCase === case_.id ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                    onClick={() => setSelectedCase(case_.id)}
                    data-testid={`case-row-${case_.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{case_.name}</p>
                        <p className="text-sm text-gray-500">{case_.caseNumber}</p>
                        <p className="text-xs text-gray-400 mt-1">Deadline: {case_.deadline}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={case_.status === "Active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {case_.status}
                        </Badge>
                        <Badge 
                          className={`text-xs ${getPriorityColor(case_.priority)}`}
                          variant="outline"
                        >
                          {case_.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Details */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Case Type</p>
                        <p className="text-lg font-semibold">Civil Litigation</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Court</p>
                        <p className="text-lg font-semibold">Superior Court</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Judge</p>
                        <p className="text-lg font-semibold">Hon. Sarah Williams</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Filing Date</p>
                        <p className="text-lg font-semibold">Jan 15, 2024</p>
                      </div>
                    </div>
                    
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        Motion deadline approaching: Response due by February 15, 2024
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Case Summary</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This case involves a breach of contract dispute between two corporations regarding 
                        a software development agreement. The plaintiff alleges non-delivery of agreed-upon 
                        features while the defendant claims scope changes were not properly documented.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      {documents?.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{doc.originalFilename}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(doc.createdAt || '').toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="contracts" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Software Development Agreement</p>
                            <p className="text-sm text-gray-500">Executed: Dec 1, 2023</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Analyzed</Badge>
                        </div>
                        <div className="space-y-2 mt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Key Terms Extracted</span>
                            <span className="font-medium">24 clauses</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Risk Level</span>
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">Medium</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Amendment #1</p>
                            <p className="text-sm text-gray-500">Executed: Jan 5, 2024</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Processing</Badge>
                        </div>
                        <Progress value={65} className="h-2 mt-3" />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">Case Filed</p>
                          <p className="text-sm text-gray-500">January 15, 2024</p>
                          <p className="text-sm text-gray-600 mt-1">Initial complaint filed with court</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">Response Filed</p>
                          <p className="text-sm text-gray-500">January 30, 2024</p>
                          <p className="text-sm text-gray-600 mt-1">Defendant's answer submitted</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">Discovery Phase</p>
                          <p className="text-sm text-gray-500">Current</p>
                          <p className="text-sm text-gray-600 mt-1">Document exchange in progress</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">Trial Date</p>
                          <p className="text-sm text-gray-500">April 15, 2024</p>
                          <p className="text-sm text-gray-600 mt-1">Scheduled trial date</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Gavel className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a case to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Precedents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-900" />
            Relevant Precedents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="font-medium">Johnson v. Microsoft Corp.</p>
                <p className="text-sm text-gray-500">Software contract breach - Similar fact pattern</p>
              </div>
              <Badge variant="outline">95% match</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="font-medium">Apple Inc. v. Samsung</p>
                <p className="text-sm text-gray-500">IP dispute - Relevant arguments</p>
              </div>
              <Badge variant="outline">87% match</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Case Dialog */}
      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Enter case information to create a new legal matter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Case creation form would appear here</p>
            <Button 
              className="w-full"
              onClick={() => {
                setShowNewCaseDialog(false);
                toast({
                  title: "Success",
                  description: "New case created successfully!",
                });
              }}
            >
              Create Case
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Contract Dialog */}
      <Dialog open={showUploadContractDialog} onOpenChange={setShowUploadContractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
            <DialogDescription>
              Upload contracts for AI-powered analysis and review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Drop contracts here or click to browse</p>
              <p className="text-xs text-gray-500 mt-2">Supports PDF, DOCX, TXT formats</p>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                setShowUploadContractDialog(false);
                toast({
                  title: "Success",
                  description: "Contract uploaded and analysis started!",
                });
              }}
            >
              Upload & Analyze
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}