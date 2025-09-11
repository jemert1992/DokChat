import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Users, 
  FileText, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Lock,
  Key,
  Bell,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface SecurityAuditLog {
  id: number;
  eventId: string;
  userId?: string;
  eventType: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'warning';
  severity: 'low' | 'info' | 'warning' | 'high' | 'critical';
  riskScore: number;
  complianceRelevant: boolean;
  eventData: any;
  createdAt: string;
}

interface ComplianceViolation {
  id: number;
  ruleId: number;
  evaluationResult: string;
  violationType: string;
  violationSeverity: 'low' | 'medium' | 'high' | 'critical';
  violationDetails: any;
  remediationStatus: 'pending' | 'in_progress' | 'resolved';
  evaluatedAt: string;
}

interface SecurityIncident {
  id: number;
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  title: string;
  description: string;
  detectedAt: string;
}

interface ComplianceMetrics {
  overallScore: number;
  activeViolations: number;
  resolvedViolations: number;
  criticalIssues: number;
  industryCompliance: {
    [industry: string]: {
      score: number;
      violations: number;
      lastEvaluated: string;
    };
  };
}

interface SecurityMetrics {
  totalSecurityEvents: number;
  highRiskEvents: number;
  activeIncidents: number;
  averageRiskScore: number;
  authenticationFailures: number;
  accessDenials: number;
}

interface SecurityComplianceDashboardProps {
  industry?: string;
  userId?: string;
}

export function SecurityComplianceDashboard({ industry, userId }: SecurityComplianceDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Fetch security metrics
  const { data: securityMetrics, isLoading: securityLoading } = useQuery<SecurityMetrics>({
    queryKey: ['/api/security/metrics', selectedTimeRange],
    enabled: true
  });

  // Fetch compliance metrics
  const { data: complianceMetrics, isLoading: complianceLoading } = useQuery<ComplianceMetrics>({
    queryKey: ['/api/compliance/metrics', industry],
    enabled: true
  });

  // Fetch recent security events
  const { data: securityEvents, isLoading: eventsLoading } = useQuery<SecurityAuditLog[]>({
    queryKey: ['/api/security/audit-logs', { 
      severity: selectedSeverity, 
      timeRange: selectedTimeRange,
      limit: 50 
    }],
    enabled: true
  });

  // Fetch compliance violations
  const { data: violations, isLoading: violationsLoading } = useQuery<ComplianceViolation[]>({
    queryKey: ['/api/compliance/violations', { 
      industry, 
      resolved: false,
      limit: 20 
    }],
    enabled: true
  });

  // Fetch security incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery<SecurityIncident[]>({
    queryKey: ['/api/security/incidents', { 
      status: 'open',
      limit: 10 
    }],
    enabled: true
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'warning': case 'medium': return 'secondary';
      case 'info': case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'resolved': return 'default';
      case 'failure': case 'open': return 'destructive';
      case 'warning': case 'investigating': return 'secondary';
      default: return 'outline';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6" data-testid="security-compliance-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Compliance</h1>
          <p className="text-muted-foreground">
            Enterprise security monitoring and regulatory compliance dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            data-testid="button-export-report"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            data-testid="button-configure-alerts"
          >
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-compliance-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceScoreColor(complianceMetrics?.overallScore || 0)}`}>
              {complianceMetrics?.overallScore || 0}%
            </div>
            <Progress 
              value={complianceMetrics?.overallScore || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card data-testid="card-active-violations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complianceMetrics?.activeViolations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceMetrics?.criticalIssues || 0} critical issues
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-security-incidents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityMetrics?.activeIncidents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics?.highRiskEvents || 0} high-risk events
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-risk-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityMetrics?.averageRiskScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics?.totalSecurityEvents || 0} total events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList data-testid="tabs-security-compliance">
          <TabsTrigger value="security">Security Monitoring</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="incidents">Incident Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Security Monitoring Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Security Events Timeline */}
            <Card data-testid="card-security-events">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>
                  Real-time security monitoring and threat detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {securityEvents?.map((event) => (
                      <div 
                        key={event.id} 
                        className="flex items-start space-x-3 p-3 rounded-lg border"
                        data-testid={`security-event-${event.id}`}
                      >
                        <div className="flex-shrink-0">
                          {event.outcome === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : event.outcome === 'failure' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {event.eventType.replace(/_/g, ' ')}
                            </p>
                            <Badge variant={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {event.action} on {event.resource}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(event.createdAt), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Authentication & Access */}
            <Card data-testid="card-authentication-stats">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication & Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication Failures</span>
                    <Badge variant="destructive">
                      {securityMetrics?.authenticationFailures || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Access Denied</span>
                    <Badge variant="secondary">
                      {securityMetrics?.accessDenials || 0}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Session Management</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>• MFA enforcement active</p>
                      <p>• Session timeout: 30 minutes</p>
                      <p>• Concurrent sessions: Limited to 3</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Status Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Compliance Violations */}
            <Card data-testid="card-compliance-violations">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {violations?.map((violation) => (
                      <div 
                        key={violation.id} 
                        className="p-3 rounded-lg border"
                        data-testid={`violation-${violation.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getSeverityColor(violation.violationSeverity)}>
                            {violation.violationSeverity}
                          </Badge>
                          <Badge variant={getStatusColor(violation.remediationStatus)}>
                            {violation.remediationStatus}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {violation.violationType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(violation.evaluatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Industry Compliance Scores */}
            <Card data-testid="card-industry-compliance">
              <CardHeader>
                <CardTitle>Industry Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceMetrics?.industryCompliance && Object.entries(complianceMetrics.industryCompliance).map(([ind, metrics]) => (
                    <div key={ind} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{ind}</span>
                        <span className={`text-sm font-bold ${getComplianceScoreColor(metrics.score)}`}>
                          {metrics.score}%
                        </span>
                      </div>
                      <Progress value={metrics.score} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{metrics.violations} violations</span>
                        <span>Last: {format(new Date(metrics.lastEvaluated), 'MMM d')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incident Management Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card data-testid="card-security-incidents-list">
            <CardHeader>
              <CardTitle>Active Security Incidents</CardTitle>
              <CardDescription>
                Current security incidents requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents?.map((incident) => (
                  <div 
                    key={incident.id} 
                    className="p-4 rounded-lg border"
                    data-testid={`incident-${incident.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{incident.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {incident.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Type: {incident.type.replace(/_/g, ' ')}</span>
                      <span>Detected: {format(new Date(incident.detectedAt), 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Audit Log Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <select 
                  value={selectedTimeRange} 
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                  data-testid="select-time-range"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <select 
                  value={selectedSeverity || ''} 
                  onChange={(e) => setSelectedSeverity(e.target.value || null)}
                  className="px-3 py-2 border rounded-md"
                  data-testid="select-severity"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card data-testid="card-audit-logs">
            <CardHeader>
              <CardTitle>Security Audit Trail</CardTitle>
              <CardDescription>
                Comprehensive logging of all security-relevant events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {securityEvents?.map((event) => (
                    <div 
                      key={event.id} 
                      className="grid grid-cols-6 gap-4 p-3 border rounded-lg text-sm"
                      data-testid={`audit-log-${event.id}`}
                    >
                      <div className="font-medium">
                        {format(new Date(event.createdAt), 'MMM d, HH:mm:ss')}
                      </div>
                      <div>
                        <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                          {event.severity}
                        </Badge>
                      </div>
                      <div>{event.eventType.replace(/_/g, ' ')}</div>
                      <div>{event.action}</div>
                      <div>{event.resource}</div>
                      <div>
                        <Badge variant={getStatusColor(event.outcome)}>
                          {event.outcome}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}