import { FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface CandidateOverviewCardProps {
  anonymizedId: string;
  hasResume: boolean;
  resumeUploadDate: string | null;
  lastActivityDate: string | null;
}

export function CandidateOverviewCard({
  anonymizedId,
  hasResume,
  resumeUploadDate,
  lastActivityDate,
}: CandidateOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Candidate Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Candidate ID</span>
          <span className="font-mono font-semibold">{anonymizedId}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Resume Status</span>
          <Badge variant={hasResume ? "default" : "secondary"}>
            {hasResume ? "Uploaded" : "Not Uploaded"}
          </Badge>
        </div>
        {hasResume && resumeUploadDate && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Upload Date</span>
              <span>{format(new Date(resumeUploadDate), "MMM d, yyyy")}</span>
            </div>
          </>
        )}
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last Active</span>
          <span>
            {lastActivityDate ? (
              <div className="text-right">
                <div>{format(new Date(lastActivityDate), "MMM d, yyyy")}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(lastActivityDate), "h:mm a")}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No activity</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
