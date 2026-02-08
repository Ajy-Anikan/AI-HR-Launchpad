import { useEffect, useState } from "react";
import { CalendarIcon, Video, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CandidateInterview {
  id: string;
  interview_type: string;
  interview_mode: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

const typeLabels: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

interface UpcomingInterviewsProps {
  userId: string;
}

export function UpcomingInterviews({ userId }: UpcomingInterviewsProps) {
  const [interviews, setInterviews] = useState<CandidateInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, [userId]);

  const fetchInterviews = async () => {
    try {
      // Candidates can only see their own interviews via RLS
      // We select only the fields candidates should see (no hr_notes)
      const { data, error } = await supabase
        .from("interview_schedules")
        .select("id, interview_type, interview_mode, scheduled_date, scheduled_time, status")
        .eq("candidate_id", userId)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error("Error fetching candidate interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading interviews...
        </CardContent>
      </Card>
    );
  }

  if (interviews.length === 0) {
    return null; // Don't show the card if no interviews
  }

  const upcoming = interviews.filter((i) => i.status === "scheduled");
  const past = interviews.filter((i) => i.status !== "scheduled");

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Scheduled Interviews
        </CardTitle>
        <CardDescription>
          {upcoming.length} upcoming interview{upcoming.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length > 0 && (
          <div className="space-y-3">
            {upcoming.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeLabels[interview.interview_type]}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {interview.interview_mode === "online" ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                      {interview.interview_mode === "online" ? "Online" : "In-person"}
                    </span>
                  </div>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(interview.scheduled_date + "T00:00:00"), "PPP")} at{" "}
                    {interview.scheduled_time.slice(0, 5)}
                  </p>
                </div>
                <Badge className={statusColors[interview.status]}>
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Past Interviews</p>
            {past.map((interview) => (
              <div
                key={interview.id}
                className="flex flex-col gap-1 p-2 rounded-md opacity-80 mb-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{typeLabels[interview.interview_type]}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(interview.scheduled_date + "T00:00:00"), "PP")}
                    </span>
                  </div>
                  <Badge className={statusColors[interview.status]} variant="outline">
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </Badge>
                </div>
                {interview.status === "completed" && (
                  <p className="text-xs text-muted-foreground italic">
                    Interview completed. HR feedback under review.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
