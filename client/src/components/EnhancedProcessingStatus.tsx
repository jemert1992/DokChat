import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  estimatedDuration: number;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: "upload",
    name: "Upload Complete",
    description: "Document received and validated",
    progress: 0,
    estimatedDuration: 1,
  },
  {
    id: "classification",
    name: "Document Classification",
    description: "Analyzing document type and structure",
    progress: 10,
    estimatedDuration: 2,
  },
  {
    id: "extraction",
    name: "Text Extraction",
    description: "Extracting text with AI models",
    progress: 20,
    estimatedDuration: 8,
  },
  {
    id: "analysis",
    name: "AI Analysis",
    description: "Deep semantic analysis and entity extraction",
    progress: 50,
    estimatedDuration: 5,
  },
  {
    id: "verification",
    name: "Quality Verification",
    description: "Validating extracted data",
    progress: 75,
    estimatedDuration: 2,
  },
  {
    id: "finalization",
    name: "Finalizing Results",
    description: "Saving and indexing document",
    progress: 90,
    estimatedDuration: 1,
  },
];

interface EnhancedProcessingStatusProps {
  progress: number;
  message?: string;
  stage?: string;
}

export function EnhancedProcessingStatus({
  progress,
  message,
  stage,
}: EnhancedProcessingStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate estimated time remaining based on progress
    if (progress > 0 && progress < 100) {
      const totalEstimatedTime = 20; // Total estimated time in seconds
      const timePerPercent = totalEstimatedTime / 100;
      const remaining = Math.ceil((100 - progress) * timePerPercent);
      setEstimatedTimeRemaining(remaining);
    } else {
      setEstimatedTimeRemaining(0);
    }
  }, [progress]);

  const getCurrentStage = () => {
    for (let i = PROCESSING_STAGES.length - 1; i >= 0; i--) {
      if (progress >= PROCESSING_STAGES[i].progress) {
        return PROCESSING_STAGES[i];
      }
    }
    return PROCESSING_STAGES[0];
  };

  const currentStage = getCurrentStage();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        {/* Header with Progress and Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Processing Document
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStage.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {progress}%
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {estimatedTimeRemaining > 0 
                ? `${formatTime(estimatedTimeRemaining)} left`
                : "Finishing up..."}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {message && <span className="text-blue-600 font-medium">{message}</span>}
          </div>
        </div>

        {/* Processing Stages */}
        <div className="space-y-3">
          {PROCESSING_STAGES.map((stage, index) => {
            const isCurrent = currentStage.id === stage.id;
            const isCompleted = !isCurrent && progress >= stage.progress;
            const isUpcoming = !isCurrent && !isCompleted;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrent
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                    : isCompleted
                    ? "bg-green-50 dark:bg-green-950/30"
                    : "bg-muted/30"
                }`}
                data-testid={`stage-${stage.id}`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : isCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        ~{stage.estimatedDuration}s
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isCurrent
                        ? "text-blue-600/80 dark:text-blue-400/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
