import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

type Industry = 'medical' | 'legal' | 'logistics' | 'finance' | 'real_estate' | 'general';

export default function IndustrySelection() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [company, setCompany] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const mutation = useMutation({
    mutationFn: async (data: { industry: Industry; company?: string }) => {
      const response = await apiRequest("PUT", "/api/user/industry", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Industry Selected",
        description: "Your workspace has been customized for your industry.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update industry selection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const industries = [
    {
      id: 'medical' as Industry,
      name: 'Medical',
      icon: 'fas fa-heartbeat',
      color: 'hover:border-teal-500',
      iconBg: 'bg-teal-500',
      description: 'HIPAA-compliant document processing for healthcare providers',
      documentTypes: 'Patient records • Lab results • Clinical notes'
    },
    {
      id: 'legal' as Industry,
      name: 'Legal',
      icon: 'fas fa-gavel',
      color: 'hover:border-blue-900',
      iconBg: 'bg-blue-900',
      description: 'Contract analysis and legal document intelligence',
      documentTypes: 'Contracts • Briefs • Case documents'
    },
    {
      id: 'logistics' as Industry,
      name: 'Logistics',
      icon: 'fas fa-truck',
      color: 'hover:border-orange-500',
      iconBg: 'bg-orange-500',
      description: 'Streamlined shipping and customs documentation',
      documentTypes: 'Bills of lading • Customs forms • Invoices'
    },
    {
      id: 'finance' as Industry,
      name: 'Finance',
      icon: 'fas fa-chart-line',
      color: 'hover:border-green-600',
      iconBg: 'bg-green-600',
      description: 'Financial document analysis and compliance',
      documentTypes: 'Statements • Reports • Applications'
    },
    {
      id: 'real_estate' as Industry,
      name: 'Real Estate',
      icon: 'fas fa-home',
      color: 'hover:border-indigo-600',
      iconBg: 'bg-indigo-600',
      description: 'Property transaction and real estate document intelligence',
      documentTypes: 'Purchase contracts • Leases • Disclosures • Inspections'
    },
    {
      id: 'general' as Industry,
      name: 'General Business',
      icon: 'fas fa-briefcase',
      color: 'hover:border-blue-600',
      iconBg: 'bg-blue-600',
      description: 'Versatile document processing for any business',
      documentTypes: 'Invoices • Contracts • Reports'
    }
  ];

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry);
  };

  const handleSubmit = () => {
    if (!selectedIndustry) {
      toast({
        title: "Selection Required",
        description: "Please select an industry to continue.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      industry: selectedIndustry,
      company: company.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <i className="fas fa-file-alt text-primary-foreground text-sm"></i>
                </div>
                <span className="text-xl font-bold text-foreground">DOKTECH 3.0</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                data-testid="button-close"
              >
                <i className="fas fa-times text-xl"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Industry Selection Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Choose Your Industry</h1>
              <p className="text-lg text-muted-foreground">Select your industry to customize your DOKTECH experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {industries.map((industry) => (
                <Card
                  key={industry.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                    selectedIndustry === industry.id 
                      ? 'border-primary shadow-lg' 
                      : `border-border ${industry.color}`
                  }`}
                  onClick={() => handleIndustrySelect(industry.id)}
                  data-testid={`card-industry-${industry.id}`}
                >
                  <CardContent className="p-6 text-left">
                    <div className={`w-16 h-16 ${industry.iconBg} rounded-xl flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
                      <i className={`${industry.icon} text-white text-2xl`}></i>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{industry.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{industry.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {industry.documentTypes}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Company Input */}
            <div className="max-w-md mx-auto mb-8">
              <Label htmlFor="company" className="text-base font-medium">Company Name (Optional)</Label>
              <Input
                id="company"
                type="text"
                placeholder="Enter your company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-2"
                data-testid="input-company"
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={!selectedIndustry || mutation.isPending}
                size="lg"
                className="min-w-48"
                data-testid="button-continue"
              >
                {mutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Setting up workspace...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </Button>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Don't worry, you can change this later in your account settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
