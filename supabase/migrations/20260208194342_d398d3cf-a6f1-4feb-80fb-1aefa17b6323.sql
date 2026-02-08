
-- Create interview_feedback table
CREATE TABLE public.interview_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL,
  hr_user_id UUID NOT NULL,
  overall_impression TEXT NOT NULL,
  technical_assessment TEXT NOT NULL CHECK (technical_assessment IN ('good', 'average', 'needs_improvement')),
  communication_assessment TEXT NOT NULL CHECK (communication_assessment IN ('good', 'average', 'needs_improvement')),
  cultural_fit_assessment TEXT NOT NULL CHECK (cultural_fit_assessment IN ('good', 'average', 'needs_improvement')),
  key_strengths TEXT,
  key_concerns TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('proceed', 'hold', 'do_not_proceed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interview_id)
);

-- Enable RLS
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- HR can view all feedback
CREATE POLICY "HR can view all interview feedback"
  ON public.interview_feedback
  FOR SELECT
  USING (has_role(auth.uid(), 'hr'::app_role));

-- HR can create feedback
CREATE POLICY "HR can create interview feedback"
  ON public.interview_feedback
  FOR INSERT
  WITH CHECK (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'::app_role));

-- HR can update their own feedback
CREATE POLICY "HR can update their own feedback"
  ON public.interview_feedback
  FOR UPDATE
  USING (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'::app_role));

-- HR can delete their own feedback
CREATE POLICY "HR can delete their own feedback"
  ON public.interview_feedback
  FOR DELETE
  USING (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'::app_role));

-- Candidates should NOT see feedback at all (no SELECT policy for candidates)

-- Trigger for updated_at
CREATE TRIGGER update_interview_feedback_updated_at
  BEFORE UPDATE ON public.interview_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
