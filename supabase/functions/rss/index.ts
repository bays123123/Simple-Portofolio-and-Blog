import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_TITLE = 'Bayu Dwi Darmawan Portofolio';
const SITE_DESCRIPTION = 'Artikel seputar industri percetakan, cetak offset, dan kemasan.';
const BASE_URL = 'https://www.bayud.my.id';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, category, created_at, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }

    const lastBuildDate = new Date().toUTCString();

    let items = '';
    if (posts && posts.length > 0) {
      for (const post of posts) {
        const url = `${BASE_URL}/blog/${post.slug}`;
        const pubDate = new Date(post.created_at).toUTCString();
        items += '    <item>\n';
        items += `      <title>${escapeXml(post.title ?? '')}</title>\n`;
        items += `      <link>${escapeXml(url)}</link>\n`;
        items += `      <guid isPermaLink="true">${escapeXml(url)}</guid>\n`;
        if (post.excerpt) {
          items += `      <description>${escapeXml(post.excerpt)}</description>\n`;
        }
        if (post.category) {
          items += `      <category>${escapeXml(post.category)}</category>\n`;
        }
        items += `      <pubDate>${pubDate}</pubDate>\n`;
        items += '    </item>\n';
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>id</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}  </channel>
</rss>`;

    console.log(`RSS generated with ${posts?.length || 0} items`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${errorMessage}</error>`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
    });
  }
});
