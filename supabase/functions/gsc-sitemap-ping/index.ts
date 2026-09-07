import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';
const BASE_URL = 'https://www.bayud.my.id';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith('sc-domain:')) {
    const domain = siteUrl.slice('sc-domain:'.length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const connectionApiKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
    if (!lovableApiKey || !connectionApiKey) {
      return new Response(JSON.stringify({ error: 'Missing Search Console credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': connectionApiKey,
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let days = 1;
    let force = false;
    try {
      const body = await req.json();
      if (typeof body?.days === 'number' && body.days > 0 && body.days <= 365) days = Math.floor(body.days);
      if (body?.force === true) force = true;
    } catch (_) {
      // no body
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('published', true)
      .or(`created_at.gte.${since},updated_at.gte.${since}`);
    if (error) throw error;

    const changed = (posts ?? []).length;
    if (changed === 0 && !force) {
      return new Response(
        JSON.stringify({ submitted: false, changed: 0, message: 'No new or updated articles; sitemap not resubmitted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!sitesRes.ok) {
      const details = await sitesRes.text();
      console.error(`Could not list properties [${sitesRes.status}]: ${details}`);
      return new Response(JSON.stringify({ error: 'Could not list Search Console properties', status: sitesRes.status, details }), {
        status: sitesRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { siteEntry = [] } = (await sitesRes.json()) as { siteEntry?: SiteEntry[] };
    const target = new URL(`${BASE_URL}/`);
    const matches = siteEntry.filter(
      (e) => e.permissionLevel !== 'siteUnverifiedUser' && coversTarget(e.siteUrl, target),
    );
    const exactRoot = matches.find((e) => e.siteUrl === `${BASE_URL}/`);
    const property = exactRoot ?? matches[0];
    if (!property) {
      return new Response(JSON.stringify({ error: 'No verified Search Console property covers this site' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const path = `/webmasters/v3/sites/${encodeURIComponent(property.siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
    const putRes = await fetch(`${GATEWAY}${path}`, { method: 'PUT', headers });
    if (!putRes.ok) {
      const details = await putRes.text();
      console.error(`Sitemap submission failed [${putRes.status}]: ${details}`);
      return new Response(JSON.stringify({ error: 'Sitemap submission failed', status: putRes.status, details }), {
        status: putRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sitemap submitted to ${property.siteUrl} (${changed} new/updated posts)`);
    return new Response(
      JSON.stringify({ submitted: true, changed, property: property.siteUrl, sitemap: SITEMAP_URL }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('gsc-sitemap-ping error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
