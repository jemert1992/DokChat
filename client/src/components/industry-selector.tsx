import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type Industry = 'medical' | 'legal' | 'logistics' | 'finance' | 'real_estate' | 'general';

export interface IndustryOption {
  id: Industry;
  name: string;
  icon: string;
  color: string;
  iconBg: string;
  description: string;
  documentTypes: string;
}

export interface IndustrySelectorProps {
  selectedIndustry?: Industry;
  onIndustrySelect: (industry: Industry) => void;
  onSubmit?: (data: { industry: Industry; company?: string }) => void;
  isLoading?: boolean;
  showCompanyInput?: boolean;
  className?: string;
}

const defaultIndustries: IndustryOption[] = [
  {
    id: 'medical',
    name: 'Medical',
    icon: 'fas fa-heartbeat',
    color: 'hover:border-teal-500',
    iconBg: 'bg-teal-500',
    description: 'HIPAA-compliant document processing for healthcare providers',
    documentTypes: 'Patient records • Lab results • Clinical notes'
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: 'fas fa-gavel',
    color: 'hover:border-blue-900',
    iconBg: 'bg-blue-900',
    description: 'Contract analysis and legal document intelligence',
    documentTypes: 'Contracts • Briefs • Case documents'
  },
  {
    id: 'logistics',
    name: 'Logistics',
    icon: 'fas fa-truck',
    color: 'hover:border-orange-500',
    iconBg: 'bg-orange-500',
    description: 'Streamlined shipping and customs documentation',
    documentTypes: 'Bills of lading • Customs forms • Invoices'
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'fas fa-chart-line',
    color: 'hover:border-green-600',
    iconBg: 'bg-green-600',
    description: 'Financial document analysis and compliance',
    documentTypes: 'Statements • Reports • Applications'
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    icon: 'fas fa-home',
    color: 'hover:border-indigo-600',
    iconBg: 'bg-indigo-600',
    description: 'Property transaction and real estate document intelligence',
    documentTypes: 'Purchase contracts • Leases • Disclosures • Inspections'
  },
  {
    id: 'general',
    name: 'General Business',
    icon: 'fas fa-briefcase',
    color: 'hover:border-blue-600',
    iconBg: 'bg-blue-600',
    description: 'Versatile document processing for any business',
    documentTypes: 'Invoices • Contracts • Reports'
  }
];

export default function IndustrySelector({
  selectedIndustry,
  onIndustrySelect,
  onSubmit,
  isLoading = false,
  showCompanyInput = true,
  className
}: IndustrySelectorProps) {
  const [company, setCompany] = useState("");

  const handleSubmit = () => {
    if (selectedIndustry && onSubmit) {
      onSubmit({
        industry: selectedIndustry,
        company: company.trim() || undefined,
      });
    }
  };

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {defaultIndustries.map((industry) => (
          <Card
            key={industry.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg border-2",
              selectedIndustry === industry.id 
                ? 'border-primary shadow-lg' 
                : `border-border ${industry.color}`
            )}
            onClick={() => onIndustrySelect(industry.id)}
            data-testid={`card-industry-${industry.id}`}
          >
            <CardContent className="p-6 text-left">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform hover:scale-110",
                industry.iconBg
              )}>
                <i className={`${industry.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {industry.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {industry.description}
              </p>
              <div className="text-xs text-muted-foreground">
                {industry.documentTypes}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCompanyInput && (
        <div className="max-w-md mx-auto mb-8">
          <Label htmlFor="company" className="text-base font-medium">
            Company Name (Optional)
          </Label>
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
      )}

      {onSubmit && (
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={!selectedIndustry || isLoading}
            size="lg"
            className="min-w-48"
            data-testid="button-continue"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Setting up workspace...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
