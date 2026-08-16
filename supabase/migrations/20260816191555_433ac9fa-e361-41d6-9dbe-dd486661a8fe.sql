CREATE TABLE public.post_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  lang text NOT NULL,
  title text,
  excerpt text,
  content text,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, lang)
);

GRANT SELECT ON public.post_translations TO anon;
GRANT SELECT ON public.post_translations TO authenticated;
GRANT ALL ON public.post_translations TO service_role;

ALTER TABLE public.post_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post translations"
ON public.post_translations FOR SELECT
USING (true);

CREATE TRIGGER update_post_translations_updated_at
BEFORE UPDATE ON public.post_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();