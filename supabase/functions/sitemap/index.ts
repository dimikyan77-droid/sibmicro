import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://sibmicro.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/catalog", priority: "0.9", changefreq: "daily" },
  { path: "/manufacturers", priority: "0.8", changefreq: "weekly" },
  { path: "/new-products", priority: "0.8", changefreq: "daily" },
  { path: "/cross-reference", priority: "0.8", changefreq: "weekly" },
  { path: "/bom", priority: "0.7", changefreq: "monthly" },
  { path: "/inventory", priority: "0.7", changefreq: "daily" },
  { path: "/quote", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/resources", priority: "0.5", changefreq: "monthly" },
];

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: catalog } = await supabase
      .from("catalog_products")
      .select("part_number, updated_at")
      .limit(50000);

    const { data: inventory } = await supabase
      .from("inventory")
      .select("part_number, updated_at")
      .limit(50000);

    const partsMap = new Map<string, string>();
    for (const row of catalog ?? []) {
      partsMap.set(row.part_number, row.updated_at ?? new Date().toISOString());
    }
    for (const row of inventory ?? []) {
      if (!partsMap.has(row.part_number)) {
        partsMap.set(row.part_number, row.updated_at ?? new Date().toISOString());
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const urls: string[] = [];
    for (const r of STATIC_ROUTES) {
      urls.push(
        `<url><loc>${SITE_URL}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
      );
    }
    for (const [pn, updated] of partsMap) {
      const lastmod = (updated || today).split("T")[0];
      urls.push(
        `<url><loc>${SITE_URL}/product/${encodeURIComponent(pn)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("sitemap error", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
      status: 200,
    });
  }
});
