import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.bayud.my.id';
const INDEXNOW_KEY = 'c232449c278c4ae7ba2d1ef4a4d26166';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let days = 2;
    try {
      const body = await req.json();
      if (typeof body?.days === 'number' && body.days > 0 && body.days <= 365) {
        days = Math.floor(body.days);
      }
    } catch (_) {
      // no body, use default
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, created_at, updated_at')
      .eq('published', true)
      .or(`created_at.gte.${since},updated_at.gte.${since}`);

    if (error) throw error;

    const { data: submitted, error: subError } = await supabase
      .from('indexnow_submissions')
      .select('url');
    if (subError) throw subError;

    const alreadySent = new Set((submitted ?? []).map((r: { url: string }) => r.url));
    const urls = (posts ?? [])
      .map((p: { slug: string }) => `${BASE_URL}/blog/${p.slug}`)
      .filter((u: string) => !alreadySent.has(u));

    if (urls.length === 0) {
      return new Response(JSON.stringify({ submitted: 0, message: 'No new URLs to submit' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Always ping the blog index too so Bing re-crawls the listing
    const urlList = [`${BASE_URL}/blog`, ...urls];

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.bayud.my.id',
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    const status = res.status;
    console.log('IndexNow response status:', status, 'urls:', urlList.length);

    if (status === 200 || status === 202) {
      await supabase.from('indexnow_submissions').insert(
        urls.map((url: string) => ({ url, status })),
      );
    }

    return new Response(JSON.stringify({ submitted: urls.length, status, urls: urlList }), {
      status: status === 200 || status === 202 ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('indexnow-submit error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
