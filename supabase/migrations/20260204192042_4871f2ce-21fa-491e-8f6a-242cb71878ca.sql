-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for HR private notes about candidates
CREATE TABLE public.hr_candidate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hr_user_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint so one HR user can have one note per candidate
ALTER TABLE public.hr_candidate_notes 
ADD CONSTRAINT hr_candidate_notes_unique UNIQUE (hr_user_id, candidate_id);

-- Enable RLS
ALTER TABLE public.hr_candidate_notes ENABLE ROW LEVEL SECURITY;

-- HR users can only view their own notes
CREATE POLICY "HR users can view their own notes"
ON public.hr_candidate_notes
FOR SELECT
TO authenticated
USING (
  hr_user_id = auth.uid() 
  AND public.has_role(auth.uid(), 'hr')
);

-- HR users can create their own notes
CREATE POLICY "HR users can create their own notes"
ON public.hr_candidate_notes
FOR INSERT
TO authenticated
WITH CHECK (
  hr_user_id = auth.uid() 
  AND public.has_role(auth.uid(), 'hr')
);

-- HR users can update their own notes
CREATE POLICY "HR users can update their own notes"
ON public.hr_candidate_notes
FOR UPDATE
TO authenticated
USING (
  hr_user_id = auth.uid() 
  AND public.has_role(auth.uid(), 'hr')
);

-- HR users can delete their own notes
CREATE POLICY "HR users can delete their own notes"
ON public.hr_candidate_notes
FOR DELETE
TO authenticated
USING (
  hr_user_id = auth.uid() 
  AND public.has_role(auth.uid(), 'hr')
);

-- Create index for faster lookups
CREATE INDEX idx_hr_candidate_notes_lookup 
ON public.hr_candidate_notes(hr_user_id, candidate_id);

-- Create trigger for updated_at
CREATE TRIGGER update_hr_candidate_notes_updated_at
BEFORE UPDATE ON public.hr_candidate_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also need to add HR SELECT access to skill_progress for viewing trends
CREATE POLICY "HR can view candidate skill progress"
ON public.skill_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr'));

-- Add HR SELECT access to mock_interview_sessions for counting
CREATE POLICY "HR can view mock interview sessions"
ON public.mock_interview_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr'));

-- Add HR SELECT access to company_practice_sessions for counting
CREATE POLICY "HR can view company practice sessions"
ON public.company_practice_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr'));