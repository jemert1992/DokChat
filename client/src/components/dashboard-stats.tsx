import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryConfig } from "@/lib/industry-config";

interface DashboardStatsProps {
  stats: any;
  isLoading: boolean;
  industry: string;
}

export default function DashboardStats({ stats, isLoading, industry }: DashboardStatsProps) {
  const industryConfig = getIndustryConfig(industry);

  const formatConfidence = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const statCards = [
    {
      label: industryConfig.statLabels.stat1,
      value: stats?.documentsProcessed || 0,
      formatter: formatNumber,
      icon: 'fas fa-file-alt',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      change: '+12%',
      changeLabel: 'from last month',
      testId: 'stat-documents'
    },
    {
      label: industryConfig.statLabels.stat2,
      value: stats?.avgConfidence || 0,
      formatter: formatConfidence,
      icon: 'fas fa-check-circle',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      change: '+2.3%',
      changeLabel: 'accuracy improvement',
      testId: 'stat-confidence'
    },
    {
      label: industryConfig.statLabels.stat3,
      value: stats?.avgProcessingTime || 2.3,
      formatter: (value: number) => `${value}s`,
      icon: 'fas fa-clock',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      change: '-15%',
      changeLabel: 'faster processing',
      testId: 'stat-processing'
    },
    {
      label: industryConfig.statLabels.stat4,
      value: stats?.complianceScore || 98.7,
      formatter: (value: number) => `${value}%`,
      icon: 'fas fa-shield-alt',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-600',
      change: industry === 'medical' ? 'HIPAA' : 'Compliant',
      changeLabel: industry === 'medical' ? 'compliant' : '',
      testId: 'stat-compliance'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="flex items-center mt-4">
                <Skeleton className="h-4 w-12 mr-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} data-testid={stat.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" data-testid={`${stat.testId}-label`}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                  {stat.formatter(stat.value)}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor}`}></i>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600 font-medium" data-testid={`${stat.testId}-change`}>
                {stat.change}
              </span>
              {stat.changeLabel && (
                <span className="text-muted-foreground ml-1" data-testid={`${stat.testId}-change-label`}>
                  {stat.changeLabel}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
