import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Send, MessageCircle, Sparkles } from 'lucide-react';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  model?: 'openai' | 'gemini';
}

interface ChatResponse {
  response: string;
  confidence: number;
  model: 'openai' | 'gemini';
  relevantSections: string[];
}

interface DocumentChatProps {
  documentId: number;
  documentTitle: string;
}

export default function DocumentChat({ documentId, documentTitle }: DocumentChatProps) {
  const [question, setQuestion] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory, isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/documents/${documentId}/chat/history`],
    enabled: isExpanded && !!documentId,
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (question: string) => {
      return await apiRequest<ChatResponse>(`/api/documents/${documentId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/chat/history`] });
      setQuestion('');
    },
    onError: (error: Error) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/documents/${documentId}/chat/history`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/chat/history`] });
      toast({
        title: "Chat Cleared",
        description: "Chat history has been cleared successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!question.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(question.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getModelColor = (model?: string) => {
    switch (model) {
      case 'openai': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'gemini': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getModelIcon = (model?: string) => {
    switch (model) {
      case 'openai': return '🤖';
      case 'gemini': return '✨';
      default: return '💬';
    }
  };

  if (!isExpanded) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50">
        <CardContent className="p-4">
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center space-x-2"
            data-testid="button-open-chat"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Document</span>
            <Sparkles className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Document Chat</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {chatHistory && chatHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                data-testid="button-clear-chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              data-testid="button-close-chat"
            >
              ✕
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {documentTitle}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" data-testid="chat-messages">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading chat history...</p>
              </div>
            </div>
          ) : chatHistory && chatHistory.length > 0 ? (
            chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20">
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-1">
                        {message.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(message.confidence * 100)}%
                          </Badge>
                        )}
                        {message.model && (
                          <Badge className={`text-xs ${getModelColor(message.model)}`}>
                            {getModelIcon(message.model)} {message.model.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about this document!
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about this document..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
              data-testid="input-chat-question"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!question.trim() || sendMessageMutation.isPending}
              size="sm"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by OpenAI and Gemini AI models
          </p>
        </div>
      </CardContent>
    </Card>
  );
}