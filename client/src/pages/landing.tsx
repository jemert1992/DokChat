import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Zap, Shield, Users, ArrowRight } from "lucide-react";
import { SiGoogle, SiGithub, SiApple } from "react-icons/si";

export default function Landing() {
  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const industries = [
    {
      name: "Medical",
      icon: "fas fa-heartbeat",
      color: "bg-gradient-to-br from-teal-500 to-emerald-600",
      description: "HIPAA-compliant processing of patient records, lab results, and clinical documentation.",
      features: ["Patient data extraction", "Clinical decision support", "Medical terminology analysis"]
    },
    {
      name: "Legal",
      icon: "fas fa-gavel", 
      color: "bg-gradient-to-br from-blue-900 to-blue-700",
      description: "Contract analysis, legal entity extraction, and litigation support tools.",
      features: ["Contract term extraction", "Legal risk assessment", "Case document analysis"]
    },
    {
      name: "Logistics",
      icon: "fas fa-truck",
      color: "bg-gradient-to-br from-orange-500 to-red-600", 
      description: "Streamlined processing of shipping documents, customs forms, and delivery confirmations.",
      features: ["Shipment tracking", "Customs compliance", "Multi-language support"]
    },
    {
      name: "Finance",
      icon: "fas fa-chart-line",
      color: "bg-gradient-to-br from-green-600 to-emerald-700",
      description: "Financial document analysis with fraud detection and regulatory compliance.",
      features: ["Financial entity extraction", "Risk assessment", "Automated reporting"]
    },
    {
      name: "Real Estate",
      icon: "fas fa-home",
      color: "bg-gradient-to-br from-indigo-600 to-purple-700",
      description: "Comprehensive property transaction and real estate document processing.",
      features: ["Contract intelligence", "Deal management", "Compliance & risk review"]
    },
    {
      name: "General Business", 
      icon: "fas fa-briefcase",
      color: "bg-gradient-to-br from-blue-600 to-cyan-600",
      description: "Versatile document processing for invoices, contracts, and business correspondence.",
      features: ["Process automation", "Data extraction", "Workflow optimization"]
    }
  ];

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Process documents in seconds with AI-powered analysis"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and compliance certifications"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Share insights and work together seamlessly"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FileText className="text-white text-sm h-4 w-4" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                  DOKTECH 3.0
                </span>
              </motion.div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
              <a href="#industries" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Industries</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
              <Button 
                onClick={handleGetStarted} 
                data-testid="button-get-started"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
            <button className="md:hidden" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-foreground"></i>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
                Transform Your
                <span className="block mt-2 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                  Document Intelligence
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              DOKTECH 3.0 revolutionizes document analysis across medical, legal, logistics, finance, and business sectors with AI-powered insights and industry-specific customizations.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Primary CTA */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleGetStarted} 
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group"
                  data-testid="button-start-trial"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              {/* Sign-in Options */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground font-medium">Sign up with</p>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200 dark:border-gray-700"
                    data-testid="button-google-signin"
                    aria-label="Sign up with Google"
                  >
                    <SiGoogle className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200 dark:border-gray-700"
                    data-testid="button-github-signin"
                    aria-label="Sign up with GitHub"
                  >
                    <SiGithub className="h-5 w-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200 dark:border-gray-700"
                    data-testid="button-apple-signin"
                    aria-label="Sign up with Apple"
                  >
                    <SiApple className="h-5 w-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                  </motion.button>
                </div>
                <p className="text-xs text-muted-foreground">or email/password • No credit card required</p>
              </div>
            </motion.div>
          </div>

          {/* Feature Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Industry Cards */}
      <section id="industries" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
              Industry-Specific Solutions
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Tailored AI-powered document processing for your industry's unique needs
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card 
                  className="h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500/50 group cursor-pointer" 
                  data-testid={`card-industry-${index}`}
                >
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${industry.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`${industry.icon} text-white text-2xl`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {industry.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {industry.description}
                    </p>
                    <ul className="space-y-2">
                      {industry.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of teams already using DOKTECH to streamline their document processing
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
              data-testid="button-cta-bottom"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md flex items-center justify-center">
              <FileText className="text-white text-xs h-3 w-3" />
            </div>
            <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              DOKTECH 3.0
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DOKTECH. All rights reserved. Built with ❤️ for document intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
