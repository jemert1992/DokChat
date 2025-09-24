import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Activity,
  Zap,
  Brain,
  Eye,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceMetrics {
  overall: number;
  ocr: number;
  ai: number;
  extraction: number;
  vision?: number;
  consensus?: number;
}

interface ProcessingError {
  stage: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

interface ConfidenceVisualizationProps {
  metrics: ConfidenceMetrics;
  errors?: ProcessingError[];
  status: 'processing' | 'completed' | 'failed';
  processingStage?: string;
  progress?: number;
}

export function ConfidenceVisualization({
  metrics,
  errors = [],
  status,
  processingStage,
  progress = 0
}: ConfidenceVisualizationProps) {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.6) return "secondary";
    return "destructive";
  };

  const getProgressColor = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Real-time Processing Status */}
      {status === 'processing' && processingStage && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription className="flex items-center justify-between">
            <span>{processingStage}</span>
            <Badge variant="outline" className="ml-2">
              {formatPercentage(progress / 100)}
            </Badge>
          </AlertDescription>
          <Progress value={progress} className="mt-2" />
        </Alert>
      )}

      {/* Error/Warning Badges */}
      {errors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {errors.map((error, index) => (
            <Badge
              key={index}
              variant={error.severity === 'error' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
              data-testid={`error-badge-${index}`}
            >
              {error.severity === 'error' ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span className="text-xs">{error.stage}: {error.message}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Main Confidence Card */}
      <Card className={cn(
        "transition-all duration-300",
        status === 'completed' && "border-green-200 dark:border-green-800",
        status === 'failed' && "border-red-200 dark:border-red-800"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Analysis Confidence
            </span>
            <Badge 
              variant={getConfidenceBadgeVariant(metrics.overall)}
              className="text-lg px-3 py-1"
              data-testid="overall-confidence-badge"
            >
              {formatPercentage(metrics.overall)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Overall Confidence</span>
              <span className={cn("font-semibold", getConfidenceColor(metrics.overall))}>
                {formatPercentage(metrics.overall)}
              </span>
            </div>
            <Progress 
              value={metrics.overall * 100} 
              className={cn("h-3", getProgressColor(metrics.overall))}
              data-testid="overall-confidence-meter"
            />
          </div>

          {/* Component Confidence Meters */}
          <div className="grid grid-cols-2 gap-4">
            {/* OCR Confidence */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">OCR Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={metrics.ocr * 100} 
                  className="flex-1 h-2"
                  data-testid="ocr-confidence-meter"
                />
                <span className={cn("text-xs font-semibold", getConfidenceColor(metrics.ocr))}>
                  {formatPercentage(metrics.ocr)}
                </span>
              </div>
            </div>

            {/* AI Analysis Confidence */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={metrics.ai * 100} 
                  className="flex-1 h-2"
                  data-testid="ai-confidence-meter"
                />
                <span className={cn("text-xs font-semibold", getConfidenceColor(metrics.ai))}>
                  {formatPercentage(metrics.ai)}
                </span>
              </div>
            </div>

            {/* Data Extraction Confidence */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data Extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={metrics.extraction * 100} 
                  className="flex-1 h-2"
                  data-testid="extraction-confidence-meter"
                />
                <span className={cn("text-xs font-semibold", getConfidenceColor(metrics.extraction))}>
                  {formatPercentage(metrics.extraction)}
                </span>
              </div>
            </div>

            {/* Vision Analysis Confidence (if available) */}
            {metrics.vision !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Vision Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={metrics.vision * 100} 
                    className="flex-1 h-2"
                    data-testid="vision-confidence-meter"
                  />
                  <span className={cn("text-xs font-semibold", getConfidenceColor(metrics.vision))}>
                    {formatPercentage(metrics.vision)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Consensus Indicator */}
          {metrics.consensus !== undefined && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Model Consensus
                </span>
                <Badge 
                  variant={getConfidenceBadgeVariant(metrics.consensus)}
                  data-testid="consensus-badge"
                >
                  {formatPercentage(metrics.consensus)}
                </Badge>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Processing Status</span>
              <Badge 
                variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                className="capitalize"
                data-testid="status-badge"
              >
                {status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Interpretation */}
      {status === 'completed' && (
        <Alert className={cn(
          "border-l-4",
          metrics.overall >= 0.8 && "border-l-green-500 bg-green-50 dark:bg-green-950",
          metrics.overall >= 0.6 && metrics.overall < 0.8 && "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950",
          metrics.overall < 0.6 && "border-l-red-500 bg-red-50 dark:bg-red-950"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {metrics.overall >= 0.8 && (
              <span className="text-green-700 dark:text-green-300">
                <strong>High Confidence:</strong> Analysis results are highly reliable and ready for use.
              </span>
            )}
            {metrics.overall >= 0.6 && metrics.overall < 0.8 && (
              <span className="text-yellow-700 dark:text-yellow-300">
                <strong>Moderate Confidence:</strong> Results are generally accurate but may benefit from manual review.
              </span>
            )}
            {metrics.overall < 0.6 && (
              <span className="text-red-700 dark:text-red-300">
                <strong>Low Confidence:</strong> Manual verification recommended before using these results.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}