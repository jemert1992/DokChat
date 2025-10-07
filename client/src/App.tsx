import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import Landing from "@/pages/landing";
import IndustrySelection from "@/pages/industry-selection";
import Dashboard from "@/pages/dashboard";
import DocumentAnalysis from "@/pages/document-analysis";
import NotFound from "@/pages/not-found";
// Industry-specific dashboards
import MedicalDashboard from "@/pages/industry/medical-dashboard";
import LegalDashboard from "@/pages/industry/legal-dashboard";
import FinanceDashboard from "@/pages/industry/finance-dashboard";
import LogisticsDashboard from "@/pages/industry/logistics-dashboard";
import RealEstateDashboard from "@/pages/industry/real-estate-dashboard";

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
          {/* Industry-specific dashboards - simplified routes */}
          <Route path="/medical" component={MedicalDashboard} />
          <Route path="/legal" component={LegalDashboard} />
          <Route path="/finance" component={FinanceDashboard} />
          <Route path="/logistics" component={LogisticsDashboard} />
          <Route path="/real-estate" component={RealEstateDashboard} />
          <Route path="/industry/medical" component={MedicalDashboard} />
          <Route path="/industry/legal" component={LegalDashboard} />
          <Route path="/industry/finance" component={FinanceDashboard} />
          <Route path="/industry/logistics" component={LogisticsDashboard} />
          <Route path="/industry/real-estate" component={RealEstateDashboard} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/medical/patient-dashboard" component={MedicalDashboard} />
          <Route path="/medical/clinical-analytics" component={MedicalDashboard} />
          <Route path="/legal/case-manager" component={LegalDashboard} />
          <Route path="/legal/contract-analysis" component={LegalDashboard} />
          <Route path="/finance/analytics-hub" component={FinanceDashboard} />
          <Route path="/finance/transaction-monitoring" component={FinanceDashboard} />
          <Route path="/logistics/control-center" component={LogisticsDashboard} />
          <Route path="/logistics/shipment-tracking" component={LogisticsDashboard} />
          <Route path="/real-estate/property-analysis" component={RealEstateDashboard} />
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
