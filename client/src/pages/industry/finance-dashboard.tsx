import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  MessageSquare, 
  DollarSign,
  Send,
  Brain,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Download,
  Home,
  TrendingUp,
  Receipt,
  CheckSquare,
  Square
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Link, useLocation } from "wouter";
import DocumentUploadZone from "@/components/document-upload-zone";
import { motion } from "framer-motion";

export default function FinanceDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" }
  ]);

  // Fetch documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const handleSendMessage = () => {
    if (!aiPrompt.trim()) return;
    
    const docSummary = selectedDocuments.length === 1 
      ? `Processing ${selectedDocuments[0].originalFilename}...`
      : selectedDocuments.length > 1
        ? `Processing ${selectedDocuments.length} documents: ${selectedDocuments.map(d => d.originalFilename).slice(0, 3).join(', ')}${selectedDocuments.length > 3 ? ` and ${selectedDocuments.length - 3} more` : ''}...`
        : 'Please select at least one document first.';
    
    setChatMessages(prev => [
      ...prev,
      { role: "user", content: aiPrompt },
      { role: "assistant", content: `Analyzing financial data for: "${aiPrompt}". ${docSummary}` }
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

  const selectAllDocuments = () => {
    const completedDocs = financeDocuments.filter(doc => doc.status === 'completed');
    setSelectedDocuments(completedDocs);
  };

  const deselectAllDocuments = () => {
    setSelectedDocuments([]);
  };

  const financeDocuments = documents?.filter(doc => 
    doc.industry === 'finance' || 
    doc.originalFilename?.toLowerCase().includes('finance') ||
    doc.originalFilename?.toLowerCase().includes('invoice') ||
    doc.originalFilename?.toLowerCase().includes('statement') ||
    doc.originalFilename?.toLowerCase().includes('tax')
  ) || [];

  const quickActions = [
    { icon: DollarSign, label: "Extract Amounts", action: "Extract all monetary amounts, transactions, and financial figures from this document" },
    { icon: TrendingUp, label: "Analyze Trends", action: "Analyze financial trends, patterns, and growth indicators in this document" },
    { icon: AlertCircle, label: "Detect Anomalies", action: "Identify any unusual transactions, discrepancies, or potential fraud indicators" },
    { icon: Receipt, label: "Summarize Finances", action: "Provide a comprehensive financial summary of this document" }
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
              <DollarSign className="h-8 w-8 text-emerald-600" />
              Financial Document Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered financial analysis and fraud detection
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2">
          Finance Industry
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
              <CardTitle>Upload Financial Documents</CardTitle>
              <CardDescription>
                Upload statements, invoices, tax documents, or audit reports for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recent Financial Documents</CardTitle>
                  <CardDescription>
                    Select documents to analyze with AI
                  </CardDescription>
                </div>
                {financeDocuments.some(doc => doc.status === 'completed') && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectedDocuments.length > 0 ? deselectAllDocuments : selectAllDocuments}
                      data-testid="button-toggle-all"
                    >
                      {selectedDocuments.length > 0 ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Select All
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              {selectedDocuments.length > 0 && (
                <Badge className="mt-2 bg-emerald-100 text-emerald-800">
                  {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {financeDocuments.length > 0 ? (
                    financeDocuments.map((doc) => {
                      const isSelected = selectedDocuments.some(d => d.id === doc.id);
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all ${
                            isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : ''
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            {doc.status === 'completed' && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleDocumentSelection(doc)}
                                className="mt-1"
                                data-testid={`checkbox-doc-${doc.id}`}
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600" />
                                <p className="font-medium">{doc.originalFilename}</p>
                                {isSelected && (
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
                                <Button size="sm" variant="outline" data-testid={`button-view-${doc.id}`}>
                                  View Details
                                </Button>
                              </Link>
                              {doc.status === 'completed' && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => {
                                    if (!isSelected) {
                                      toggleDocumentSelection(doc);
                                    }
                                    const aiTab = document.querySelector('[value="ai-chat"]') as HTMLElement;
                                    aiTab?.click();
                                  }}
                                  data-testid={`button-analyze-${doc.id}`}
                                >
                                  <Brain className="h-3 w-3 mr-1" />
                                  Analyze
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No financial documents uploaded yet</p>
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
          {selectedDocuments.length > 0 ? (
            <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
              <FileText className="h-4 w-4 text-emerald-600" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold mb-2">
                      Analyzing {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="space-y-1">
                      {selectedDocuments.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          <span>{doc.originalFilename}</span>
                        </div>
                      ))}
                      {selectedDocuments.length > 5 && (
                        <p className="text-sm text-gray-600">
                          ... and {selectedDocuments.length - 5} more documents
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={deselectAllDocuments}
                  >
                    Clear Selection
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Please select at least one document from the Documents tab to start AI analysis
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Financial AI Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your financial documents or use quick actions
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
                      const docInfo = selectedDocuments.length === 1 
                        ? selectedDocuments[0].originalFilename 
                        : `${selectedDocuments.length} documents`;
                      setChatMessages(prev => [
                        ...prev,
                        { role: "user", content: action.action },
                        { role: "assistant", content: `Analyzing financial data for ${docInfo}: ${action.action}...` }
                      ]);
                    }}
                    data-testid={`button-quick-${idx}`}
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
                            ? 'bg-emerald-600 text-white' 
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
                  placeholder="Ask about transactions, balances, trends, anomalies, compliance..."
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
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {selectedDocuments.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" data-testid="button-export">
                    <Download className="h-4 w-4 mr-2" />
                    Export Analysis
                  </Button>
                  {selectedDocuments.length === 1 && (
                    <Link href={`/document/${selectedDocuments[0].id}`}>
                      <Button variant="outline" size="sm" data-testid="button-view-report">
                        View Full Report
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}