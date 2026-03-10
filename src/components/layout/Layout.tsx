import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card/80">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-heading font-bold text-foreground tracking-tight">
                  Vre<span className="text-gradient">AI</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered platform for interview preparation and intelligent hiring.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                {[
                  { label: "Mock Interview", path: "/mock-interview" },
                  { label: "Resume Analyzer", path: "/resume-analyzer" },
                  { label: "Skill Tracker", path: "/skill-tracker" },
                  { label: "Company Prep Hub", path: "/company-prep" },
                ].map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Resources</h4>
              <ul className="space-y-2">
                {[
                  { label: "Analytics", path: "/analytics" },
                  { label: "HR Dashboard", path: "/hr-dashboard" },
                  { label: "Pipeline", path: "/hr-pipeline" },
                ].map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Contact</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} VreAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
