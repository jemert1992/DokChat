import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface VerificationData {
  uncertaintyScore: number;
  discrepancies: Array<{
    field: string;
    originalValue: any;
    verifiedValue: any;
    confidence: number;
    reason: string;
  }>;
  needsManualReview: boolean;
  reviewReason?: string;
  verificationId?: number;
}

interface VerificationStatusProps {
  verification?: VerificationData;
}

export function VerificationStatus({ verification }: VerificationStatusProps) {
  if (!verification) {
    return null;
  }

  const { uncertaintyScore, discrepancies, needsManualReview, reviewReason } = verification;
  const uncertaintyPercent = (uncertaintyScore * 100).toFixed(1);

  const getStatusIcon = () => {
    if (needsManualReview) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (discrepancies.length === 0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-orange-500" />;
  };

  const getStatusBadge = () => {
    if (needsManualReview) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300" data-testid="badge-verification-needs-review">Needs Review</Badge>;
    }
    if (discrepancies.length === 0) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300" data-testid="badge-verification-verified">Verified</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300" data-testid="badge-verification-discrepancies">Has Discrepancies</Badge>;
  };

  return (
    <Card className="mt-4" data-testid="card-verification-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Verification Results</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Auto-QA second-pass validation • Uncertainty: {uncertaintyPercent}%
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Uncertainty Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uncertainty Score</span>
            <span className="font-medium" data-testid="text-uncertainty-score">{uncertaintyPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                uncertaintyScore > 0.3 ? 'bg-yellow-500' : 
                uncertaintyScore > 0.1 ? 'bg-orange-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${uncertaintyPercent}%` }}
            />
          </div>
        </div>

        {/* Manual Review Alert */}
        {needsManualReview && reviewReason && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800" data-testid="alert-manual-review">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Manual Review Required:</strong> {reviewReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Discrepancies List */}
        {discrepancies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Discrepancies Found ({discrepancies.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {discrepancies.map((disc, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 space-y-1"
                  data-testid={`card-discrepancy-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{disc.field}</span>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-confidence-${index}`}>
                      {(disc.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex gap-2">
                      <span className="text-red-600 dark:text-red-400">Original:</span>
                      <span className="line-through text-gray-600 dark:text-gray-400" data-testid={`text-original-${index}`}>
                        {JSON.stringify(disc.originalValue)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-600 dark:text-green-400">Verified:</span>
                      <span className="text-gray-900 dark:text-gray-100" data-testid={`text-verified-${index}`}>
                        {JSON.stringify(disc.verifiedValue)}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 italic">
                      {disc.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {discrepancies.length === 0 && !needsManualReview && (
          <Alert variant="default" className="bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800" data-testid="alert-verification-success">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              All extracted data verified successfully with no discrepancies found.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
