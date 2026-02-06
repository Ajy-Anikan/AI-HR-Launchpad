import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  Filter,
  Users,
  Video,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InterviewRow {
  id: string;
  candidate_id: string;
  interview_type: string;
  interview_mode: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  hr_notes: string | null;
  created_at: string;
}

const generateAnonymizedId = (userId: string): string => {
  const hash = userId.split("").reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `CAND-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  scheduled: {
    label: "Scheduled",
    variant: "default",
    icon: <Clock className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    variant: "secondary",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const typeLabels: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
};

export default function HRInterviews() {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("upcoming");

  useEffect(() => {
    if (!authLoading && user && role === "hr") {
      fetchInterviews();
    }
  }, [user, role, authLoading]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interview_schedules")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast({
        title: "Error",
        description: "Failed to load interviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("interview_schedules")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Status updated", description: `Interview marked as ${newStatus}.` });
      fetchInterviews();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update interview status.",
        variant: "destructive",
      });
    }
  };

  const filteredInterviews = interviews
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
      const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
      return sortOrder === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === "scheduled").length,
    completed: interviews.filter((i) => i.status === "completed").length,
    cancelled: interviews.filter((i) => i.status === "cancelled").length,
  };

  if (!authLoading && role !== "hr") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to HR users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/hr-dashboard")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Schedule</h1>
        <p className="text-muted-foreground">Manage and track all scheduled candidate interviews.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.scheduled}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.cancelled}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming First</SelectItem>
                <SelectItem value="recent">Recent First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interview List */}
      <Card>
        <CardHeader>
          <CardTitle>Interviews</CardTitle>
          <CardDescription>{filteredInterviews.length} interview(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading interviews...</div>
          ) : filteredInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No interviews found.</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden space-y-4">
                {filteredInterviews.map((interview) => {
                  const sc = statusConfig[interview.status];
                  return (
                    <Card key={interview.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-medium">
                          {generateAnonymizedId(interview.candidate_id)}
                        </span>
                        <Badge variant={sc.variant} className="flex items-center gap-1">
                          {sc.icon}
                          {sc.label}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{typeLabels[interview.interview_type]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mode:</span>
                          <span className="flex items-center gap-1">
                            {interview.interview_mode === "online" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {interview.interview_mode === "online" ? "Online" : "In-person"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{format(new Date(interview.scheduled_date + "T00:00:00"), "PPP")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span>{interview.scheduled_time.slice(0, 5)}</span>
                        </div>
                        {interview.hr_notes && (
                          <div className="pt-2 border-t">
                            <p className="text-muted-foreground text-xs mb-1">Notes:</p>
                            <p className="text-sm">{interview.hr_notes}</p>
                          </div>
                        )}
                      </div>
                      {interview.status === "scheduled" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => updateStatus(interview.id, "completed")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1">
                                <XCircle className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Interview?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the interview as cancelled. You can schedule a new one later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction onClick={() => updateStatus(interview.id, "cancelled")}>
                                  Cancel Interview
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviews.map((interview) => {
                      const sc = statusConfig[interview.status];
                      return (
                        <TableRow key={interview.id}>
                          <TableCell
                            className="font-mono font-medium cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/candidate-profile/${interview.candidate_id}`)}
                          >
                            {generateAnonymizedId(interview.candidate_id)}
                          </TableCell>
                          <TableCell>{typeLabels[interview.interview_type]}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {interview.interview_mode === "online" ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              {interview.interview_mode === "online" ? "Online" : "In-person"}
                            </span>
                          </TableCell>
                          <TableCell>{format(new Date(interview.scheduled_date + "T00:00:00"), "PPP")}</TableCell>
                          <TableCell>{interview.scheduled_time.slice(0, 5)}</TableCell>
                          <TableCell>
                            <Badge variant={sc.variant} className="flex items-center gap-1 w-fit">
                              {sc.icon}
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {interview.status === "scheduled" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(interview.id, "completed")}
                                >
                                  Complete
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">Cancel</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Interview?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will mark the interview as cancelled.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => updateStatus(interview.id, "cancelled")}>
                                        Cancel Interview
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
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
