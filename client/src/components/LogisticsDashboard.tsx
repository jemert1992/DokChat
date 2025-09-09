import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Globe, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Ship, Plane, Package, MapPin } from 'lucide-react';

interface LogisticsDashboardProps {
  documents: any[];
  analytics: any;
}

export default function LogisticsDashboard({ documents, analytics }: LogisticsDashboardProps) {
  const shipmentsProcessed = documents.filter(doc => doc.status === 'completed').length;
  const customsAccuracy = 96.4; // Sample data
  const multiLanguageOCR = 94.1;
  const tradeCompliance = 98.7;

  const customsAlerts = [
    { type: 'HS_CODE_MISMATCH', message: 'HS code discrepancy detected in 2 customs declarations', severity: 'high' },
    { type: 'RESTRICTED_GOODS', message: 'Potential restricted items flagged in shipment #SH-2024-1847', severity: 'high' },
    { type: 'DOCUMENTATION_INCOMPLETE', message: '5 shipments missing required certificates of origin', severity: 'medium' },
    { type: 'DUTY_CALCULATION', message: 'Duty rate changes affect 12 pending shipments', severity: 'low' }
  ];

  const shipmentStatus = [
    { id: 'SH-2024-1847', origin: 'Shanghai', destination: 'Los Angeles', status: 'In Transit', eta: '2024-01-15' },
    { id: 'SH-2024-1848', origin: 'Hamburg', destination: 'New York', status: 'Customs Clearance', eta: '2024-01-12' },
    { id: 'SH-2024-1849', origin: 'Dubai', destination: 'Miami', status: 'Delivered', eta: '2024-01-10' }
  ];

  const logisticsEntities = {
    shipments: 1247,
    hsCodes: 342,
    certificates: 186,
    carriers: 45,
    ports: 67
  };

  const languageBreakdown = {
    english: 45,
    chinese: 23,
    spanish: 18,
    german: 8,
    french: 6
  };

  return (
    <div className="space-y-6">
      {/* Customs & Trade Compliance Alerts */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Truck className="mr-2 h-5 w-5 text-orange-600" />
          Global Trade Compliance Dashboard
        </h2>
        
        {customsAlerts.map((alert, index) => (
          <Alert key={index} className={`border-l-4 ${
            alert.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
            alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
            'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {alert.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments Processed</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{shipmentsProcessed}</div>
            <p className="text-xs text-muted-foreground">International shipments</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customs Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customsAccuracy}%</div>
            <p className="text-xs text-muted-foreground">Customs declaration accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multi-Language OCR</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{multiLanguageOCR}%</div>
            <p className="text-xs text-muted-foreground">Multi-language document processing</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trade Compliance</CardTitle>
            <Ship className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{tradeCompliance}%</div>
            <p className="text-xs text-muted-foreground">International trade compliance rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Logistics Intelligence Dashboard */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Active Shipments</TabsTrigger>
          <TabsTrigger value="customs">Customs & Compliance</TabsTrigger>
          <TabsTrigger value="multilang">Multi-Language Processing</TabsTrigger>
          <TabsTrigger value="analytics">Trade Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Shipment Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipmentStatus.map((shipment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Ship className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">{shipment.id}</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {shipment.origin} → {shipment.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">ETA: {shipment.eta}</p>
                      </div>
                    </div>
                    <Badge className={
                      shipment.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }>
                      {shipment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Plane className="mr-2 h-5 w-5 text-blue-500" />
                  Air Freight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500 mb-2">42</div>
                <p className="text-sm text-muted-foreground">Active air shipments</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Avg Transit Time</span>
                  <Badge variant="outline">3.2 days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Ship className="mr-2 h-5 w-5 text-green-500" />
                  Ocean Freight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500 mb-2">156</div>
                <p className="text-sm text-muted-foreground">Active ocean shipments</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Avg Transit Time</span>
                  <Badge variant="outline">18.5 days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-orange-500" />
                  Ground Freight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500 mb-2">89</div>
                <p className="text-sm text-muted-foreground">Active ground shipments</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs">Avg Transit Time</span>
                  <Badge variant="outline">2.8 days</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customs Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>HS Code Classification</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Progress value={96} className="h-2" />
                <p className="text-sm text-muted-foreground">96.4% of goods properly classified with HS codes</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Duty & Tax Calculations</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Progress value={98} className="h-2" />
                <p className="text-sm text-muted-foreground">Automated duty calculations with 98.2% accuracy</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Restricted Items Detection</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Progress value={99} className="h-2" />
                <p className="text-sm text-muted-foreground">Advanced screening for restricted and prohibited goods</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Trade Sanctions Compliance</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-sm text-muted-foreground">Real-time sanctions list screening</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Customs Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Customs Declaration Filed - SH-2024-1847</p>
                    <p className="text-sm text-muted-foreground">Electronics shipment from Shanghai to Los Angeles</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">5 minutes ago</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">Filed</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">HS Code Verification</p>
                    <p className="text-sm text-muted-foreground">Automated verification completed for 24 items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">12 minutes ago</p>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Verified</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Duty Payment Processed</p>
                    <p className="text-sm text-muted-foreground">$4,567.89 in duties and taxes calculated and paid</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">25 minutes ago</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multilang" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Language Document Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(languageBreakdown).map(([language, count]) => (
                      <div key={language} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{count}%</div>
                        <p className="text-sm text-muted-foreground capitalize">{language}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/10">
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Language Detection:</strong> Automatic language detection achieved 97.3% accuracy across 18 supported languages
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Translation Service:</strong> Real-time translation available for all major trade languages including Chinese, Spanish, German, and French
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>English Documents</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="w-24 h-2" />
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Chinese Documents</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={23} className="w-24 h-2" />
                      <span className="text-sm">23%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Spanish Documents</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={18} className="w-24 h-2" />
                      <span className="text-sm">18%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>German Documents</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={8} className="w-24 h-2" />
                      <span className="text-sm">8%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>French Documents</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={6} className="w-24 h-2" />
                      <span className="text-sm">6%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Route Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Asia-Pacific → North America</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      98.2% On-Time
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Europe → North America</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      96.7% On-Time
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Middle East → Asia</span>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      94.1% On-Time
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Shipping Cost Reduction</span>
                      <span className="font-medium text-green-600">-12.3%</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Customs Processing Time</span>
                      <span className="font-medium text-blue-600">-34.5%</span>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Documentation Errors</span>
                      <span className="font-medium text-green-600">-67.8%</span>
                    </div>
                    <Progress value={32} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}