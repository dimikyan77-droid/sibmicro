import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEXAR_TOKEN_URL = "https://identity.nexar.com/connect/token";
const NEXAR_GRAPHQL_URL = "https://api.nexar.com/graphql";

// Cache token in memory (edge functions are short-lived but may handle multiple requests)
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getNexarToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = Deno.env.get("NEXAR_CLIENT_ID");
  const clientSecret = Deno.env.get("NEXAR_CLIENT_SECRET");

  if (!clientId) throw new Error("NEXAR_CLIENT_ID is not configured");
  if (!clientSecret) throw new Error("NEXAR_CLIENT_SECRET is not configured");

  const resp = await fetch(NEXAR_TOKEN_URL, {
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
    throw new Error(`Nexar token error [${resp.status}]: ${text}`);
  }

  const data = await resp.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

const SEARCH_QUERY_AUTHORIZED = `
query SearchParts($q: String!, $limit: Int!) {
  supSearch(q: $q, limit: $limit) {
    hits
    results {
      part {
        mpn
        manufacturer { name }
        shortDescription
        specs {
          attribute { name }
          displayValue
        }
        bestDatasheet { url }
        sellers(authorizedOnly: true) {
          company { name }
          offers {
            inventoryLevel
            prices { quantity price currency }
            moq
            packaging
          }
        }
      }
    }
  }
}
`;

const SEARCH_QUERY_ALL_SELLERS = `
query SearchParts($q: String!, $limit: Int!) {
  supSearch(q: $q, limit: $limit) {
    hits
    results {
      part {
        mpn
        manufacturer { name }
        shortDescription
        specs {
          attribute { name }
          displayValue
        }
        bestDatasheet { url }
        sellers {
          company { name }
          offers {
            inventoryLevel
            prices { quantity price currency }
            moq
            packaging
          }
        }
      }
    }
  }
}
`;

const SEARCH_QUERY_BASIC = `
query SearchParts($q: String!, $limit: Int!) {
  supSearch(q: $q, limit: $limit) {
    hits
    results {
      part {
        mpn
        manufacturer { name }
        shortDescription
        specs {
          attribute { name }
          displayValue
        }
        bestDatasheet { url }
      }
    }
  }
}
`;

async function executeSearch(token: string, query: string, variables: { q: string; limit: number }) {
  const gqlResp = await fetch(NEXAR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!gqlResp.ok) {
    const text = await gqlResp.text();
    throw new Error(`Nexar API error [${gqlResp.status}]: ${text}`);
  }

  return await gqlResp.json();
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

    const token = await getNexarToken();
    const variables = { q: query, limit: Math.min(limit, 20) };

    const attempts = [
      { name: "authorized_sellers", query: SEARCH_QUERY_AUTHORIZED },
      { name: "all_sellers", query: SEARCH_QUERY_ALL_SELLERS },
      { name: "basic", query: SEARCH_QUERY_BASIC },
    ];

    let gqlData: any = null;
    let source = "none";

    for (const attempt of attempts) {
      const data = await executeSearch(token, attempt.query, variables);
      const hits = data?.data?.supSearch?.hits ?? 0;
      const results = data?.data?.supSearch?.results ?? [];

      if (data?.errors?.length) {
        const errorText = JSON.stringify(data.errors);
        console.warn(`Nexar GraphQL errors [${attempt.name}]:`, errorText);

        if (errorText.toLowerCase().includes("exceeded your part limit")) {
          return new Response(
            JSON.stringify({
              error:
                "Octopart API limit exceeded for this account. Please upgrade your Nexar plan or wait for reset.",
              code: "OCTOPART_LIMIT_EXCEEDED",
            }),
            {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      gqlData = data;
      source = attempt.name;

      if (results.length > 0 || hits > 0) {
        break;
      }
    }

    // Transform results into a cleaner format
    const results = (gqlData?.data?.supSearch?.results || []).map((r: any) => {
      const part = r.part;
      const sellers = (part?.sellers || []).map((s: any) => ({
        name: s.company?.name,
        offers: (s.offers || []).map((o: any) => ({
          stock: o.inventoryLevel,
          moq: o.moq,
          packaging: o.packaging,
          prices: (o.prices || []).map((p: any) => ({
            quantity: p.quantity,
            price: p.price,
            currency: p.currency,
          })),
        })),
      }));

      return {
        mpn: part?.mpn,
        manufacturer: part?.manufacturer?.name,
        description: part?.shortDescription,
        datasheetUrl: part?.bestDatasheet?.url,
        specs: (part?.specs || []).slice(0, 10).map((s: any) => ({
          name: s.attribute?.name,
          value: s.displayValue,
        })),
        sellers,
      };
    });

    return new Response(
      JSON.stringify({
        hits: gqlData?.data?.supSearch?.hits || 0,
        results,
        source,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Octopart search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
