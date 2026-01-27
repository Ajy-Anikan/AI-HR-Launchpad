import { Link } from "react-router-dom";
import { 
  BrainCircuit, 
  FileText, 
  Target, 
  Building2, 
  Users, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BrainCircuit,
    title: "Mock Interview",
    description: "Practice with AI-powered interview simulations tailored to your role.",
    path: "/mock-interview",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    description: "Get instant feedback and suggestions to improve your resume.",
    path: "/resume-analyzer",
  },
  {
    icon: Target,
    title: "Skill Tracker",
    description: "Track your skills progress and identify areas for improvement.",
    path: "/skill-tracker",
  },
  {
    icon: Building2,
    title: "Company Prep Hub",
    description: "Research companies and prepare for specific interviews.",
    path: "/company-prep",
  },
];

export default function Index() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6 shadow-soft">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Your AI-Powered{" "}
            <span className="text-gradient">Career Partner</span>
          </h1>
          
          <p className="text-lg text-muted-foreground md:text-xl mb-8 max-w-2xl mx-auto">
            Elevate your job search with intelligent interview prep, resume optimization, 
            and skill tracking. Everything you need to land your dream job.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gradient-primary border-0 shadow-glow text-base">
              <Link to="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to help candidates and HR professionals alike.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              to={feature.path}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-soft card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 gradient-primary group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <div className="rounded-2xl gradient-primary p-8 md:p-12 text-center shadow-glow">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary-foreground opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Are you an HR Professional?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Streamline your recruitment process with AI-powered candidate screening, 
            interview scheduling, and talent analytics.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/hr-dashboard">
              Explore HR Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
