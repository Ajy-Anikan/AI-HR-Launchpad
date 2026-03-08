import { useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Loader2,
  Briefcase,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CareerPath {
  title: string;
  description: string;
  key_skills: string[];
  match_percentage: number;
  skills_to_improve: string[];
  learning_suggestions: string[];
}

interface CareerPathSuggestionsProps {
  skills: string[];
  experienceYears: number | null;
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
}

export default function CareerPathSuggestions({
  skills,
  experienceYears,
  missingSkills,
  strengths,
  gaps,
}: CareerPathSuggestionsProps) {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-career-paths", {
        body: {
          skills,
          experience_years: experienceYears,
          missing_skills: missingSkills,
          strengths,
          gaps,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setCareerPaths(data.career_paths || []);
      setHasGenerated(true);
      setExpandedIndex(0);
    } catch (error: any) {
      console.error("Career path error:", error);
      if (error?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else if (error?.status === 402) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else {
        toast.error("Failed to generate career suggestions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const CAREER_ICONS: Record<string, string> = {
    frontend: "🎨",
    backend: "⚙️",
    fullstack: "🔗",
    data: "📊",
    machine: "🤖",
    devops: "☁️",
    mobile: "📱",
    product: "📋",
    security: "🔒",
    cloud: "☁️",
  };

  const getCareerIcon = (title: string) => {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(CAREER_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return "💼";
  };

  const getMatchColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  if (!hasGenerated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Suggested Career Paths
          </CardTitle>
          <CardDescription>
            Get AI-powered career path suggestions based on your skills and experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Discover career paths that align with your current skills. This is for personal guidance only.
            </p>
            <Button
              onClick={generateSuggestions}
              disabled={loading || skills.length === 0}
              className="gradient-primary border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Compass className="mr-2 h-4 w-4" />
                  Explore Career Paths
                </>
              )}
            </Button>
            {skills.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Upload a resume first to unlock this feature.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Suggested Career Paths
            </CardTitle>
            <CardDescription>Personalized suggestions based on your profile</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={generateSuggestions} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {careerPaths.map((path, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <motion.div
              key={path.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCareerIcon(path.title)}</span>
                    <div>
                      <h4 className="font-medium">{path.title}</h4>
                      <p className="text-xs text-muted-foreground">{path.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </div>

                {/* Match Indicator */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Skill Match</span>
                    <span className={`text-sm font-semibold ${getMatchColor(path.match_percentage)}`}>
                      {path.match_percentage}%
                    </span>
                  </div>
                  <Progress value={path.match_percentage} className="h-2" />
                </div>

                {/* Key Skills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {path.key_skills.map((skill) => {
                    const hasSkill = skills.some(
                      (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
                    );
                    return (
                      <Badge
                        key={skill}
                        variant={hasSkill ? "default" : "outline"}
                        className={`text-[11px] ${hasSkill ? "" : "opacity-60"}`}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-4 border-t pt-4"
                  >
                    {/* Skills to Improve */}
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Skills to Improve
                      </h5>
                      <ul className="space-y-1.5">
                        {path.skills_to_improve.map((skill, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Learning Suggestions */}
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        Recommended Actions
                      </h5>
                      <ul className="space-y-1.5">
                        {path.learning_suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          🌱 These suggestions are for personal guidance only. Keep exploring and growing!
        </p>
      </CardContent>
    </Card>
  );
}
