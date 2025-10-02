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
  Activity,
  Send,
  Brain,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Download,
  Home,
  Pill,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Link, useLocation } from "wouter";
import DocumentUploadZone from "@/components/document-upload-zone";
import { motion } from "framer-motion";

export default function MedicalDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "Hello! I'm your medical document AI assistant. Upload medical documents and I can help you analyze multiple documents together - comparing patient information, tracking treatment progress across visits, correlating lab results with diagnoses, and more. What would you like me to analyze?" }
  ]);

  // Fetch documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const handleSendMessage = () => {
    if (!aiPrompt.trim()) return;
    
    const docNames = selectedDocuments.map(d => d.originalFilename).join(", ");
    setChatMessages(prev => [
      ...prev,
      { role: "user", content: aiPrompt },
      { role: "assistant", content: `I'll analyze that for you. ${selectedDocuments.length > 0 ? `Looking at ${selectedDocuments.length} document(s): ${docNames}...` : 'Please select at least one document first.'}` }
    ]);
    setAiPrompt("");
  };

  const toggleDocumentSelection = (doc: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(d => d.id === doc.id);
      if (isSelected) {
        return prev.filter(d => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const medicalDocuments = documents?.filter(doc => 
    doc.industry === 'medical' || 
    doc.originalFilename?.toLowerCase().includes('medical') ||
    doc.originalFilename?.toLowerCase().includes('patient') ||
    doc.originalFilename?.toLowerCase().includes('clinical')
  ) || [];

  const quickActions = [
    { icon: FileSearch, label: "Compare Patient Info", action: "Compare patient demographics and information across all selected documents" },
    { icon: Activity, label: "Track Diagnoses", action: "Track diagnoses and medical conditions across all visits" },
    { icon: FileText, label: "Summarize All", action: "Provide a comprehensive summary of all selected medical documents" },
    { icon: Pill, label: "Medication History", action: "Extract and compare all medications, dosages across documents" }
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
              <Activity className="h-8 w-8 text-teal-600" />
              Medical Document Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              HIPAA-compliant document processing with clinical AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocuments.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
            </Badge>
          )}
          <Badge className="bg-teal-100 text-teal-800 px-4 py-2">
            Medical Industry
          </Badge>
        </div>
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
            AI Assistant {selectedDocuments.length > 0 && `(${selectedDocuments.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Medical Documents</CardTitle>
              <CardDescription>
                Upload multiple medical records, lab reports, prescriptions, or clinical notes for combined AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone industry="medical" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medical Documents</CardTitle>
                  <CardDescription>
                    Select one or more documents to analyze together with AI
                  </CardDescription>
                </div>
                {selectedDocuments.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={clearSelection}
                  >
                    Clear Selection ({selectedDocuments.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {medicalDocuments.length > 0 ? (
                    medicalDocuments.map((doc) => {
                      const isSelected = selectedDocuments.some(d => d.id === doc.id);
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-all ${
                            isSelected ? 'border-teal-500 bg-teal-50 dark:bg-teal-950' : ''
                          }`}
                          onClick={() => toggleDocumentSelection(doc)}
                          data-testid={`document-card-${doc.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-teal-600" />
                                <p className="font-medium">{doc.originalFilename}</p>
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs bg-teal-100">
                                    ✓ Selected
                                  </Badge>
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
                                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                                  View Details
                                </Button>
                              </Link>
                              {doc.status === 'completed' && (
                                <Button 
                                  size="sm" 
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDocumentSelection(doc);
                                  }}
                                  data-testid={`button-select-${doc.id}`}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Selected
                                    </>
                                  ) : (
                                    <>
                                      <Brain className="h-3 w-3 mr-1" />
                                      Select
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No medical documents uploaded yet</p>
                      <p className="text-sm mt-2">Upload your first document above to get started</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-950 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected for analysis
                    </span>
                    <Button 
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        // Switch to AI chat tab
                        const aiTab = document.querySelector('[value="ai-chat"]') as HTMLElement;
                        aiTab?.click();
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Analyze Selected
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="ai-chat" className="space-y-4 mt-4">
          {selectedDocuments.length > 0 ? (
            <Alert className="border-teal-200 bg-teal-50 dark:bg-teal-950">
              <FileText className="h-4 w-4 text-teal-600" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">Analyzing {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}:</span>
                    <div className="mt-2 space-y-1">
                      {selectedDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm">
                          <span>• {doc.originalFilename}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => toggleDocumentSelection(doc)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={clearSelection}
                  >
                    Clear All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Please select one or more documents from the Documents tab to start AI analysis
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                Medical AI Assistant - Multi-Document Analysis
              </CardTitle>
              <CardDescription>
                Ask questions across multiple documents - compare treatments, track progress, correlate findings
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
                    disabled={selectedDocuments.length === 0}
                    onClick={() => {
                      setAiPrompt(action.action);
                      setChatMessages(prev => [
                        ...prev,
                        { role: "user", content: action.action },
                        { role: "assistant", content: `Analyzing ${selectedDocuments.length} document(s) for: ${action.action}...` }
                      ]);
                      setAiPrompt("");
                    }}
                    data-testid={`quick-action-${idx}`}
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
                            ? 'bg-teal-600 text-white' 
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
                  placeholder={selectedDocuments.length > 1 
                    ? "Ask about patterns across documents, compare treatments, track progress..." 
                    : "Ask about diagnoses, medications, lab results, patient history..."}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[80px]"
                  disabled={selectedDocuments.length === 0}
                  data-testid="textarea-ai-prompt"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={selectedDocuments.length === 0 || !aiPrompt.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {selectedDocuments.length > 0 && selectedDocuments.every(doc => doc.status === 'completed') && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Combined Analysis
                  </Button>
                  <Button variant="outline" size="sm">
                    View Individual Reports
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}