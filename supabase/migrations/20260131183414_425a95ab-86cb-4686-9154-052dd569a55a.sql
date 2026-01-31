-- Create mock_interview_sessions table
CREATE TABLE public.mock_interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'hr')),
  role_level TEXT NOT NULL CHECK (role_level IN ('fresher', 'junior', 'mid')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER NOT NULL DEFAULT 5
);

-- Create mock_interview_answers table
CREATE TABLE public.mock_interview_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_answers ENABLE ROW LEVEL SECURITY;

-- Candidates can only view their own sessions
CREATE POLICY "Candidates can view their own mock interview sessions"
ON public.mock_interview_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Candidates can insert their own sessions
CREATE POLICY "Candidates can insert their own mock interview sessions"
ON public.mock_interview_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own sessions
CREATE POLICY "Candidates can update their own mock interview sessions"
ON public.mock_interview_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Candidates can view their own answers (via session ownership)
CREATE POLICY "Candidates can view their own mock interview answers"
ON public.mock_interview_answers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.mock_interview_sessions
  WHERE mock_interview_sessions.id = mock_interview_answers.session_id
  AND mock_interview_sessions.user_id = auth.uid()
));

-- Candidates can insert answers to their sessions
CREATE POLICY "Candidates can insert their own mock interview answers"
ON public.mock_interview_answers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mock_interview_sessions
  WHERE mock_interview_sessions.id = mock_interview_answers.session_id
  AND mock_interview_sessions.user_id = auth.uid()
));

-- Candidates can update their own answers
CREATE POLICY "Candidates can update their own mock interview answers"
ON public.mock_interview_answers
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.mock_interview_sessions
  WHERE mock_interview_sessions.id = mock_interview_answers.session_id
  AND mock_interview_sessions.user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_mock_sessions_user ON public.mock_interview_sessions(user_id, started_at DESC);
CREATE INDEX idx_mock_answers_session ON public.mock_interview_answers(session_id, question_number);