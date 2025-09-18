import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import Landing from "@/pages/landing";
import IndustrySelection from "@/pages/industry-selection";
import Dashboard from "@/pages/dashboard";
import DocumentAnalysis from "@/pages/document-analysis";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        message="Loading application..." 
      />
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/industry-selection" component={IndustrySelection} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/industry-selection" component={IndustrySelection} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/document/:id" component={DocumentAnalysis} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
