import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type TrendType = "improving" | "stable" | "needs_attention" | null;

interface ProgressGrowthCardProps {
  readinessScore: number | null;
  technicalTrend: TrendType;
  communicationTrend: TrendType;
}

const getReadinessLabel = (score: number | null): { label: string; color: string } => {
  if (score === null) return { label: "Not Available", color: "bg-muted text-muted-foreground" };
  if (score >= 70) return { label: "High", color: "bg-emerald-100 text-emerald-700" };
  if (score >= 40) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Low", color: "bg-red-100 text-red-700" };
};

const getTrendInfo = (trend: TrendType) => {
  switch (trend) {
    case "improving":
      return { 
        label: "Improving", 
        icon: TrendingUp, 
        className: "text-emerald-600" 
      };
    case "stable":
      return { 
        label: "Stable", 
        icon: Minus, 
        className: "text-muted-foreground" 
      };
    case "needs_attention":
      return { 
        label: "Needs Attention", 
        icon: TrendingDown, 
        className: "text-amber-600" 
      };
    default:
      return { 
        label: "Not Available", 
        icon: Minus, 
        className: "text-muted-foreground" 
      };
  }
};

export function ProgressGrowthCard({
  readinessScore,
  technicalTrend,
  communicationTrend,
}: ProgressGrowthCardProps) {
  const readiness = getReadinessLabel(readinessScore);
  const techTrendInfo = getTrendInfo(technicalTrend);
  const commTrendInfo = getTrendInfo(communicationTrend);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Progress & Growth
        </CardTitle>
        <CardDescription>
          All scores are indicative and for reference only
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Score */}
        <div>
          <span className="text-sm text-muted-foreground block mb-2">Self-Readiness Score</span>
          <div className="flex items-center justify-between">
            {readinessScore !== null ? (
              <>
                <span className="text-3xl font-bold">{readinessScore}</span>
                <Badge className={readiness.color}>{readiness.label}</Badge>
              </>
            ) : (
              <span className="text-muted-foreground">No score available</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Technical Skill Trend */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Technical Skill Trend</span>
          <div className={`flex items-center gap-1 ${techTrendInfo.className}`}>
            <techTrendInfo.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{techTrendInfo.label}</span>
          </div>
        </div>

        <Separator />

        {/* Communication Skill Trend */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Communication Skill Trend</span>
          <div className={`flex items-center gap-1 ${commTrendInfo.className}`}>
            <commTrendInfo.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{commTrendInfo.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
