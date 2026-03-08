import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIGIKEY_API_URL = "https://api.digikey.com";
const DIGIKEY_TOKEN_URL = "https://api.digikey.com/v1/oauth2/token";

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getDigiKeyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = Deno.env.get("DIGIKEY_CLIENT_ID");
  const clientSecret = Deno.env.get("DIGIKEY_CLIENT_SECRET");

  if (!clientId) throw new Error("DIGIKEY_CLIENT_ID is not configured");
  if (!clientSecret) throw new Error("DIGIKEY_CLIENT_SECRET is not configured");

  const resp = await fetch(DIGIKEY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DigiKey token error [${resp.status}]: ${text}`);
  }

  const data = await resp.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 10 } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("DIGIKEY_CLIENT_ID");
    if (!clientId) throw new Error("DIGIKEY_CLIENT_ID is not configured");

    const token = await getDigiKeyToken();

    const searchResp = await fetch(`${DIGIKEY_API_URL}/products/v4/search/keyword`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-DIGIKEY-Client-Id": clientId,
        "X-DIGIKEY-Locale-Language": "en",
        "X-DIGIKEY-Locale-Currency": "USD",
        "X-DIGIKEY-Locale-Site": "US",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Keywords: query,
        Limit: Math.min(limit, 50),
        Offset: 0,
      }),
    });

    if (!searchResp.ok) {
      const text = await searchResp.text();
      throw new Error(`DigiKey API error [${searchResp.status}]: ${text}`);
    }

    const data = await searchResp.json();

    // Transform to unified format
    const products = (data.Products || []).map((p: any) => {
      const variations = p.ProductVariations || [];
      const priceTiers: { quantity: number; price: number }[] = [];

      for (const v of variations) {
        for (const pb of v.StandardPricing || []) {
          priceTiers.push({
            quantity: pb.BreakQuantity,
            price: pb.UnitPrice,
          });
        }
      }

      // Deduplicate price tiers (keep lowest price per qty)
      const tierMap = new Map<number, number>();
      for (const t of priceTiers) {
        const existing = tierMap.get(t.quantity);
        if (!existing || t.price < existing) tierMap.set(t.quantity, t.price);
      }

      const uniqueTiers = Array.from(tierMap.entries())
        .map(([quantity, price]) => ({ quantity, price }))
        .sort((a, b) => a.quantity - b.quantity);

      const totalStock = typeof p.QuantityAvailable === "number" ? p.QuantityAvailable : 0;

      // Extract parameters as specs
      const specs = (p.Parameters || []).slice(0, 15).map((param: any) => ({
        name: param.ParameterText || "",
        value: param.ValueText || "",
      }));

      return {
        mpn: p.ManufacturerProductNumber || "",
        manufacturer: p.Manufacturer?.Name || "",
        description: p.Description?.ProductDescription || p.Description?.DetailedDescription || "",
        datasheetUrl: p.DatasheetUrl || null,
        productUrl: p.ProductUrl || null,
        photoUrl: p.PhotoUrl || null,
        stock: totalStock,
        rohs: p.Classifications?.RohsStatus || "",
        priceTiers: uniqueTiers,
        specs,
        digiKeyPn: variations[0]?.DigiKeyProductNumber || "",
        packageType: variations[0]?.PackageType?.Name || "",
      };
    });

    // Also include ExactMatches
    const exactMatches = (data.ExactMatches || []).map((p: any) => {
      const variations = p.ProductVariations || [];
      const priceTiers: { quantity: number; price: number }[] = [];

      for (const v of variations) {
        for (const pb of v.StandardPricing || []) {
          priceTiers.push({ quantity: pb.BreakQuantity, price: pb.UnitPrice });
        }
      }

      const tierMap = new Map<number, number>();
      for (const t of priceTiers) {
        const existing = tierMap.get(t.quantity);
        if (!existing || t.price < existing) tierMap.set(t.quantity, t.price);
      }

      const uniqueTiers = Array.from(tierMap.entries())
        .map(([quantity, price]) => ({ quantity, price }))
        .sort((a, b) => a.quantity - b.quantity);

      const totalStock = typeof p.QuantityAvailable === "number" ? p.QuantityAvailable : 0;

      const specs = (p.Parameters || []).slice(0, 15).map((param: any) => ({
        name: param.ParameterText || "",
        value: param.ValueText || "",
      }));

      return {
        mpn: p.ManufacturerProductNumber || "",
        manufacturer: p.Manufacturer?.Name || "",
        description: p.Description?.ProductDescription || p.Description?.DetailedDescription || "",
        datasheetUrl: p.DatasheetUrl || null,
        productUrl: p.ProductUrl || null,
        photoUrl: p.PhotoUrl || null,
        stock: totalStock,
        rohs: p.Classifications?.RohsStatus || "",
        priceTiers: uniqueTiers,
        specs,
        digiKeyPn: variations[0]?.DigiKeyProductNumber || "",
        packageType: variations[0]?.PackageType?.Name || "",
      };
    });

    // Merge exact matches first, then other products (dedup by mpn)
    const seen = new Set<string>();
    const allResults: any[] = [];
    for (const item of [...exactMatches, ...products]) {
      const key = `${item.mpn}-${item.digiKeyPn}`;
      if (!seen.has(key)) {
        seen.add(key);
        allResults.push(item);
      }
    }

    return new Response(
      JSON.stringify({
        hits: data.ProductsCount || 0,
        results: allResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("DigiKey search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
