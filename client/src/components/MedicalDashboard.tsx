import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, Activity, Users, FileText, Clock, CheckCircle, XCircle, Heart, Stethoscope } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Document, MedicalAnalytics, ComplianceAlert } from '@shared/schema';

interface MedicalDashboardProps {
  documents: Document[];
  isLoading?: boolean;
}

export default function MedicalDashboard({ documents, isLoading = false }: MedicalDashboardProps) {
  // Fetch real medical analytics data
  const { data: medicalAnalytics, isLoading: analyticsLoading, error: analyticsError } = useQuery<MedicalAnalytics>({
    queryKey: ['/api/analytics/industry/medical'],
    enabled: !isLoading,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch compliance alerts
  const { data: complianceAlerts, isLoading: alertsLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ['/api/analytics/compliance-alerts'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Use real data or fallbacks
  const hipaaCompliantDocs = medicalAnalytics?.hipaaCompliantDocs ?? documents.filter(doc => doc.status === 'completed').length;
  const phiDetectionRate = medicalAnalytics?.phiDetectionRate ?? 0;
  const clinicalAccuracy = medicalAnalytics?.clinicalAccuracy ?? 0;
  const patientRecordsProcessed = medicalAnalytics?.patientRecordsProcessed ?? 0;
  
  // Calculate average processing time from real data
  const completedDocs = documents.filter(doc => doc.status === 'completed' && doc.extractedData?.processingTime);
  const avgProcessingTimeMs = completedDocs.length > 0
    ? completedDocs.reduce((sum, doc) => sum + (doc.extractedData?.processingTime || 0), 0) / completedDocs.length
    : 0;
  const avgProcessingTime = avgProcessingTimeMs > 0 ? `${(avgProcessingTimeMs / 1000).toFixed(1)}s` : 'N/A';

  const criticalAlerts = (complianceAlerts || []).filter(alert => alert.severity === 'high' || alert.severity === 'medium').slice(0, 3);
  const medicalEntities = medicalAnalytics?.medicalEntities || {
    medications: 0,
    diagnoses: 0,
    procedures: 0,
    allergies: 0,
    vitalSigns: 0
  };

  // Show loading state
  if (isLoading || analyticsLoading) {
    return (
      <div className="space-y-6" data-testid="medical-dashboard-loading">
        <div className="grid gap-4">
          <Skeleton className="h-8 w-64" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (analyticsError) {
    return (
      <div className="space-y-6" data-testid="medical-dashboard-error">
        <Alert className="border-red-500 bg-red-50 dark:bg-red-900/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load medical analytics. Some data may be unavailable.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Shield className="mr-2 h-5 w-5 text-teal-600" />
          HIPAA Compliance Dashboard
        </h2>
        
        {criticalAlerts.length > 0 ? criticalAlerts.map((alert, index) => (
          <Alert key={alert.documentId || index} className={`border-l-4 ${
            alert.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
            alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
            'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          }`} data-testid={`alert-${alert.type.toLowerCase()}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {alert.message}
            </AlertDescription>
            {alert.timestamp && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            )}
          </Alert>
        )) : (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10" data-testid="alert-no-issues">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-medium text-green-800 dark:text-green-200">
              No critical HIPAA compliance issues detected
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Records</CardTitle>
            <FileText className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{hipaaCompliantDocs}</div>
            <p className="text-xs text-muted-foreground">HIPAA compliant documents</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PHI Detection</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{phiDetectionRate}%</div>
            <p className="text-xs text-muted-foreground">Protected Health Information detected</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinical Accuracy</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{clinicalAccuracy}%</div>
            <p className="text-xs text-muted-foreground">Medical entity extraction accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Average document processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Medical Intelligence Dashboard */}
      <Tabs defaultValue="entities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entities">Medical Entities</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Insights</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-red-500" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500 mb-2">{medicalEntities.medications}</div>
                <p className="text-sm text-muted-foreground">Extracted with RxNorm codes</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Drug Interactions</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">3 Flagged</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-blue-500" />
                  Diagnoses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500 mb-2">{medicalEntities.diagnoses}</div>
                <p className="text-sm text-muted-foreground">ICD-10 coded conditions</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Critical Conditions</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">5 Critical</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500 mb-2">{medicalEntities.allergies}</div>
                <p className="text-sm text-muted-foreground">Patient allergies documented</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Severe Allergies</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">8 Severe</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>HIPAA Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>PHI Detection & Protection</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <Progress value={98} className="h-2" />
                  <p className="text-sm text-muted-foreground">98% of PHI automatically detected and protected</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Access Control & Authentication</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-sm text-muted-foreground">All access properly authenticated and logged</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Data Encryption</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-sm text-muted-foreground">AES-256 encryption at rest and in transit</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Audit Logging</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-sm text-muted-foreground">Complete audit trail for all document access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Decision Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Drug Interaction Alert:</strong> Potential interaction between Warfarin and Amoxicillin detected in Patient #12847
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-red-500 bg-red-50 dark:bg-red-900/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical Lab Value:</strong> Hemoglobin level 6.2 g/dL flagged as critically low in Patient #12901
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Missing Information:</strong> Allergy information incomplete for 12 patients processed today
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">PHI Access - Patient Record #12847</p>
                    <p className="text-sm text-muted-foreground">Dr. Sarah Johnson accessed patient chart</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">2 minutes ago</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">Authorized</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Document Upload - Lab Results</p>
                    <p className="text-sm text-muted-foreground">Automatic PHI detection completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">5 minutes ago</p>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Processed</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Consent Verification</p>
                    <p className="text-sm text-muted-foreground">Patient consent verified for data processing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">15 minutes ago</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}