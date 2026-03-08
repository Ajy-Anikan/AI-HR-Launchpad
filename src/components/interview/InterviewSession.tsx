import { useCallback } from "react";
import { ArrowRight, CheckCircle2, Loader2, MessageSquare, Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { InterviewTimer } from "./InterviewTimer";
import VoiceRecorder from "./VoiceRecorder";
import { interviewTypeLabels, type InterviewType, type InterviewMode, type InputMode, TIMER_SECONDS } from "./InterviewSetup";

interface InterviewSessionProps {
  interviewType: InterviewType;
  interviewMode: InterviewMode;
  inputMode: InputMode;
  currentQuestion: number;
  totalQuestions: number;
  questionText: string;
  answerText: string;
  setAnswerText: (text: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  timerKey: number;
}

export function InterviewSession({
  interviewType,
  interviewMode,
  inputMode,
  currentQuestion,
  totalQuestions,
  questionText,
  answerText,
  setAnswerText,
  isLoading,
  isSubmitting,
  onSubmit,
  timerKey,
}: InterviewSessionProps) {
  const progress = ((currentQuestion - 1) / totalQuestions) * 100;

  const handleTimeUp = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="container py-8 max-w-2xl">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-sm text-muted-foreground">
            {interviewTypeLabels[interviewType].label} Interview
            {interviewMode === "simulation" && " • Simulation"}
            {inputMode === "voice" && " • 🎙️ Voice"}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Timer for simulation mode */}
      {interviewMode === "simulation" && !isLoading && (
        <div className="mb-6">
          <InterviewTimer
            key={timerKey}
            totalSeconds={TIMER_SECONDS[interviewType]}
            isActive={!isLoading && !isSubmitting}
            onTimeUp={handleTimeUp}
          />
        </div>
      )}

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Interview Question</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Generating question...</span>
            </div>
          ) : (
            <p className="text-lg leading-relaxed">{questionText}</p>
          )}
        </CardContent>
      </Card>

      {/* Answer Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {inputMode === "voice" && <Mic className="h-4 w-4 text-primary" />}
            Your Answer
          </CardTitle>
          <CardDescription>
            {inputMode === "voice"
              ? "Speak your answer clearly. Your voice will be transcribed in real-time."
              : interviewMode === "simulation"
              ? "Answer within the time limit. The interview will auto-advance when time expires."
              : "Take your time. There's no rush—this is practice."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none"
            disabled={isLoading || isSubmitting}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {answerText.length > 0 ? `${answerText.split(/\s+/).filter(Boolean).length} words` : ""}
            </span>
            <Button
              onClick={onSubmit}
              disabled={!answerText.trim() || isLoading || isSubmitting}
              className="gradient-primary border-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestion >= totalQuestions ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Interview
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Next Question
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {interviewMode === "simulation"
          ? "⏱ Simulation mode — answer before time runs out!"
          : "💡 Remember: This is a safe space to practice. Focus on expressing your thoughts clearly."}
      </p>
    </div>
  );
}
