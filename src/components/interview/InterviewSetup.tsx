import { Link } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Play, Loader2, Zap, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTooltip } from "@/components/onboarding/PageTooltip";

export type InterviewType = "technical" | "behavioral" | "hr";
export type RoleLevel = "fresher" | "junior" | "mid";
export type InterviewMode = "practice" | "simulation";

export const interviewTypeLabels: Record<InterviewType, { label: string; icon: string; description: string }> = {
  technical: { label: "Technical", icon: "💻", description: "Coding, system design, and technical problem-solving" },
  behavioral: { label: "Behavioral", icon: "🎯", description: "STAR method and situational questions" },
  hr: { label: "HR", icon: "👋", description: "General questions and initial screening" },
};

export const roleLevelLabels: Record<RoleLevel, string> = {
  fresher: "Fresher (0-1 years)",
  junior: "Junior (1-3 years)",
  mid: "Mid-Level (3-5 years)",
};

export const TIMER_SECONDS: Record<InterviewType, number> = {
  technical: 5 * 60,
  behavioral: 3 * 60,
  hr: 2 * 60,
};

interface InterviewSetupProps {
  interviewType: InterviewType | null;
  setInterviewType: (type: InterviewType) => void;
  roleLevel: RoleLevel | null;
  setRoleLevel: (level: RoleLevel) => void;
  interviewMode: InterviewMode;
  setInterviewMode: (mode: InterviewMode) => void;
  candidateSkills: string[];
  isLoading: boolean;
  onStart: () => void;
}

export function InterviewSetup({
  interviewType,
  setInterviewType,
  roleLevel,
  setRoleLevel,
  interviewMode,
  setInterviewMode,
  candidateSkills,
  isLoading,
  onStart,
}: InterviewSetupProps) {
  return (
    <div className="container py-8 max-w-2xl">
      <PageTooltip
        tooltipKey="mock_interview"
        message="Practice real interview questions here. Choose your interview type and difficulty, then answer AI-generated questions to get structured feedback."
      />
      <Link
        to="/candidate-dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
          <BrainCircuit className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Mock Interview</h1>
        <p className="text-muted-foreground">
          Practice interview questions in a calm, supportive environment. This is for learning, not hiring.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Setup</CardTitle>
          <CardDescription>Choose your interview type, role level, and mode to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interview Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Interview Mode</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setInterviewMode("practice")}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  interviewMode === "practice" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
              >
                <BookOpen className="h-6 w-6 mb-2 text-primary" />
                <span className="font-medium block">Practice Mode</span>
                <span className="text-xs text-muted-foreground">No time limits. Learn at your own pace.</span>
              </button>
              <button
                onClick={() => setInterviewMode("simulation")}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  interviewMode === "simulation" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
              >
                <Zap className="h-6 w-6 mb-2 text-primary" />
                <span className="font-medium block">Simulation Mode</span>
                <span className="text-xs text-muted-foreground">Timed questions mimicking a real interview.</span>
              </button>
            </div>
          </div>

          {/* Interview Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Interview Type</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.keys(interviewTypeLabels) as InterviewType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setInterviewType(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    interviewType === type ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl block mb-2">{interviewTypeLabels[type].icon}</span>
                  <span className="font-medium block">{interviewTypeLabels[type].label}</span>
                  <span className="text-xs text-muted-foreground">{interviewTypeLabels[type].description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Role Level</label>
            <Select value={roleLevel || ""} onValueChange={(v) => setRoleLevel(v as RoleLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleLevelLabels) as RoleLevel[]).map((level) => (
                  <SelectItem key={level} value={level}>
                    {roleLevelLabels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Simulation time info */}
          {interviewMode === "simulation" && interviewType && (
            <div className="p-3 rounded-lg bg-accent/50 border border-accent text-sm">
              <span className="font-medium">⏱ Time per question:</span>{" "}
              {TIMER_SECONDS[interviewType] / 60} minutes ({interviewTypeLabels[interviewType].label})
            </div>
          )}

          {/* Skills Preview */}
          {candidateSkills.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Your Skills (from resume)</p>
              <div className="flex flex-wrap gap-2">
                {candidateSkills.slice(0, 8).map((skill) => (
                  <span key={skill} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {skill}
                  </span>
                ))}
                {candidateSkills.length > 8 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                    +{candidateSkills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={onStart}
            disabled={!interviewType || !roleLevel || isLoading}
            className="w-full gradient-primary border-0 shadow-glow"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
