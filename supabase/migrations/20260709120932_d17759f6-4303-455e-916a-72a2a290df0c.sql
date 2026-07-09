CREATE OR REPLACE FUNCTION public.get_blog_view_counts()
RETURNS TABLE(path text, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT path, count(*)::bigint AS views
  FROM public.page_views
  WHERE path LIKE '/blog/%'
  GROUP BY path;
$$;

GRANT EXECUTE ON FUNCTION public.get_blog_view_counts() TO anon, authenticated;