import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError.message);
      return new Response(JSON.stringify({ error: 'Authorization check failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!roleData) {
      console.error('User is not admin:', user.id);
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Admin user verified:', user.id);

    const { topic, type } = await req.json();
    
    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log(`Generating ${type || 'full'} content for topic: ${topic}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'title') {
      systemPrompt = 'You are a professional blog title writer specializing in Indonesian content. Generate catchy, SEO-friendly blog titles that are compelling and descriptive. Return only the title, nothing else.';
      userPrompt = `Generate a compelling blog title in Indonesian about: ${topic}`;
    } else if (type === 'excerpt') {
      systemPrompt = 'You are a professional Indonesian copywriter. Generate engaging blog excerpts/summaries that hook readers and make them want to read more. Return only the excerpt (2-3 sentences), nothing else.';
      userPrompt = `Generate an engaging excerpt/summary in Indonesian for a blog post about: ${topic}`;
    } else {
      // Full content
      systemPrompt = `Anda adalah penulis blog profesional Indonesia yang ahli dalam membuat konten berkualitas tinggi.

INSTRUKSI PENULISAN:
1. Tulis artikel dalam Bahasa Indonesia yang baik dan benar
2. Gunakan struktur yang jelas dengan heading dan subheading menggunakan format Markdown:
   - Gunakan ## untuk judul bagian utama (H2)
   - Gunakan ### untuk sub-bagian (H3)
   - JANGAN gunakan # (H1) karena judul artikel sudah ada

3. Struktur artikel yang WAJIB diikuti:
   - Paragraf pembuka yang menarik dan menjelaskan topik (2-3 paragraf)
   - Beberapa bagian utama dengan ## heading (minimal 3-4 bagian)
   - Setiap bagian memiliki penjelasan mendalam dengan paragraf yang rapi
   - Gunakan ### untuk sub-bagian jika diperlukan
   - Paragraf penutup/kesimpulan yang kuat

4. Kualitas konten:
   - Setiap paragraf minimal 3-4 kalimat
   - Gunakan transisi yang baik antar paragraf
   - Sertakan contoh konkret dan penjelasan praktis
   - Gunakan bullet points (-) atau numbered lists hanya jika benar-benar diperlukan
   - Hindari paragraf yang terlalu pendek atau terlalu panjang

5. Format yang dilarang:
   - JANGAN gunakan # untuk heading
   - JANGAN buat konten yang terlalu singkat
   - JANGAN gunakan terlalu banyak bullet points, fokus pada paragraf naratif

6. Panjang artikel: minimal 800-1200 kata`;
      userPrompt = `Tulis artikel blog yang komprehensif dan terstruktur dengan baik tentang: ${topic}

Pastikan artikel memiliki:
- Pembukaan yang menarik
- Minimal 4 bagian utama dengan heading ##
- Penjelasan mendalam di setiap bagian
- Kesimpulan yang kuat`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    console.log(`Successfully generated ${type || 'full'} content for admin user:`, user.id);

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blog-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
