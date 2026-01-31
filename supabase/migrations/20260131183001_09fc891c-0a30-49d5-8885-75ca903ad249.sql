-- Create skill_progress table for tracking candidate improvement over time
CREATE TABLE public.skill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  communication_score INTEGER NOT NULL CHECK (communication_score >= 0 AND communication_score <= 100),
  consistency_score INTEGER CHECK (consistency_score >= 0 AND consistency_score <= 100),
  overall_progress_score INTEGER NOT NULL CHECK (overall_progress_score >= 0 AND overall_progress_score <= 100),
  source TEXT NOT NULL DEFAULT 'manual', -- 'resume_update', 'mock_interview', 'practice_session', 'manual'
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;

-- Candidates can only view their own progress
CREATE POLICY "Candidates can view their own skill progress"
ON public.skill_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Candidates can insert their own progress entries
CREATE POLICY "Candidates can insert their own skill progress"
ON public.skill_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own progress entries
CREATE POLICY "Candidates can update their own skill progress"
ON public.skill_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries by user and date
CREATE INDEX idx_skill_progress_user_date ON public.skill_progress(user_id, recorded_at DESC);