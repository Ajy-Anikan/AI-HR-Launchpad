import { Info, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TrendType = "improving" | "stable" | "needs_attention" | null;

interface FitScoreInputs {
  // Resume data
  technicalSkills: string[];
  experienceYears: number | null;
  
  // Skill progress
  readinessScore: number | null;
  technicalTrend: TrendType;
  communicationTrend: TrendType;
  
  // Activity data
  mockInterviewCount: number;
  companyPracticeCount: number;
}

interface ScoreComponent {
  name: string;
  weight: number;
  score: number;
  explanation: string;
  tooltipDescription: string;
  icon: React.ReactNode;
}

interface FitScoreCardProps extends FitScoreInputs {}

const calculateFitScore = (inputs: FitScoreInputs): {
  totalScore: number;
  components: ScoreComponent[];
  strengths: string[];
  risks: string[];
} => {
  const components: ScoreComponent[] = [];
  const strengths: string[] = [];
  const risks: string[] = [];

  // 1. Technical Skills Alignment (40%)
  let technicalScore = 0;
  let technicalExplanation = "";
  
  const skillCount = inputs.technicalSkills.length;
  if (skillCount >= 8) {
    technicalScore = 90;
    technicalExplanation = "Strong skill portfolio with diverse technical capabilities";
    strengths.push("Comprehensive technical skill set");
  } else if (skillCount >= 5) {
    technicalScore = 70;
    technicalExplanation = "Good range of technical skills identified";
  } else if (skillCount >= 2) {
    technicalScore = 50;
    technicalExplanation = "Basic technical skills present";
    risks.push("Limited technical skill visibility - may benefit from resume review");
  } else {
    technicalScore = 20;
    technicalExplanation = "Limited skill data available";
    risks.push("Skill data insufficient for thorough assessment");
  }
  
  // Boost for experience
  if (inputs.experienceYears && inputs.experienceYears >= 3) {
    technicalScore = Math.min(100, technicalScore + 10);
    technicalExplanation += ". Experience level adds confidence";
  }

  components.push({
    name: "Technical Skills",
    weight: 40,
    score: technicalScore,
    explanation: technicalExplanation,
    tooltipDescription: "Measures how closely the candidate's extracted skills match job requirements.",
    icon: <Sparkles className="h-4 w-4" />,
  });

  // 2. Communication & Clarity (25%)
  let communicationScore = 50; // Base score
  let communicationExplanation = "";
  
  if (inputs.communicationTrend === "improving") {
    communicationScore = 85;
    communicationExplanation = "Communication skills showing positive trajectory";
    strengths.push("Improving communication clarity");
  } else if (inputs.communicationTrend === "stable") {
    communicationScore = 65;
    communicationExplanation = "Communication skills consistent over time";
  } else if (inputs.communicationTrend === "needs_attention") {
    communicationScore = 40;
    communicationExplanation = "Communication scores indicate room for development";
  } else {
    communicationExplanation = "Insufficient data to assess communication trends";
  }

  components.push({
    name: "Communication",
    weight: 25,
    score: communicationScore,
    explanation: communicationExplanation,
    tooltipDescription: "Based on qualitative evaluation from mock interview responses.",
    icon: <TrendingUp className="h-4 w-4" />,
  });

  // 3. Growth & Improvement Trend (20%)
  let growthScore = 50;
  let growthExplanation = "";
  
  if (inputs.technicalTrend === "improving" && inputs.communicationTrend === "improving") {
    growthScore = 95;
    growthExplanation = "Consistent improvement across all tracked areas";
    strengths.push("Strong growth mindset with measurable progress");
  } else if (inputs.technicalTrend === "improving" || inputs.communicationTrend === "improving") {
    growthScore = 75;
    growthExplanation = "Positive growth trend in key areas";
  } else if (inputs.technicalTrend === "stable" || inputs.communicationTrend === "stable") {
    growthScore = 55;
    growthExplanation = "Stable performance maintained";
  } else if (inputs.technicalTrend === "needs_attention" || inputs.communicationTrend === "needs_attention") {
    growthScore = 35;
    growthExplanation = "Growth metrics suggest need for development focus";
  } else {
    growthExplanation = "Growth data requires more practice sessions to assess";
  }

  // Boost based on readiness score
  if (inputs.readinessScore && inputs.readinessScore >= 70) {
    growthScore = Math.min(100, growthScore + 10);
  }

  components.push({
    name: "Growth Trend",
    weight: 20,
    score: growthScore,
    explanation: growthExplanation,
    tooltipDescription: "Indicates improvement in candidate skill tracker over time.",
    icon: <TrendingUp className="h-4 w-4" />,
  });

  // 4. Practice Consistency (15%)
  let consistencyScore = 0;
  let consistencyExplanation = "";
  
  const totalPractice = inputs.mockInterviewCount + inputs.companyPracticeCount;
  
  if (totalPractice >= 10) {
    consistencyScore = 95;
    consistencyExplanation = "Highly engaged with consistent practice activity";
    strengths.push("Demonstrates dedication through regular practice");
  } else if (totalPractice >= 5) {
    consistencyScore = 70;
    consistencyExplanation = "Good practice engagement level";
  } else if (totalPractice >= 2) {
    consistencyScore = 45;
    consistencyExplanation = "Some practice activity recorded";
  } else if (totalPractice >= 1) {
    consistencyScore = 25;
    consistencyExplanation = "Minimal practice activity observed";
    risks.push("Low practice engagement - may need encouragement");
  } else {
    consistencyScore = 10;
    consistencyExplanation = "No practice sessions recorded yet";
  }

  components.push({
    name: "Practice Consistency",
    weight: 15,
    score: consistencyScore,
    explanation: consistencyExplanation,
    tooltipDescription: "Reflects the number of practice sessions completed.",
    icon: <CheckCircle2 className="h-4 w-4" />,
  });

  // Calculate weighted total
  const totalScore = Math.round(
    components.reduce((sum, c) => sum + (c.score * c.weight / 100), 0)
  );

  return { totalScore, components, strengths, risks };
};

const getScoreColor = (score: number): string => {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-orange-600";
};

const getScoreBg = (score: number): string => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-orange-500";
};

export function FitScoreCard(props: FitScoreCardProps) {
  const { totalScore, components, strengths, risks } = calculateFitScore(props);

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Fit Score
            </CardTitle>
            <CardDescription className="mt-1">
              Supporting indicator for evaluation — not a hiring decision
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-md hover:bg-muted">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                The Fit Score aggregates skills, communication, growth trends, and practice data 
                to provide a high-level alignment indicator. Use alongside other evaluation methods.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${totalScore * 2.51} 251`}
                strokeLinecap="round"
                className={getScoreColor(totalScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(totalScore)}`}>
                {totalScore}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Weighted composite score based on available candidate data
            </p>
            <div className="flex flex-wrap gap-2">
              {components.map((c) => (
                <Badge key={c.name} variant="outline" className="text-xs">
                  {c.name}: {c.weight}%
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Score Breakdown
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {components.map((component) => (
              <div
                key={component.name}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{component.icon}</span>
                    <span className="font-medium text-sm">{component.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getScoreColor(component.score)}`}>
                      {component.score}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs">
                          {component.weight}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Weight in final score</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <Progress
                  value={component.score}
                  className="h-2 mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {component.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Signals Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Strength Signals */}
          {strengths.length > 0 && (
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">
                  Strength Signals
                </h4>
              </div>
              <ul className="space-y-2">
                {strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk / Attention Signals */}
          {risks.length > 0 && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="font-medium text-sm text-amber-700 dark:text-amber-400">
                  Areas for Review
                </h4>
              </div>
              <ul className="space-y-2">
                {risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* If no signals, show placeholder */}
          {strengths.length === 0 && risks.length === 0 && (
            <div className="col-span-full p-4 rounded-lg border bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                More data needed to identify specific strength and attention signals.
              </p>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            This score is a supporting indicator derived from self-reported data. 
            It should not be used as the sole basis for hiring decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
