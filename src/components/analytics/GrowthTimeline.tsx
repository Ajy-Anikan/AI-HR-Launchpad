import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  FileText,
  Mic,
  Building2,
  BarChart3,
  Zap,
  Trophy,
  Star,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface TimelineEvent {
  date: string;
  type: "resume" | "mock_interview" | "company_prep" | "skill_update" | "simulation";
  label: string;
  description?: string;
}

interface SkillTrend {
  date: string;
  technical: number;
  communication: number;
  overall: number;
}

interface GrowthTimelineProps {
  activities: TimelineEvent[];
  skillTrends: SkillTrend[];
  mockCount: number;
  companyPrepCount: number;
  hasResume: boolean;
}

const EVENT_CONFIG: Record<TimelineEvent["type"], { icon: typeof FileText; colorClass: string; bgClass: string }> = {
  resume: { icon: FileText, colorClass: "text-primary", bgClass: "bg-primary/10" },
  mock_interview: { icon: Mic, colorClass: "text-accent", bgClass: "bg-accent/10" },
  company_prep: { icon: Building2, colorClass: "text-primary", bgClass: "bg-primary/10" },
  skill_update: { icon: BarChart3, colorClass: "text-muted-foreground", bgClass: "bg-muted" },
  simulation: { icon: Zap, colorClass: "text-primary", bgClass: "bg-primary/10" },
};

interface Milestone {
  id: string;
  label: string;
  icon: typeof Trophy;
  achieved: boolean;
}

export default function GrowthTimeline({
  activities,
  skillTrends,
  mockCount,
  companyPrepCount,
  hasResume,
}: GrowthTimelineProps) {
  // Group activities by month
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    activities.forEach((a) => {
      const key = format(parseISO(a.date), "MMMM yyyy");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    return Array.from(groups.entries());
  }, [activities]);

  // Milestones
  const milestones: Milestone[] = useMemo(
    () => [
      { id: "resume", label: "Resume Uploaded", icon: FileText, achieved: hasResume },
      { id: "first_mock", label: "First Mock Interview", icon: Mic, achieved: mockCount >= 1 },
      { id: "five_mocks", label: "5 Interviews Practiced", icon: Trophy, achieved: mockCount >= 5 },
      { id: "first_prep", label: "First Company Prep", icon: Building2, achieved: companyPrepCount >= 1 },
    ],
    [hasResume, mockCount, companyPrepCount]
  );

  // Practice frequency data for chart
  const practiceFrequency = useMemo(() => {
    const freq = new Map<string, number>();
    activities.forEach((a) => {
      const key = format(parseISO(a.date), "MMM d");
      freq.set(key, (freq.get(key) || 0) + 1);
    });
    return Array.from(freq.entries())
      .slice(-14)
      .map(([date, count]) => ({ date, sessions: count }));
  }, [activities]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Growth Timeline
        </h2>
        <p className="text-muted-foreground">
          Your journey of improvement through practice and preparation.
        </p>
      </div>

      {/* Achievement Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-primary" />
            Milestones
          </CardTitle>
          <CardDescription>Key achievements on your preparation journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {milestones.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex flex-col items-center text-center p-4 rounded-lg border transition-colors ${
                    m.achieved
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30 opacity-50"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                      m.achieved ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${m.achieved ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-xs font-medium">{m.label}</span>
                  {m.achieved && (
                    <Badge variant="outline" className="mt-1.5 text-[10px] border-primary/30 text-primary">
                      Achieved
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress Trends Chart */}
      {skillTrends.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Improvement Trends
            </CardTitle>
            <CardDescription>Technical and communication skill growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={skillTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="technical"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    name="Technical"
                  />
                  <Line
                    type="monotone"
                    dataKey="communication"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", r: 3 }}
                    name="Communication"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Activity Frequency */}
      {practiceFrequency.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice Activity</CardTitle>
            <CardDescription>How often you've been practicing recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={practiceFrequency}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chronological Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Activity History
          </CardTitle>
          <CardDescription>A detailed timeline of your preparation journey</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No activities yet. Start a mock interview or upload your resume to begin!
            </p>
          ) : (
            <div className="space-y-6">
              {groupedActivities.map(([month, events]) => (
                <div key={month}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">{month}</h4>
                  <div className="relative ml-4">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                    <ul className="space-y-4">
                      {events.map((event, i) => {
                        const config = EVENT_CONFIG[event.type];
                        const Icon = config.icon;
                        return (
                          <motion.li
                            key={`${event.date}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-4 relative"
                          >
                            <div
                              className={`h-8 w-8 rounded-full ${config.bgClass} flex items-center justify-center shrink-0 z-10`}
                            >
                              <Icon className={`h-4 w-4 ${config.colorClass}`} />
                            </div>
                            <div className="pt-0.5 min-w-0">
                              <p className="text-sm font-medium">{event.label}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(parseISO(event.date), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
