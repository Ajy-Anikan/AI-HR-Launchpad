import { Link } from "react-router-dom";
import { 
  FileText, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight,
  BarChart3,
  Building2,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  ClipboardList,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Index() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(173 58% 39% / 0.15), transparent), radial-gradient(ellipse 60% 50% at 80% 50%, hsl(199 89% 48% / 0.1), transparent), radial-gradient(ellipse 60% 40% at 10% 80%, hsl(173 58% 39% / 0.08), transparent)",
            }}
          />
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04] animate-[pulse_8s_ease-in-out_infinite]"
            style={{ background: "radial-gradient(circle, hsl(173 58% 39%), transparent 70%)" }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1]">
              Prepare Smarter.{" "}
              <span className="text-gradient">Hire Better.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              An AI-driven platform that empowers candidates with structured interview 
              preparation and helps HR teams make informed, unbiased hiring decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild 
                className="gradient-primary border-0 shadow-glow text-base px-8 hover:opacity-90 transition-opacity"
              >
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-base px-8 hover:bg-primary/5 transition-colors"
              >
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Candidate Card */}
          <Card className="group relative overflow-hidden border bg-card shadow-soft card-hover">
            <CardContent className="p-8 lg:p-10">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">For Candidates</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Everything you need to prepare confidently and grow.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: FileText, text: "Resume Analysis" },
                  { icon: MessageSquare, text: "Mock Interviews with AI Feedback" },
                  { icon: Building2, text: "Company-Specific Prep" },
                  { icon: TrendingUp, text: "Skill Progress Tracking" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-sm text-foreground">
                    <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full gradient-primary border-0 shadow-glow hover:opacity-90 transition-opacity">
                <Link to="/register">
                  Start Preparing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="absolute bottom-0 left-0 h-1 w-0 gradient-primary group-hover:w-full transition-all duration-500" />
            </CardContent>
          </Card>

          {/* HR Card */}
          <Card className="group relative overflow-hidden border bg-card shadow-soft card-hover">
            <CardContent className="p-8 lg:p-10">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">For HR Teams</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Streamline hiring with structured, unbiased tools.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: ClipboardList, text: "Structured Candidate Profiles" },
                  { icon: ShieldCheck, text: "Fit Score with Explainable Breakdown" },
                  { icon: Calendar, text: "Interview Scheduling & Feedback" },
                  { icon: BarChart3, text: "Aggregated Analytics Dashboard" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-sm text-foreground">
                    <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full hover:bg-primary/5 transition-colors">
                <Link to="/hr-dashboard">
                  Manage Candidates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="absolute bottom-0 left-0 h-1 w-0 gradient-primary group-hover:w-full transition-all duration-500" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">
            Built for Responsible Recruitment
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tools designed to enhance preparation and support fair hiring — not replace human judgment.
          </p>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {[
            {
              icon: FileText,
              title: "Resume Intelligence",
              description: "Upload your resume and receive structured skill insights aligned with job requirements.",
              align: "left" as const,
            },
            {
              icon: BrainCircuit,
              title: "AI Interview Practice",
              description: "Practice real interview scenarios with qualitative feedback designed for growth.",
              align: "right" as const,
            },
            {
              icon: ShieldCheck,
              title: "Responsible Hiring Insights",
              description: "Access anonymized candidate insights and aggregated analytics without automated decision-making.",
              align: "left" as const,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`flex flex-col sm:flex-row items-start gap-5 p-6 md:p-8 rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:shadow-medium ${
                feature.align === "right" ? "sm:flex-row-reverse sm:text-right" : ""
              }`}
            >
              <div className="flex-shrink-0 h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <feature.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="rounded-2xl gradient-primary p-8 md:p-14 text-center shadow-glow max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto leading-relaxed">
            Join a platform built for smarter preparation and responsible hiring. 
            No rankings, no bias — just growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
