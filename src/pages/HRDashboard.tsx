import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText,
  Activity,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Calendar,
  CalendarIcon,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CandidateData {
  id: string;
  anonymizedId: string;
  hasResume: boolean;
  readinessScore: number | null;
  lastActivityDate: string | null;
}

const getReadinessLabel = (score: number | null): { label: string; color: string } => {
  if (score === null) return { label: "N/A", color: "bg-muted text-muted-foreground" };
  if (score >= 70) return { label: "High", color: "bg-emerald-100 text-emerald-700" };
  if (score >= 40) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Low", color: "bg-red-100 text-red-700" };
};

const generateAnonymizedId = (userId: string): string => {
  // Create a deterministic but anonymized ID from user_id
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `CAND-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
};

export default function HRDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeFilter, setResumeFilter] = useState<string>("all");
  const [readinessFilter, setReadinessFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Stats
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [candidatesWithResume, setCandidatesWithResume] = useState(0);
  const [candidatesWithActivity, setCandidatesWithActivity] = useState(0);

  useEffect(() => {
    if (!authLoading && user && role === "hr") {
      fetchCandidates();
    }
  }, [user, role, authLoading]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Get all candidate user IDs from user_roles
      const { data: candidateRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "candidate");

      if (rolesError) throw rolesError;

      if (!candidateRoles || candidateRoles.length === 0) {
        setCandidates([]);
        setTotalCandidates(0);
        setCandidatesWithResume(0);
        setCandidatesWithActivity(0);
        setLoading(false);
        return;
      }

      const candidateUserIds = candidateRoles.map(r => r.user_id);

      // Fetch resumes for these candidates
      const { data: resumes, error: resumeError } = await supabase
        .from("resumes")
        .select("user_id, uploaded_at")
        .in("user_id", candidateUserIds);

      if (resumeError) throw resumeError;

      // Fetch latest skill progress for readiness scores
      const { data: skillProgress, error: skillError } = await supabase
        .from("skill_progress")
        .select("user_id, overall_progress_score, recorded_at")
        .in("user_id", candidateUserIds)
        .order("recorded_at", { ascending: false });

      if (skillError) throw skillError;

      // Fetch mock interview activity
      const { data: mockSessions, error: mockError } = await supabase
        .from("mock_interview_sessions")
        .select("user_id, started_at")
        .in("user_id", candidateUserIds)
        .order("started_at", { ascending: false });

      if (mockError) throw mockError;

      // Fetch company practice activity
      const { data: practiceSessions, error: practiceError } = await supabase
        .from("company_practice_sessions")
        .select("user_id, started_at")
        .in("user_id", candidateUserIds)
        .order("started_at", { ascending: false });

      if (practiceError) throw practiceError;

      // Build candidate data
      const resumeMap = new Map(resumes?.map(r => [r.user_id, r]) || []);
      
      // Get latest skill score per user
      const skillMap = new Map<string, { score: number; date: string }>();
      skillProgress?.forEach(sp => {
        if (!skillMap.has(sp.user_id)) {
          skillMap.set(sp.user_id, { 
            score: sp.overall_progress_score, 
            date: sp.recorded_at 
          });
        }
      });

      // Get latest activity per user
      const activityMap = new Map<string, string>();
      mockSessions?.forEach(ms => {
        if (!activityMap.has(ms.user_id)) {
          activityMap.set(ms.user_id, ms.started_at);
        }
      });
      practiceSessions?.forEach(ps => {
        const existing = activityMap.get(ps.user_id);
        if (!existing || new Date(ps.started_at) > new Date(existing)) {
          activityMap.set(ps.user_id, ps.started_at);
        }
      });

      const candidateData: CandidateData[] = candidateRoles.map(cr => {
        const resume = resumeMap.get(cr.user_id);
        const skill = skillMap.get(cr.user_id);
        const lastActivity = activityMap.get(cr.user_id);

        return {
          id: cr.user_id,
          anonymizedId: generateAnonymizedId(cr.user_id),
          hasResume: !!resume,
          readinessScore: skill?.score || null,
          lastActivityDate: lastActivity || skill?.date || (resume ? resume.uploaded_at : null),
        };
      });

      setCandidates(candidateData);
      setTotalCandidates(candidateData.length);
      setCandidatesWithResume(candidateData.filter(c => c.hasResume).length);
      setCandidatesWithActivity(candidateData.filter(c => c.lastActivityDate !== null).length);

    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load candidate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    // Resume filter
    if (resumeFilter === "yes" && !candidate.hasResume) return false;
    if (resumeFilter === "no" && candidate.hasResume) return false;

    // Readiness filter
    if (readinessFilter !== "all") {
      const { label } = getReadinessLabel(candidate.readinessScore);
      if (readinessFilter === "high" && label !== "High") return false;
      if (readinessFilter === "medium" && label !== "Medium") return false;
      if (readinessFilter === "low" && label !== "Low") return false;
      if (readinessFilter === "na" && label !== "N/A") return false;
    }

    // Search by anonymized ID
    if (searchTerm && !candidate.anonymizedId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Access denied for non-HR users
  if (!authLoading && role !== "hr") {
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
          <p className="text-muted-foreground">
            View candidate information for observation and shortlisting support.
          </p>
        </div>
        <Button onClick={() => navigate("/hr-interviews")}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Interview Schedule
        </Button>
      </div>

      {/* Disclaimer Alert */}
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Note:</strong> All scores shown are indicative self-assessments and should not be used as final hiring criteria. 
          This dashboard is for observation purposes only.
        </AlertDescription>
      </Alert>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4">{totalCandidates}</p>
            <p className="text-sm text-muted-foreground">Total Candidates</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4">{candidatesWithResume}</p>
            <p className="text-sm text-muted-foreground">Resume Uploaded</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4">{candidatesWithActivity}</p>
            <p className="text-sm text-muted-foreground">Practice Activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Candidate ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={resumeFilter} onValueChange={setResumeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Resume Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resumes</SelectItem>
                <SelectItem value="yes">Uploaded</SelectItem>
                <SelectItem value="no">Not Uploaded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readinessFilter} onValueChange={setReadinessFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Readiness Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (70+)</SelectItem>
                <SelectItem value="medium">Medium (40-69)</SelectItem>
                <SelectItem value="low">Low (&lt;40)</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidate List */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate List</CardTitle>
          <CardDescription>
            {filteredCandidates.length} of {candidates.length} candidates shown (read-only view)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading candidates...</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No candidates found matching your filters.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredCandidates.map((candidate) => {
                  const readiness = getReadinessLabel(candidate.readinessScore);
                  return (
                    <Card key={candidate.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono font-medium text-sm">{candidate.anonymizedId}</span>
                        <Badge className={readiness.color}>
                          {readiness.label}
                          {candidate.readinessScore !== null && ` (${candidate.readinessScore})`}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resume:</span>
                          <Badge variant={candidate.hasResume ? "default" : "secondary"}>
                            {candidate.hasResume ? "Uploaded" : "Not Uploaded"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Activity:</span>
                          <span>
                            {candidate.lastActivityDate 
                              ? format(new Date(candidate.lastActivityDate), "MMM d, yyyy")
                              : "—"
                            }
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => navigate(`/candidate-profile/${candidate.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate ID</TableHead>
                      <TableHead>Resume Status</TableHead>
                      <TableHead>
                        Self-Readiness Score
                        <span className="text-xs text-muted-foreground block">
                          (indicative only)
                        </span>
                      </TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => {
                      const readiness = getReadinessLabel(candidate.readinessScore);
                      return (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-mono font-medium">
                            {candidate.anonymizedId}
                          </TableCell>
                          <TableCell>
                            <Badge variant={candidate.hasResume ? "default" : "secondary"}>
                              {candidate.hasResume ? "Uploaded" : "Not Uploaded"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={readiness.color}>
                              {readiness.label}
                              {candidate.readinessScore !== null && ` (${candidate.readinessScore})`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {candidate.lastActivityDate 
                              ? format(new Date(candidate.lastActivityDate), "MMM d, yyyy")
                              : "—"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/candidate-profile/${candidate.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
