import { Briefcase, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface PracticeActivityCardProps {
  mockInterviewCount: number;
  companyPracticeCount: number;
  lastPracticeDate: string | null;
}

export function PracticeActivityCard({
  mockInterviewCount,
  companyPracticeCount,
  lastPracticeDate,
}: PracticeActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Practice Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Mock Interviews</span>
          <span className="font-semibold">{mockInterviewCount} completed</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Company Prep Sessions</span>
          <span className="font-semibold">{companyPracticeCount} completed</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last Practice</span>
          <span>
            {lastPracticeDate ? (
              <div className="text-right">
                <div className="font-semibold">
                  {format(new Date(lastPracticeDate), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(lastPracticeDate), "h:mm a")}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No practice recorded</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
