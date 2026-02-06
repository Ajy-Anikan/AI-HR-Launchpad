
-- Create interview_schedules table
CREATE TABLE public.interview_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  hr_user_id UUID NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'hr')),
  interview_mode TEXT NOT NULL CHECK (interview_mode IN ('online', 'in_person')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  hr_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- HR can do everything on their own interviews
CREATE POLICY "HR can create interview schedules"
ON public.interview_schedules
FOR INSERT
TO authenticated
WITH CHECK (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can view all interview schedules"
ON public.interview_schedules
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can update their own interview schedules"
ON public.interview_schedules
FOR UPDATE
TO authenticated
USING (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can delete their own interview schedules"
ON public.interview_schedules
FOR DELETE
TO authenticated
USING (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'));

-- Candidates can view their own scheduled interviews (but NOT hr_notes - handled in app layer)
CREATE POLICY "Candidates can view their own interviews"
ON public.interview_schedules
FOR SELECT
TO authenticated
USING (candidate_id = auth.uid() AND has_role(auth.uid(), 'candidate'));

-- Trigger for updated_at
CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON public.interview_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
