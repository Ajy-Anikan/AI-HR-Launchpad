import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnswerWithEvaluation {
  id: string;
  question_number: number;
  question_text: string;
  answer_text: string | null;
  evaluation?: {
    relevance_rating: string;
    clarity_rating: string;
    depth_rating: string;
    feedback_text: string;
  };
}

interface SessionEvaluation {
  strengths: string[];
  gaps: string[];
  improvement_tips: string[];
  summary_message: string;
}

interface Session {
  id: string;
  interview_type: string;
  role_level: string;
  completed_at: string;
  total_questions: number;
}

const ratingConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "Strong": { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  "Average": { icon: MinusCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  "Needs Improvement": { icon: AlertCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

export default function InterviewEvaluation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { user, role, loading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<AnswerWithEvaluation[]>([]);
  const [sessionEvaluation, setSessionEvaluation] = useState<SessionEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([1]));
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);

  // Access control
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (role === "hr") {
        navigate("/hr-dashboard");
        return;
      }
    }
  }, [user, role, authLoading, navigate]);

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user || !sessionId) return;

      setIsLoading(true);
      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from("mock_interview_sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (sessionError) throw sessionError;
        if (!sessionData) {
          toast.error("Interview session not found");
          navigate("/mock-interview");
          return;
        }

        if (sessionData.status !== "completed") {
          toast.error("This interview is not yet completed");
          navigate("/mock-interview");
          return;
        }

        setSession(sessionData);

        // Fetch answers
        const { data: answersData, error: answersError } = await supabase
          .from("mock_interview_answers")
          .select("*")
          .eq("session_id", sessionId)
          .order("question_number", { ascending: true });

        if (answersError) throw answersError;

        // Fetch existing evaluations for answers
        const answerIds = answersData.map(a => a.id);
        const { data: evalData } = await supabase
          .from("answer_evaluations")
          .select("*")
          .in("answer_id", answerIds);

        // Fetch existing session evaluation
        const { data: sessionEvalData } = await supabase
          .from("session_evaluations")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        // Merge evaluations with answers
        const answersWithEvals: AnswerWithEvaluation[] = answersData.map(answer => {
          const evaluation = evalData?.find(e => e.answer_id === answer.id);
          return {
            ...answer,
            evaluation: evaluation ? {
              relevance_rating: evaluation.relevance_rating,
              clarity_rating: evaluation.clarity_rating,
              depth_rating: evaluation.depth_rating,
              feedback_text: evaluation.feedback_text,
            } : undefined,
          };
        });

        setAnswers(answersWithEvals);
        
        if (sessionEvalData) {
          setSessionEvaluation({
            strengths: sessionEvalData.strengths,
            gaps: sessionEvalData.gaps,
            improvement_tips: sessionEvalData.improvement_tips,
            summary_message: sessionEvalData.summary_message,
          });
          setHasExistingEvaluation(true);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast.error("Failed to load interview data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && sessionId) {
      fetchSessionData();
    }
  }, [user, sessionId, navigate]);

  const runEvaluation = async () => {
    if (!session || answers.length === 0) return;

    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-interview", {
        body: {
          session_id: session.id,
          interview_type: session.interview_type,
          answers: answers.map(a => ({
            id: a.id,
            question_number: a.question_number,
            question_text: a.question_text,
            answer_text: a.answer_text,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Save answer evaluations
      for (const evalItem of data.answer_evaluations) {
        await supabase.from("answer_evaluations").upsert({
          answer_id: evalItem.answer_id,
          relevance_rating: evalItem.relevance_rating,
          clarity_rating: evalItem.clarity_rating,
          depth_rating: evalItem.depth_rating,
          feedback_text: evalItem.feedback_text,
        }, { onConflict: "answer_id" });
      }

      // Save session evaluation
      await supabase.from("session_evaluations").upsert({
        session_id: session.id,
        strengths: data.strengths,
        gaps: data.gaps,
        improvement_tips: data.improvement_tips,
        summary_message: data.summary_message,
      }, { onConflict: "session_id" });

      // Update local state
      const updatedAnswers = answers.map(answer => {
        const evaluation = data.answer_evaluations.find((e: any) => e.answer_id === answer.id);
        return {
          ...answer,
          evaluation: evaluation ? {
            relevance_rating: evaluation.relevance_rating,
            clarity_rating: evaluation.clarity_rating,
            depth_rating: evaluation.depth_rating,
            feedback_text: evaluation.feedback_text,
          } : answer.evaluation,
        };
      });

      setAnswers(updatedAnswers);
      setSessionEvaluation({
        strengths: data.strengths,
        gaps: data.gaps,
        improvement_tips: data.improvement_tips,
        summary_message: data.summary_message,
      });
      setHasExistingEvaluation(true);

      toast.success("Evaluation complete!");
    } catch (error) {
      console.error("Error running evaluation:", error);
      toast.error("Failed to evaluate interview. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionNumber)) {
        next.delete(questionNumber);
      } else {
        next.add(questionNumber);
      }
      return next;
    });
  };

  const RatingBadge = ({ rating }: { rating: string }) => {
    const config = ratingConfig[rating] || ratingConfig["Average"];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="h-3 w-3" />
        {rating}
      </span>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "candidate") {
    return null;
  }

  if (!session) {
    return (
      <div className="container py-8 max-w-2xl text-center">
        <p className="text-muted-foreground">No interview session found.</p>
        <Button asChild className="mt-4">
          <Link to="/mock-interview">Go to Mock Interview</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link 
        to="/candidate-dashboard" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Evaluation</h1>
        <p className="text-muted-foreground">
          Review your performance and discover areas for improvement.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="capitalize">
            {session.interview_type} Interview
          </Badge>
          <Badge variant="outline" className="capitalize">
            {session.role_level} Level
          </Badge>
          <Badge variant="outline">
            {session.total_questions} Questions
          </Badge>
        </div>
      </div>

      {/* Evaluation Trigger */}
      {!hasExistingEvaluation && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="py-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium mb-2">Ready for Feedback?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Get constructive feedback on each of your answers to help you improve.
            </p>
            <Button
              onClick={runEvaluation}
              disabled={isEvaluating}
              className="gradient-primary border-0 shadow-glow"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Evaluation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      {sessionEvaluation && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Encouraging Summary */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm leading-relaxed">{sessionEvaluation.summary_message}</p>
            </div>

            {/* Strengths */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {sessionEvaluation.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-2">
                {sessionEvaluation.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Tips */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Lightbulb className="h-4 w-4" />
                Actionable Tips
              </h4>
              <ul className="space-y-2">
                {sessionEvaluation.improvement_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-medium text-blue-600 dark:text-blue-400 shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Re-evaluate button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={runEvaluation}
                disabled={isEvaluating}
              >
                {isEvaluating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Re-evaluate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question-by-Question View */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Your Answers
        </h2>

        {answers.map((answer) => (
          <Collapsible
            key={answer.id}
            open={expandedQuestions.has(answer.question_number)}
            onOpenChange={() => toggleQuestion(answer.question_number)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {answer.question_number}
                      </span>
                      <CardTitle className="text-base line-clamp-1 text-left">
                        {answer.question_text}
                      </CardTitle>
                    </div>
                    {expandedQuestions.has(answer.question_number) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {answer.evaluation && !expandedQuestions.has(answer.question_number) && (
                    <div className="flex gap-2 mt-2 ml-11">
                      <RatingBadge rating={answer.evaluation.relevance_rating} />
                      <RatingBadge rating={answer.evaluation.clarity_rating} />
                      <RatingBadge rating={answer.evaluation.depth_rating} />
                    </div>
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {/* Question */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Question</h4>
                    <p className="text-sm leading-relaxed">{answer.question_text}</p>
                  </div>

                  {/* Answer */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Answer</h4>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm leading-relaxed">
                      {answer.answer_text || <span className="text-muted-foreground italic">No answer provided</span>}
                    </div>
                  </div>

                  {/* Evaluation */}
                  {answer.evaluation && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Evaluation</h4>
                      
                      {/* Ratings */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Relevance</span>
                          <RatingBadge rating={answer.evaluation.relevance_rating} />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Clarity</span>
                          <RatingBadge rating={answer.evaluation.clarity_rating} />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Depth</span>
                          <RatingBadge rating={answer.evaluation.depth_rating} />
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                          {answer.evaluation.feedback_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {!answer.evaluation && !isEvaluating && (
                    <p className="text-sm text-muted-foreground italic">
                      Click "Generate Evaluation" above to get feedback on this answer.
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button asChild className="gradient-primary border-0 shadow-glow">
          <Link to="/mock-interview">Practice Another Interview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/candidate-dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Encouragement Footer */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        🌟 Every evaluation is a stepping stone to becoming a better interviewer. Keep practicing!
      </p>
    </div>
  );
}
