import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, MessageSquare, X, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSession {
  id: number;
  title: string;
  documentIds: number[];
  industry: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistorySidebarProps {
  industry: string;
  onSelectSession: (session: ChatSession) => void;
  currentSessionId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistorySidebar({ 
  industry, 
  onSelectSession, 
  currentSessionId,
  isOpen,
  onClose 
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, industry]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/chat-sessions?industry=${industry}`);
      const data = await response.json();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 border-l border-gray-200 dark:border-gray-800"
          >
            <Card className="h-full border-none rounded-none">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <CardTitle className="text-lg">Chat History</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    data-testid="button-close-history"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Previous conversations and analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-140px)]">
                  {isLoading ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Loading chat history...</p>
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="p-4 space-y-2">
                      {sessions.map((session) => (
                        <motion.button
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            onSelectSession(session);
                            onClose();
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            currentSessionId === session.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          data-testid={`button-session-${session.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.title || `Chat ${session.id}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {session.documentIds.length} document{session.documentIds.length !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(session.updatedAt)}
                              </p>
                            </div>
                            {currentSessionId === session.id && (
                              <Badge variant="outline" className="text-xs">Active</Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No chat history yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start a conversation to see it here
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
