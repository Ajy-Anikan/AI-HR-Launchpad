-- Create company practice sessions table
CREATE TABLE public.company_practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company TEXT NOT NULL,
  question_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  practice_year INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_questions INTEGER NOT NULL DEFAULT 5,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create company practice answers table
CREATE TABLE public.company_practice_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.company_practice_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_practice_answers ENABLE ROW LEVEL SECURITY;

-- RLS: Only candidates can access their own practice sessions (explicitly block HR)
CREATE POLICY "Candidates can view their own practice sessions"
ON public.company_practice_sessions
FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.get_user_role(auth.uid()) = 'candidate'
);

CREATE POLICY "Candidates can create their own practice sessions"
ON public.company_practice_sessions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.get_user_role(auth.uid()) = 'candidate'
);

CREATE POLICY "Candidates can update their own practice sessions"
ON public.company_practice_sessions
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.get_user_role(auth.uid()) = 'candidate'
);

-- RLS for answers: Only candidates can access answers for their own sessions
CREATE POLICY "Candidates can view their own practice answers"
ON public.company_practice_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_practice_sessions s
    WHERE s.id = session_id
    AND s.user_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'candidate'
  )
);

CREATE POLICY "Candidates can create answers for their own sessions"
ON public.company_practice_answers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_practice_sessions s
    WHERE s.id = session_id
    AND s.user_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'candidate'
  )
);

CREATE POLICY "Candidates can update their own practice answers"
ON public.company_practice_answers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_practice_sessions s
    WHERE s.id = session_id
    AND s.user_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'candidate'
  )
);

-- Indexes for performance
CREATE INDEX idx_company_practice_sessions_user_id ON public.company_practice_sessions(user_id);
CREATE INDEX idx_company_practice_answers_session_id ON public.company_practice_answers(session_id);