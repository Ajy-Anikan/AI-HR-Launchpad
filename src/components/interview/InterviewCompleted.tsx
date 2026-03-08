import { Link } from "react-router-dom";
import { CheckCircle2, Play, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { interviewTypeLabels, type InterviewType, type InterviewMode } from "./InterviewSetup";

interface Answer {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

interface InterviewCompletedProps {
  interviewType: InterviewType;
  interviewMode: InterviewMode;
  roleLevel: string;
  totalQuestions: number;
  answers: Answer[];
  sessionId: string;
  startedAt: Date | null;
  onReset: () => void;
}

export function InterviewCompleted({
  interviewType,
  interviewMode,
  roleLevel,
  totalQuestions,
  answers,
  sessionId,
  startedAt,
  onReset,
}: InterviewCompletedProps) {
  const elapsedMinutes = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 60000) : null;

  return (
    <div className="container py-8 max-w-2xl">
      <Card className="text-center">
        <CardContent className="py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Mock Interview Completed!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Great effort. Review your answers and feedback to continue improving.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Session Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{interviewTypeLabels[interviewType].label}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mode:</span>
                <span className="ml-2 font-medium capitalize">{interviewMode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className="ml-2 font-medium capitalize">{roleLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Questions:</span>
                <span className="ml-2 font-medium">{totalQuestions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Answered:</span>
                <span className="ml-2 font-medium">{answers.filter((a) => a.answerText.trim()).length}</span>
              </div>
              {elapsedMinutes !== null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-1 font-medium">
                    {elapsedMinutes < 1 ? "< 1 min" : `${elapsedMinutes} min`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gradient-primary border-0 shadow-glow">
              <Link to={`/interview-evaluation?session=${sessionId}`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Feedback
              </Link>
            </Button>
            <Button onClick={onReset} variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Start Another Interview
            </Button>
            <Button asChild variant="ghost">
              <Link to="/candidate-dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-8">
        🌟 Every practice session brings you closer to your goals. Keep going!
      </p>
    </div>
  );
}
