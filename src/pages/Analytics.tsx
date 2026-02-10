import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Loader2 } from "lucide-react";
import CandidateAnalytics from "@/components/analytics/CandidateAnalytics";
import HRAnalytics from "@/components/analytics/HRAnalytics";

export default function Analytics() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to view your analytics and progress insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {role === "hr" ? <HRAnalytics /> : <CandidateAnalytics />}
    </div>
  );
}
