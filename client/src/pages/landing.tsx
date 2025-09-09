import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const industries = [
    {
      name: "Medical",
      icon: "fas fa-heartbeat",
      color: "bg-teal-500",
      description: "HIPAA-compliant processing of patient records, lab results, and clinical documentation.",
      features: ["Patient data extraction", "Clinical decision support", "Medical terminology analysis"]
    },
    {
      name: "Legal",
      icon: "fas fa-gavel", 
      color: "bg-blue-900",
      description: "Contract analysis, legal entity extraction, and litigation support tools.",
      features: ["Contract term extraction", "Legal risk assessment", "Case document analysis"]
    },
    {
      name: "Logistics",
      icon: "fas fa-truck",
      color: "bg-orange-500", 
      description: "Streamlined processing of shipping documents, customs forms, and delivery confirmations.",
      features: ["Shipment tracking", "Customs compliance", "Multi-language support"]
    },
    {
      name: "Finance",
      icon: "fas fa-chart-line",
      color: "bg-green-600",
      description: "Financial document analysis with fraud detection and regulatory compliance.",
      features: ["Financial entity extraction", "Risk assessment", "Automated reporting"]
    },
    {
      name: "General Business", 
      icon: "fas fa-briefcase",
      color: "bg-blue-600",
      description: "Versatile document processing for invoices, contracts, and business correspondence.",
      features: ["Process automation", "Data extraction", "Workflow optimization"]
    },
    {
      name: "Enterprise Features",
      icon: "fas fa-cogs",
      color: "bg-purple-600",
      description: "Advanced capabilities for large-scale document processing and analysis.",
      features: ["Real-time processing", "API integrations", "Advanced analytics"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <i className="fas fa-file-alt text-primary-foreground text-sm"></i>
                </div>
                <span className="text-xl font-bold text-foreground">DOKTECH 3.0</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#industries" className="text-muted-foreground hover:text-foreground transition-colors">Industries</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Button onClick={handleGetStarted} data-testid="button-get-started">
                Get Started
              </Button>
            </div>
            <button className="md:hidden" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-foreground"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your
            <span className="text-primary"> Document Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            DOKTECH 3.0 revolutionizes document analysis across medical, legal, logistics, finance, and business sectors with AI-powered insights and industry-specific customizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted} 
              size="lg"
              className="font-medium"
              data-testid="button-start-trial"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="font-medium"
              data-testid="button-watch-demo"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Industry Cards */}
      <section id="industries" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Industry-Specific Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`card-industry-${index}`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${industry.color} rounded-lg flex items-center justify-center mb-4`}>
                    <i className={`${industry.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{industry.name}</h3>
                  <p className="text-muted-foreground mb-4">
                    {industry.description}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {industry.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
