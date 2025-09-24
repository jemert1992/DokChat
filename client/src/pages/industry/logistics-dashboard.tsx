import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Truck, 
  Package, 
  MapPin, 
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Plane,
  Ship,
  Shield,
  DollarSign,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";

export default function LogisticsDashboard() {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  // Fetch logistics documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents", { industry: "logistics" }],
  });

  // Mock shipment data - in production, this would come from the database
  const shipments = [
    { id: "1", tracking: "SHP-2024-001", origin: "Shanghai", destination: "Los Angeles", status: "In Transit", eta: "2024-02-05", mode: "sea" },
    { id: "2", tracking: "SHP-2024-002", origin: "Frankfurt", destination: "New York", status: "Customs", eta: "2024-01-25", mode: "air" },
    { id: "3", tracking: "SHP-2024-003", origin: "Chicago", destination: "Dallas", status: "Delivered", eta: "2024-01-20", mode: "ground" },
    { id: "4", tracking: "SHP-2024-004", origin: "Tokyo", destination: "London", status: "Processing", eta: "2024-02-10", mode: "air" },
  ];

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "air": return <Plane className="h-4 w-4" />;
      case "sea": return <Ship className="h-4 w-4" />;
      case "ground": return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-100 text-green-700";
      case "In Transit": return "bg-blue-100 text-blue-700";
      case "Customs": return "bg-yellow-100 text-yellow-700";
      case "Processing": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logistics Control Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time shipment tracking, customs management, and route optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-new-shipment">
            <Package className="h-4 w-4 mr-2" />
            New Shipment
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-upload-manifest">
            <Truck className="h-4 w-4 mr-2" />
            Upload Manifest
          </Button>
        </div>
      </div>

      {/* Logistics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</p>
                <p className="text-2xl font-bold">147</p>
                <p className="text-xs text-green-600 mt-1">94% on time</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Customs</p>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-yellow-600 mt-1">5 delayed</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivered Today</p>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-blue-600 mt-1">+15% vs yesterday</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Transit Time</p>
                <p className="text-2xl font-bold">3.2d</p>
                <p className="text-xs text-green-600 mt-1">-8% improvement</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Optimization Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-orange-600" />
            AI-Powered Route Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" data-testid="button-optimize-routes">
              <MapPin className="h-4 w-4 mr-2" />
              Optimize Current Routes
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-predict-delays">
              <Clock className="h-4 w-4 mr-2" />
              Predict Delays
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-customs-check">
              <Globe className="h-4 w-4 mr-2" />
              Customs Pre-Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Shipments</span>
                <Badge variant="outline">{shipments.length} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                      selectedShipment === shipment.id ? "bg-orange-50 dark:bg-orange-950" : ""
                    }`}
                    onClick={() => setSelectedShipment(shipment.id)}
                    data-testid={`shipment-row-${shipment.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          {getModeIcon(shipment.mode)}
                          <p className="font-medium text-gray-900 dark:text-white">{shipment.tracking}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {shipment.origin} → {shipment.destination}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ETA: {shipment.eta}</p>
                      </div>
                      <Badge 
                        className={`text-xs ${getStatusColor(shipment.status)}`}
                        variant="outline"
                      >
                        {shipment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Details */}
        <div className="lg:col-span-2">
          {selectedShipment ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tracking" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                    <TabsTrigger value="customs">Customs</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="route">Route</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tracking" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Container ID</p>
                        <p className="text-lg font-semibold">MSKU-7849302</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="text-lg font-semibold">2,450 kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Carrier</p>
                        <p className="text-lg font-semibold">Maersk Line</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="text-lg font-semibold">$125,000</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <h3 className="font-semibold">Tracking Timeline</h3>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">Picked Up</p>
                            <p className="text-sm text-gray-500">Shanghai Port - Jan 15, 2024 09:00 AM</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">Departed Origin</p>
                            <p className="text-sm text-gray-500">Shanghai - Jan 16, 2024 14:00 PM</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 animate-pulse"></div>
                          <div className="flex-1">
                            <p className="font-medium">In Transit</p>
                            <p className="text-sm text-gray-500">Pacific Ocean - Current Location</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">Arrival Port</p>
                            <p className="text-sm text-gray-500">Los Angeles - Est. Feb 5, 2024</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="customs" className="space-y-4 mt-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <span className="font-medium">Pre-cleared:</span> All customs documentation has been pre-approved
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Export Clearance</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Cleared</Badge>
                          <p className="text-sm text-gray-500 mt-1">China Customs</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Import Clearance</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Pre-cleared</Badge>
                          <p className="text-sm text-gray-500 mt-1">US Customs</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium">HS Code</span>
                          </div>
                          <p className="font-mono text-sm">8471.30.0100</p>
                          <p className="text-xs text-gray-500 mt-1">Automatic Data Processing</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Duties & Taxes</span>
                          </div>
                          <p className="font-semibold">$8,750</p>
                          <p className="text-xs text-gray-500 mt-1">Paid in advance</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">Bill of Lading</p>
                              <p className="text-sm text-gray-500">BL-2024-001847</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                        </div>
                      </div>
                      
                      <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">Commercial Invoice</p>
                              <p className="text-sm text-gray-500">INV-2024-9384</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                        </div>
                      </div>
                      
                      <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">Packing List</p>
                              <p className="text-sm text-gray-500">PL-2024-001847</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="route" className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <h3 className="font-semibold mb-3">Optimized Route</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Distance</span>
                          <span className="font-medium">11,453 km</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Estimated Fuel</span>
                          <span className="font-medium">45,200 gallons</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Carbon Footprint</span>
                          <span className="font-medium">412 tons CO2</span>
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Alternative route available: Via Panama Canal - saves 2 days but increases cost by $3,500
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a shipment to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delivery Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Delivery Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">On-Time Delivery</span>
                <Badge className="bg-green-100 text-green-700">94%</Badge>
              </div>
              <Progress value={94} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Target: 95%</p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Damage Rate</span>
                <Badge className="bg-green-100 text-green-700">0.3%</Badge>
              </div>
              <Progress value={3} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Industry avg: 1.2%</p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Customer Satisfaction</span>
                <Badge className="bg-green-100 text-green-700">4.8/5</Badge>
              </div>
              <Progress value={96} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Based on 1,247 reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}