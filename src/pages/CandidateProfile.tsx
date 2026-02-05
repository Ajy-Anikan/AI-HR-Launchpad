import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { CandidateOverviewCard } from "@/components/hr/CandidateOverviewCard";
import { SkillSummaryCard } from "@/components/hr/SkillSummaryCard";
import { ProgressGrowthCard, TrendType } from "@/components/hr/ProgressGrowthCard";
import { PracticeActivityCard } from "@/components/hr/PracticeActivityCard";
import { HRNotesCard } from "@/components/hr/HRNotesCard";
import { FitScoreCard } from "@/components/hr/FitScoreCard";

interface CandidateProfileData {
  anonymizedId: string;
  hasResume: boolean;
  resumeUploadDate: string | null;
  technicalSkills: string[];
  softSkills: string[];
  experienceYears: number | null;
  readinessScore: number | null;
  technicalTrend: TrendType;
  communicationTrend: TrendType;
  mockInterviewCount: number;
  companyPracticeCount: number;
  lastActivityDate: string | null;
  lastPracticeDate: string | null;
  hrNote: string;
}

const generateAnonymizedId = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `CAND-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
};

const calculateTrend = (scores: number[]): TrendType => {
  if (scores.length < 2) return null;
  
  // Compare average of recent vs older scores
  const midpoint = Math.floor(scores.length / 2);
  const recentAvg = scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const olderAvg = scores.slice(midpoint).reduce((a, b) => a + b, 0) / (scores.length - midpoint);
  
  const diff = recentAvg - olderAvg;
  if (diff > 5) return "improving";
  if (diff < -5) return "needs_attention";
  return "stable";
};

export default function CandidateProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role === "hr" && candidateId) {
      fetchCandidateProfile();
    }
  }, [candidateId, role, authLoading]);

  const fetchCandidateProfile = async () => {
    if (!candidateId || !user) return;
    
    setLoading(true);
    try {
      // Verify this is a candidate user
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", candidateId)
        .eq("role", "candidate")
        .maybeSingle();

      if (roleError) throw roleError;
      if (!roleData) {
        toast({
          title: "Not found",
          description: "Candidate profile not found",
          variant: "destructive",
        });
        navigate("/hr-dashboard");
        return;
      }

      // Fetch resume data
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("uploaded_at, skills, experience_years")
        .eq("user_id", candidateId)
        .maybeSingle();

      if (resumeError && resumeError.code !== "PGRST116") throw resumeError;

      // Fetch skill progress history for trends
      const { data: skillHistory, error: skillHistoryError } = await supabase
        .from("skill_progress")
        .select("technical_score, communication_score, overall_progress_score, recorded_at")
        .eq("user_id", candidateId)
        .order("recorded_at", { ascending: false })
        .limit(10);

      if (skillHistoryError && skillHistoryError.code !== "PGRST116") throw skillHistoryError;

      // Calculate trends from history
      const technicalScores = skillHistory?.map(s => s.technical_score) || [];
      const communicationScores = skillHistory?.map(s => s.communication_score) || [];
      const latestScore = skillHistory?.[0]?.overall_progress_score || null;

      // Fetch mock interview count
      const { count: mockCount, error: mockError } = await supabase
        .from("mock_interview_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", candidateId);

      if (mockError) throw mockError;

      // Fetch company practice count
      const { count: practiceCount, error: practiceError } = await supabase
        .from("company_practice_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", candidateId);

      if (practiceError) throw practiceError;

      // Determine last activity and last practice
      const { data: lastMock } = await supabase
        .from("mock_interview_sessions")
        .select("started_at")
        .eq("user_id", candidateId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastPractice } = await supabase
        .from("company_practice_sessions")
        .select("started_at")
        .eq("user_id", candidateId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let lastActivity = null;
      let lastPracticeDate = null;
      
      if (lastMock?.started_at && lastPractice?.started_at) {
        lastActivity = new Date(lastMock.started_at) > new Date(lastPractice.started_at) 
          ? lastMock.started_at 
          : lastPractice.started_at;
        lastPracticeDate = lastActivity;
      } else {
        lastActivity = lastMock?.started_at || lastPractice?.started_at || skillHistory?.[0]?.recorded_at || null;
        lastPracticeDate = lastMock?.started_at || lastPractice?.started_at || null;
      }

      // Fetch HR's existing note for this candidate
      const { data: noteData } = await supabase
        .from("hr_candidate_notes")
        .select("note_text")
        .eq("hr_user_id", user.id)
        .eq("candidate_id", candidateId)
        .maybeSingle();

      setProfile({
        anonymizedId: generateAnonymizedId(candidateId),
        hasResume: !!resumeData,
        resumeUploadDate: resumeData?.uploaded_at || null,
        technicalSkills: resumeData?.skills || [],
        softSkills: [],
        experienceYears: resumeData?.experience_years || null,
        readinessScore: latestScore,
        technicalTrend: calculateTrend(technicalScores),
        communicationTrend: calculateTrend(communicationScores),
        mockInterviewCount: mockCount || 0,
        companyPracticeCount: practiceCount || 0,
        lastActivityDate: lastActivity,
        lastPracticeDate: lastPracticeDate,
        hrNote: noteData?.note_text || "",
      });

    } catch (error) {
      console.error("Error fetching candidate profile:", error);
      toast({
        title: "Error loading profile",
        description: "Failed to load candidate profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Access denied for non-HR users
  if (!authLoading && role !== "hr") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This page is only accessible to HR users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-16 text-muted-foreground">
          Loading candidate profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested candidate profile could not be found.
            </p>
            <Button onClick={() => navigate("/hr-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate("/hr-dashboard")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Candidate Profile</h1>
        <p className="text-muted-foreground font-mono text-lg">{profile.anonymizedId}</p>
      </div>

      {/* Disclaimer */}
      <Alert className="mb-6 border-warning/50 bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          <strong>Note:</strong> This is a read-only view for observation purposes. 
          All scores are self-reported and indicative only. Personal identifiers are hidden to promote unbiased evaluation.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fit Score - Full Width for HR */}
        <FitScoreCard
          technicalSkills={profile.technicalSkills}
          experienceYears={profile.experienceYears}
          readinessScore={profile.readinessScore}
          technicalTrend={profile.technicalTrend}
          communicationTrend={profile.communicationTrend}
          mockInterviewCount={profile.mockInterviewCount}
          companyPracticeCount={profile.companyPracticeCount}
        />

        {/* Candidate Overview */}
        <CandidateOverviewCard
          anonymizedId={profile.anonymizedId}
          hasResume={profile.hasResume}
          resumeUploadDate={profile.resumeUploadDate}
          lastActivityDate={profile.lastActivityDate}
        />

        {/* Progress & Growth */}
        <ProgressGrowthCard
          readinessScore={profile.readinessScore}
          technicalTrend={profile.technicalTrend}
          communicationTrend={profile.communicationTrend}
        />

        {/* Skill Summary */}
        <SkillSummaryCard
          technicalSkills={profile.technicalSkills}
          softSkills={profile.softSkills}
          experienceYears={profile.experienceYears}
        />

        {/* Practice Activity */}
        <PracticeActivityCard
          mockInterviewCount={profile.mockInterviewCount}
          companyPracticeCount={profile.companyPracticeCount}
          lastPracticeDate={profile.lastPracticeDate}
        />
      </div>

      {/* HR Notes - Full Width */}
      {user && (
        <div className="mt-6">
          <HRNotesCard
            candidateId={candidateId!}
            hrUserId={user.id}
            initialNote={profile.hrNote}
          />
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 p-4 rounded-lg bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 inline mr-1" />
          This profile is provided for observation and shortlisting support only. 
          It should not be used as the sole basis for hiring decisions.
        </p>
      </div>
    </div>
  );
}
