// Generates public/sitemap.xml and public/rss.xml from the live database.
// Runs before `vite dev` and `vite build` (predev/prebuild) so both files
// always include every published blog post.

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.bayud.my.id";
const SITE_TITLE = "Bayu Dwi Darmawan Portofolio";
const SITE_DESCRIPTION =
  "Artikel seputar industri percetakan, cetak offset, dan kemasan.";

// Load env from .env (Vite-style vars) without extra deps.
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface Post {
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let posts: Post[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("title, slug, excerpt, category, created_at, updated_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      posts = (data as Post[]) ?? [];
    } catch (err) {
      console.warn("generate-feeds: could not fetch posts, keeping existing files.", err);
      return;
    }
  } else {
    console.warn("generate-feeds: missing Supabase env, skipping.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // ---- sitemap.xml ----
  const staticPages = [
    { loc: "/", changefreq: "monthly", priority: "1.0" },
    { loc: "/blog", changefreq: "daily", priority: "0.9" },
  ];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const page of staticPages) {
    sitemap += "  <url>\n";
    sitemap += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += "  </url>\n";
  }
  for (const post of posts) {
    const lastmod = post.updated_at
      ? new Date(post.updated_at).toISOString().split("T")[0]
      : today;
    sitemap += "  <url>\n";
    sitemap += `    <loc>${BASE_URL}/blog/${post.slug}</loc>\n`;
    sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
    sitemap += "    <changefreq>weekly</changefreq>\n";
    sitemap += "    <priority>0.7</priority>\n";
    sitemap += "  </url>\n";
  }
  sitemap += "</urlset>\n";
  writeFileSync(resolve("public/sitemap.xml"), sitemap);

  // ---- rss.xml ----
  const lastBuildDate = new Date().toUTCString();
  let items = "";
  for (const post of posts) {
    const url = `${BASE_URL}/blog/${post.slug}`;
    const pubDate = new Date(post.created_at).toUTCString();
    items += "    <item>\n";
    items += `      <title>${escapeXml(post.title ?? "")}</title>\n`;
    items += `      <link>${escapeXml(url)}</link>\n`;
    items += `      <guid isPermaLink="true">${escapeXml(url)}</guid>\n`;
    if (post.excerpt) items += `      <description>${escapeXml(post.excerpt)}</description>\n`;
    if (post.category) items += `      <category>${escapeXml(post.category)}</category>\n`;
    items += `      <pubDate>${pubDate}</pubDate>\n`;
    items += "    </item>\n";
  }
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>id</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}  </channel>
</rss>
`;
  writeFileSync(resolve("public/rss.xml"), rss);

  console.log(
    `Feeds written: sitemap.xml (${staticPages.length + posts.length} urls), rss.xml (${posts.length} items)`,
  );
}

main();
