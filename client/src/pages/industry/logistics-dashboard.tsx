import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Globe,
  CheckSquare,
  Square,
  History,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Link, useLocation } from "wouter";
import DocumentUploadZone from "@/components/document-upload-zone";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import ChatHistorySidebar from "@/components/chat-history-sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function LogisticsDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" }
  ]);

  // Fetch documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // WebSocket for real-time progress updates
  const { processingUpdates } = useWebSocket();

  // Auto-load most recent chat session on mount
  useEffect(() => {
    if (!documents) return;
    
    apiRequest('GET', '/api/chat-sessions?industry=logistics&limit=1')
      .then(res => res.json())
      .then((sessions: any[]) => {
        if (sessions && sessions.length > 0) {
          const mostRecentSession = sessions[0];
          const sessionDocs = documents.filter(doc => 
            mostRecentSession.documentIds.includes(doc.id)
          );
          
          if (sessionDocs.length > 0) {
            setSelectedDocuments(sessionDocs);
            setCurrentSessionId(mostRecentSession.id);
            
            apiRequest('GET', `/api/chat-sessions/${mostRecentSession.id}/messages`)
              .then(res => res.json())
              .then((messages: any[]) => {
                if (messages && messages.length > 0) {
                  setChatMessages([
                    { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                  ]);
                }
              })
              .catch(err => console.error('Failed to load messages:', err));
          }
        }
      })
      .catch(err => console.error('Failed to load recent session:', err));
  }, [documents]);

  // Create or load chat session when documents are selected
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      const documentIds = selectedDocuments.map(d => d.id).sort((a, b) => a - b);
      
      apiRequest('GET', '/api/chat-sessions?industry=logistics')
        .then(res => res.json())
        .then((sessions: any[]) => {
          const existingSession = sessions.find(s => {
            const sessionDocIds = [...s.documentIds].sort((a: number, b: number) => a - b);
            return sessionDocIds.length === documentIds.length && 
                   sessionDocIds.every((id: number, idx: number) => id === documentIds[idx]);
          });
          
          if (existingSession) {
            setCurrentSessionId(existingSession.id);
            return apiRequest('GET', `/api/chat-sessions/${existingSession.id}/messages`)
              .then(res => res.json());
          } else {
            return apiRequest('POST', '/api/chat-sessions', {
              documentIds,
              industry: 'logistics',
              title: `Logistics Analysis - ${new Date().toLocaleDateString()}`
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
              { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" },
              ...messages.map(m => ({ role: m.role, content: m.content }))
            ]);
          } else {
            setChatMessages([
              { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" }
            ]);
          }
        })
        .catch(err => {
          console.error('Failed to create/load chat session:', err);
        });
    } else {
      setCurrentSessionId(null);
      setChatMessages([
        { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" }
      ]);
    }
  }, [selectedDocuments.map(d => d.id).sort((a, b) => a - b).join(',')]);

  const handleSendMessage = async () => {
    if (!aiPrompt.trim() || !currentSessionId || selectedDocuments.length === 0) return;
    
    const userMessage = aiPrompt;
    const documentIds = selectedDocuments.map(d => d.id);
    
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
      await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
        role: 'user',
        content: userMessage,
        model: 'gemini-2.5-flash'
      });
      
      const response = await apiRequest('POST', '/api/chat/analyze', {
        question: userMessage,
        documentIds,
        industry: 'logistics'
      });
      
      const data = await response.json();
      const aiResponse = data.analysis || "Unable to generate analysis";
      
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: aiResponse };
        return newMessages;
      });
      
      await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
        role: 'assistant',
        content: aiResponse,
        model: 'gemini-2.5-flash'
      });
    } catch (err) {
      console.error('Failed to analyze documents:', err);
      
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
    const completedDocs = logisticsDocuments.filter(doc => doc.status === 'completed');
    setSelectedDocuments(completedDocs);
  };

  const deselectAllDocuments = () => {
    setSelectedDocuments([]);
  };

  const handleSelectChatSession = async (session: any) => {
    const sessionDocs = documents?.filter(doc => 
      session.documentIds.includes(doc.id)
    ) || [];
    
    setSelectedDocuments(sessionDocs);
    setCurrentSessionId(session.id);
    
    try {
      const response = await apiRequest('GET', `/api/chat-sessions/${session.id}/messages`);
      const messages = await response.json();
      
      if (messages && messages.length > 0) {
        setChatMessages([
          { role: "assistant", content: "I'm your logistics document AI assistant. Upload shipping manifests, customs forms, bills of lading, or delivery receipts and I'll help you track shipments, verify customs compliance, extract tracking numbers, and optimize routes. You can select multiple documents for bulk analysis. How can I help with your logistics operations?" },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ]);
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const logisticsDocuments = (documents || []).filter(doc => 
    doc.industry === 'logistics' || 
    doc.originalFilename?.toLowerCase().includes('logistics') ||
    doc.originalFilename?.toLowerCase().includes('shipping') ||
    doc.originalFilename?.toLowerCase().includes('customs') ||
    doc.originalFilename?.toLowerCase().includes('manifest')
  ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
            Logistics Industry
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
              <CardTitle>Upload Logistics Documents</CardTitle>
              <CardDescription>
                Upload shipping manifests, customs forms, bills of lading, or delivery receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone industry="logistics" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recent Logistics Documents</CardTitle>
                  <CardDescription>
                    Select documents to analyze with AI
                  </CardDescription>
                </div>
                {logisticsDocuments.some(doc => doc.status === 'completed') && (
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
                <Badge className="mt-2 bg-blue-100 text-blue-800">
                  {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {logisticsDocuments.length > 0 ? (
                    logisticsDocuments.map((doc) => {
                      const isSelected = selectedDocuments.some(d => d.id === doc.id);
                      const progressUpdate = processingUpdates.find(u => u.documentId === String(doc.id));
                      const isProcessing = progressUpdate?.status === 'processing';
                      
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
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
                                <FileText className="h-4 w-4 text-blue-600" />
                                <p className="font-medium">{doc.originalFilename}</p>
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs">Selected</Badge>
                                )}
                                {isProcessing && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    {progressUpdate.progress}%
                                  </Badge>
                                )}
                              </div>
                              {isProcessing ? (
                                <div className="space-y-1 mt-2">
                                  <Progress value={progressUpdate.progress} className="h-1.5" />
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {progressUpdate.message}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                  {doc.status === 'completed' ? 'Ready for analysis' : `Status: ${doc.status}`}
                                </p>
                              )}
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
          {selectedDocuments.length > 0 ? (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold mb-2">
                      Analyzing {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="space-y-1">
                      {selectedDocuments.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
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
                    disabled={selectedDocuments.length === 0}
                    onClick={async () => {
                      const docInfo = selectedDocuments.length === 1 
                        ? selectedDocuments[0].originalFilename 
                        : `${selectedDocuments.length} documents`;
                      const userMessage = action.action;
                      const assistantResponse = `Analyzing logistics data for ${docInfo}: ${action.action}...`;
                      
                      setChatMessages(prev => [
                        ...prev,
                        { role: "user", content: userMessage },
                        { role: "assistant", content: assistantResponse }
                      ]);
                      
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

              {/* Chat Messages */}
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
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div 
                            className="text-sm prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: msg.content
                                .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-2 first:mt-0">$1</h3>')
                                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                .replace(/^[•\-] (.+)$/gm, '<li class="ml-4">$1</li>')
                                .replace(/(<li class="ml-4">.+<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-2">$&</ul>')
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
                  placeholder="Ask about tracking, customs, manifests, routes, compliance..."
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
                  className="bg-blue-600 hover:bg-blue-700"
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
        industry="logistics"
        onSelectSession={handleSelectChatSession}
        currentSessionId={currentSessionId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
