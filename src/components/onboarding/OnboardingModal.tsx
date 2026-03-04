import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  BrainCircuit,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type AppRole = "candidate" | "hr";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const candidateSteps: OnboardingStep[] = [
  {
    icon: <Upload className="h-8 w-8" />,
    title: "Upload Resume",
    description:
      "Upload your resume to extract skills and receive insights.",
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: "Try a Mock Interview",
    description:
      "Practice interview questions and receive structured feedback.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Track Your Progress",
    description:
      "Monitor your skill growth and readiness through analytics.",
  },
];

const hrSteps: OnboardingStep[] = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "View Candidate Profiles",
    description:
      "Access structured candidate profiles with skill summaries.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Schedule Interviews",
    description:
      "Manage interviews and provide structured feedback.",
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Monitor Hiring Insights",
    description:
      "Use aggregated analytics to understand hiring trends.",
  },
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  role: AppRole;
}

export function OnboardingModal({ open, onComplete, role }: OnboardingModalProps) {
  const [phase, setPhase] = useState<"welcome" | "steps">("welcome");
  const [currentStep, setCurrentStep] = useState(0);

  const steps = role === "candidate" ? candidateSteps : hrSteps;
  const totalSteps = steps.length;
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  const handleStartSetup = () => setPhase("steps");

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isLastStep = currentStep === totalSteps - 1;
  const finalButtonLabel =
    role === "candidate" ? "Go to Dashboard" : "Open HR Dashboard";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {phase === "welcome" ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8 text-center"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-6">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold">
                  Welcome to AI-HR Assistant
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed">
                  This platform helps candidates prepare for interviews and HR
                  teams manage hiring with AI-powered insights.
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={handleStartSetup}
                className="mt-8 gradient-primary border-0 shadow-glow px-8"
                size="lg"
              >
                Start Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="steps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              {/* Progress header */}
              <div className="px-8 pt-6 pb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-3 px-8 pb-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all duration-300",
                      i < currentStep
                        ? "bg-primary"
                        : i === currentStep
                        ? "bg-primary scale-125"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-6 text-center"
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                    {steps[currentStep].icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {steps[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between px-8 pb-8 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-muted-foreground"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className={cn(
                    isLastStep && "gradient-primary border-0 shadow-glow"
                  )}
                >
                  {isLastStep ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {finalButtonLabel}
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
