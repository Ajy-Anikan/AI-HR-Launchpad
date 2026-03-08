
-- Pipeline stages table to track candidate hiring stage
CREATE TABLE public.pipeline_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  hr_user_id uuid NOT NULL,
  stage text NOT NULL DEFAULT 'applied',
  moved_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_candidates ENABLE ROW LEVEL SECURITY;

-- HR can manage pipeline entries
CREATE POLICY "HR can view pipeline candidates"
  ON public.pipeline_candidates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can insert pipeline candidates"
  ON public.pipeline_candidates FOR INSERT
  TO authenticated
  WITH CHECK (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can update pipeline candidates"
  ON public.pipeline_candidates FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can delete pipeline candidates"
  ON public.pipeline_candidates FOR DELETE
  TO authenticated
  USING (hr_user_id = auth.uid() AND has_role(auth.uid(), 'hr'));

-- Unique constraint: one entry per candidate per HR user
CREATE UNIQUE INDEX idx_pipeline_candidate_hr ON public.pipeline_candidates (candidate_id, hr_user_id);
