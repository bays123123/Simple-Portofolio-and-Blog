import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const path: string = (body.path || '/').toString().slice(0, 512);
    const source: string = (body.source || 'Direct').toString().slice(0, 128);
    const device: string = (body.device || 'desktop').toString().slice(0, 32);
    const sessionId: string = (body.sessionId || '').toString().slice(0, 64);

    // Resolve visitor IP from forwarding headers
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';

    // Try header-based geo first (fast, no external call)
    let country: string | null = null;
    let countryCode: string | null =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      null;

    // Fall back to an IP geolocation lookup
    if (!countryCode && ip && !ip.startsWith('127.') && !ip.startsWith('::1')) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          country = geo.country_name || null;
          countryCode = geo.country_code || null;
        }
      } catch (_) {
        // ignore geo failures
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('page_views').insert({
      path,
      source,
      device,
      country,
      country_code: countryCode,
      session_id: sessionId || null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('track-visit error:', error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
