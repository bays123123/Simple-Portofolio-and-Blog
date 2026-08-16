import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPPORTED = new Set(["en"]);

type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  updated_at: string;
};

type Translation = {
  post_id: string;
  lang: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  source_updated_at: string | null;
};

const LANG_NAME: Record<string, string> = { en: "English" };

async function translatePost(post: Post, lang: string, withContent: boolean, apiKey: string) {
  const target = LANG_NAME[lang] ?? lang;
  const payload = {
    title: post.title,
    excerpt: post.excerpt ?? "",
    ...(withContent ? { content: post.content ?? "" } : {}),
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            `You are a professional translator for a printing-technology blog. Translate the given JSON values into ${target}. ` +
            `Rules: keep Markdown structure, headings, lists, links, images, code blocks and line breaks EXACTLY as in the source; ` +
            `do not add or remove content; do not translate code, URLs or proper names; keep technical printing terms accurate. ` +
            `Reply with ONLY a JSON object using the same keys as the input.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI gateway ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = await res.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: { title?: string; excerpt?: string; content?: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Unable to parse translation output");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  return {
    title: parsed.title ?? post.title,
    excerpt: parsed.excerpt ?? post.excerpt ?? "",
    content: withContent ? parsed.content ?? post.content : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postIds, lang = "en", includeContent = false } = await req.json();

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return new Response(JSON.stringify({ error: "postIds is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SUPPORTED.has(lang)) {
      return new Response(JSON.stringify({ error: "Unsupported language" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = postIds.filter((v: unknown) => typeof v === "string").slice(0, 8);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("id, title, excerpt, content, updated_at")
      .in("id", ids)
      .eq("published", true);
    if (postsError) throw postsError;

    const { data: cached, error: cacheError } = await supabase
      .from("post_translations")
      .select("post_id, lang, title, excerpt, content, source_updated_at")
      .eq("lang", lang)
      .in("post_id", ids);
    if (cacheError) throw cacheError;

    const cacheMap = new Map<string, Translation>((cached ?? []).map((t) => [t.post_id, t as Translation]));
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const results: Record<string, { title: string; excerpt: string; content: string | null }> = {};

    for (const post of (posts ?? []) as Post[]) {
      const hit = cacheMap.get(post.id);
      const fresh = hit && hit.source_updated_at === post.updated_at;
      const complete = fresh && (!includeContent || !!hit?.content);

      if (complete && hit) {
        results[post.id] = {
          title: hit.title ?? post.title,
          excerpt: hit.excerpt ?? "",
          content: hit.content,
        };
        continue;
      }

      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

      const translated = await translatePost(post, lang, includeContent || !!hit?.content, apiKey);
      results[post.id] = translated;

      const { error: upsertError } = await supabase.from("post_translations").upsert(
        {
          post_id: post.id,
          lang,
          title: translated.title,
          excerpt: translated.excerpt,
          content: translated.content ?? hit?.content ?? null,
          source_updated_at: post.updated_at,
        },
        { onConflict: "post_id,lang" },
      );
      if (upsertError) console.error("upsert translation failed", upsertError);
    }

    return new Response(JSON.stringify({ lang, translations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-posts error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
