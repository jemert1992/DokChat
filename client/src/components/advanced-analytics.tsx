import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getIndustryConfig } from "@/lib/industry-config";

interface AdvancedAnalyticsProps {
  industry: string;
  userId: string;
}

interface AnalyticsData {
  processingTrends: Array<{
    date: string;
    documentsProcessed: number;
    avgConfidence: number;
    processingTime: number;
  }>;
  modelPerformance: Array<{
    model: string;
    accuracy: number;
    usage: number;
    avgTime: number;
  }>;
  industryInsights: Array<{
    category: string;
    count: number;
    confidence: number;
  }>;
  complianceMetrics: Array<{
    type: string;
    score: number;
    issues: number;
  }>;
  entityDistribution: Array<{
    type: string;
    count: number;
    confidence: number;
  }>;
  processingStages: Array<{
    stage: string;
    avgTime: number;
    successRate: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function AdvancedAnalytics({ industry, userId }: AdvancedAnalyticsProps) {
  const industryConfig = getIndustryConfig(industry);

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/advanced", industry, userId],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <i className="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
            <p>No analytics data available yet</p>
            <p className="text-sm mt-2">Process some documents to see advanced analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDocuments = analyticsData.processingTrends.reduce((sum, day) => sum + day.documentsProcessed, 0);
  const avgConfidence = analyticsData.processingTrends.length > 0 
    ? analyticsData.processingTrends.reduce((sum, day) => sum + day.avgConfidence, 0) / analyticsData.processingTrends.length
    : 0;
  const bestModel = analyticsData.modelPerformance.reduce((best, model) => 
    model.accuracy > best.accuracy ? model : best, analyticsData.modelPerformance[0]
  );

  return (
    <div className="space-y-6" data-testid="advanced-analytics">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold" data-testid="total-documents">{totalDocuments}</p>
              </div>
              <i className="fas fa-file-alt text-2xl text-primary opacity-70"></i>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold" data-testid="avg-confidence">{avgConfidence.toFixed(1)}%</p>
              </div>
              <i className="fas fa-brain text-2xl text-primary opacity-70"></i>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Model</p>
                <p className="text-lg font-bold" data-testid="best-model">{bestModel?.model}</p>
                <p className="text-sm text-muted-foreground">{bestModel?.accuracy.toFixed(1)}% accuracy</p>
              </div>
              <i className="fas fa-robot text-2xl text-primary opacity-70"></i>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry Focus</p>
                <p className="text-lg font-bold" data-testid="industry-focus">{industryConfig.name}</p>
                <p className="text-sm text-muted-foreground">Specialized analysis</p>
              </div>
              <i className={`${industryConfig.icon} text-2xl text-primary opacity-70`}></i>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Processing Trends</TabsTrigger>
          <TabsTrigger value="models">AI Model Performance</TabsTrigger>
          <TabsTrigger value="entities">Entity Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.processingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="documentsProcessed" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="avgConfidence" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Stages Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.processingStages.map((stage) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{stage.stage.replace('_', ' ')}</span>
                        <Badge variant="secondary">{stage.avgTime.toFixed(1)}s</Badge>
                      </div>
                      <Progress value={stage.successRate} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {stage.successRate.toFixed(1)}% success rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Insights Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData.industryInsights}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="category"
                    >
                      {analyticsData.industryInsights.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.modelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy %" />
                  <Bar dataKey="usage" fill="#82ca9d" name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData.modelPerformance.map((model) => (
              <Card key={model.model}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="font-bold text-lg capitalize">{model.model}</h3>
                    <div className="mt-4 space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-xl font-bold text-green-600">{model.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Usage</p>
                        <p className="text-lg font-semibold">{model.usage} docs</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time</p>
                        <p className="text-lg font-semibold">{model.avgTime.toFixed(1)}s</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Extraction Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Entity Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.entityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Entity Confidence Scores</h4>
                  <div className="space-y-4">
                    {analyticsData.entityDistribution.map((entity) => (
                      <div key={entity.type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{entity.type.replace('_', ' ')}</span>
                          <span className="text-sm text-muted-foreground">{entity.count} found</span>
                        </div>
                        <Progress value={entity.confidence} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {entity.confidence.toFixed(1)}% confidence
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{industryConfig.name} Compliance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Compliance Scores</h4>
                  <div className="space-y-4">
                    {analyticsData.complianceMetrics.map((metric) => (
                      <div key={metric.type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{metric.type}</span>
                          <Badge variant={metric.score > 90 ? "default" : metric.score > 70 ? "secondary" : "destructive"}>
                            {metric.score.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={metric.score} className="h-3" />
                        {metric.issues > 0 && (
                          <p className="text-sm text-orange-600">
                            {metric.issues} issues found
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Compliance Overview</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.complianceMetrics}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="score"
                        nameKey="type"
                      >
                        {analyticsData.complianceMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}