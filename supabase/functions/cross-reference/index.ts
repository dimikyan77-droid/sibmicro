import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { partNumber } = await req.json();
    if (!partNumber || typeof partNumber !== "string" || partNumber.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Invalid part number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert electronic components engineer specializing in cross-reference and part compatibility.
Given a part number, return a JSON array of compatible alternatives/equivalents.

Rules:
- Return ONLY real, existing part numbers from well-known manufacturers
- Include pin-compatible, functional equivalents, and drop-in replacements
- For each alternative provide: partNumber, manufacturer, compatibility (drop-in | functional | similar), notes (brief explanation of differences if any), and package
- Sort by compatibility: drop-in first, then functional, then similar
- Return 5-10 alternatives when possible
- If you don't know the part or can't find alternatives, return an empty array

Respond with ONLY valid JSON, no markdown, no explanation. Format:
[{"partNumber":"...","manufacturer":"...","compatibility":"drop-in","notes":"...","package":"..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Find cross-reference alternatives for: ${partNumber.trim()}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response, stripping possible markdown fences
    let alternatives: unknown[];
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      alternatives = JSON.parse(cleaned);
      if (!Array.isArray(alternatives)) alternatives = [];
    } catch {
      alternatives = [];
    }

    return new Response(JSON.stringify({ partNumber: partNumber.trim(), alternatives }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cross-reference error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
