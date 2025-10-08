import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface ProcessingMetric {
  id: number;
  pageNumber?: number;
  sectionName?: string;
  processingMethod: string;
  confidence: number;
  textExtracted?: number;
  errors?: any[];
  unresolvedFields?: string[];
  processingTime?: number;
}

interface ProcessingReport {
  id: number;
  overallConfidence: number;
  methodBreakdown: {
    vision: { avgConfidence: number; pageCount: number };
    sonnet: { avgConfidence: number; pageCount: number };
    nlp: { avgConfidence: number; pageCount: number };
    ocr: { avgConfidence: number; pageCount: number };
  };
  errorSummary: string;
  unresolvedFieldsSummary: string;
  recommendations: string[];
  pageMetrics?: any[];
  sectionMetrics?: any[];
}

interface ProcessingMetricsData {
  documentId: number;
  metrics: ProcessingMetric[];
  report: ProcessingReport | null;
  hasReport: boolean;
  totalMetrics: number;
}

export function ProcessingMetricsReport({ documentId }: { documentId: number }) {
  const { data, isLoading, error } = useQuery<ProcessingMetricsData>({
    queryKey: [`/api/documents/${documentId}/processing-report`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading processing report...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load processing metrics. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const { report, metrics } = data;

  if (!report) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Report Available</AlertTitle>
        <AlertDescription>
          Processing metrics will be generated after document processing is complete.
        </AlertDescription>
      </Alert>
    );
  }

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "vision":
        return "bg-blue-500";
      case "sonnet":
        return "bg-purple-500";
      case "nlp":
        return "bg-green-500";
      case "ocr":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMethodBadgeVariant = (method: string) => {
    switch (method.toLowerCase()) {
      case "vision":
        return "default";
      case "sonnet":
        return "secondary";
      case "nlp":
        return "outline";
      case "ocr":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6" data-testid="processing-metrics-report">
      {/* Overall Confidence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Overall Processing Quality
          </CardTitle>
          <CardDescription>Aggregate confidence across all processing methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Confidence</span>
                <span className="text-2xl font-bold" data-testid="overall-confidence">
                  {(report.overallConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={report.overallConfidence * 100} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Method Breakdown</CardTitle>
          <CardDescription>Confidence and page count by processing method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(report.methodBreakdown).map(([method, data]) => {
              if (data.pageCount === 0) return null;
              return (
                <div key={method} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getMethodBadgeVariant(method)} className="capitalize">
                      {method}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{data.pageCount} pages</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Avg Confidence</span>
                      <span className="text-lg font-semibold" data-testid={`method-${method}-confidence`}>
                        {(data.avgConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={data.avgConfidence * 100} className={`h-2 ${getMethodColor(method)}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Summaries */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="errors">Error Summary</TabsTrigger>
          <TabsTrigger value="unresolved">Unresolved Fields</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Error Summary</CardTitle>
              <CardDescription>Intelligent analysis of processing errors</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="error-summary">
                {report.errorSummary || "No errors detected."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unresolved">
          <Card>
            <CardHeader>
              <CardTitle>Unresolved Fields Summary</CardTitle>
              <CardDescription>Fields that couldn't be extracted or verified</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="unresolved-summary">
                {report.unresolvedFieldsSummary || "All fields successfully extracted."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Actionable insights to improve processing quality</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" data-testid="recommendations-list">
                {report.recommendations?.length > 0 ? (
                  report.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No recommendations available.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Page-Level Metrics (if available) */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Page-Level Confidence</CardTitle>
            <CardDescription>Detailed confidence scores per page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics
                .filter((m) => m.pageNumber)
                .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
                .map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between border-b pb-2"
                    data-testid={`page-metric-${metric.pageNumber}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Page {metric.pageNumber}</span>
                      <Badge variant={getMethodBadgeVariant(metric.processingMethod)} className="capitalize">
                        {metric.processingMethod}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {(metric.confidence * 100).toFixed(1)}%
                      </span>
                      <Progress value={metric.confidence * 100} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
