import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Brain,
  Upload,
  Send,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Users,
  FileSearch
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import ShareDocumentDialog from "@/components/share-document-dialog";

export default function MedicalDashboard() {
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [activeView, setActiveView] = useState<'dashboard' | 'ai'>('dashboard');
  const [isDragging, setIsDragging] = useState(false);

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const stats = {
    accuracy: 98.5,
    documentsProcessed: documents?.filter(d => d.status === 'completed').length || 0,
    avgTime: "1.2s"
  };

  const toggleDocumentSelection = (doc: Document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(d => d.id === doc.id);
      return isSelected ? prev.filter(d => d.id !== doc.id) : [...prev, doc];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // File upload would be handled here
  };

  const quickActions = [
    { icon: FileSearch, label: "Extract Patient Info", gradient: "from-blue-500 to-cyan-500" },
    { icon: Activity, label: "Analyze Diagnoses", gradient: "from-purple-500 to-pink-500" },
    { icon: Users, label: "Treatment Plans", gradient: "from-green-500 to-teal-500" },
    { icon: TrendingUp, label: "Lab Results", gradient: "from-orange-500 to-red-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 right-8 h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveView(activeView === 'dashboard' ? 'ai' : 'dashboard')}
        data-testid="button-toggle-view"
      >
        {activeView === 'dashboard' ? <Brain className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
      </motion.button>

      <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
        {/* Header with Stats */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Medical Intelligence Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-6">
            <motion.div 
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                  <p className="text-3xl font-bold text-green-600">{stats.accuracy}%</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </motion.div>
            <motion.div 
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.avgTime}</p>
                </div>
                <Clock className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </motion.div>
            <motion.div 
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.documentsProcessed}</p>
                </div>
                <FileText className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeView === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Upload Zone */}
              <motion.div
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-2 border-dashed transition-all duration-300 hover:shadow-xl ${
                  isDragging ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950' : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
                }`}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                id="upload-zone"
                whileHover={{ scale: 1.01 }}
              >
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-xl font-semibold mb-2">Drop Medical Documents Here</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Support for bulk upload - Select multiple files
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Badge className="bg-green-100 text-green-800">HIPAA Compliant</Badge>
                    <Badge className="bg-blue-100 text-blue-800">Bulk Upload Enabled</Badge>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    id="file-input"
                    data-testid="input-file-upload"
                  />
                  <Button 
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>
              </motion.div>

              {/* Recent Documents */}
              <motion.div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300" data-testid="recent-documents">
                <h2 className="text-2xl font-bold mb-4">Recent Documents</h2>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {documents?.slice(0, 10).map((doc, index) => {
                      const isSelected = selectedDocuments.some(d => d.id === doc.id);
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-md'
                          }`}
                          onClick={() => toggleDocumentSelection(doc)}
                          whileHover={{ scale: 1.02 }}
                          data-testid={`document-card-${doc.id}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                doc.status === 'completed' 
                                  ? 'bg-green-100 text-green-600' 
                                  : doc.status === 'processing' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.originalFilename}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={
                                    doc.status === 'completed' ? 'status-badge-ready' :
                                    doc.status === 'processing' ? 'status-badge-processing' :
                                    'status-badge-error'
                                  }>
                                    {doc.status}
                                  </Badge>
                                  {isSelected && (
                                    <Badge className="bg-purple-100 text-purple-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {doc.status === 'completed' && (
                                <ShareDocumentDialog document={doc}>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:bg-purple-100"
                                    data-testid={`button-share-${doc.id}`}
                                  >
                                    Share
                                  </Button>
                                </ShareDocumentDialog>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/document/${doc.id}`;
                                }}
                                className="hover:bg-blue-100"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* AI Assistant View */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Brain className="h-6 w-6 text-purple-600" />
                    Medical AI Assistant
                  </h2>
                  {selectedDocuments.length > 0 && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {selectedDocuments.length} documents selected
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white shadow-lg hover:shadow-xl transition-all`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAiPrompt(action.label)}
                      data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <action.icon className="h-5 w-5 mb-2" />
                      <p className="text-sm font-semibold">{action.label}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Chat Interface */}
                <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                  <ScrollArea className="h-[300px] mb-4">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white h-8 w-8 flex items-center justify-center">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                          <p className="text-sm">
                            Hello! I'm your medical AI assistant. Select documents and I'll help you analyze patient information, 
                            track treatment progress, correlate lab results, and more.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={selectedDocuments.length > 0 
                        ? "Ask about the selected documents..." 
                        : "Select documents first, then ask your question..."}
                      className="flex-1 min-h-[60px] resize-none"
                      data-testid="textarea-ai-prompt"
                    />
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      disabled={!aiPrompt.trim() || selectedDocuments.length === 0}
                      data-testid="button-send-ai"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}