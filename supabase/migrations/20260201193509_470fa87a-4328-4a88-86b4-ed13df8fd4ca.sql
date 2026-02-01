-- Create table for storing answer-level evaluations
CREATE TABLE public.answer_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.mock_interview_answers(id) ON DELETE CASCADE,
  relevance_rating TEXT NOT NULL CHECK (relevance_rating IN ('Strong', 'Average', 'Needs Improvement')),
  clarity_rating TEXT NOT NULL CHECK (clarity_rating IN ('Strong', 'Average', 'Needs Improvement')),
  depth_rating TEXT NOT NULL CHECK (depth_rating IN ('Strong', 'Average', 'Needs Improvement')),
  feedback_text TEXT NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(answer_id)
);

-- Create table for storing session-level evaluation summaries
CREATE TABLE public.session_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  gaps TEXT[] NOT NULL DEFAULT '{}',
  improvement_tips TEXT[] NOT NULL DEFAULT '{}',
  summary_message TEXT NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.answer_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies for answer_evaluations (candidates can only view evaluations for their own answers)
CREATE POLICY "Candidates can view their own answer evaluations"
ON public.answer_evaluations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mock_interview_answers a
    JOIN public.mock_interview_sessions s ON a.session_id = s.id
    WHERE a.id = answer_evaluations.answer_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert answer evaluations"
ON public.answer_evaluations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mock_interview_answers a
    JOIN public.mock_interview_sessions s ON a.session_id = s.id
    WHERE a.id = answer_evaluations.answer_id
    AND s.user_id = auth.uid()
  )
);

-- RLS policies for session_evaluations (candidates can only view their own session evaluations)
CREATE POLICY "Candidates can view their own session evaluations"
ON public.session_evaluations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mock_interview_sessions s
    WHERE s.id = session_evaluations.session_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert session evaluations"
ON public.session_evaluations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mock_interview_sessions s
    WHERE s.id = session_evaluations.session_id
    AND s.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_answer_evaluations_answer ON public.answer_evaluations(answer_id);
CREATE INDEX idx_session_evaluations_session ON public.session_evaluations(session_id);