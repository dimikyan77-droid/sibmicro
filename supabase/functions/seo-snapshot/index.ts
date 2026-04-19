import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://sibmicro.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string | null | undefined) {
  if (!s) return "";
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" }[c]!));
}

function buildHtml(opts: {
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd?: object;
  bodyContent: string;
}) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}" />
<link rel="canonical" href="${esc(opts.canonical)}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(opts.title)}" />
<meta property="og:description" content="${esc(opts.description)}" />
<meta property="og:url" content="${esc(opts.canonical)}" />
<meta property="og:image" content="${esc(opts.image)}" />
<meta property="og:site_name" content="SibMicro" />
<meta property="og:locale" content="ru_RU" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(opts.title)}" />
<meta name="twitter:description" content="${esc(opts.description)}" />
<meta name="twitter:image" content="${esc(opts.image)}" />
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ""}
</head>
<body>
${opts.bodyContent}
<p><a href="${esc(opts.canonical)}">Open interactive version on SibMicro</a></p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const partNumber = url.searchParams.get("pn");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!partNumber) {
      // Home / generic snapshot
      const html = buildHtml({
        title: "SibMicro — Electronic Component Search",
        description: "Search, compare and order electronic components from leading manufacturers. BOM upload, cross-reference, in-stock inventory.",
        canonical: SITE_URL + "/",
        image: SITE_URL + "/icon-512.png",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SibMicro",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/catalog?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        bodyContent: `<h1>SibMicro — Electronic Component Search</h1><p>Search electronic components, compare specs, request quotes.</p>`,
      });
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    // Try catalog first, then inventory
    const { data: catalog } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("part_number", partNumber)
      .maybeSingle();

    let product: any = catalog;
    if (!product) {
      const { data: inv } = await supabase
        .from("inventory")
        .select("*")
        .eq("part_number", partNumber)
        .maybeSingle();
      product = inv;
    }

    const canonical = `${SITE_URL}/product/${encodeURIComponent(partNumber)}`;
    const image = product?.image_url || `${SITE_URL}/icon-512.png`;
    const mfr = product?.manufacturer || "";
    const desc = product?.description || `Buy ${partNumber}${mfr ? ` from ${mfr}` : ""} — datasheet, price, in-stock availability at SibMicro.`;
    const title = `${partNumber}${mfr ? ` — ${mfr}` : ""} | SibMicro`;

    const jsonLd: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: partNumber,
      sku: partNumber,
      mpn: partNumber,
      description: desc,
      image,
      url: canonical,
      ...(mfr ? { brand: { "@type": "Brand", name: mfr } } : {}),
      ...(product?.category ? { category: product.category } : {}),
    };
    if (product?.price) {
      jsonLd.offers = {
        "@type": "Offer",
        price: String(product.price),
        priceCurrency: product.currency || "RUB",
        availability: (product.quantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: canonical,
      };
    }

    const body = `
<h1>${esc(partNumber)}${mfr ? ` — ${esc(mfr)}` : ""}</h1>
${product?.category ? `<p><strong>Category:</strong> ${esc(product.category)}${product.subcategory ? " / " + esc(product.subcategory) : ""}</p>` : ""}
${product?.package ? `<p><strong>Package:</strong> ${esc(product.package)}</p>` : ""}
${product?.price ? `<p><strong>Price:</strong> ${esc(String(product.price))} ${esc(product.currency || "RUB")}</p>` : ""}
${product?.quantity != null ? `<p><strong>Stock:</strong> ${esc(String(product.quantity))}</p>` : ""}
<p>${esc(desc)}</p>
${product?.datasheet_url ? `<p><a href="${esc(product.datasheet_url)}">Datasheet (PDF)</a></p>` : ""}
`;

    const html = buildHtml({ title, description: desc, canonical, image, jsonLd, bodyContent: body });

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
      status: product ? 200 : 404,
    });
  } catch (e) {
    console.error("seo-snapshot error", e);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
