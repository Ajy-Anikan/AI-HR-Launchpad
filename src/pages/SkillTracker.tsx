import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Lightbulb,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Code,
  Activity,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SkillProgress {
  id: string;
  recorded_at: string;
  technical_score: number;
  communication_score: number;
  consistency_score: number | null;
  overall_progress_score: number;
  source: string;
  notes: string | null;
}

type TrendDirection = "up" | "down" | "stable";

interface SkillTrend {
  name: string;
  current: number;
  previous: number | null;
  trend: TrendDirection;
  icon: React.ComponentType<{ className?: string }>;
}

function getTrend(current: number, previous: number | null): TrendDirection {
  if (previous === null) return "stable";
  if (current > previous + 2) return "up";
  if (current < previous - 2) return "down";
  return "stable";
}

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function generateInsights(trends: SkillTrend[], progressHistory: SkillProgress[]): string[] {
  const insights: string[] = [];
  
  const improving = trends.filter(t => t.trend === "up");
  const declining = trends.filter(t => t.trend === "down");
  const stable = trends.filter(t => t.trend === "stable");
  
  if (improving.length > 0) {
    insights.push(`Great progress! Your ${improving.map(t => t.name.toLowerCase()).join(" and ")} ${improving.length > 1 ? "are" : "is"} improving steadily. Keep up the momentum!`);
  }
  
  if (declining.length > 0) {
    insights.push(`Your ${declining.map(t => t.name.toLowerCase()).join(" and ")} could use more practice. Consider focusing on these areas in your next session.`);
  }
  
  if (stable.length > 0 && improving.length === 0 && progressHistory.length > 1) {
    insights.push(`Your ${stable.map(t => t.name.toLowerCase()).join(" and ")} ${stable.length > 1 ? "have" : "has"} been consistent. Try new challenges to push your limits!`);
  }
  
  if (progressHistory.length === 1) {
    insights.push("Welcome to your skill tracking journey! Complete more practice sessions to see your progress trends.");
  }
  
  const avgScore = trends.reduce((sum, t) => sum + t.current, 0) / trends.length;
  if (avgScore >= 75) {
    insights.push("You're performing above average across all areas. You're well-prepared for opportunities!");
  } else if (avgScore < 50) {
    insights.push("There's room for growth in all areas. Start with small, consistent practice sessions to build momentum.");
  }
  
  return insights.slice(0, 3);
}

export default function SkillTracker() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [progressHistory, setProgressHistory] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (role === "hr") {
        navigate("/hr-dashboard");
        return;
      }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("skill_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (!error && data) {
        setProgressHistory(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchProgress();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "candidate") {
    return null;
  }

  const latestProgress = progressHistory[0];
  const previousProgress = progressHistory[1] || null;

  const skillTrends: SkillTrend[] = latestProgress
    ? [
        {
          name: "Technical Skills",
          current: latestProgress.technical_score,
          previous: previousProgress?.technical_score ?? null,
          trend: getTrend(latestProgress.technical_score, previousProgress?.technical_score ?? null),
          icon: Code,
        },
        {
          name: "Communication Skills",
          current: latestProgress.communication_score,
          previous: previousProgress?.communication_score ?? null,
          trend: getTrend(latestProgress.communication_score, previousProgress?.communication_score ?? null),
          icon: MessageSquare,
        },
        {
          name: "Overall Readiness",
          current: latestProgress.overall_progress_score,
          previous: previousProgress?.overall_progress_score ?? null,
          trend: getTrend(latestProgress.overall_progress_score, previousProgress?.overall_progress_score ?? null),
          icon: Activity,
        },
      ]
    : [];

  const insights = latestProgress ? generateInsights(skillTrends, progressHistory) : [];

  const improvingSkills = skillTrends.filter(s => s.trend === "up");
  const stagnantSkills = skillTrends.filter(s => s.trend === "stable" && progressHistory.length > 1);
  const needsAttentionSkills = skillTrends.filter(s => s.trend === "down");

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link 
            to="/candidate-dashboard" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Skill Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your improvement over time. For personal growth, not hiring.
          </p>
        </div>
      </div>

      {!latestProgress ? (
        /* No Progress Data */
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Progress Data Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your journey by completing mock interviews or practice sessions to track your skill improvement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gradient-primary border-0 shadow-glow">
                <Link to="/mock-interview">Start Mock Interview</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/resume-analyzer">Upload Resume</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Skill Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Current Skill Scores
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last updated: {format(new Date(latestProgress.recorded_at), "MMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                {skillTrends.map((skill) => (
                  <div key={skill.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <skill.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{skill.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-lg font-bold ${getScoreColor(skill.current)}`}>
                          {skill.current}
                        </span>
                        <TrendIndicator trend={skill.trend} />
                      </div>
                    </div>
                    <Progress value={skill.current} className="h-2" />
                    {skill.previous !== null && (
                      <p className="text-xs text-muted-foreground">
                        Previous: {skill.previous}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progress History
              </CardTitle>
              <CardDescription>
                Track how your skills change across multiple attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressHistory.length === 1 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Complete more practice to see progress trends.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressHistory.slice(0, 5).map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg ${index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}
                    >
                      <div className="flex-shrink-0 text-center">
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.recorded_at), "MMM d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.recorded_at), "yyyy")}
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Technical</span>
                          <div className={`font-semibold ${getScoreColor(entry.technical_score)}`}>
                            {entry.technical_score}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Communication</span>
                          <div className={`font-semibold ${getScoreColor(entry.communication_score)}`}>
                            {entry.communication_score}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Overall</span>
                          <div className={`font-semibold ${getScoreColor(entry.overall_progress_score)}`}>
                            {entry.overall_progress_score}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                          {entry.source.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Improvement Indicators */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Improving ↑
                </CardTitle>
              </CardHeader>
              <CardContent>
                {improvingSkills.length > 0 ? (
                  <ul className="space-y-1">
                    {improvingSkills.map((skill) => (
                      <li key={skill.name} className="text-sm text-emerald-800 dark:text-emerald-300">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep practicing to see improvements!</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  Stable →
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stagnantSkills.length > 0 ? (
                  <ul className="space-y-1">
                    {stagnantSkills.map((skill) => (
                      <li key={skill.name} className="text-sm text-slate-700 dark:text-slate-300">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">All skills are changing!</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Needs Attention ↓
                </CardTitle>
              </CardHeader>
              <CardContent>
                {needsAttentionSkills.length > 0 ? (
                  <ul className="space-y-1">
                    {needsAttentionSkills.map((skill) => (
                      <li key={skill.name} className="text-sm text-amber-800 dark:text-amber-300">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Great job! Nothing declining.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Insights for You
              </CardTitle>
              <CardDescription>
                Personalized suggestions based on your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.map((insight, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent"
                  >
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="gradient-primary border-0 shadow-glow">
                  <Link to="/mock-interview">Practice Mock Interview</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/resume-analyzer">Update Resume</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/candidate-dashboard">View Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
