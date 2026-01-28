import { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Star,
  FileText,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ScreenedCandidate {
  id: string;
  resume_id: string;
  job_id: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  analysis: string;
  screened_at: string;
  resume: {
    id: string;
    user_id: string;
    file_name: string;
    skills: string[];
    experience_years: number;
    education: string;
    summary: string;
  };
  job: {
    id: string;
    title: string;
    required_skills: string[];
  };
}

interface JobRequirement {
  id: string;
  title: string;
  description: string | null;
  required_skills: string[];
  min_experience_years: number;
  is_active: boolean;
  created_at: string;
}

const stats = [
  { icon: Users, label: "Total Candidates", value: "0", change: "", color: "bg-primary/10 text-primary", key: "candidates" },
  { icon: Briefcase, label: "Open Positions", value: "0", change: "", color: "bg-emerald-100 text-emerald-600", key: "positions" },
  { icon: Calendar, label: "Screened Today", value: "0", change: "", color: "bg-violet-100 text-violet-600", key: "screened" },
  { icon: TrendingUp, label: "Avg Match Score", value: "0%", change: "", color: "bg-accent/10 text-accent", key: "avgScore" },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 bg-emerald-100";
  if (score >= 60) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Partial Match";
  return "Low Match";
};

export default function HRDashboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [screenedCandidates, setScreenedCandidates] = useState<ScreenedCandidate[]>([]);
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(stats);

  // Fetch data on mount
  useEffect(() => {
    if (user && role === "hr") {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_requirements")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Fetch screening results with resume and job data
      const { data: screeningData, error: screeningError } = await supabase
        .from("screening_results")
        .select(`
          *,
          resume:resumes(id, user_id, file_name, skills, experience_years, education, summary),
          job:job_requirements(id, title, required_skills)
        `)
        .order("match_score", { ascending: false });

      if (screeningError) throw screeningError;
      setScreenedCandidates((screeningData || []) as unknown as ScreenedCandidate[]);

      // Fetch all resumes count
      const { count: resumeCount } = await supabase
        .from("resumes")
        .select("*", { count: "exact", head: true });

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const screenedToday = (screeningData || []).filter(
        (s) => s.screened_at.startsWith(today)
      ).length;

      const avgScore = screeningData && screeningData.length > 0
        ? Math.round(screeningData.reduce((acc, s) => acc + s.match_score, 0) / screeningData.length)
        : 0;

      setStatsData([
        { ...stats[0], value: String(resumeCount || 0) },
        { ...stats[1], value: String(jobsData?.filter(j => j.is_active).length || 0) },
        { ...stats[2], value: String(screenedToday) },
        { ...stats[3], value: `${avgScore}%` },
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const screenAllResumes = async (jobId: string) => {
    try {
      toast({
        title: "Screening started",
        description: "Analyzing all resumes against job requirements...",
      });

      // Fetch all resumes that haven't been screened for this job
      const { data: resumes, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .not("skills", "is", null);

      if (resumeError) throw resumeError;

      // Screen each resume
      for (const resume of resumes || []) {
        await supabase.functions.invoke("screen-resume", {
          body: {
            resumeText: `Skills: ${resume.skills?.join(", ")}\nExperience: ${resume.experience_years} years\nEducation: ${resume.education}\nSummary: ${resume.summary}`,
            resumeId: resume.id,
            jobId,
          },
        });
      }

      toast({
        title: "Screening complete",
        description: `Screened ${resumes?.length || 0} candidates`,
      });

      fetchData();
    } catch (error) {
      console.error("Screening error:", error);
      toast({
        title: "Screening failed",
        description: "An error occurred during screening",
        variant: "destructive",
      });
    }
  };

  const filteredCandidates = screenedCandidates.filter((candidate) => {
    const matchesJob = selectedJob === "all" || candidate.job_id === selectedJob;
    const matchesSearch = searchTerm === "" || 
      candidate.resume?.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.resume?.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesJob && matchesSearch;
  });

  const topCandidates = filteredCandidates.filter(c => c.match_score >= 70);

  if (role !== "hr") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This dashboard is only accessible to HR users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Screen candidates and manage your recruitment pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Job Requirement</DialogTitle>
                <DialogDescription>
                  Create a new job to screen candidates against.
                </DialogDescription>
              </DialogHeader>
              <AddJobForm onSuccess={fetchData} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mt-4">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJob !== "all" && (
              <Button onClick={() => screenAllResumes(selectedJob)} variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Screen All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Screened Candidates List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Screened Candidates</CardTitle>
                <CardDescription>
                  {filteredCandidates.length} candidates matched
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No screened candidates yet.</p>
                  <p className="text-sm">Add a job and screen candidates to see results.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCandidates.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Top Candidates
              </CardTitle>
              <CardDescription>Score 70% or higher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No top candidates yet
                </p>
              ) : (
                topCandidates.slice(0, 5).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs gradient-primary text-primary-foreground">
                          {candidate.resume?.file_name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">
                          {candidate.resume?.file_name?.split(".")[0] || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.job?.title}
                        </p>
                      </div>
                    </div>
                    <Badge className={getScoreColor(candidate.match_score)}>
                      {candidate.match_score}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Jobs Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.filter(j => j.is_active).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active jobs
                </p>
              ) : (
                jobs.filter(j => j.is_active).map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{job.title}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedJob(job.id);
                          screenAllResumes(job.id);
                        }}
                      >
                        Screen
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.required_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: ScreenedCandidate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="gradient-primary text-primary-foreground">
              {candidate.resume?.file_name?.slice(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {candidate.resume?.file_name?.split(".")[0] || "Unknown Candidate"}
            </p>
            <p className="text-sm text-muted-foreground">
              {candidate.resume?.experience_years || 0} years exp • {candidate.job?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreColor(candidate.match_score)}`}>
              {candidate.match_score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getScoreLabel(candidate.match_score)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Match Score Bar */}
      <div className="mt-4">
        <Progress value={candidate.match_score} className="h-2" />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Analysis */}
          <div>
            <p className="text-sm font-medium mb-1">AI Analysis</p>
            <p className="text-sm text-muted-foreground">{candidate.analysis}</p>
          </div>

          {/* Skills comparison */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 text-emerald-600">
                Matched Skills ({candidate.matched_skills?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1">
                {candidate.matched_skills?.map((skill, i) => (
                  <Badge key={i} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-red-600">
                Missing Skills ({candidate.missing_skills?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1">
                {candidate.missing_skills?.map((skill, i) => (
                  <Badge key={i} variant="outline" className="border-red-200 text-red-600">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Education & Summary */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Education</p>
              <p className="text-muted-foreground">{candidate.resume?.education || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium">Summary</p>
              <p className="text-muted-foreground line-clamp-2">
                {candidate.resume?.summary || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddJobForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [minExperience, setMinExperience] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from("job_requirements")
        .insert({
          title,
          description: description || null,
          required_skills: skillsArray,
          min_experience_years: parseInt(minExperience) || 0,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Job created",
        description: "You can now screen candidates against this job.",
      });

      onSuccess();
      setTitle("");
      setDescription("");
      setSkills("");
      setMinExperience("0");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job requirement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Job Title *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Senior Frontend Developer"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief job description"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Required Skills *</label>
        <Input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="React, TypeScript, Node.js (comma-separated)"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Min. Experience (years)</label>
        <Input
          type="number"
          value={minExperience}
          onChange={(e) => setMinExperience(e.target.value)}
          min="0"
          max="20"
        />
      </div>
      <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
        {loading ? "Creating..." : "Create Job"}
      </Button>
    </form>
  );
}
