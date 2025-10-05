import { useState, useEffect } from "react";
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
  Square,
  History
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Link, useLocation } from "wouter";
import DocumentUploadZone from "@/components/document-upload-zone";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import ChatHistorySidebar from "@/components/chat-history-sidebar";

export default function FinanceDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" }
  ]);

  // Fetch documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Auto-load most recent chat session on mount
  useEffect(() => {
    if (!documents) return; // Wait for documents to load
    
    // Try to load the most recent session
    apiRequest('GET', '/api/chat-sessions?industry=finance&limit=1')
      .then(res => res.json())
      .then((sessions: any[]) => {
        if (sessions && sessions.length > 0) {
          const mostRecentSession = sessions[0];
          
          // Restore the documents that were part of this session
          const sessionDocs = documents.filter(doc => 
            mostRecentSession.documentIds.includes(doc.id)
          );
          
          if (sessionDocs.length > 0) {
            setSelectedDocuments(sessionDocs);
            setCurrentSessionId(mostRecentSession.id);
            
            // Load the chat history
            apiRequest('GET', `/api/chat-sessions/${mostRecentSession.id}/messages`)
              .then(res => res.json())
              .then((messages: any[]) => {
                if (messages && messages.length > 0) {
                  setChatMessages([
                    { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                  ]);
                }
              })
              .catch(err => console.error('Failed to load messages:', err));
          }
        }
      })
      .catch(err => console.error('Failed to load recent session:', err));
  }, [documents]); // Run when documents are loaded

  // Create or load chat session when documents are selected
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      const documentIds = selectedDocuments.map(d => d.id).sort((a, b) => a - b); // Sort for consistent comparison
      
      // Check if there's an existing session for these documents
      apiRequest('GET', '/api/chat-sessions?industry=finance')
        .then(res => res.json())
        .then((sessions: any[]) => {
          // Find a session with the exact same document IDs
          const existingSession = sessions.find(s => {
            const sessionDocIds = [...s.documentIds].sort((a: number, b: number) => a - b);
            return sessionDocIds.length === documentIds.length && 
                   sessionDocIds.every((id: number, idx: number) => id === documentIds[idx]);
          });
          
          if (existingSession) {
            // Load existing session
            setCurrentSessionId(existingSession.id);
            return apiRequest('GET', `/api/chat-sessions/${existingSession.id}/messages`)
              .then(res => res.json());
          } else {
            // Create a new chat session for these documents
            return apiRequest('POST', '/api/chat-sessions', {
              documentIds,
              industry: 'finance',
              title: `Finance Analysis - ${new Date().toLocaleDateString()}`
            })
              .then(res => res.json())
              .then((session: any) => {
                setCurrentSessionId(session.id);
                return apiRequest('GET', `/api/chat-sessions/${session.id}/messages`)
                  .then(res => res.json());
              });
          }
        })
        .then((messages: any[]) => {
          if (messages && messages.length > 0) {
            setChatMessages([
              { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" },
              ...messages.map(m => ({ role: m.role, content: m.content }))
            ]);
          } else {
            // Reset to default message for new session
            setChatMessages([
              { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" }
            ]);
          }
        })
        .catch(err => {
          console.error('Failed to create/load chat session:', err);
        });
    } else {
      // Reset when no documents are selected
      setCurrentSessionId(null);
      setChatMessages([
        { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" }
      ]);
    }
  }, [selectedDocuments.map(d => d.id).sort((a, b) => a - b).join(',')]); // Depend on sorted document IDs

  const handleSendMessage = async () => {
    if (!aiPrompt.trim() || !currentSessionId || selectedDocuments.length === 0) return;
    
    const userMessage = aiPrompt;
    const documentIds = selectedDocuments.map(d => d.id);
    
    // Show user message and loading state immediately
    const loadingMessage = selectedDocuments.length === 1 
      ? `Analyzing ${selectedDocuments[0].originalFilename}...`
      : `Analyzing ${selectedDocuments.length} documents...`;
    
    setChatMessages(prev => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: loadingMessage }
    ]);
    setAiPrompt("");
    
    try {
      // Save user message
      await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
        role: 'user',
        content: userMessage,
        model: 'gemini-2.5-flash'
      });
      
      // Call real AI analysis endpoint (now powered by Gemini!)
      const response = await apiRequest('POST', '/api/chat/analyze', {
        question: userMessage,
        documentIds,
        industry: 'finance'
      });
      
      const data = await response.json();
      const aiResponse = data.analysis || "Unable to generate analysis";
      
      // Update chat with real AI response
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: aiResponse };
        return newMessages;
      });
      
      // Save AI response to database
      await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
        role: 'assistant',
        content: aiResponse,
        model: 'gemini-2.5-flash'
      });
    } catch (err) {
      console.error('Failed to analyze documents:', err);
      
      // Show error message
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: "assistant", 
          content: "I encountered an error analyzing your documents. Please try again or select different documents." 
        };
        return newMessages;
      });
    }
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

  const handleSelectChatSession = async (session: any) => {
    // Load the documents from the session
    const sessionDocs = documents?.filter(doc => 
      session.documentIds.includes(doc.id)
    ) || [];
    
    setSelectedDocuments(sessionDocs);
    setCurrentSessionId(session.id);
    
    // Load chat messages
    try {
      const response = await apiRequest('GET', `/api/chat-sessions/${session.id}/messages`);
      const messages = await response.json();
      
      if (messages && messages.length > 0) {
        setChatMessages([
          { role: "assistant", content: "I'm your financial document AI assistant. Upload financial statements, invoices, tax documents, audit reports, or transaction records and I'll help you extract key figures, detect anomalies, analyze trends, and ensure compliance. You can select multiple documents for bulk analysis. What financial insights do you need?" },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ]);
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsHistoryOpen(true)}
            data-testid="button-open-history"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Chat History
          </Button>
          <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2">
            Finance Industry
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
              <DocumentUploadZone industry="finance" />
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
                              {doc.aiConfidence && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-xs">Confidence: {doc.aiConfidence}%</span>
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
                    onClick={async () => {
                      const docInfo = selectedDocuments.length === 1 
                        ? selectedDocuments[0].originalFilename 
                        : `${selectedDocuments.length} documents`;
                      const userMessage = action.action;
                      const assistantResponse = `Analyzing financial data for ${docInfo}: ${action.action}...`;
                      
                      // Update UI immediately
                      setChatMessages(prev => [
                        ...prev,
                        { role: "user", content: userMessage },
                        { role: "assistant", content: assistantResponse }
                      ]);
                      
                      // Save to database if session exists
                      if (currentSessionId) {
                        try {
                          await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
                            role: 'user',
                            content: userMessage,
                            model: 'openai'
                          });
                          
                          await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
                            role: 'assistant',
                            content: assistantResponse,
                            model: 'openai'
                          });
                        } catch (err) {
                          console.error('Failed to save quick action messages:', err);
                        }
                      }
                    }}
                    data-testid={`button-quick-${idx}`}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Chat Messages - Larger area for better readability */}
              <ScrollArea className="h-[500px] border rounded-lg p-4 bg-white dark:bg-gray-950">
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 ${
                          msg.role === 'user' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div 
                            className="text-sm prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: msg.content
                                // Convert headers (## Header)
                                .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-2 first:mt-0">$1</h3>')
                                // Convert bold (**text**)
                                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                // Convert bullet points (• or -)
                                .replace(/^[•\-] (.+)$/gm, '<li class="ml-4">$1</li>')
                                // Wrap consecutive <li> in <ul>
                                .replace(/(<li class="ml-4">.+<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-2">$&</ul>')
                                // Convert line breaks to paragraphs
                                .split('\n\n')
                                .map(para => para.trim() ? `<p class="mb-3 last:mb-0">${para}</p>` : '')
                                .join('')
                            }}
                          />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
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

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        industry="finance"
        onSelectSession={handleSelectChatSession}
        currentSessionId={currentSessionId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}