ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts (category);
CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON public.blog_posts USING gin (tags);