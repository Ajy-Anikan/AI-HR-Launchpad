import { useEffect, useState } from "react";
import { UpcomingInterviews } from "@/components/candidate/UpcomingInterviews";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { PageTooltip } from "@/components/onboarding/PageTooltip";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Upload,
  Target,
  BrainCircuit,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillInsights } from "@/components/candidate/SkillInsights";

interface ParsedData {
  technical_skills?: string[];
  soft_skills?: string[];
  skill_gaps?: string[];
  focus_areas?: string[];
}

interface ResumeData {
  id: string;
  file_name: string;
  uploaded_at: string;
  skills: string[] | null;
  experience_years: number | null;
  summary: string | null;
  education: string | null;
  parsed_data: ParsedData | null;
}

interface ScreeningResult {
  match_score: number;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  analysis: string | null;
}

export default function CandidateDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { showOnboarding, completeOnboarding } = useOnboarding(user?.id);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    // Stay on dashboard
  };

  // Role-based access control - only candidates allowed
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

  // Fetch candidate data
  useEffect(() => {
    if (user && role === "candidate") {
      fetchCandidateData();
    }
  }, [user, role]);

  const fetchCandidateData = async () => {
    if (!user) return;

    try {
      // Fetch resume data
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeError) throw resumeError;
      
      // Cast parsed_data to our expected type
      if (resumeData) {
        const typedResume: ResumeData = {
          ...resumeData,
          parsed_data: resumeData.parsed_data as ParsedData | null,
        };
        setResume(typedResume);

        // Fetch screening results for this candidate's resumes
        const { data: screeningData, error: screeningError } = await supabase
          .from("screening_results")
          .select("match_score, matched_skills, missing_skills, analysis")
          .eq("resume_id", resumeData.id);

        if (screeningError) throw screeningError;
        setScreeningResults(screeningData || []);
      }
    } catch (error) {
      console.error("Error fetching candidate data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate self-readiness score based on available data
  const calculateReadinessScore = (): number => {
    if (!resume) return 0;

    let score = 0;
    let factors = 0;

    // Resume uploaded: base 20 points
    score += 20;
    factors++;

    // Skills extracted: up to 25 points
    if (resume.skills && resume.skills.length > 0) {
      const skillScore = Math.min(resume.skills.length * 3, 25);
      score += skillScore;
      factors++;
    }

    // Experience: up to 20 points
    if (resume.experience_years) {
      const expScore = Math.min(resume.experience_years * 4, 20);
      score += expScore;
      factors++;
    }

    // AI summary exists: 15 points
    if (resume.summary) {
      score += 15;
      factors++;
    }

    // Average screening match score contribution: up to 20 points
    if (screeningResults.length > 0) {
      const avgMatch = screeningResults.reduce((acc, r) => acc + r.match_score, 0) / screeningResults.length;
      score += Math.round(avgMatch * 0.2);
      factors++;
    }

    return Math.min(score, 100);
  };

  // Extract improvement suggestions
  const getImprovementSuggestions = () => {
    const skillGaps: string[] = [];
    const focusAreas: string[] = [];

    // Collect missing skills from all screening results
    screeningResults.forEach((result) => {
      if (result.missing_skills) {
        result.missing_skills.forEach((skill) => {
          if (!skillGaps.includes(skill)) {
            skillGaps.push(skill);
          }
        });
      }
    });

    // Generate focus areas based on data
    if (!resume?.summary) {
      focusAreas.push("Complete your resume profile with a strong summary");
    }
    if (!resume?.skills || resume.skills.length < 5) {
      focusAreas.push("Add more skills to showcase your expertise");
    }
    if (!resume?.experience_years || resume.experience_years < 2) {
      focusAreas.push("Highlight projects or internships to demonstrate experience");
    }
    if (skillGaps.length > 0) {
      focusAreas.push("Learn trending skills that employers are looking for");
    }
    if (screeningResults.length === 0) {
      focusAreas.push("Explore job requirements to understand market demands");
    }

    return {
      skillGaps: skillGaps.slice(0, 3),
      focusAreas: focusAreas.slice(0, 3),
    };
  };

  // Extract technical and soft skills
  const getSkillsByType = () => {
    const technicalSkills: string[] = resume?.parsed_data?.technical_skills || [];
    const softSkills: string[] = resume?.parsed_data?.soft_skills || [];

    // If parsed_data doesn't have separated skills, try to categorize from main skills
    if (technicalSkills.length === 0 && softSkills.length === 0 && resume?.skills) {
      const techKeywords = ["react", "javascript", "python", "java", "sql", "typescript", "node", "aws", "docker", "kubernetes", "git", "html", "css", "api", "database", "linux", "cloud"];
      const softKeywords = ["communication", "leadership", "teamwork", "problem-solving", "analytical", "management", "collaboration", "creativity", "adaptability"];

      resume.skills.forEach((skill) => {
        const lowerSkill = skill.toLowerCase();
        if (techKeywords.some((kw) => lowerSkill.includes(kw))) {
          technicalSkills.push(skill);
        } else if (softKeywords.some((kw) => lowerSkill.includes(kw))) {
          softSkills.push(skill);
        } else {
          technicalSkills.push(skill); // Default to technical
        }
      });
    }

    return { technicalSkills, softSkills };
  };

  const readinessScore = calculateReadinessScore();
  const { skillGaps, focusAreas } = getImprovementSuggestions();
  const { technicalSkills, softSkills } = getSkillsByType();

  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (role !== "candidate") {
    return null;
  }

  return (
    <div className="container py-8 max-w-6xl">
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        role="candidate"
      />
      <PageTooltip
        tooltipKey="candidate_dashboard"
        message="This is your readiness dashboard. Upload your resume, practice interviews, and track your progress — all in one place."
      />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Candidate Readiness Dashboard</h1>
        <p className="text-muted-foreground">
          Track your profile strength and discover areas for improvement
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/resume-analyzer">
          <Card className="card-hover h-full cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Resume Upload</p>
                <p className="text-sm text-muted-foreground">Analyze your resume</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/skill-tracker">
          <Card className="card-hover h-full cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">Skill Tracker</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/mock-interview">
          <Card className="card-hover h-full cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <BrainCircuit className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium">Mock Interview</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Status Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resume Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resume ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Resume Uploaded</p>
                      <p className="text-sm text-muted-foreground">{resume.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Uploaded on {new Date(resume.uploaded_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/resume-analyzer">Update Resume</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-2">No Resume Uploaded</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your resume to unlock insights and readiness features
                  </p>
                  <Button asChild>
                    <Link to="/resume-analyzer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resume
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Insights Card */}
          {resume && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Resume Insights
                </CardTitle>
                <CardDescription>AI-extracted information from your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Summary */}
                {resume.summary && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Profile Summary</h4>
                    <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-4">{resume.summary}</p>
                  </div>
                )}

                {/* Experience */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resume.experience_years || 0}</p>
                    <p className="text-sm text-muted-foreground">Years of Experience</p>
                  </div>
                </div>

                {/* Technical Skills */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.length > 0 ? (
                      technicalSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No technical skills extracted yet</p>
                    )}
                  </div>
                </div>

                {/* Soft Skills */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Soft Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {softSkills.length > 0 ? (
                      softSkills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No soft skills extracted yet</p>
                    )}
                  </div>
                </div>

                {/* Education */}
                {resume.education && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Education</h4>
                    <p className="text-sm">{resume.education}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          {user && <UpcomingInterviews userId={user.id} />}

          {/* Self-Readiness Score Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Self-Readiness Score
                  </CardTitle>
                  <CardDescription className="mt-1">
                    For personal improvement, not hiring
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${readinessScore * 3.52} 352`}
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{readinessScore}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                <p className="font-medium text-foreground">What this score represents:</p>
                <p>
                  Your readiness score reflects how complete and competitive your profile is based on resume completeness, skills coverage, and alignment with market demands.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Improvement Suggestions
              </CardTitle>
              <CardDescription>Areas to focus on for growth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skill Gaps */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Top Skill Gaps
                </h4>
                {skillGaps.length > 0 ? (
                  <ul className="space-y-2">
                    {skillGaps.map((skill, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {resume ? "Great job! No major skill gaps detected." : "Upload your resume to see skill gaps."}
                  </p>
                )}
              </div>

              {/* Focus Areas */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Focus Areas
                </h4>
                <ul className="space-y-3">
                  {focusAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Encouragement */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="text-sm text-primary font-medium mb-1">Keep going! 💪</p>
                <p className="text-sm text-muted-foreground">
                  Every step you take to improve your skills brings you closer to your career goals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
