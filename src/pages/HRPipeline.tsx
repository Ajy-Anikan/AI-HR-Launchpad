import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  Users,
  Eye,
  CalendarPlus,
  GripVertical,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STAGES = [
  { id: "applied", label: "Applied", color: "bg-muted" },
  { id: "resume_reviewed", label: "Resume Reviewed", color: "bg-blue-500/10" },
  { id: "interview_scheduled", label: "Interview Scheduled", color: "bg-amber-500/10" },
  { id: "interview_completed", label: "Interview Completed", color: "bg-purple-500/10" },
  { id: "shortlisted", label: "Shortlisted", color: "bg-emerald-500/10" },
  { id: "offer_stage", label: "Offer Stage", color: "bg-primary/10" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

interface PipelineCandidate {
  id: string;
  candidate_id: string;
  stage: StageId;
  moved_at: string;
  candidateHash: string;
  skills: string[];
  fitScore: number;
  lastActivity: string;
}

export default function HRPipeline() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

  // Filters
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/login"); return; }
      if (role !== "hr") { navigate("/candidate-dashboard"); return; }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role === "hr") loadPipeline();
  }, [user, role]);

  const loadPipeline = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all resumes (HR can view all)
      const [resumeRes, pipelineRes, interviewRes, skillRes] = await Promise.all([
        supabase.from("resumes").select("user_id, skills, uploaded_at"),
        supabase.from("pipeline_candidates").select("*").eq("hr_user_id", user.id),
        supabase.from("interview_schedules").select("candidate_id, scheduled_date, status").eq("hr_user_id", user.id),
        supabase.from("skill_progress").select("user_id, overall_progress_score, recorded_at").order("recorded_at", { ascending: false }),
      ]);

      const resumes = resumeRes.data || [];
      const pipelineEntries = pipelineRes.data || [];
      const interviews = interviewRes.data || [];
      const skillData = skillRes.data || [];

      // Build pipeline map
      const pipelineMap = new Map(pipelineEntries.map((p: any) => [p.candidate_id, p]));

      // Build unique candidate list from resumes
      const seenCandidates = new Set<string>();
      const allCandidates: PipelineCandidate[] = [];

      for (const r of resumes) {
        if (seenCandidates.has(r.user_id)) continue;
        seenCandidates.add(r.user_id);

        const pipeline = pipelineMap.get(r.user_id);
        const candidateInterviews = interviews.filter((i: any) => i.candidate_id === r.user_id);
        const candidateSkill = skillData.find((s: any) => s.user_id === r.user_id);

        // Determine default stage based on existing data
        let stage: StageId = "applied";
        if (pipeline) {
          stage = pipeline.stage as StageId;
        } else if (candidateInterviews.some((i: any) => i.status === "completed")) {
          stage = "interview_completed";
        } else if (candidateInterviews.length > 0) {
          stage = "interview_scheduled";
        } else if (r.skills && r.skills.length > 0) {
          stage = "resume_reviewed";
        }

        // Calculate a simple fit score approximation
        const skillCount = r.skills?.length || 0;
        const progressScore = candidateSkill?.overall_progress_score || 0;
        const fitScore = Math.min(Math.round((skillCount * 5 + progressScore) / 2), 100);

        // Last activity
        const dates = [r.uploaded_at];
        if (candidateInterviews.length > 0) dates.push(candidateInterviews[0].scheduled_date);
        if (candidateSkill) dates.push(candidateSkill.recorded_at);
        const lastActivity = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        allCandidates.push({
          id: pipeline?.id || `temp-${r.user_id}`,
          candidate_id: r.user_id,
          stage,
          moved_at: pipeline?.moved_at || r.uploaded_at,
          candidateHash: `CND-${r.user_id.substring(0, 6).toUpperCase()}`,
          skills: (r.skills || []).slice(0, 3),
          fitScore,
          lastActivity,
        });

        // Auto-create pipeline entry if missing
        if (!pipeline) {
          supabase.from("pipeline_candidates").insert({
            candidate_id: r.user_id,
            hr_user_id: user.id,
            stage,
          }).then(() => {});
        }
      }

      setCandidates(allCandidates);
    } catch (err) {
      console.error("Pipeline load error:", err);
      toast.error("Failed to load pipeline data.");
    } finally {
      setLoading(false);
    }
  };

  const moveCandidate = useCallback(async (candidateId: string, newStage: StageId) => {
    if (!user) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.candidate_id === candidateId
          ? { ...c, stage: newStage, moved_at: new Date().toISOString() }
          : c
      )
    );

    try {
      const { error } = await supabase
        .from("pipeline_candidates")
        .update({ stage: newStage, moved_at: new Date().toISOString() })
        .eq("candidate_id", candidateId)
        .eq("hr_user_id", user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Move error:", err);
      toast.error("Failed to update candidate stage.");
      loadPipeline(); // Revert
    }
  }, [user]);

  // Drag handlers
  const handleDragStart = (candidateId: string) => setDraggingId(candidateId);
  const handleDragEnd = () => { setDraggingId(null); setDragOverStage(null); };
  const handleDragOver = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };
  const handleDrop = (stageId: StageId) => {
    if (draggingId) {
      const candidate = candidates.find((c) => c.candidate_id === draggingId);
      if (candidate && candidate.stage !== stageId) {
        moveCandidate(draggingId, stageId);
      }
    }
    setDraggingId(null);
    setDragOverStage(null);
  };

  // Filtering
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills)));
  const filteredCandidates = candidates.filter((c) => {
    if (skillFilter !== "all" && !c.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    if (scoreFilter === "high" && c.fitScore < 70) return false;
    if (scoreFilter === "medium" && (c.fitScore < 40 || c.fitScore >= 70)) return false;
    if (scoreFilter === "low" && c.fitScore >= 40) return false;
    return true;
  });

  const getCandidatesForStage = (stageId: StageId) =>
    filteredCandidates.filter((c) => c.stage === stageId);

  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (role !== "hr") return null;

  return (
    <div className="container py-8">
      <Link
        to="/hr-dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Hiring Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Track candidate progress through hiring stages
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {allSkills.slice(0, 10).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Fit Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (70+)</SelectItem>
              <SelectItem value="medium">Medium (40-69)</SelectItem>
              <SelectItem value="low">Low (&lt;40)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[900px]">
          {STAGES.map((stage) => {
            const stageCandidates = getCandidatesForStage(stage.id);
            const isOver = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex-1 min-w-[200px] rounded-lg border transition-colors ${
                  isOver ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Column Header */}
                <div className={`px-3 py-2.5 rounded-t-lg ${stage.color} border-b`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{stage.label}</h3>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {stageCandidates.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageCandidates.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No candidates
                    </p>
                  )}
                  {stageCandidates.map((candidate) => (
                    <motion.div
                      key={candidate.candidate_id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      draggable
                      onDragStart={() => handleDragStart(candidate.candidate_id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing ${
                        draggingId === candidate.candidate_id ? "opacity-50" : ""
                      }`}
                    >
                      <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-muted-foreground">
                              {candidate.candidateHash}
                            </span>
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {s}
                              </Badge>
                            ))}
                          </div>

                          {/* Fit Score */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-muted-foreground">Fit</span>
                              <span className="font-medium">{candidate.fitScore}%</span>
                            </div>
                            <Progress value={candidate.fitScore} className="h-1" />
                          </div>

                          {/* Last Activity */}
                          <p className="text-[10px] text-muted-foreground">
                            Last: {new Date(candidate.lastActivity).toLocaleDateString()}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              asChild
                            >
                              <Link to={`/candidate-profile/${candidate.candidate_id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              asChild
                            >
                              <Link to="/hr-interviews">
                                <CalendarPlus className="h-3 w-3 mr-1" />
                                Schedule
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Drag and drop candidate cards to move them between stages. This board is private to your account.
      </p>
    </div>
  );
}
