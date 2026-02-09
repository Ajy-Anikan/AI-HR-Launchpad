import { useState, useEffect } from "react";
import { Loader2, Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Target, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnswerEvaluation {
  answer_id: string;
  relevance_rating: string;
  clarity_rating: string;
  depth_rating: string;
  feedback_text: string;
}

interface EvaluationData {
  answer_evaluations: AnswerEvaluation[];
  strengths: string[];
  gaps: string[];
  improvement_tips: string[];
  summary_message: string;
}

interface AnswerData {
  id: string;
  question_number: number;
  question_text: string;
  answer_text: string | null;
}

interface CompanyPrepEvaluationProps {
  sessionId: string;
  company: string;
  questionType: string;
  difficulty: string;
  practiceYear: string;
  questions: { question: string; context: string }[];
  answers: string[];
}

const ratingBadge = (rating: string) => {
  const r = rating.toLowerCase();
  if (r === "strong") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Strong</Badge>;
  if (r === "fair") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Fair</Badge>;
  return <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">Needs Improvement</Badge>;
};

export default function CompanyPrepEvaluation({
  sessionId,
  company,
  questionType,
  difficulty,
  practiceYear,
  questions,
  answers,
}: CompanyPrepEvaluationProps) {
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [openQuestions, setOpenQuestions] = useState<Record<number, boolean>>({});

  // Check if evaluation already exists
  useEffect(() => {
    const checkExisting = async () => {
      const { data } = await supabase
        .from("company_prep_evaluations")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (data) {
        // Load existing evaluation with answer evaluations
        const { data: answerEvals } = await supabase
          .from("company_prep_answer_evaluations")
          .select("*")
          .in("answer_id", (await supabase
            .from("company_practice_answers")
            .select("id")
            .eq("session_id", sessionId)
          ).data?.map(a => a.id) || []);

        setEvaluation({
          answer_evaluations: (answerEvals || []).map(e => ({
            answer_id: e.answer_id,
            relevance_rating: e.relevance_rating,
            clarity_rating: e.clarity_rating,
            depth_rating: e.depth_rating,
            feedback_text: e.feedback_text,
          })),
          strengths: data.strengths || [],
          gaps: data.gaps || [],
          improvement_tips: data.improvement_tips || [],
          summary_message: data.summary_message,
        });
        setHasEvaluated(true);
      }
    };
    checkExisting();
  }, [sessionId]);

  const handleEvaluate = async () => {
    setIsLoading(true);
    try {
      // Fetch stored answers from DB
      const { data: storedAnswers, error: fetchError } = await supabase
        .from("company_practice_answers")
        .select("id, question_number, question_text, answer_text")
        .eq("session_id", sessionId)
        .order("question_number");

      if (fetchError) throw fetchError;
      if (!storedAnswers || storedAnswers.length === 0) throw new Error("No answers found");

      const { data: evalData, error: evalError } = await supabase.functions.invoke(
        "evaluate-company-prep",
        {
          body: {
            session_id: sessionId,
            company,
            question_type: questionType,
            difficulty,
            practice_year: practiceYear ? parseInt(practiceYear) : null,
            answers: storedAnswers,
          },
        }
      );

      if (evalError) throw evalError;
      if (!evalData) throw new Error("No evaluation data returned");

      // Save session-level evaluation
      const { error: saveError } = await supabase
        .from("company_prep_evaluations")
        .insert({
          session_id: sessionId,
          strengths: evalData.strengths,
          gaps: evalData.gaps,
          improvement_tips: evalData.improvement_tips,
          summary_message: evalData.summary_message,
        });

      if (saveError) throw saveError;

      // Save per-answer evaluations
      if (evalData.answer_evaluations?.length > 0) {
        const answerEvalsToInsert = evalData.answer_evaluations.map((ae: AnswerEvaluation) => ({
          answer_id: ae.answer_id,
          relevance_rating: ae.relevance_rating,
          clarity_rating: ae.clarity_rating,
          depth_rating: ae.depth_rating,
          feedback_text: ae.feedback_text,
        }));

        const { error: answerSaveError } = await supabase
          .from("company_prep_answer_evaluations")
          .insert(answerEvalsToInsert);

        if (answerSaveError) throw answerSaveError;
      }

      setEvaluation(evalData);
      setHasEvaluated(true);
      toast({ title: "Evaluation Complete", description: "Your practice session has been evaluated!" });
    } catch (error) {
      console.error("Evaluation error:", error);
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "Could not evaluate session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setOpenQuestions(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!hasEvaluated && !isLoading) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardHeader className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-lg">Get AI Feedback</CardTitle>
          <CardDescription>
            Receive personalized, coaching-style feedback on your {company} practice session.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleEvaluate} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Evaluate My Answers
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Evaluating your answers...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Our AI coach is reviewing your {company} practice session
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Session Feedback</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{evaluation.summary_message}</p>
        </CardContent>
      </Card>

      {/* Strengths & Gaps */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Company-Aligned Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Areas to Improve</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Tips */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Preparation Tips for {company}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {evaluation.improvement_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm bg-muted/50 rounded-lg p-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Question-by-Question Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question-by-Question Feedback</CardTitle>
          <CardDescription>Expand each question to see your answer and detailed feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, index) => {
            const answerEval = evaluation.answer_evaluations[index];
            const isOpen = openQuestions[index] ?? false;

            return (
              <Collapsible key={index} open={isOpen} onOpenChange={() => toggleQuestion(index)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="shrink-0">Q{index + 1}</Badge>
                      <span className="text-sm font-medium truncate">{q.question}</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 space-y-4">
                    {/* Your Answer */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Answer</p>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {answers[index] || "(No answer provided)"}
                      </div>
                    </div>

                    {/* Ratings */}
                    {answerEval && (
                      <>
                        <div className="flex flex-wrap gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Relevance</p>
                            {ratingBadge(answerEval.relevance_rating)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Clarity</p>
                            {ratingBadge(answerEval.clarity_rating)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Depth</p>
                            {ratingBadge(answerEval.depth_rating)}
                          </div>
                        </div>

                        {/* Feedback */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Feedback</p>
                          <p className="text-sm leading-relaxed bg-primary/5 rounded-lg p-3">{answerEval.feedback_text}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
