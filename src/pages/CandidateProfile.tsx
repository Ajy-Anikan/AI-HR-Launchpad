import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Activity, 
  Calendar,
  AlertCircle,
  Briefcase,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CandidateProfileData {
  anonymizedId: string;
  hasResume: boolean;
  resumeUploadDate: string | null;
  skills: string[];
  experienceYears: number | null;
  readinessScore: number | null;
  mockInterviewCount: number;
  companyPracticeCount: number;
  lastActivityDate: string | null;
}

const generateAnonymizedId = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `CAND-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
};

const getReadinessLabel = (score: number | null): { label: string; color: string } => {
  if (score === null) return { label: "Not Available", color: "bg-muted text-muted-foreground" };
  if (score >= 70) return { label: "High", color: "bg-emerald-100 text-emerald-700" };
  if (score >= 40) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Low", color: "bg-red-100 text-red-700" };
};

export default function CandidateProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { role, loading: authLoading } = useAuth();
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
    if (!candidateId) return;
    
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

      // Fetch latest skill progress
      const { data: skillData, error: skillError } = await supabase
        .from("skill_progress")
        .select("overall_progress_score, recorded_at")
        .eq("user_id", candidateId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (skillError && skillError.code !== "PGRST116") throw skillError;

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

      // Determine last activity
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
      if (lastMock?.started_at && lastPractice?.started_at) {
        lastActivity = new Date(lastMock.started_at) > new Date(lastPractice.started_at) 
          ? lastMock.started_at 
          : lastPractice.started_at;
      } else {
        lastActivity = lastMock?.started_at || lastPractice?.started_at || skillData?.recorded_at || null;
      }

      setProfile({
        anonymizedId: generateAnonymizedId(candidateId),
        hasResume: !!resumeData,
        resumeUploadDate: resumeData?.uploaded_at || null,
        skills: resumeData?.skills || [],
        experienceYears: resumeData?.experience_years || null,
        readinessScore: skillData?.overall_progress_score || null,
        mockInterviewCount: mockCount || 0,
        companyPracticeCount: practiceCount || 0,
        lastActivityDate: lastActivity,
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

  const readiness = getReadinessLabel(profile.readinessScore);

  return (
    <div className="container py-8 max-w-4xl">
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
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Note:</strong> This is a read-only view for observation purposes. 
          All scores are self-reported and indicative only. Personal identifiers are hidden to promote unbiased evaluation.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={profile.hasResume ? "default" : "secondary"}>
                {profile.hasResume ? "Uploaded" : "Not Uploaded"}
              </Badge>
            </div>
            {profile.hasResume && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Upload Date</span>
                  <span>
                    {profile.resumeUploadDate 
                      ? format(new Date(profile.resumeUploadDate), "MMM d, yyyy")
                      : "—"
                    }
                  </span>
                </div>
                {profile.experienceYears !== null && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Experience</span>
                      <span>{profile.experienceYears} years</span>
                    </div>
                  </>
                )}
                {profile.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground block mb-2">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 10).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.skills.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Self-Readiness Score
            </CardTitle>
            <CardDescription>
              Self-assessed score (indicative, not final)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              {profile.readinessScore !== null ? (
                <>
                  <div className="text-5xl font-bold mb-2">{profile.readinessScore}</div>
                  <Badge className={`${readiness.color} text-lg px-4 py-1`}>
                    {readiness.label}
                  </Badge>
                </>
              ) : (
                <div className="text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No readiness score available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Practice Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Practice Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mock Interviews</span>
              <span className="font-semibold">{profile.mockInterviewCount} sessions</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Company Practice</span>
              <span className="font-semibold">{profile.companyPracticeCount} sessions</span>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              {profile.lastActivityDate ? (
                <>
                  <div className="text-2xl font-semibold">
                    {format(new Date(profile.lastActivityDate), "MMMM d, yyyy")}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {format(new Date(profile.lastActivityDate), "h:mm a")}
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No activity recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
