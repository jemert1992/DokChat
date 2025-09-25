import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Activity, 
  Heart, 
  FileText, 
  Pill, 
  TestTube, 
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@shared/schema";

export default function MedicalDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  // Fetch medical documents
  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Mock patient data - in production, this would come from the database
  const patients = [
    { id: "1", name: "John Doe", mrn: "MRN-001", lastVisit: "2024-01-15", status: "Active", riskLevel: "low" },
    { id: "2", name: "Jane Smith", mrn: "MRN-002", lastVisit: "2024-01-20", status: "Active", riskLevel: "high" },
    { id: "3", name: "Robert Johnson", mrn: "MRN-003", lastVisit: "2024-01-10", status: "Inactive", riskLevel: "medium" },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive patient records and clinical insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            data-testid="button-add-patient"
            onClick={() => {
              toast({
                title: "Add Patient",
                description: "Opening patient registration form...",
              });
              setShowAddPatientDialog(true);
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
          <Button 
            className="bg-teal-600 hover:bg-teal-700" 
            data-testid="button-upload-records"
            onClick={() => {
              toast({
                title: "Upload Medical Records",
                description: "Opening document upload dialog...",
              });
              setShowUploadDialog(true);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Upload Records
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Patients</p>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-green-600 mt-1">+12 this week</p>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Records Processed</p>
                <p className="text-2xl font-bold">1,842</p>
                <p className="text-xs text-blue-600 mt-1">99.3% accuracy</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lab Results</p>
                <p className="text-2xl font-bold">89</p>
                <p className="text-xs text-orange-600 mt-1">5 critical</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TestTube className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">HIPAA Compliance</p>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-green-600 mt-1">Fully compliant</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Patient List</span>
                <Badge variant="outline">{patients.length} patients</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                      selectedPatient === patient.id ? "bg-teal-50 dark:bg-teal-950" : ""
                    }`}
                    onClick={() => setSelectedPatient(patient.id)}
                    data-testid={`patient-row-${patient.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                        <p className="text-sm text-gray-500">{patient.mrn}</p>
                        <p className="text-xs text-gray-400 mt-1">Last visit: {patient.lastVisit}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={patient.status === "Active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {patient.status}
                        </Badge>
                        <Badge 
                          className={`text-xs ${getRiskColor(patient.riskLevel)}`}
                          variant="outline"
                        >
                          {patient.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Patient Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="records">Records</TabsTrigger>
                    <TabsTrigger value="labs">Lab Results</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Blood Pressure</p>
                        <p className="text-lg font-semibold">120/80 mmHg</p>
                        <Badge className="mt-1 text-xs" variant="outline">Normal</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Heart Rate</p>
                        <p className="text-lg font-semibold">72 bpm</p>
                        <Badge className="mt-1 text-xs" variant="outline">Normal</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Temperature</p>
                        <p className="text-lg font-semibold">98.6°F</p>
                        <Badge className="mt-1 text-xs" variant="outline">Normal</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">BMI</p>
                        <p className="text-lg font-semibold">24.5</p>
                        <Badge className="mt-1 text-xs" variant="outline">Healthy</Badge>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Patient has a scheduled follow-up appointment on February 15, 2024
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                  
                  <TabsContent value="records" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      {documents?.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{doc.originalFilename}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(doc.createdAt || '').toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="labs" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Glucose Level</span>
                          <Badge className="bg-green-100 text-green-700">Normal</Badge>
                        </div>
                        <Progress value={85} className="h-2" />
                        <p className="text-sm text-gray-500 mt-1">95 mg/dL (Range: 70-100)</p>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Cholesterol</span>
                          <Badge className="bg-yellow-100 text-yellow-700">Borderline</Badge>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-sm text-gray-500 mt-1">210 mg/dL (Range: &lt;200)</p>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Hemoglobin</span>
                          <Badge className="bg-green-100 text-green-700">Normal</Badge>
                        </div>
                        <Progress value={70} className="h-2" />
                        <p className="text-sm text-gray-500 mt-1">14.5 g/dL (Range: 13.5-17.5)</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="medications" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">Lisinopril</p>
                          <p className="text-sm text-gray-500">10mg daily - Blood pressure</p>
                        </div>
                        <Pill className="h-5 w-5 text-teal-600" />
                      </div>
                      
                      <div className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">Metformin</p>
                          <p className="text-sm text-gray-500">500mg twice daily - Diabetes</p>
                        </div>
                        <Pill className="h-5 w-5 text-teal-600" />
                      </div>
                      
                      <div className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">Atorvastatin</p>
                          <p className="text-sm text-gray-500">20mg daily - Cholesterol</p>
                        </div>
                        <Pill className="h-5 w-5 text-teal-600" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a patient to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <span className="font-medium">High Priority:</span> Patient MRN-002 has critical lab values requiring immediate review
              </AlertDescription>
            </Alert>
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <span className="font-medium">Medication Alert:</span> Potential drug interaction detected for Patient MRN-003
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Add Patient Dialog */}
      <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter patient information to create a new medical record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Patient registration form would appear here</p>
            <Button 
              className="w-full"
              onClick={() => {
                setShowAddPatientDialog(false);
                toast({
                  title: "Success",
                  description: "New patient added successfully!",
                });
              }}
            >
              Add Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Records Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Medical Records</DialogTitle>
            <DialogDescription>
              Upload patient records, lab results, or medical documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Drop medical records here or click to browse</p>
              <p className="text-xs text-gray-500 mt-2">Supports PDF, DICOM, HL7 formats</p>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                setShowUploadDialog(false);
                toast({
                  title: "Success",
                  description: "Medical records uploaded and processed!",
                });
              }}
            >
              Upload & Process
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}