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
  name: "list_blog_posts",
  title: "List blog posts",
  description:
    "List published blog posts, most recent first. Optionally filter by tag or category. Returns titles, slugs, excerpts, and metadata (not full content).",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of posts to return (default 20)."),
    tag: z.string().optional().describe("Only return posts that include this tag."),
    category: z.string().optional().describe("Only return posts in this category."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, tag, category }) => {
    const supabase = supabasePublic();
    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, category, tags, read_time, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (tag) query = query.contains("tags", [tag]);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
