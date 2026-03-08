import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Mic,
  Building2,
  BarChart3,
  Target,
  Lightbulb,
  Calendar,
  Award,
  AlertCircle,
} from "lucide-react";
import GrowthTimeline, { type TimelineEvent } from "./GrowthTimeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface SkillTrend {
  date: string;
  technical: number;
  communication: number;
  overall: number;
}

interface ActivityItem {
  date: string;
  type: "resume" | "mock_interview" | "company_prep" | "skill_update";
  label: string;
}

export default function CandidateAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skillTrends, setSkillTrends] = useState<SkillTrend[]>([]);
  const [mockCount, setMockCount] = useState(0);
  const [companyPrepCount, setCompanyPrepCount] = useState(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [scoreTrend, setScoreTrend] = useState<"up" | "down" | "stable">("stable");
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [skillRes, mockRes, companyRes, resumeRes, evalRes, companyEvalRes] = await Promise.all([
        supabase
          .from("skill_progress")
          .select("technical_score, communication_score, overall_progress_score, recorded_at")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: true }),
        supabase
          .from("mock_interview_sessions")
          .select("id, started_at, status")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false }),
        supabase
          .from("company_practice_sessions")
          .select("id, started_at, company, status")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false }),
        supabase
          .from("resumes")
          .select("uploaded_at")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("session_evaluations")
          .select("strengths, gaps, session_id"),
        supabase
          .from("company_prep_evaluations")
          .select("strengths, gaps, session_id"),
      ]);

      // Skill trends
      const skills = skillRes.data || [];
      const trends: SkillTrend[] = skills.map((s) => ({
        date: format(new Date(s.recorded_at), "MMM d"),
        technical: s.technical_score,
        communication: s.communication_score,
        overall: s.overall_progress_score,
      }));
      setSkillTrends(trends);

      if (skills.length >= 2) {
        const last = skills[skills.length - 1].overall_progress_score;
        const prev = skills[skills.length - 2].overall_progress_score;
        setScoreTrend(last > prev ? "up" : last < prev ? "down" : "stable");
        setLatestScore(last);
      } else if (skills.length === 1) {
        setLatestScore(skills[0].overall_progress_score);
      }

      // Counts
      const mocks = mockRes.data || [];
      setMockCount(mocks.filter((m) => m.status === "completed").length);
      const preps = companyRes.data || [];
      setCompanyPrepCount(preps.filter((p) => p.status === "completed").length);

      // Strengths & focus areas from evaluations
      const userMockIds = new Set(mocks.map((m) => m.id));
      const userPrepIds = new Set(preps.map((p) => p.id));

      const allStrengths: string[] = [];
      const allGaps: string[] = [];

      (evalRes.data || []).forEach((e) => {
        if (userMockIds.has(e.session_id)) {
          if (e.strengths) allStrengths.push(...e.strengths);
          if (e.gaps) allGaps.push(...e.gaps);
        }
      });
      (companyEvalRes.data || []).forEach((e) => {
        if (userPrepIds.has(e.session_id)) {
          if (e.strengths) allStrengths.push(...e.strengths);
          if (e.gaps) allGaps.push(...e.gaps);
        }
      });

      setStrengths(getTopItems(allStrengths, 3));
      setFocusAreas(getTopItems(allGaps, 3));

      // Activity timeline
      const activityList: ActivityItem[] = [];
      (resumeRes.data || []).forEach((r) => {
        activityList.push({
          date: r.uploaded_at,
          type: "resume",
          label: "Resume uploaded",
        });
      });
      mocks.forEach((m) => {
        activityList.push({
          date: m.started_at,
          type: "mock_interview",
          label: `Mock interview ${m.status === "completed" ? "completed" : "started"}`,
        });
      });
      preps.forEach((p) => {
        activityList.push({
          date: p.started_at,
          type: "company_prep",
          label: `${p.company} prep session ${p.status === "completed" ? "completed" : "started"}`,
        });
      });
      skills.forEach((s) => {
        activityList.push({
          date: s.recorded_at,
          type: "skill_update",
          label: "Skill tracker updated",
        });
      });

      activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(activityList.slice(0, 15));
    } catch (err) {
      console.error("Error fetching candidate analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTopItems = (items: string[], count: number): string[] => {
    const freq = new Map<string, number>();
    items.forEach((item) => {
      const key = item.trim().toLowerCase();
      freq.set(key, (freq.get(key) || 0) + 1);
    });
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  };

  const activityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "resume": return <FileText className="h-4 w-4 text-primary" />;
      case "mock_interview": return <Mic className="h-4 w-4 text-accent" />;
      case "company_prep": return <Building2 className="h-4 w-4 text-primary" />;
      case "skill_update": return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const TrendIcon = scoreTrend === "up" ? TrendingUp : scoreTrend === "down" ? TrendingDown : Minus;
  const trendColor = scoreTrend === "up" ? "text-emerald-600" : scoreTrend === "down" ? "text-red-500" : "text-muted-foreground";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Progress Insights</h1>
        <p className="text-muted-foreground">
          Track your growth and identify areas for improvement.
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground/80">
          These insights are for your personal development only. Keep practicing — every step counts!
        </AlertDescription>
      </Alert>

      {/* Progress Overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            </div>
            <p className="text-3xl font-bold">{latestScore ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Self-Readiness Score</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Mic className="h-5 w-5 text-accent" />
            </div>
            <p className="text-3xl font-bold">{mockCount}</p>
            <p className="text-sm text-muted-foreground">Mock Interviews Completed</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{companyPrepCount}</p>
            <p className="text-sm text-muted-foreground">Company Prep Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Trends Chart */}
      {skillTrends.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Skill Progress Over Time
            </CardTitle>
            <CardDescription>Your technical and communication skill trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={skillTrends}>
                  <defs>
                    <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(214, 32%, 91%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="technical"
                    stroke="hsl(173, 58%, 39%)"
                    fill="url(#techGrad)"
                    strokeWidth={2}
                    name="Technical"
                  />
                  <Area
                    type="monotone"
                    dataKey="communication"
                    stroke="hsl(24, 95%, 53%)"
                    fill="url(#commGrad)"
                    strokeWidth={2}
                    name="Communication"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Focus Areas */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-emerald-600" />
              Your Strengths
            </CardTitle>
            <CardDescription>Recurring strong points from evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete more practice sessions to see your strengths.</p>
            ) : (
              <ul className="space-y-3">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 mt-0.5">
                      Strength
                    </Badge>
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Focus Areas
            </CardTitle>
            <CardDescription>Areas to improve based on feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {focusAreas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete more practice sessions to identify focus areas.</p>
            ) : (
              <ul className="space-y-3">
                {focusAreas.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shrink-0 mt-0.5">
                      Focus
                    </Badge>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Your recent preparation activities</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No activity yet. Start a mock interview or upload your resume to begin!
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />
              <ul className="space-y-4">
                {activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-4 relative">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                      {activityIcon(a.type)}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium">{a.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
