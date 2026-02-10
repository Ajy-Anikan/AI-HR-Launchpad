import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Activity,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface SkillGap {
  skill: string;
  count: number;
}

export default function HRAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [resumeCount, setResumeCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [avgFitRange, setAvgFitRange] = useState<{ min: number; max: number } | null>(null);
  const [topGaps, setTopGaps] = useState<SkillGap[]>([]);
  const [trendSummary, setTrendSummary] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, dateFrom, dateTo]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all candidate user IDs
      const { data: candidateRoles } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "candidate");

      const candidates = candidateRoles || [];
      let filteredCandidates = candidates;

      if (dateFrom) {
        filteredCandidates = filteredCandidates.filter(
          (c) => new Date(c.created_at) >= new Date(dateFrom)
        );
      }
      if (dateTo) {
        filteredCandidates = filteredCandidates.filter(
          (c) => new Date(c.created_at) <= new Date(dateTo + "T23:59:59")
        );
      }

      const candidateIds = filteredCandidates.map((c) => c.user_id);
      setTotalCandidates(candidateIds.length);

      if (candidateIds.length === 0) {
        setResumeCount(0);
        setActiveCount(0);
        setInterviewCount(0);
        setAvgFitRange(null);
        setTopGaps([]);
        setTrendSummary("");
        setLoading(false);
        return;
      }

      // Parallel fetches
      const [resumeRes, mockRes, companyRes, interviewRes, skillRes, screenRes] = await Promise.all([
        supabase.from("resumes").select("user_id").in("user_id", candidateIds),
        supabase.from("mock_interview_sessions").select("user_id").in("user_id", candidateIds),
        supabase.from("company_practice_sessions").select("user_id").in("user_id", candidateIds),
        supabase.from("interview_schedules").select("id"),
        supabase
          .from("skill_progress")
          .select("user_id, overall_progress_score, recorded_at")
          .in("user_id", candidateIds)
          .order("recorded_at", { ascending: false }),
        supabase
          .from("screening_results")
          .select("missing_skills"),
      ]);

      // Resume count (unique users)
      const resumeUsers = new Set((resumeRes.data || []).map((r) => r.user_id));
      setResumeCount(resumeUsers.size);

      // Active candidates (have mock or company prep)
      const activeUsers = new Set([
        ...(mockRes.data || []).map((m) => m.user_id),
        ...(companyRes.data || []).map((c) => c.user_id),
      ]);
      setActiveCount(activeUsers.size);

      // Interview count
      setInterviewCount((interviewRes.data || []).length);

      // Fit score range (using overall_progress_score as proxy, aggregated)
      const latestScorePerUser = new Map<string, number>();
      (skillRes.data || []).forEach((sp) => {
        if (!latestScorePerUser.has(sp.user_id)) {
          latestScorePerUser.set(sp.user_id, sp.overall_progress_score);
        }
      });

      const scores = Array.from(latestScorePerUser.values());
      if (scores.length >= 3) {
        setAvgFitRange({
          min: Math.round(scores.reduce((a, b) => Math.min(a, b), 100)),
          max: Math.round(scores.reduce((a, b) => Math.max(a, b), 0)),
        });
      } else {
        setAvgFitRange(null);
      }

      // Top skill gaps from screening results
      const gapMap = new Map<string, number>();
      (screenRes.data || []).forEach((sr) => {
        (sr.missing_skills || []).forEach((skill: string) => {
          const key = skill.toLowerCase().trim();
          gapMap.set(key, (gapMap.get(key) || 0) + 1);
        });
      });
      const sortedGaps = Array.from(gapMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, count]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          count,
        }));
      setTopGaps(sortedGaps);

      // Trend summary
      if (scores.length >= 2) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg >= 60) {
          setTrendSummary("Most candidates show strong and steady growth in their preparation.");
        } else if (avg >= 40) {
          setTrendSummary("Candidates are making moderate progress. Encourage more practice sessions.");
        } else {
          setTrendSummary("Overall scores are in the early stage. More candidate engagement is needed.");
        }
      } else {
        setTrendSummary("Not enough data yet for trend analysis.");
      }
    } catch (err) {
      console.error("Error fetching HR analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-muted-foreground">
          Aggregated and anonymized insights across all candidates.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Note:</strong> All data is aggregated and anonymized. These metrics are
          indicative and should not be used as final hiring criteria.
        </AlertDescription>
      </Alert>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateFrom" className="text-sm text-muted-foreground">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo" className="text-sm text-muted-foreground">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{totalCandidates}</p>
            <p className="text-sm text-muted-foreground">Total Candidates</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold">{resumeCount}</p>
            <p className="text-sm text-muted-foreground">Resumes Uploaded</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-3xl font-bold">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active in Practice</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">{interviewCount}</p>
            <p className="text-sm text-muted-foreground">Scheduled Interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Insights */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Fit Score Range */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Readiness Score Range
            </CardTitle>
            <CardDescription>Aggregated score distribution (not individual)</CardDescription>
          </CardHeader>
          <CardContent>
            {avgFitRange ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{avgFitRange.min}</p>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary"
                    style={{ width: `${avgFitRange.max}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{avgFitRange.max}</p>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough data to show aggregated score range.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trend Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Growth Trend
            </CardTitle>
            <CardDescription>Overall candidate improvement summary</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{trendSummary}</p>
          </CardContent>
        </Card>
      </div>

      {/* Common Skill Gaps */}
      {topGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Common Skill Gaps
            </CardTitle>
            <CardDescription>Most frequently identified missing skills across candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topGaps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={120}
                    tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(214, 32%, 91%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(173, 58%, 39%)"
                    radius={[0, 4, 4, 0]}
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
