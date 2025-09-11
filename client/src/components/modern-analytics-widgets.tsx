import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ModernAnalyticsWidgetsProps {
  industry: string;
  stats: any;
  isLoading: boolean;
}

export default function ModernAnalyticsWidgets({ industry, stats, isLoading }: ModernAnalyticsWidgetsProps) {
  const getCurrentHour = () => {
    return new Date().getHours();
  };

  const getTimeBasedUsers = () => {
    const hour = getCurrentHour();
    // Simulate realistic user counts based on time of day
    if (hour >= 9 && hour <= 17) {
      return Math.floor(Math.random() * 50) + 25; // Business hours: 25-75 users
    } else if (hour >= 6 && hour <= 21) {
      return Math.floor(Math.random() * 20) + 10; // Extended hours: 10-30 users
    } else {
      return Math.floor(Math.random() * 10) + 2; // Night: 2-12 users
    }
  };

  const liveUsers = getTimeBasedUsers();

  const engagementData = [
    { metric: 'Documents Processed', value: stats?.documentsProcessed || 0, change: '+12.5%', trend: 'up' },
    { metric: 'Processing Speed', value: `${stats?.avgProcessingTime || 2.3}s`, change: '-15%', trend: 'up' },
    { metric: 'AI Confidence', value: `${Math.round((stats?.avgConfidence || 0.95) * 100)}%`, change: '+2.3%', trend: 'up' },
    { metric: 'Compliance Score', value: `${stats?.complianceScore || 98.7}%`, change: '+0.8%', trend: 'up' },
  ];

  const industryMetrics = {
    medical: {
      title: 'Healthcare Analytics',
      primaryMetric: 'Patient Records Processed',
      secondaryMetrics: ['HIPAA Compliance', 'Clinical Accuracy', 'Processing Time']
    },
    legal: {
      title: 'Legal Analytics',
      primaryMetric: 'Contracts Analyzed',
      secondaryMetrics: ['Contract Accuracy', 'Risk Assessment', 'Compliance Check']
    },
    finance: {
      title: 'Financial Analytics',
      primaryMetric: 'Financial Docs Analyzed',
      secondaryMetrics: ['Fraud Detection', 'Risk Score', 'Compliance Rate']
    },
    logistics: {
      title: 'Logistics Analytics',
      primaryMetric: 'Shipments Processed',
      secondaryMetrics: ['Customs Accuracy', 'Delivery Speed', 'Tracking Efficiency']
    },
    real_estate: {
      title: 'Real Estate Analytics',
      primaryMetric: 'Property Transactions',
      secondaryMetrics: ['Contract Accuracy', 'Processing Speed', 'Compliance Score']
    },
    general: {
      title: 'Business Analytics',
      primaryMetric: 'Documents Processed',
      secondaryMetrics: ['Extraction Accuracy', 'Processing Speed', 'Quality Score']
    }
  };

  const currentMetrics = industryMetrics[industry as keyof typeof industryMetrics] || industryMetrics.general;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
      {/* Document Processing Analytics */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Processing
            </h3>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" data-testid="button-document-options">
              <i className="fas fa-ellipsis-h"></i>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {engagementData.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.metric}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </span>
                  <span className={`text-sm font-medium ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Processing efficiency</span>
              <span className="font-medium text-gray-900 dark:text-white">94.2%</span>
            </div>
            <Progress value={94} className="mt-2 h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Live Processing Status */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Live Processing
            </h3>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <i className="fas fa-circle text-xs mr-1.5 animate-pulse"></i>
              Live
            </Badge>
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="live-users-count">
              {liveUsers}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Active processing sessions
            </p>
          </div>

          <div className="space-y-3">
            {[
              { user: 'Medical AI Agent', status: 'Processing lab results', progress: 78 },
              { user: 'Legal Assistant', status: 'Analyzing contracts', progress: 45 },
              { user: 'Finance Bot', status: 'Risk assessment', progress: 92 }
            ].map((session, index) => (
              <div key={index} className="flex items-center space-x-3" data-testid={`processing-session-${index}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-white text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.user}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {session.status}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {session.progress}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Performance */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentMetrics.title}
            </h3>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" data-testid="button-view-report">
              View Report
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">{currentMetrics.primaryMetric}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="primary-metric-value">
                {(stats?.documentsProcessed || 0).toLocaleString()}
              </span>
            </div>

            {currentMetrics.secondaryMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between" data-testid={`secondary-metric-${index}`}>
                <span className="text-sm text-gray-600 dark:text-gray-400">{metric}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.floor(Math.random() * 10) + 90}%
                  </span>
                  <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              data-testid="action-upload-documents"
            >
              <i className="fas fa-upload text-lg"></i>
              <span className="text-xs">Upload</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              data-testid="action-view-analytics"
            >
              <i className="fas fa-chart-line text-lg"></i>
              <span className="text-xs">Analytics</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              data-testid="action-export-data"
            >
              <i className="fas fa-download text-lg"></i>
              <span className="text-xs">Export</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              data-testid="action-settings"
            >
              <i className="fas fa-cog text-lg"></i>
              <span className="text-xs">Settings</span>
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">System Health</span>
              <span className="flex items-center text-green-600">
                <i className="fas fa-circle text-xs mr-1"></i>
                Optimal
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}