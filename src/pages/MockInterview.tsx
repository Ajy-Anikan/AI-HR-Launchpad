import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  BrainCircuit, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type InterviewType = "technical" | "behavioral" | "hr";
type RoleLevel = "fresher" | "junior" | "mid";
type InterviewStage = "setup" | "interview" | "completed";

interface Answer {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

const interviewTypeLabels: Record<InterviewType, { label: string; icon: string; description: string }> = {
  technical: { 
    label: "Technical", 
    icon: "💻", 
    description: "Coding, system design, and technical problem-solving" 
  },
  behavioral: { 
    label: "Behavioral", 
    icon: "🎯", 
    description: "STAR method and situational questions" 
  },
  hr: { 
    label: "HR", 
    icon: "👋", 
    description: "General questions and initial screening" 
  },
};

const roleLevelLabels: Record<RoleLevel, string> = {
  fresher: "Fresher (0-1 years)",
  junior: "Junior (1-3 years)",
  mid: "Mid-Level (3-5 years)",
};

export default function MockInterview() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  // Setup state
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [roleLevel, setRoleLevel] = useState<RoleLevel | null>(null);
  
  // Interview state
  const [stage, setStage] = useState<InterviewStage>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(5);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Candidate data
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number | null>(null);

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

  // Fetch candidate data
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

    if (user) {
      fetchCandidateData();
    }
  }, [user]);

  const startInterview = async () => {
    if (!interviewType || !roleLevel || !user) return;

    setIsLoading(true);
    try {
      // Create session
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
      
      // Generate first question
      await generateQuestion(1, []);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestion = async (questionNumber: number, previousQuestions: string[]) => {
    if (!interviewType || !roleLevel) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-interview-question", {
        body: {
          interview_type: interviewType,
          role_level: roleLevel,
          skills: candidateSkills,
          experience_years: experienceYears,
          question_number: questionNumber,
          total_questions: totalQuestions,
          previous_questions: previousQuestions,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setQuestionText(data.question);
      setCurrentQuestion(questionNumber);

      // Save question to database
      if (sessionId) {
        await supabase.from("mock_interview_answers").insert({
          session_id: sessionId,
          question_number: questionNumber,
          question_text: data.question,
        });
      }
    } catch (error) {
      console.error("Error generating question:", error);
      toast.error("Failed to generate question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim() || !sessionId) return;

    setIsSubmitting(true);
    try {
      // Update answer in database
      await supabase
        .from("mock_interview_answers")
        .update({
          answer_text: answerText,
          answered_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("question_number", currentQuestion);

      // Save to local state
      const newAnswer: Answer = {
        questionNumber: currentQuestion,
        questionText,
        answerText,
      };
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);
      setAnswerText("");

      if (currentQuestion >= totalQuestions) {
        // Complete the interview
        await supabase
          .from("mock_interview_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        setStage("completed");
      } else {
        // Generate next question
        const previousQuestions = updatedAnswers.map((a) => a.questionText);
        await generateQuestion(currentQuestion + 1, previousQuestions);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInterview = () => {
    setStage("setup");
    setInterviewType(null);
    setRoleLevel(null);
    setSessionId(null);
    setCurrentQuestion(1);
    setQuestionText("");
    setAnswerText("");
    setAnswers([]);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "candidate") {
    return null;
  }

  // Setup Stage
  if (stage === "setup") {
    return (
      <div className="container py-8 max-w-2xl">
        <Link 
          to="/candidate-dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
            <BrainCircuit className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Mock Interview</h1>
          <p className="text-muted-foreground">
            Practice interview questions in a calm, supportive environment. This is for learning, not hiring.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interview Setup</CardTitle>
            <CardDescription>Choose your interview type and role level to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Interview Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Interview Type</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {(Object.keys(interviewTypeLabels) as InterviewType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setInterviewType(type)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      interviewType === type
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl block mb-2">{interviewTypeLabels[type].icon}</span>
                    <span className="font-medium block">{interviewTypeLabels[type].label}</span>
                    <span className="text-xs text-muted-foreground">
                      {interviewTypeLabels[type].description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Level Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Role Level</label>
              <Select value={roleLevel || ""} onValueChange={(v) => setRoleLevel(v as RoleLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLevelLabels) as RoleLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      {roleLevelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Preview */}
            {candidateSkills.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Your Skills (from resume)</p>
                <div className="flex flex-wrap gap-2">
                  {candidateSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {skill}
                    </span>
                  ))}
                  {candidateSkills.length > 8 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                      +{candidateSkills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={startInterview}
              disabled={!interviewType || !roleLevel || isLoading}
              className="w-full gradient-primary border-0 shadow-glow"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interview Stage
  if (stage === "interview") {
    const progress = ((currentQuestion - 1) / totalQuestions) * 100;

    return (
      <div className="container py-8 max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              {interviewTypeLabels[interviewType!].label} Interview
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

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
            <CardTitle className="text-base">Your Answer</CardTitle>
            <CardDescription>
              Take your time. There's no rush—this is practice.
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
                onClick={submitAnswer}
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

        {/* Encouragement */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          💡 Remember: This is a safe space to practice. Focus on expressing your thoughts clearly.
        </p>
      </div>
    );
  }

  // Completed Stage
  return (
    <div className="container py-8 max-w-2xl">
      <Card className="text-center">
        <CardContent className="py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Mock Interview Completed!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Great job completing your practice interview! Your responses have been saved for future review.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Session Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{interviewTypeLabels[interviewType!].label}</span>
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
                <span className="ml-2 font-medium">{answers.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gradient-primary border-0 shadow-glow">
              <Link to={`/interview-evaluation?session=${sessionId}`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Feedback
              </Link>
            </Button>
            <Button onClick={resetInterview} variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Start Another Interview
            </Button>
            <Button asChild variant="ghost">
              <Link to="/candidate-dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Encouragement Footer */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        🌟 Every practice session brings you closer to your goals. Keep going!
      </p>
    </div>
  );
}
