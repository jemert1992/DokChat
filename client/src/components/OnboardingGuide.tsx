import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: ReactNode;
  action?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Welcome to DOKTECH 3.0",
    description: "Your AI-powered document intelligence platform. Let's get you started with a quick tour.",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    title: "Upload Documents",
    description: "Click 'Upload Documents' to process invoices, contracts, medical records, and more. We support PDF, images, and scanned documents up to 100MB.",
    icon: <div className="text-2xl">📄</div>,
    action: "Go to Upload",
  },
  {
    title: "AI Processing",
    description: "Our AI automatically extracts text, identifies entities, and analyzes content in under 1 minute. Watch the real-time progress as it processes.",
    icon: <div className="text-2xl">🤖</div>,
  },
  {
    title: "Smart Analysis",
    description: "View extracted data, confidence scores, and industry-specific insights. Use the AI Assistant to ask questions about your documents.",
    icon: <div className="text-2xl">📊</div>,
    action: "Go to Dashboard",
  },
  {
    title: "Industry Dashboards",
    description: "Your workspace adapts to your industry (Medical, Legal, Finance, etc.) with specialized tools and compliance features.",
    icon: <div className="text-2xl">🏢</div>,
  },
];

interface OnboardingGuideProps {
  onComplete: () => void;
  onNavigate?: (path: string) => void;
}

export function OnboardingGuide({ onComplete, onNavigate }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentGuideStep = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleAction = () => {
    if (currentGuideStep.action?.includes('Upload')) {
      onNavigate?.('/upload');
    } else if (currentGuideStep.action?.includes('Dashboard')) {
      onNavigate?.('/dashboard');
    }
    handleNext();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-blue-500">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleComplete}
            data-testid="button-close-onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              {currentGuideStep.icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{currentGuideStep.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep + 1} of {GUIDE_STEPS.length}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg leading-relaxed">{currentGuideStep.description}</p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {GUIDE_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : index < currentStep
                    ? "w-2 bg-green-600"
                    : "w-2 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous-step"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentGuideStep.action ? (
              <Button onClick={handleAction} className="gap-2" data-testid="button-action">
                {currentGuideStep.action}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2" data-testid="button-next-step">
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <button
              onClick={handleComplete}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-skip-onboarding"
            >
              Skip tour
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
