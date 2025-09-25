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
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Shield,
  Activity,
  PieChart,
  CreditCard,
  Receipt,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";

export default function FinanceDashboard() {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  // Fetch financial documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Mock transaction data - in production, this would come from the database
  const transactions = [
    { id: "1", type: "Invoice", amount: "$125,000", date: "2024-01-20", status: "Processed", riskScore: 15 },
    { id: "2", type: "Wire Transfer", amount: "$450,000", date: "2024-01-19", status: "Under Review", riskScore: 75 },
    { id: "3", type: "ACH Payment", amount: "$32,500", date: "2024-01-18", status: "Cleared", riskScore: 10 },
    { id: "4", type: "Foreign Exchange", amount: "€200,000", date: "2024-01-17", status: "Flagged", riskScore: 85 },
  ];

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Analytics Hub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Transaction monitoring, fraud detection, and compliance reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            data-testid="button-generate-report"
            onClick={() => {
              toast({
                title: "Generate Report",
                description: "Opening report generation wizard...",
              });
              setShowReportDialog(true);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700" 
            data-testid="button-upload-statement"
            onClick={() => {
              toast({
                title: "Upload Statement",
                description: "Opening statement upload dialog...",
              });
              setShowUploadDialog(true);
            }}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">$2.4M</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% MTD
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold">3,842</p>
                <p className="text-xs text-blue-600 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fraud Alerts</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-orange-600 mt-1">3 high risk</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Score</p>
                <p className="text-2xl font-bold">96%</p>
                <p className="text-xs text-green-600 mt-1">SOX Compliant</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Detection System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            AI-Powered Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Pattern Analysis</span>
                <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Analyzing 1,247 patterns</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Anomaly Detection</span>
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">3 Found</Badge>
              </div>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Scan complete</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Risk Scoring</span>
                <Badge className="bg-blue-100 text-blue-700 text-xs">Running</Badge>
              </div>
              <Progress value={65} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Processing transactions</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">ML Models</span>
                <Badge className="bg-purple-100 text-purple-700 text-xs">97% Accuracy</Badge>
              </div>
              <Progress value={97} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">5 models active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Transactions</span>
                <Badge variant="outline">{transactions.length} today</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                      selectedTransaction === transaction.id ? "bg-green-50 dark:bg-green-950" : ""
                    }`}
                    onClick={() => setSelectedTransaction(transaction.id)}
                    data-testid={`transaction-row-${transaction.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.type}</p>
                        <p className="text-lg font-bold text-green-600">{transaction.amount}</p>
                        <p className="text-xs text-gray-400 mt-1">{transaction.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={transaction.status === "Cleared" ? "default" : 
                                  transaction.status === "Flagged" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                        <Badge 
                          className={`text-xs ${getRiskColor(transaction.riskScore)}`}
                          variant="outline"
                        >
                          Risk: {transaction.riskScore}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Analysis */}
        <div className="lg:col-span-2">
          {selectedTransaction ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Transaction Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Transaction ID</p>
                        <p className="text-lg font-semibold">TXN-2024-0847291</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Processing Time</p>
                        <p className="text-lg font-semibold">2.3 seconds</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sender</p>
                        <p className="text-lg font-semibold">Acme Corporation</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <p className="text-lg font-semibold">Global Trading Inc</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <h3 className="font-semibold mb-2">Transaction Flow</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Initiated: Jan 20, 2024 10:30 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Verified: Jan 20, 2024 10:31 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-sm">Processing: Jan 20, 2024 10:32 AM</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="risk" className="space-y-4 mt-4">
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <span className="font-medium">Medium Risk Detected:</span> Unusual transaction amount for this account profile
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Amount Threshold</span>
                          <span className="text-sm text-gray-500">75% above average</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Geographic Risk</span>
                          <span className="text-sm text-gray-500">Low</span>
                        </div>
                        <Progress value={20} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Pattern Match</span>
                          <span className="text-sm text-gray-500">No suspicious patterns</span>
                        </div>
                        <Progress value={10} className="h-2" />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="compliance" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium">AML Check</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Passed</Badge>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium">KYC Verification</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Verified</Badge>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">OFAC Screening</span>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">Review Required</Badge>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium">SOX Compliance</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      {documents?.slice(0, 3).map((doc) => (
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
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a transaction to view analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-600" />
            Market Insights & Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">USD/EUR</span>
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.23%
                </span>
              </div>
              <p className="text-2xl font-bold">1.0847</p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">S&P 500</span>
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -0.45%
                </span>
              </div>
              <p className="text-2xl font-bold">4,783.21</p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">10Y Treasury</span>
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.1bps
                </span>
              </div>
              <p className="text-2xl font-bold">4.23%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Financial Report</DialogTitle>
            <DialogDescription>
              Select report type and parameters for generation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Report configuration options would appear here</p>
            <Button 
              className="w-full"
              onClick={() => {
                setShowReportDialog(false);
                toast({
                  title: "Success",
                  description: "Report generation started! You'll receive it shortly.",
                });
              }}
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Statement Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Financial Statement</DialogTitle>
            <DialogDescription>
              Upload bank statements, invoices, or financial documents for analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Drop financial statements here or click to browse</p>
              <p className="text-xs text-gray-500 mt-2">Supports CSV, PDF, OFX, QBO formats</p>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                setShowUploadDialog(false);
                toast({
                  title: "Success",
                  description: "Statement uploaded and processing started!",
                });
              }}
            >
              Upload & Process
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}