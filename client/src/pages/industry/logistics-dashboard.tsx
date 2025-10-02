import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  MessageSquare, 
  Truck,
  Send,
  Brain,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Download,
  Home,
  Package,
  Globe
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Link, useLocation } from "wouter";
import DocumentUploadZone from "@/components/document-upload-zone";
import { motion } from "framer-motion";

export default function LogisticsDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. How can I help with your logistics operations?" }
  ]);

  // Fetch documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const handleSendMessage = () => {
    if (!aiPrompt.trim()) return;
    
    setChatMessages(prev => [
      ...prev,
      { role: "user", content: aiPrompt },
      { role: "assistant", content: `Processing logistics query: "${aiPrompt}". ${selectedDocument ? `Analyzing ${selectedDocument.originalFilename}...` : 'Please select a document first.'}` }
    ]);
    setAiPrompt("");
  };

  const logisticsDocuments = documents?.filter(doc => 
    doc.industry === 'logistics' || 
    doc.originalFilename?.toLowerCase().includes('logistics') ||
    doc.originalFilename?.toLowerCase().includes('shipping') ||
    doc.originalFilename?.toLowerCase().includes('customs') ||
    doc.originalFilename?.toLowerCase().includes('manifest')
  ) || [];

  const quickActions = [
    { icon: Package, label: "Extract Tracking Info", action: "Extract all tracking numbers, package IDs, and shipping details" },
    { icon: Globe, label: "Customs Compliance", action: "Check customs forms for compliance and identify any missing documentation" },
    { icon: FileSearch, label: "Verify Manifest", action: "Verify shipping manifest details and identify discrepancies" },
    { icon: Truck, label: "Route Analysis", action: "Analyze delivery routes and suggest optimizations" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              Logistics Document Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered shipping and customs document processing
            </p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
          Logistics Industry
        </Badge>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents & Upload
          </TabsTrigger>
          <TabsTrigger value="ai-chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Logistics Documents</CardTitle>
              <CardDescription>
                Upload shipping manifests, customs forms, bills of lading, or delivery receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Logistics Documents</CardTitle>
              <CardDescription>
                Select a document to analyze with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {logisticsDocuments.length > 0 ? (
                    logisticsDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-all ${
                          selectedDocument?.id === doc.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <p className="font-medium">{doc.originalFilename}</p>
                              {selectedDocument?.id === doc.id && (
                                <Badge variant="outline" className="text-xs">Selected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {doc.status === 'completed' ? 'Ready for analysis' : `Status: ${doc.status}`}
                            </p>
                            {doc.confidence && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-xs">Confidence: {doc.confidence}%</span>
                                </div>
                                {doc.documentType && (
                                  <Badge variant="outline" className="text-xs">
                                    {doc.documentType}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link href={`/document/${doc.id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                            {doc.status === 'completed' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocument(doc);
                                  const aiTab = document.querySelector('[value="ai-chat"]') as HTMLElement;
                                  aiTab?.click();
                                }}
                              >
                                <Brain className="h-3 w-3 mr-1" />
                                Analyze
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No logistics documents uploaded yet</p>
                      <p className="text-sm mt-2">Upload your first document above to get started</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="ai-chat" className="space-y-4 mt-4">
          {selectedDocument ? (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="flex justify-between items-center">
                <span>Analyzing: <strong>{selectedDocument.originalFilename}</strong></span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedDocument(null)}
                >
                  Change Document
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Please select a document from the Documents tab first to start AI analysis
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Logistics AI Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your logistics documents or use quick actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start"
                    disabled={!selectedDocument}
                    onClick={() => {
                      setChatMessages(prev => [
                        ...prev,
                        { role: "user", content: action.action },
                        { role: "assistant", content: `Processing logistics data: ${action.action}...` }
                      ]);
                    }}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Chat Messages */}
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask about tracking, customs, routes, delivery status, compliance..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[80px]"
                  disabled={!selectedDocument}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!selectedDocument || !aiPrompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {selectedDocument?.status === 'completed' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Analysis
                  </Button>
                  <Link href={`/document/${selectedDocument.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Report
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}