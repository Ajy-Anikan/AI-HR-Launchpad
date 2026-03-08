import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Code2,
  Briefcase,
  Cpu,
  MessageSquare,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = "skills_to_highlight" | "experience_enhancement" | "technical_depth" | "communication_structure";
type Priority = "high" | "medium" | "optional";

interface Suggestion {
  category: Category;
  priority: Priority;
  title: string;
  explanation: string;
  action: string;
}

interface ResumeImprovementsProps {
  skills: string[];
  experienceYears: number;
  education: string;
  summary: string;
  missingSkills?: string[];
  evaluationGaps?: string[];
}

const CATEGORY_META: Record<Category, { label: string; icon: typeof Code2 }> = {
  skills_to_highlight: { label: "Skills to Highlight", icon: Code2 },
  experience_enhancement: { label: "Experience Enhancement", icon: Briefcase },
  technical_depth: { label: "Technical Depth", icon: Cpu },
  communication_structure: { label: "Communication & Structure", icon: MessageSquare },
};

const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  high: { label: "High Priority", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Medium Priority", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  optional: { label: "Optional", className: "bg-muted text-muted-foreground border-border" },
};

export default function ResumeImprovements({
  skills,
  experienceYears,
  education,
  summary,
  missingSkills = [],
  evaluationGaps = [],
}: ResumeImprovementsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-resume-improvements", {
        body: {
          skills,
          experience_years: experienceYears,
          education,
          summary,
          missing_skills: missingSkills,
          evaluation_gaps: evaluationGaps,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
      setHasGenerated(true);
      setExpandedIndex(0);
    } catch (err: any) {
      console.error("Resume improvement error:", err);
      if (err?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else if (err?.status === 402) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else {
        toast.error("Failed to generate suggestions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasGenerated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Resume Improvement Suggestions
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations to strengthen your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Our AI will analyze your resume and provide actionable suggestions to improve it.
            </p>
            <Button onClick={generate} disabled={loading} className="gradient-primary border-0">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Improvement Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const grouped = suggestions.reduce<Record<Category, Suggestion[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<Category, Suggestion[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resume Improvement Suggestions
            </CardTitle>
            <CardDescription>Actionable recommendations to strengthen your resume</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.entries(grouped) as [Category, Suggestion[]][]).map(([category, items]) => {
          const meta = CATEGORY_META[category];
          if (!meta) return null;
          const Icon = meta.icon;

          return (
            <div key={category}>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                {meta.label}
              </h4>
              <div className="space-y-2">
                {items.map((suggestion, i) => {
                  const globalIndex = suggestions.indexOf(suggestion);
                  const isExpanded = expandedIndex === globalIndex;
                  const priorityMeta = PRIORITY_META[suggestion.priority];

                  return (
                    <motion.div
                      key={globalIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        className="rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${priorityMeta.className}`}
                              >
                                {priorityMeta.label}
                              </Badge>
                              <span className="text-sm font-medium">{suggestion.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t"
                            >
                              <div className="flex items-start gap-2">
                                <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-primary mb-0.5">Recommended Action</p>
                                  <p className="text-sm">{suggestion.action}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          💡 These suggestions are for your personal improvement. Focus on what feels most relevant to you.
        </p>
      </CardContent>
    </Card>
  );
}
