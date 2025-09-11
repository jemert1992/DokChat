import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Award, Zap } from 'lucide-react';

interface ExecutiveDashboardProps {
  industry: string;
  userId: string;
}

interface ExecutiveDashboard {
  kpiSummary: {
    overallScore: number;
    accuracyToTarget: number;
    processingEfficiency: number;
    costEffectiveness: number;
    customerSatisfaction: number;
    innovationIndex: number;
  };
  strategicMetrics: {
    marketPosition: {
      competitiveRank: number;
      marketShare: number;
      growthRate: number;
      differentiationScore: number;
    };
    operationalExcellence: {
      qualityScore: number;
      efficiencyScore: number;
      reliabilityScore: number;
      scalabilityScore: number;
    };
    innovation: {
      technologyAdoption: number;
      featureUtilization: number;
      userEngagement: number;
      futureReadiness: number;
    };
  };
  riskDashboard: {
    overallRiskScore: number;
    riskCategories: Record<string, {
      score: number;
      trend: 'improving' | 'stable' | 'deteriorating';
      mitigation: string[];
    }>;
    riskHeatmap: Array<{
      category: string;
      subcategory: string;
      probability: number;
      impact: number;
      riskScore: number;
    }>;
  };
  actionItems: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'performance' | 'quality' | 'cost' | 'compliance' | 'innovation';
    action: string;
    expectedImpact: string;
    timeframe: string;
    resources: string[];
    owner: string;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function ExecutiveDashboard({ industry, userId }: ExecutiveDashboardProps) {
  const { data: executiveData, isLoading, error } = useQuery<ExecutiveDashboard>({
    queryKey: ["/api/analytics/executive", industry, userId],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="executive-dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !executiveData) {
    return (
      <Alert className="border-orange-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load executive dashboard. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const { kpiSummary, strategicMetrics, riskDashboard, actionItems } = executiveData;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <div className="space-y-6" data-testid="executive-dashboard">
      {/* KPI Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.overallScore)}`} data-testid="overall-score">
                  {kpiSummary.overallScore.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.overallScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accuracy Target Progress</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.accuracyToTarget * 100)}`} data-testid="accuracy-target">
                  {(kpiSummary.accuracyToTarget * 100).toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.accuracyToTarget * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Goal: 93%+ accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Efficiency</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.processingEfficiency)}`} data-testid="processing-efficiency">
                  {kpiSummary.processingEfficiency.toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.processingEfficiency} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Effectiveness</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.costEffectiveness)}`} data-testid="cost-effectiveness">
                  {kpiSummary.costEffectiveness.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.costEffectiveness} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.customerSatisfaction)}`} data-testid="customer-satisfaction">
                  {kpiSummary.customerSatisfaction.toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.customerSatisfaction} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Innovation Index</p>
                <p className={`text-2xl font-bold ${getScoreColor(kpiSummary.innovationIndex)}`} data-testid="innovation-index">
                  {kpiSummary.innovationIndex.toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="mt-4">
              <Progress value={kpiSummary.innovationIndex} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Metrics and Risk Dashboard */}
      <Tabs defaultValue="strategic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategic">Strategic Metrics</TabsTrigger>
          <TabsTrigger value="risk">Risk Dashboard</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="strategic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Position */}
            <Card>
              <CardHeader>
                <CardTitle>Market Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Competitive Rank</span>
                    <Badge variant="secondary" data-testid="competitive-rank">#{strategicMetrics.marketPosition.competitiveRank}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Market Share</span>
                    <span className="font-medium" data-testid="market-share">{(strategicMetrics.marketPosition.marketShare * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Growth Rate</span>
                    <span className="font-medium text-green-600" data-testid="growth-rate">+{(strategicMetrics.marketPosition.growthRate * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Differentiation</span>
                      <span className="text-sm font-medium">{(strategicMetrics.marketPosition.differentiationScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={strategicMetrics.marketPosition.differentiationScore * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operational Excellence */}
            <Card>
              <CardHeader>
                <CardTitle>Operational Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(strategicMetrics.operationalExcellence).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Innovation */}
            <Card>
              <CardHeader>
                <CardTitle>Innovation Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(strategicMetrics.innovation).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(riskDashboard.riskCategories).map(([category, risk]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getScoreBadgeVariant(100 - risk.score)}>
                            {risk.score.toFixed(1)}%
                          </Badge>
                          {risk.trend === 'improving' ? 
                            <TrendingDown className="h-4 w-4 text-green-600" /> :
                            risk.trend === 'deteriorating' ?
                            <TrendingUp className="h-4 w-4 text-red-600" /> :
                            <div className="h-4 w-4" />
                          }
                        </div>
                      </div>
                      <Progress value={100 - risk.score} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Mitigation: {risk.mitigation.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskDashboard.riskHeatmap.map((risk, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm">{risk.category}</div>
                        <div className="text-xs text-muted-foreground">{risk.subcategory}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Risk: {risk.riskScore.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">
                          P: {(risk.probability * 100).toFixed(0)}% | I: {(risk.impact * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="space-y-4">
            {actionItems.map((item, index) => (
              <Alert key={index} className={`border-l-4 ${getPriorityColor(item.priority)}`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{item.action}</div>
                        <div className="text-sm text-muted-foreground mt-1">{item.expectedImpact}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={item.priority === 'critical' ? 'destructive' : 
                                     item.priority === 'high' ? 'default' : 'secondary'}>
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.timeframe}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Owner:</span> {item.owner} | 
                      <span className="font-medium"> Resources:</span> {item.resources.join(', ')}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}