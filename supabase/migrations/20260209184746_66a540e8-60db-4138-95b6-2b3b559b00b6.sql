
-- Table for session-level company prep evaluation
CREATE TABLE public.company_prep_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE REFERENCES public.company_practice_sessions(id) ON DELETE CASCADE,
  strengths TEXT[] DEFAULT '{}',
  gaps TEXT[] DEFAULT '{}',
  improvement_tips TEXT[] DEFAULT '{}',
  summary_message TEXT NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for per-answer evaluation feedback
CREATE TABLE public.company_prep_answer_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL UNIQUE REFERENCES public.company_practice_answers(id) ON DELETE CASCADE,
  relevance_rating TEXT NOT NULL,
  clarity_rating TEXT NOT NULL,
  depth_rating TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_prep_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prep_answer_evaluations ENABLE ROW LEVEL SECURITY;

-- Candidate-only SELECT on session evaluations (via session ownership)
CREATE POLICY "Candidates can view their own company prep evaluations"
ON public.company_prep_evaluations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_practice_sessions s
    WHERE s.id = company_prep_evaluations.session_id
    AND s.user_id = auth.uid()
  )
);

-- Service role / edge function inserts (no user INSERT needed)
CREATE POLICY "Service role can insert company prep evaluations"
ON public.company_prep_evaluations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_practice_sessions s
    WHERE s.id = company_prep_evaluations.session_id
    AND s.user_id = auth.uid()
  )
);

-- Candidate-only SELECT on answer evaluations (via answer -> session ownership)
CREATE POLICY "Candidates can view their own answer evaluations"
ON public.company_prep_answer_evaluations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_practice_answers a
    JOIN public.company_practice_sessions s ON s.id = a.session_id
    WHERE a.id = company_prep_answer_evaluations.answer_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert answer evaluations"
ON public.company_prep_answer_evaluations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_practice_answers a
    JOIN public.company_practice_sessions s ON s.id = a.session_id
    WHERE a.id = company_prep_answer_evaluations.answer_id
    AND s.user_id = auth.uid()
  )
);
