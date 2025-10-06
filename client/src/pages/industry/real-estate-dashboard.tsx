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
  Building2,
  Send,
  Brain,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Download,
  Home as HomeIcon,
  TrendingUp,
  MapPin,
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

export default function RealEstateDashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" }
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
    
    apiRequest('GET', '/api/chat-sessions?industry=real_estate&limit=1')
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
                    { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" },
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
      
      apiRequest('GET', '/api/chat-sessions?industry=real_estate')
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
              industry: 'real_estate',
              title: `Real Estate Analysis - ${new Date().toLocaleDateString()}`
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
              { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" },
              ...messages.map(m => ({ role: m.role, content: m.content }))
            ]);
          } else {
            setChatMessages([
              { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" }
            ]);
          }
        })
        .catch(err => {
          console.error('Failed to create/load chat session:', err);
        });
    } else {
      setCurrentSessionId(null);
      setChatMessages([
        { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" }
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
        industry: 'real_estate'
      });

      const result = await response.json();
      
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: result.analysis || result.message || 'Analysis complete.'
        };
        return newMessages;
      });

      await apiRequest('POST', `/api/chat-sessions/${currentSessionId}/messages`, {
        role: 'assistant',
        content: result.analysis || result.message || 'Analysis complete.',
        model: 'gemini-2.5-flash'
      });

    } catch (error: any) {
      console.error('AI analysis error:', error);
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: `Error: ${error.message || 'Failed to analyze documents. Please try again.'}`
        };
        return newMessages;
      });
    }
  };

  const handleDocumentToggle = (doc: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(d => d.id === doc.id);
      if (isSelected) {
        return prev.filter(d => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const handleSelectSession = (session: any) => {
    if (!documents) return;
    
    const sessionDocs = documents.filter(doc => 
      session.documentIds.includes(doc.id)
    );
    
    setCurrentSessionId(session.id);
    setSelectedDocuments(sessionDocs);
    
    apiRequest('GET', `/api/chat-sessions/${session.id}/messages`)
      .then(res => res.json())
      .then((messages: any[]) => {
        setChatMessages([
          { role: "assistant", content: "I'm your real estate document AI assistant. Upload property listings, purchase agreements, lease contracts, title documents, or inspection reports and I'll help you extract property details, analyze terms, identify risks, and ensure compliance. You can select multiple documents for bulk analysis. What real estate insights do you need?" },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ]);
      })
      .catch(err => console.error('Failed to load messages:', err));
  };

  const realEstateDocuments = (documents || []).filter(doc => 
    doc.industry === 'real_estate' || 
    doc.industry === 'general' ||
    !doc.industry
  ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  Real Estate Intelligence
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  AI-powered property document analysis
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="gap-2"
              data-testid="button-back-to-dashboard"
            >
              <HomeIcon className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-lg border-orange-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <CardTitle className="text-2xl">AI Property Analysis</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="gap-2"
                    data-testid="button-toggle-history"
                  >
                    <History className="h-4 w-4" />
                    {isHistoryOpen ? 'Hide' : 'Show'} History
                  </Button>
                </div>
                <CardDescription>
                  Select documents and ask questions about property details, contracts, or compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}>
                          <div className="flex items-start gap-2">
                            {msg.role === 'assistant' && <Brain className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask about property values, contract terms, compliance issues..."
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      data-testid="textarea-ai-prompt"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!aiPrompt.trim() || selectedDocuments.length === 0}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 self-end"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedDocuments.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Select at least one document to start analyzing
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedDocuments.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>{selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <DocumentUploadZone 
              industry="real_estate"
            />
          </motion.div>

          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg border-orange-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-750">
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Your Documents
                </CardTitle>
                <CardDescription>Select documents for AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-[500px] pr-4">
                  {realEstateDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No documents yet</p>
                      <p className="text-sm mt-1">Upload your first property document</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {realEstateDocuments.map((doc) => {
                        const isSelected = selectedDocuments.some(d => d.id === doc.id);
                        const progressUpdate = processingUpdates.find(u => u.documentId === String(doc.id));
                        const isProcessing = progressUpdate?.status === 'processing';
                        
                        return (
                          <motion.div
                            key={doc.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <button
                              onClick={() => handleDocumentToggle(doc)}
                              className={`w-full p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                              }`}
                              data-testid={`checkbox-document-${doc.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {isSelected ? (
                                    <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                  ) : (
                                    <Square className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {doc.originalFilename}
                                  </p>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={
                                          progressUpdate?.status === 'completed' || doc.status === 'completed' 
                                            ? 'default' 
                                            : progressUpdate?.status === 'failed' || doc.status === 'error'
                                            ? 'destructive'
                                            : 'secondary'
                                        } 
                                        className="text-xs"
                                      >
                                        {isProcessing ? (
                                          <span className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {progressUpdate.progress}%
                                          </span>
                                        ) : (
                                          progressUpdate?.status || doc.status
                                        )}
                                      </Badge>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                    
                                    {isProcessing && (
                                      <div className="space-y-1">
                                        <Progress value={progressUpdate.progress} className="h-1.5" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          {progressUpdate.message}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <ChatHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        industry="real_estate"
        currentSessionId={currentSessionId}
      />
    </div>
  );
}
