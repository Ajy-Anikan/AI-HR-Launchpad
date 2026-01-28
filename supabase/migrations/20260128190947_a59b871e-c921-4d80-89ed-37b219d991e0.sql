-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow HR users to view all resumes
CREATE POLICY "HR can view all resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'hr'
));

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parsed_data JSONB,
  skills TEXT[],
  experience_years INTEGER,
  education TEXT,
  summary TEXT
);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own resumes
CREATE POLICY "Candidates can view their own resumes"
ON public.resumes FOR SELECT
USING (auth.uid() = user_id);

-- Candidates can insert their own resumes
CREATE POLICY "Candidates can insert their own resumes"
ON public.resumes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own resumes
CREATE POLICY "Candidates can update their own resumes"
ON public.resumes FOR UPDATE
USING (auth.uid() = user_id);

-- HR can view all resumes
CREATE POLICY "HR can view all resumes"
ON public.resumes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'hr'
));

-- Create job_requirements table for matching
CREATE TABLE public.job_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[] NOT NULL,
  min_experience_years INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on job_requirements
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;

-- HR can manage job requirements
CREATE POLICY "HR can manage job requirements"
ON public.job_requirements FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'hr'
));

-- Everyone can view active job requirements
CREATE POLICY "Everyone can view active jobs"
ON public.job_requirements FOR SELECT
USING (is_active = true);

-- Create screening_results table
CREATE TABLE public.screening_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  matched_skills TEXT[],
  missing_skills TEXT[],
  analysis TEXT,
  screened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resume_id, job_id)
);

-- Enable RLS on screening_results
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own screening results
CREATE POLICY "Candidates can view their own screening results"
ON public.screening_results FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = screening_results.resume_id 
  AND resumes.user_id = auth.uid()
));

-- HR can view and manage all screening results
CREATE POLICY "HR can manage screening results"
ON public.screening_results FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'hr'
));