import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Zap, Shield, Users, Mail, Lock, User } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Account created successfully",
        });
        window.location.href = "/industry-selection";
      } else {
        toast({
          title: "Error",
          description: result.message || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Signed in successfully",
        });
        window.location.href = "/industry-selection";
      } else {
        toast({
          title: "Error",
          description: result.message || "Sign in failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section with Auth */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Marketing Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Transform Your
                <span className="block mt-2 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                  Document Intelligence
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                DOKTECH 3.0 revolutionizes document analysis across medical, legal, logistics, finance, and business sectors with AI-powered insights.
              </p>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Auth Forms */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full"
            >
              <Card className="shadow-2xl border-2">
                <CardContent className="pt-6">
                  <Tabs defaultValue="signup" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                      <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
                    </TabsList>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                id="firstName" 
                                name="firstName"
                                placeholder="John" 
                                className="pl-9"
                                required
                                data-testid="input-firstname"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                id="lastName" 
                                name="lastName"
                                placeholder="Doe" 
                                className="pl-9"
                                required
                                data-testid="input-lastname"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signup-email" 
                              name="email"
                              type="email" 
                              placeholder="you@example.com" 
                              className="pl-9"
                              required
                              data-testid="input-signup-email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signup-password" 
                              name="password"
                              type="password" 
                              placeholder="••••••••" 
                              className="pl-9"
                              required
                              minLength={6}
                              data-testid="input-signup-password"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          disabled={isLoading}
                          data-testid="button-signup"
                        >
                          {isLoading ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-11"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        data-testid="button-google-signup"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Sign up with Google
                      </Button>
                    </TabsContent>

                    {/* Sign In Tab */}
                    <TabsContent value="signin">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signin-email" 
                              name="email"
                              type="email" 
                              placeholder="you@example.com" 
                              className="pl-9"
                              required
                              data-testid="input-signin-email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signin-password" 
                              name="password"
                              type="password" 
                              placeholder="••••••••" 
                              className="pl-9"
                              required
                              data-testid="input-signin-password"
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          disabled={isLoading}
                          data-testid="button-signin"
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-11"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        data-testid="button-google-signin"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Sign in with Google
                      </Button>
                    </TabsContent>
                  </Tabs>

                  <p className="text-xs text-center text-muted-foreground mt-6">
                    No credit card required • Free trial included
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industry Cards */}
      <section id="industries" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Industry-Specific Solutions
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Tailored document intelligence for your industry with specialized AI models and compliance frameworks
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full border-2 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl ${industry.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <i className={`${industry.icon} text-white text-2xl`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{industry.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{industry.description}</p>
                    <div className="space-y-2">
                      {industry.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="text-white text-sm h-4 w-4" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
              DOKTECH 3.0
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DOKTECH 3.0. AI-powered document intelligence platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
