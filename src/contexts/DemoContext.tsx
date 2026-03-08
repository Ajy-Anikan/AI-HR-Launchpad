import { createContext, useContext, useState, ReactNode } from "react";

interface DemoData {
  resumeInsights: {
    skills: string[];
    experience_years: number;
    education: string;
    summary: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
  interviewSessions: {
    id: string;
    type: string;
    level: string;
    status: string;
    date: string;
    questions: number;
  }[];
  skillProgress: {
    date: string;
    technical: number;
    communication: number;
    overall: number;
  }[];
  analyticsOverview: {
    totalInterviews: number;
    avgScore: number;
    resumesUploaded: number;
    skillGrowth: number;
  };
}

const DEMO_DATA: DemoData = {
  resumeInsights: {
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "GraphQL"],
    experience_years: 4,
    education: "B.S. Computer Science – Stanford University",
    summary: "Full-stack engineer with 4 years of experience building scalable web applications with React and Node.js.",
    matchScore: 78,
    matchedSkills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    missingSkills: ["Kubernetes", "CI/CD Pipelines", "System Design"],
  },
  interviewSessions: [
    { id: "demo-1", type: "Technical", level: "Mid-Level", status: "completed", date: "2026-03-05", questions: 5 },
    { id: "demo-2", type: "Behavioral", level: "Mid-Level", status: "completed", date: "2026-03-03", questions: 5 },
    { id: "demo-3", type: "System Design", level: "Senior", status: "in_progress", date: "2026-03-08", questions: 3 },
  ],
  skillProgress: [
    { date: "Feb 1", technical: 52, communication: 60, overall: 55 },
    { date: "Feb 15", technical: 58, communication: 63, overall: 60 },
    { date: "Mar 1", technical: 65, communication: 68, overall: 66 },
    { date: "Mar 8", technical: 72, communication: 74, overall: 73 },
  ],
  analyticsOverview: {
    totalInterviews: 12,
    avgScore: 73,
    resumesUploaded: 3,
    skillGrowth: 18,
  },
};

interface DemoContextType {
  isDemoMode: boolean;
  startDemo: () => void;
  endDemo: () => void;
  demoData: DemoData;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  tourActive: boolean;
  startTour: () => void;
  endTour: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const totalSteps = 5;

  const startDemo = () => {
    setIsDemoMode(true);
    setCurrentStep(0);
    setTourActive(true);
  };

  const endDemo = () => {
    setIsDemoMode(false);
    setCurrentStep(0);
    setTourActive(false);
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const goToStep = (step: number) => setCurrentStep(step);
  const startTour = () => setTourActive(true);
  const endTour = () => setTourActive(false);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        startDemo,
        endDemo,
        demoData: DEMO_DATA,
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        goToStep,
        tourActive,
        startTour,
        endTour,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
