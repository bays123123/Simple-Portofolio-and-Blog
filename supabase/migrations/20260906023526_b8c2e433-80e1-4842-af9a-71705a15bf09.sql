CREATE TABLE public.indexnow_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  status integer NOT NULL DEFAULT 202,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.indexnow_submissions TO service_role;

ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages indexnow submissions"
ON public.indexnow_submissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);