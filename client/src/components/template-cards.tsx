import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getIndustryConfig } from "@/lib/industry-config";
import { useLocation } from "wouter";

interface TemplateCardsProps {
  currentIndustry: string;
  onTemplateSelect: (industryId: string) => void;
}

export default function TemplateCards({ currentIndustry, onTemplateSelect }: TemplateCardsProps) {
  const [, setLocation] = useLocation();

  const industryTemplates = [
    {
      id: 'medical',
      name: 'Medical Dashboard',
      description: 'Healthcare document analysis with HIPAA compliance',
      icon: 'fas fa-heartbeat',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      iconColor: 'text-white',
      features: ['Patient Records', 'Lab Reports', 'Clinical Analysis', 'HIPAA Compliance'],
      stats: { documents: '2.3K', accuracy: '99.2%', speed: '1.8s' },
      chartCount: 8,
      isActive: currentIndustry === 'medical'
    },
    {
      id: 'legal',
      name: 'Legal Dashboard',
      description: 'Contract analysis and legal document processing',
      icon: 'fas fa-gavel',
      color: 'bg-gradient-to-br from-blue-600 to-indigo-700',
      iconColor: 'text-white',
      features: ['Contract Review', 'Legal Briefs', 'Compliance Check', 'Risk Analysis'],
      stats: { documents: '1.8K', accuracy: '97.5%', speed: '2.1s' },
      chartCount: 6,
      isActive: currentIndustry === 'legal'
    },
    {
      id: 'finance',
      name: 'Finance Dashboard',
      description: 'Financial document analysis and fraud detection',
      icon: 'fas fa-chart-line',
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-white',
      features: ['Financial Statements', 'Risk Assessment', 'Fraud Detection', 'Compliance'],
      stats: { documents: '3.1K', accuracy: '98.7%', speed: '1.5s' },
      chartCount: 12,
      isActive: currentIndustry === 'finance'
    },
    {
      id: 'logistics',
      name: 'Logistics Dashboard',
      description: 'Shipping documents and customs form processing',
      icon: 'fas fa-truck',
      color: 'bg-gradient-to-br from-orange-500 to-red-600',
      iconColor: 'text-white',
      features: ['Bills of Lading', 'Customs Forms', 'Invoices', 'Tracking'],
      stats: { documents: '4.2K', accuracy: '96.8%', speed: '2.3s' },
      chartCount: 7,
      isActive: currentIndustry === 'logistics'
    },
    {
      id: 'real_estate',
      name: 'Real Estate Dashboard',
      description: 'Property documents and transaction analysis',
      icon: 'fas fa-home',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      iconColor: 'text-white',
      features: ['Property Contracts', 'Leases', 'Inspections', 'Closings'],
      stats: { documents: '1.5K', accuracy: '98.1%', speed: '1.9s' },
      chartCount: 9,
      isActive: currentIndustry === 'real_estate'
    },
    {
      id: 'general',
      name: 'General Business',
      description: 'Universal document processing for all business needs',
      icon: 'fas fa-briefcase',
      color: 'bg-gradient-to-br from-gray-600 to-slate-700',
      iconColor: 'text-white',
      features: ['Invoices', 'Contracts', 'Reports', 'Correspondence'],
      stats: { documents: '5.7K', accuracy: '95.4%', speed: '2.0s' },
      chartCount: 15,
      isActive: currentIndustry === 'general'
    }
  ];

  const handleCardClick = (template: any) => {
    if (template.id !== currentIndustry) {
      // Switch industry
      setLocation('/industry-selection');
    } else {
      // View current industry dashboard
      onTemplateSelect(template.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Industry Templates
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from specialized AI-powered document analysis templates
          </p>
        </div>
        <Button
          variant="outline"
          className="text-sm"
          onClick={() => setLocation('/industry-selection')}
          data-testid="button-switch-industry"
        >
          <i className="fas fa-exchange-alt mr-2"></i>
          Switch Industry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {industryTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              template.isActive 
                ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50/50 dark:bg-blue-950/30' 
                : 'hover:shadow-xl border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleCardClick(template)}
            data-testid={`template-card-${template.id}`}
          >
            <CardContent className="p-6">
              {/* Header with Icon and Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${template.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <i className={`${template.icon} ${template.iconColor} text-xl`}></i>
                </div>
                {template.isActive && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Current
                  </Badge>
                )}
              </div>

              {/* Title and Description */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Key Features
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{template.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {template.stats.documents}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Docs</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {template.stats.accuracy}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {template.stats.speed}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Speed</p>
                </div>
              </div>

              {/* Chart Count and Action */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-chart-bar mr-2"></i>
                  {template.chartCount} charts available
                </div>
                <Button
                  size="sm"
                  variant={template.isActive ? "default" : "ghost"}
                  className="text-xs"
                  data-testid={`button-select-${template.id}`}
                >
                  {template.isActive ? (
                    <>
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-right mr-1"></i>
                      Select
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}