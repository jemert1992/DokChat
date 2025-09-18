import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { transformDataForIndustry, type ProcessedInsight, type ProcessedEntity, type TransformedData } from '@/lib/industry-data-transformer';

interface ExtractedDataDisplayProps {
  data: any;
}

const ExtractedDataDisplay: React.FC<ExtractedDataDisplayProps> = ({ data }) => {
  const { user } = useAuth();
  const [transformedData, setTransformedData] = useState<TransformedData | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    if (data && user?.industry) {
      const transformed = transformDataForIndustry(data, user.industry);
      setTransformedData(transformed);
    }
  }, [data, user?.industry]);

  // Get severity colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      case 'success': return 'outline';
      default: return 'outline';
    }
  };

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'excellent': return 'fas fa-check-circle text-green-600';
      case 'good': return 'fas fa-check text-blue-600';
      case 'needs-attention': return 'fas fa-exclamation-triangle text-yellow-600';
      case 'critical': return 'fas fa-times-circle text-red-600';
      default: return 'fas fa-info-circle text-gray-600';
    }
  };

  const renderInsightCard = (insight: ProcessedInsight) => (
    <Card key={insight.id} className={`${getSeverityColor(insight.severity)} border transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${insight.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' : 
                                           insight.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                                           insight.severity === 'success' ? 'bg-green-100 dark:bg-green-900' :
                                           'bg-blue-100 dark:bg-blue-900'}`}>
              <i className={`${insight.icon} text-lg`}></i>
            </div>
            <div>
              <Badge variant={getSeverityBadgeColor(insight.severity)} className="mb-1">
                {insight.category}
              </Badge>
              <h4 className="font-semibold text-foreground">{insight.title}</h4>
            </div>
          </div>
          {insight.confidence && showTechnicalDetails && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Confidence Score</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-3">{insight.description}</p>
        
        {insight.details && insight.details.length > 0 && (
          <div className="space-y-1 mb-3">
            {insight.details.map((detail, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <i className="fas fa-chevron-right text-xs mt-0.5 text-muted-foreground"></i>
                <span className="text-sm text-muted-foreground">{detail}</span>
              </div>
            ))}
          </div>
        )}
        
        {insight.actions && insight.actions.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-tasks text-sm text-muted-foreground"></i>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommended Actions</span>
            </div>
            <div className="space-y-1">
              {insight.actions.map((action, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <i className="fas fa-arrow-right text-xs mt-0.5 text-primary"></i>
                  <span className="text-sm text-foreground font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderEntityCard = (entity: ProcessedEntity) => (
    <div key={entity.id} className="p-3 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-1.5 bg-background rounded">
            <i className={`${entity.icon} text-sm`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {entity.type}
              </Badge>
              <Badge variant={getImportanceBadgeColor(entity.importance)} className="text-xs">
                {entity.importance} priority
              </Badge>
            </div>
            <p className="font-medium text-foreground text-sm">{entity.value}</p>
            {entity.context && (
              <p className="text-xs text-muted-foreground mt-1">{entity.context}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!transformedData) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
        <p>Processing document analysis...</p>
      </div>
    );
  }

  const { insights, entities, summary, recommendations, complianceStatus } = transformedData;

  // Group insights by category
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, ProcessedInsight[]>);

  // Group entities by category
  const groupedEntities = entities.reduce((acc, entity) => {
    if (!acc[entity.category]) {
      acc[entity.category] = [];
    }
    acc[entity.category].push(entity);
    return acc;
  }, {} as Record<string, ProcessedEntity[]>);

  // Count insights by severity
  const severityCount = {
    critical: insights.filter(i => i.severity === 'critical').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    info: insights.filter(i => i.severity === 'info').length,
    success: insights.filter(i => i.severity === 'success').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <i className={getStatusIcon(summary.status)}></i>
                <span>{summary.title}</span>
              </CardTitle>
              <p className="text-muted-foreground mt-2">{summary.description}</p>
            </div>
            {summary.score && (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.score}%</div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
            )}
          </div>
        </CardHeader>
        {(severityCount.critical > 0 || severityCount.warning > 0) && (
          <CardContent>
            <div className="flex items-center space-x-4">
              {severityCount.critical > 0 && (
                <Badge variant="destructive" className="space-x-1">
                  <i className="fas fa-exclamation-circle text-xs"></i>
                  <span>{severityCount.critical} Critical</span>
                </Badge>
              )}
              {severityCount.warning > 0 && (
                <Badge variant="secondary" className="space-x-1">
                  <i className="fas fa-exclamation-triangle text-xs"></i>
                  <span>{severityCount.warning} Warnings</span>
                </Badge>
              )}
              {severityCount.success > 0 && (
                <Badge variant="outline" className="space-x-1 text-green-600">
                  <i className="fas fa-check-circle text-xs"></i>
                  <span>{severityCount.success} Passed</span>
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Compliance Status */}
      {complianceStatus && (
        <Alert className={complianceStatus.compliant ? 'border-green-500' : 'border-red-500'}>
          <i className={`fas ${complianceStatus.compliant ? 'fa-shield-alt' : 'fa-exclamation-triangle'} mr-2`}></i>
          <AlertTitle>Compliance Status</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                {complianceStatus.compliant ? 'Document meets all compliance requirements' : 'Compliance issues detected'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {complianceStatus.standards.map((standard, idx) => (
                  <Badge key={idx} variant={complianceStatus.compliant ? 'outline' : 'secondary'}>
                    {standard}
                  </Badge>
                ))}
              </div>
              {complianceStatus.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {complianceStatus.issues.map((issue, idx) => (
                    <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                      • {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="insights">
              <i className="fas fa-lightbulb mr-2"></i>
              Insights ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="entities">
              <i className="fas fa-tags mr-2"></i>
              Entities ({entities.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <i className="fas fa-clipboard-check mr-2"></i>
              Actions ({recommendations.length})
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs"
          >
            <i className={`fas fa-${showTechnicalDetails ? 'eye-slash' : 'eye'} mr-1`}></i>
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </Button>
        </div>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {Object.keys(groupedInsights).length > 0 ? (
            Object.entries(groupedInsights).map(([category, categoryInsights]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {category}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {categoryInsights.length}
                  </Badge>
                </h3>
                <div className="grid gap-3">
                  {categoryInsights.map(renderInsightCard)}
                </div>
              </div>
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                <p className="text-muted-foreground">No issues or insights found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4 mt-4">
          {Object.keys(groupedEntities).length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Object.entries(groupedEntities).map(([category, categoryEntities]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center">
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                          {category}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {categoryEntities.length} found
                        </Badge>
                      </h3>
                      <div className="grid gap-2">
                        {categoryEntities.map(renderEntityCard)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {showTechnicalDetails && data && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Extracted from {data.openai ? 'OpenAI' : ''} {data.gemini ? '& Gemini' : ''} analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <i className="fas fa-tags text-4xl text-muted-foreground mb-4 opacity-50"></i>
                <p className="text-muted-foreground">No entities extracted from this document</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <i className="fas fa-tasks mr-2 text-primary"></i>
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((recommendation, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{recommendation}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <i className="fas fa-check mr-1"></i>
                        Mark Done
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No specific recommendations at this time
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Details Footer (if enabled) */}
      {showTechnicalDetails && data && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <i className="fas fa-microchip mr-2"></i>
              Technical Analysis Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {data.openai && (
                <div>
                  <span className="text-muted-foreground">OpenAI Model</span>
                  <p className="font-mono">{data.consensus?.recommendedModel === 'openai' ? '✓ Primary' : 'Secondary'}</p>
                </div>
              )}
              {data.gemini && (
                <div>
                  <span className="text-muted-foreground">Gemini Model</span>
                  <p className="font-mono">{data.consensus?.recommendedModel === 'gemini' ? '✓ Primary' : 'Secondary'}</p>
                </div>
              )}
              {data.openai?.aiConfidence && (
                <div>
                  <span className="text-muted-foreground">AI Confidence</span>
                  <p className="font-mono">{Math.round(data.openai.aiConfidence * 100)}%</p>
                </div>
              )}
              {user?.industry && (
                <div>
                  <span className="text-muted-foreground">Industry Mode</span>
                  <p className="font-mono capitalize">{user.industry.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExtractedDataDisplay;