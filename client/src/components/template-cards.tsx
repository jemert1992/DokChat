import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getIndustryConfig } from "@/lib/industry-config";
import { FileText, Zap, Shield, Brain, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

interface IndustryCapabilitiesProps {
  userIndustry: string;
  onStartProcessing: () => void;
}

export default function IndustryCapabilities({ userIndustry, onStartProcessing }: IndustryCapabilitiesProps) {
  const industryConfig = getIndustryConfig(userIndustry);

  // Get industry-specific capabilities and smart recommendations
  const getIndustryCapabilities = (industry: string) => {
    const capabilities = {
      medical: {
        primaryCapabilities: [
          { icon: FileText, title: 'Patient Records Analysis', description: 'Extract patient data, medical history, and treatment plans with HIPAA compliance', confidence: '99.3%' },
          { icon: Shield, title: 'Lab Report Processing', description: 'Analyze lab results, flag critical values, and track patient trends', confidence: '98.7%' },
          { icon: Brain, title: 'Clinical Decision Support', description: 'AI-powered insights for diagnosis assistance and treatment recommendations', confidence: '97.2%' },
        ],
        smartRecommendations: [
          'Upload patient intake forms to extract demographics and insurance information',
          'Process lab reports to identify critical values and trends',
          'Analyze clinical notes to extract symptoms and treatment plans',
        ],
        complianceFeatures: ['HIPAA Privacy Protection', 'Medical Data Encryption', 'Audit Trail Logging'],
        processingStats: { avgTime: '1.8s', accuracy: '99.2%', documentsProcessed: '2.3K+' }
      },
      legal: {
        primaryCapabilities: [
          { icon: FileText, title: 'Contract Analysis', description: 'Extract key terms, clauses, obligations, and identify risks in legal agreements', confidence: '98.1%' },
          { icon: Shield, title: 'Legal Brief Processing', description: 'Analyze case documents, extract precedents, and identify legal arguments', confidence: '97.5%' },
          { icon: Brain, title: 'Risk Assessment', description: 'AI-powered legal risk analysis and compliance verification', confidence: '96.8%' },
        ],
        smartRecommendations: [
          'Upload contracts to extract key terms, dates, and obligations',
          'Process legal briefs to identify case precedents and arguments',
          'Analyze discovery documents for relevant evidence and facts',
        ],
        complianceFeatures: ['Attorney-Client Privilege Protection', 'Legal Document Security', 'Court Filing Standards'],
        processingStats: { avgTime: '2.1s', accuracy: '97.5%', documentsProcessed: '1.8K+' }
      },
      finance: {
        primaryCapabilities: [
          { icon: FileText, title: 'Financial Statement Analysis', description: 'Extract financial data, ratios, and identify anomalies in reports', confidence: '98.9%' },
          { icon: Shield, title: 'Fraud Detection', description: 'AI-powered fraud pattern recognition and risk assessment', confidence: '97.3%' },
          { icon: Brain, title: 'Compliance Monitoring', description: 'Automated regulatory compliance checking and reporting', confidence: '98.5%' },
        ],
        smartRecommendations: [
          'Upload bank statements to detect unusual transactions and patterns',
          'Process invoices to extract payment terms and vendor information',
          'Analyze tax documents to ensure compliance and identify deductions',
        ],
        complianceFeatures: ['SOX Compliance', 'AML/KYC Verification', 'Financial Data Security'],
        processingStats: { avgTime: '1.5s', accuracy: '98.7%', documentsProcessed: '3.1K+' }
      },
      logistics: {
        primaryCapabilities: [
          { icon: FileText, title: 'Shipping Document Processing', description: 'Extract shipment details, tracking info, and customs data', confidence: '97.8%' },
          { icon: Shield, title: 'Customs Compliance', description: 'Verify customs forms and international shipping requirements', confidence: '96.4%' },
          { icon: Brain, title: 'Supply Chain Intelligence', description: 'AI-powered logistics optimization and route analysis', confidence: '95.9%' },
        ],
        smartRecommendations: [
          'Upload bills of lading to extract shipment and cargo details',
          'Process customs forms to ensure international compliance',
          'Analyze delivery receipts to track shipment performance',
        ],
        complianceFeatures: ['International Shipping Standards', 'Customs Documentation', 'Multi-Language Support'],
        processingStats: { avgTime: '2.3s', accuracy: '96.8%', documentsProcessed: '4.2K+' }
      },
      real_estate: {
        primaryCapabilities: [
          { icon: FileText, title: 'Property Document Analysis', description: 'Extract property details, terms, and financial information from contracts', confidence: '98.3%' },
          { icon: Shield, title: 'Transaction Processing', description: 'Analyze closing documents, titles, and legal requirements', confidence: '97.1%' },
          { icon: Brain, title: 'Market Intelligence', description: 'AI-powered property valuation and market trend analysis', confidence: '96.5%' },
        ],
        smartRecommendations: [
          'Upload purchase agreements to extract terms and conditions',
          'Process lease agreements to identify key clauses and obligations',
          'Analyze property inspections to identify issues and recommendations',
        ],
        complianceFeatures: ['Real Estate Law Compliance', 'Title Verification', 'Escrow Documentation'],
        processingStats: { avgTime: '1.9s', accuracy: '98.1%', documentsProcessed: '1.5K+' }
      },
      general: {
        primaryCapabilities: [
          { icon: FileText, title: 'Document Analysis', description: 'Extract text, tables, and structured data from any document type', confidence: '97.5%' },
          { icon: Shield, title: 'Data Security', description: 'Enterprise-grade security with end-to-end encryption', confidence: '99.1%' },
          { icon: Brain, title: 'AI Intelligence', description: 'Multi-model AI analysis with confidence scoring', confidence: '96.8%' },
        ],
        smartRecommendations: [
          'Upload business documents to extract key information and data',
          'Process forms and applications to automate data entry',
          'Analyze reports to identify insights and trends',
        ],
        complianceFeatures: ['Enterprise Security', 'Data Privacy Protection', 'Flexible Processing'],
        processingStats: { avgTime: '2.0s', accuracy: '97.2%', documentsProcessed: '5.7K+' }
      }
    };
    return capabilities[industry as keyof typeof capabilities] || capabilities.general;
  };

  const capabilities = getIndustryCapabilities(userIndustry);
  const industryDisplayName = industryConfig.name;

  return (
    <div className="space-y-8">
      {/* Industry-Focused Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className={`w-16 h-16 bg-gradient-to-br from-${industryConfig.color}-500 to-${industryConfig.color}-600 rounded-2xl flex items-center justify-center shadow-lg`}>
            <i className={`${industryConfig.icon} text-white text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {industryDisplayName} Intelligence
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered document processing specialized for your industry
            </p>
          </div>
        </div>
        
        {/* Performance Stats Banner */}
        <div className="flex items-center justify-center space-x-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{capabilities.processingStats.accuracy}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{capabilities.processingStats.avgTime}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{capabilities.processingStats.documentsProcessed}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
          </div>
        </div>
      </div>

      {/* Primary Capabilities */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            What DOKTECH can do for you
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.primaryCapabilities.map((capability, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <capability.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {capability.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {capability.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {capability.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart recommendations for your documents
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.smartRecommendations.map((recommendation, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Compliance Features */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Built-in compliance & security
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {capabilities.complianceFeatures.map((feature, index) => (
            <Badge key={index} variant="outline" className="px-3 py-1 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
              <Shield className="w-3 h-3 mr-1" />
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ready to transform your document workflow?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload your {industryDisplayName.toLowerCase()} documents and let DOKTECH's AI analyze them with industry-specific intelligence and compliance built-in.
        </p>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
          onClick={onStartProcessing}
          data-testid="button-upload-documents-cta"
        >
          <i className="fas fa-upload mr-2"></i>
          Upload Documents
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}