import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";

interface FeatureHintProps {
  id: string;
  title: string;
  description: string;
  position?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  icon?: ReactNode;
}

export function FeatureHint({ 
  id, 
  title, 
  description, 
  position = "bottom-right",
  icon 
}: FeatureHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if hint was already dismissed
    const dismissed = localStorage.getItem(`hint_dismissed_${id}`);
    if (!dismissed) {
      // Show hint after a short delay
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`hint_dismissed_${id}`, 'true');
  };

  if (!isVisible) return null;

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-left": "top-4 left-4",
  };

  return (
    <Card 
      className={`fixed ${positionClasses[position]} z-40 max-w-sm shadow-lg border-blue-500/50 animate-in slide-in-from-right-5`}
      data-testid={`hint-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
            {icon || <Lightbulb className="h-4 w-4 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
            data-testid={`button-dismiss-hint-${id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
