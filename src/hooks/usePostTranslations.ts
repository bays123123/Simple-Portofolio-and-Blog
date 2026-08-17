import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

export type PostTranslation = {
  title: string;
  excerpt: string;
  content: string | null;
};

/**
 * Fetches (and lazily generates) English translations for the given posts.
 * Results are cached server-side in `post_translations`, so repeat visits are instant.
 */
export const usePostTranslations = (
  postIds: string[],
  lang: Lang,
  includeContent = false,
) => {
  const ids = [...postIds].filter(Boolean).sort();

  return useQuery({
    queryKey: ["post-translations", lang, includeContent, ids.join(",")],
    enabled: lang !== "id" && ids.length > 0,
    staleTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("translate-posts", {
        body: { postIds: ids, lang, includeContent },
      });
      if (error) throw error;
      return (data?.translations ?? {}) as Record<string, PostTranslation>;
    },
  });
};
