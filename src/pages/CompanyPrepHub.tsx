import { useState, useEffect } from "react";
import { Building2, Search, Star, Users, MapPin, ChevronRight, ArrowLeft, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import CompanyPrepEvaluation from "@/components/candidate/CompanyPrepEvaluation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Stage = "selection" | "config" | "practice" | "completed";

interface Company {
  name: string;
  industry: string;
  employees: string;
  location: string;
  rating: number;
  category: "maang" | "other";
}

interface Question {
  question: string;
  context: string;
}

const companies: Company[] = [
  // MAANG
  { name: "Google", industry: "Technology", employees: "150,000+", location: "Mountain View, CA", rating: 4.5, category: "maang" },
  { name: "Amazon", industry: "E-commerce", employees: "1,500,000+", location: "Seattle, WA", rating: 3.9, category: "maang" },
  { name: "Apple", industry: "Technology", employees: "160,000+", location: "Cupertino, CA", rating: 4.3, category: "maang" },
  { name: "Netflix", industry: "Entertainment", employees: "12,000+", location: "Los Gatos, CA", rating: 4.2, category: "maang" },
  { name: "Meta", industry: "Social Media", employees: "70,000+", location: "Menlo Park, CA", rating: 4.1, category: "maang" },
  // Other Companies
  { name: "Microsoft", industry: "Technology", employees: "180,000+", location: "Redmond, WA", rating: 4.4, category: "other" },
  { name: "Adobe", industry: "Software", employees: "28,000+", location: "San Jose, CA", rating: 4.3, category: "other" },
  { name: "Infosys", industry: "IT Services", employees: "340,000+", location: "Bangalore, India", rating: 3.8, category: "other" },
  { name: "TCS", industry: "IT Services", employees: "600,000+", location: "Mumbai, India", rating: 3.7, category: "other" },
  { name: "Accenture", industry: "Consulting", employees: "700,000+", location: "Dublin, Ireland", rating: 4.0, category: "other" },
  { name: "Startups", industry: "Various", employees: "Variable", location: "Global", rating: 4.0, category: "other" },
];

const questionTypes = ["Coding", "Technical", "Behavioral", "HR"];
const difficulties = ["Easy", "Medium", "Hard"];
const years = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"];

export default function CompanyPrepHub() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  
  const [stage, setStage] = useState<Stage>("selection");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [questionType, setQuestionType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [year, setYear] = useState("");
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check access control
  if (role === "hr") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Restricted</CardTitle>
            <CardDescription>
              The Company Prep Hub is exclusively for candidates to practice interview questions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maangCompanies = filteredCompanies.filter(c => c.category === "maang");
  const otherCompanies = filteredCompanies.filter(c => c.category === "other");

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setStage("config");
  };

  const handleStartPractice = async () => {
    if (!selectedCompany || !questionType || !difficulty || !user) {
      toast({
        title: "Missing Selection",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create practice session
      const { data: session, error: sessionError } = await supabase
        .from("company_practice_sessions")
        .insert({
          user_id: user.id,
          company: selectedCompany.name,
          question_type: questionType,
          difficulty: difficulty,
          practice_year: year ? parseInt(year) : null,
          status: "in_progress",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);

      // Generate questions via edge function
      const { data: questionData, error: questionError } = await supabase.functions.invoke(
        "generate-company-question",
        {
          body: {
            company: selectedCompany.name,
            questionType,
            difficulty,
            year: year || null,
          },
        }
      );

      if (questionError) throw questionError;

      if (!questionData?.questions || questionData.questions.length === 0) {
        throw new Error("No questions generated");
      }

      // Save questions to database
      const questionsToInsert = questionData.questions.map((q: Question, index: number) => ({
        session_id: session.id,
        question_number: index + 1,
        question_text: q.question,
      }));

      const { error: insertError } = await supabase
        .from("company_practice_answers")
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      // Update session with total questions
      await supabase
        .from("company_practice_sessions")
        .update({ total_questions: questionData.questions.length })
        .eq("id", session.id);

      setQuestions(questionData.questions);
      setAnswers(new Array(questionData.questions.length).fill(""));
      setCurrentQuestionIndex(0);
      setStage("practice");

    } catch (error) {
      console.error("Error starting practice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start practice session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !answers[currentQuestionIndex].trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save answer to database
      const { error } = await supabase
        .from("company_practice_answers")
        .update({
          answer_text: answers[currentQuestionIndex],
          answered_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("question_number", currentQuestionIndex + 1);

      if (error) throw error;

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Complete session
        await supabase
          .from("company_practice_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        setStage("completed");
      }

    } catch (error) {
      console.error("Error saving answer:", error);
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStage("selection");
    setSelectedCompany(null);
    setQuestionType("");
    setDifficulty("");
    setYear("");
    setSessionId(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
  };

  // Selection Stage
  if (stage === "selection") {
    return (
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Company Prep Hub</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Practice company-specific interview questions to boost your preparation and confidence.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies..."
              className="pl-12 h-14 text-lg rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* MAANG Companies */}
        {maangCompanies.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5">
                <Sparkles className="h-3 w-3 mr-1" />
                MAANG
              </Badge>
              <h2 className="text-xl font-semibold">Top Tech Companies</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {maangCompanies.map((company) => (
                <Card 
                  key={company.name} 
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleCompanySelect(company)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{company.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="mt-4">{company.name}</CardTitle>
                    <CardDescription>{company.industry}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {company.employees}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4 group">
                      Start Practice
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Companies */}
        {otherCompanies.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Other Companies</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCompanies.map((company) => (
                <Card 
                  key={company.name} 
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleCompanySelect(company)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center font-bold text-lg">
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{company.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="mt-4">{company.name}</CardTitle>
                    <CardDescription>{company.industry}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {company.employees}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4 group">
                      Start Practice
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Configuration Stage
  if (stage === "config" && selectedCompany) {
    return (
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => setStage("selection")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">
              {selectedCompany.name.charAt(0)}
            </div>
            <CardTitle className="text-2xl">{selectedCompany.name}</CardTitle>
            <CardDescription>Configure your practice session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Type *</label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty *</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year (Optional)</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any year</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleStartPractice}
              disabled={!questionType || !difficulty || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Practice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Practice Stage
  if (stage === "practice" && questions.length > 0) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Practice
          </Button>
          <Badge variant="outline" className="text-sm">
            {selectedCompany?.name} • {questionType}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="font-medium">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{difficulty}</Badge>
              <Badge variant="outline">{questionType}</Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
            {currentQuestion.context && (
              <CardDescription className="mt-2 italic">
                💡 {currentQuestion.context}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your answer here... Take your time and be thorough."
              className="min-h-[200px] text-base"
              value={answers[currentQuestionIndex]}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button 
          className="w-full h-12 text-lg" 
          onClick={handleSubmitAnswer}
          disabled={!answers[currentQuestionIndex].trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : currentQuestionIndex < questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          ) : (
            <>
              Complete Practice
              <CheckCircle2 className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    );
  }

  // Completed Stage
  if (stage === "completed") {
    return (
      <div className="container py-8 max-w-3xl">
        <Card className="text-center mb-8">
          <CardHeader>
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Practice Session Completed! 🎉</CardTitle>
            <CardDescription className="text-base mt-2">
              Great job completing your {selectedCompany?.name} practice session!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h3 className="font-medium mb-2">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <p className="font-medium">{selectedCompany?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Question Type:</span>
                  <p className="font-medium">{questionType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Difficulty:</span>
                  <p className="font-medium">{difficulty}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Questions Answered:</span>
                  <p className="font-medium">{questions.length}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Practice Another Company
              </Button>
              <Button className="flex-1" onClick={() => {
                setStage("config");
                setQuestions([]);
                setAnswers([]);
                setCurrentQuestionIndex(0);
              }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Evaluation Section */}
        {sessionId && selectedCompany && (
          <CompanyPrepEvaluation
            sessionId={sessionId}
            company={selectedCompany.name}
            questionType={questionType}
            difficulty={difficulty}
            practiceYear={year}
            questions={questions}
            answers={answers}
          />
        )}
      </div>
    );
  }

  return null;
}
