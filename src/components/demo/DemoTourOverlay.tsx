import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, FileText, MessageSquare, TrendingUp, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";

const TOUR_STEPS = [
  {
    title: "Resume Analyzer",
    description: "Upload a resume and receive AI-powered insights about skills and experience.",
    tip: "Start by uploading a resume to receive skill insights.",
    icon: FileText,
    route: "/resume-analyzer",
    color: "hsl(173, 58%, 39%)",
  },
  {
    title: "Mock Interview",
    description: "Practice interviews with AI-generated questions and qualitative feedback.",
    tip: "Try a mock interview to simulate real conversations.",
    icon: MessageSquare,
    route: "/mock-interview",
    color: "hsl(199, 89%, 48%)",
  },
  {
    title: "Skill Tracker",
    description: "Track improvement in technical and communication skills over time.",
    tip: "View your skill growth trends across sessions.",
    icon: TrendingUp,
    route: "/skill-tracker",
    color: "hsl(24, 95%, 53%)",
  },
  {
    title: "Company Prep Hub",
    description: "Prepare for interviews at specific companies using targeted practice sessions.",
    tip: "Choose a company and practice role-specific questions.",
    icon: Building2,
    route: "/company-prep",
    color: "hsl(262, 83%, 58%)",
  },
  {
    title: "HR Dashboard",
    description: "HR users can review candidate readiness and manage interviews.",
    tip: "See aggregated candidate analytics and schedule interviews.",
    icon: Users,
    route: "/hr-dashboard",
    color: "hsl(173, 58%, 39%)",
  },
];

export function DemoTourOverlay() {
  const { tourActive, currentStep, totalSteps, nextStep, prevStep, endDemo, endTour } = useDemo();
  const navigate = useNavigate();
  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (tourActive && step) {
      navigate(step.route);
    }
  }, [tourActive, currentStep, step, navigate]);

  if (!tourActive) return null;

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* Dimmed overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-foreground/40 backdrop-blur-sm"
            onClick={endTour}
          />

          {/* Tour card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[92vw] max-w-lg"
          >
            <div className="rounded-2xl border bg-card shadow-medium overflow-hidden">
              {/* Step indicator bar */}
              <div className="flex gap-1.5 px-5 pt-4">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i <= currentStep ? step.color : "hsl(var(--muted))",
                    }}
                  />
                ))}
              </div>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${step.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      Step {currentStep + 1} of {totalSteps}
                    </p>
                    <h3 className="text-lg font-bold text-foreground leading-tight">{step.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={() => { endTour(); endDemo(); navigate("/"); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {step.description}
                </p>

                {/* Tip highlight */}
                <div
                  className="rounded-lg px-3.5 py-2.5 text-xs font-medium mb-4"
                  style={{
                    background: `${step.color}10`,
                    color: step.color,
                    border: `1px solid ${step.color}25`,
                  }}
                >
                  💡 {step.tip}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { endTour(); endDemo(); navigate("/"); }}
                    className="text-muted-foreground text-xs"
                  >
                    Skip Tour
                  </Button>
                  <div className="flex gap-2">
                    {!isFirst && (
                      <Button variant="outline" size="sm" onClick={prevStep}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    )}
                    {isLast ? (
                      <Button
                        size="sm"
                        className="gradient-primary border-0 shadow-glow"
                        onClick={() => { endTour(); endDemo(); navigate("/register"); }}
                      >
                        Get Started
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gradient-primary border-0 shadow-glow"
                        onClick={nextStep}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
