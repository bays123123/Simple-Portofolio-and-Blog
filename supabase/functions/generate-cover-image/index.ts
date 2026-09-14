import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) return json({ error: "Authorization check failed" }, 500);
    if (!roleData) return json({ error: "Forbidden - Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const excerpt = typeof body?.excerpt === "string" ? body.excerpt.trim().slice(0, 400) : "";
    if (!title || title.length > 300) {
      return json({ error: "Judul artikel wajib diisi (maks 300 karakter)" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY is not configured" }, 500);

    const prompt = [
      `Create a photorealistic, professional cover photo for a printing-industry blog article.`,
      `The image MUST visually represent this exact article title: "${title}".`,
      category ? `Article category: ${category}.` : "",
      excerpt ? `Article summary for context: ${excerpt}` : "",
      `Composition: wide 16:9 landscape, real printing/packaging workshop context (presses, cylinders, plates, inks, printed sheets, color bars, densitometer, operator hands) exactly as implied by the title.`,
      `Lighting: clean industrial lighting, sharp focus, shallow depth of field, editorial photography look.`,
      `STRICT RULES: stay strictly on the topic of the title, do not invent unrelated subjects, no text, no words, no letters, no numbers, no logos, no watermarks, no collage, no charts, no cartoon or 3D-render style.`,
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) return json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, 429);
      if (aiRes.status === 402) return json({ error: "Kredit AI habis. Tambahkan kredit untuk melanjutkan." }, 402);
      return json({ error: `AI gateway error: ${aiRes.status}` }, 500);
    }

    const aiData = await aiRes.json();
    const b64 = aiData?.data?.[0]?.b64_json;
    if (!b64) {
      console.error("No image returned:", JSON.stringify(aiData).slice(0, 500));
      return json({ error: "Gambar gagal dibuat, coba lagi." }, 500);
    }

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60)
      .replace(/^-|-$/g, "") || "cover";
    const path = `${slug}-${Date.now()}.png`;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: uploadError } = await admin.storage
      .from("blog-covers")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return json({ error: `Gagal menyimpan gambar: ${uploadError.message}` }, 500);
    }

    // Long-lived signed URL (~10 years) so the cover stays reachable publicly.
    const { data: signed, error: signError } = await admin.storage
      .from("blog-covers")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signError || !signed?.signedUrl) {
      console.error("Sign error:", signError?.message);
      return json({ error: "Gagal membuat URL gambar" }, 500);
    }

    return json({ url: signed.signedUrl, path });
  } catch (error) {
    console.error("generate-cover-image error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
