import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InterviewSetup, type InterviewType, type RoleLevel, type InterviewMode, type InputMode } from "@/components/interview/InterviewSetup";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { InterviewCompleted } from "@/components/interview/InterviewCompleted";

type InterviewStage = "setup" | "interview" | "completed";

interface Answer {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

export default function MockInterview() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [roleLevel, setRoleLevel] = useState<RoleLevel | null>(null);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("practice");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [stage, setStage] = useState<InterviewStage>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(5);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/login"); return; }
      if (role === "hr") { navigate("/hr-dashboard"); return; }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    const fetchCandidateData = async () => {
      if (!user) return;
      const { data: resume } = await supabase
        .from("resumes")
        .select("skills, experience_years")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (resume) {
        setCandidateSkills(resume.skills || []);
        setExperienceYears(resume.experience_years);
      }
    };
    if (user) fetchCandidateData();
  }, [user]);

  const generateQuestion = useCallback(async (
    questionNumber: number,
    previousQuestions: string[],
    sid: string,
    type: InterviewType,
    level: RoleLevel,
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-interview-question", {
        body: {
          interview_type: type,
          role_level: level,
          skills: candidateSkills,
          experience_years: experienceYears,
          question_number: questionNumber,
          total_questions: totalQuestions,
          previous_questions: previousQuestions,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQuestionText(data.question);
      setCurrentQuestion(questionNumber);
      setTimerKey((k) => k + 1);

      await supabase.from("mock_interview_answers").insert({
        session_id: sid,
        question_number: questionNumber,
        question_text: data.question,
      });
    } catch (error) {
      console.error("Error generating question:", error);
      toast.error("Failed to generate question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [candidateSkills, experienceYears, totalQuestions]);

  const startInterview = async () => {
    if (!interviewType || !roleLevel || !user) return;
    setIsLoading(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from("mock_interview_sessions")
        .insert({
          user_id: user.id,
          interview_type: interviewType,
          role_level: roleLevel,
          total_questions: totalQuestions,
        })
        .select()
        .single();
      if (sessionError) throw sessionError;

      setSessionId(session.id);
      setStage("interview");
      setStartedAt(new Date());
      await generateQuestion(1, [], session.id, interviewType, roleLevel);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = useCallback(async () => {
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const currentAnswerText = answerText.trim() || "(No answer — time expired)";

      await supabase
        .from("mock_interview_answers")
        .update({ answer_text: currentAnswerText, answered_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("question_number", currentQuestion);

      const newAnswer: Answer = {
        questionNumber: currentQuestion,
        questionText,
        answerText: currentAnswerText,
      };
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);
      setAnswerText("");

      if (currentQuestion >= totalQuestions) {
        await supabase
          .from("mock_interview_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", sessionId);
        setStage("completed");
      } else {
        const previousQuestions = updatedAnswers.map((a) => a.questionText);
        await generateQuestion(currentQuestion + 1, previousQuestions, sessionId, interviewType!, roleLevel!);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, isSubmitting, answerText, currentQuestion, questionText, answers, totalQuestions, interviewType, roleLevel, generateQuestion]);

  const resetInterview = () => {
    setStage("setup");
    setInterviewType(null);
    setRoleLevel(null);
    setInterviewMode("practice");
    setSessionId(null);
    setCurrentQuestion(1);
    setQuestionText("");
    setAnswerText("");
    setAnswers([]);
    setStartedAt(null);
    setTimerKey(0);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "candidate") return null;

  if (stage === "setup") {
    return (
      <InterviewSetup
        interviewType={interviewType}
        setInterviewType={setInterviewType}
        roleLevel={roleLevel}
        setRoleLevel={setRoleLevel}
        interviewMode={interviewMode}
        setInterviewMode={setInterviewMode}
        candidateSkills={candidateSkills}
        isLoading={isLoading}
        onStart={startInterview}
      />
    );
  }

  if (stage === "interview") {
    return (
      <InterviewSession
        interviewType={interviewType!}
        interviewMode={interviewMode}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        questionText={questionText}
        answerText={answerText}
        setAnswerText={setAnswerText}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onSubmit={submitAnswer}
        timerKey={timerKey}
      />
    );
  }

  return (
    <InterviewCompleted
      interviewType={interviewType!}
      interviewMode={interviewMode}
      roleLevel={roleLevel!}
      totalQuestions={totalQuestions}
      answers={answers}
      sessionId={sessionId!}
      startedAt={startedAt}
      onReset={resetInterview}
    />
  );
}
