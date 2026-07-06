/// <reference types="node" />
import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabasePublic() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "search_blog_posts",
  title: "Search blog posts",
  description:
    "Search published blog posts by keyword across title, excerpt, and content. Returns matching posts with metadata (not full content).",
  inputSchema: {
    query: z.string().min(1).describe("Keyword or phrase to search for."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = supabasePublic();
    const term = `%${query}%`;
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, category, tags, read_time, created_at, updated_at")
      .eq("published", true)
      .or(`title.ilike.${term},excerpt.ilike.${term},content.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
