import { useState } from "react";
import { Search, ExternalLink, Loader2, Package, ShoppingCart, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/mockData";
import { toast } from "sonner";

interface OctopartPrice {
  quantity: number;
  price: number;
  currency: string;
}

interface OctopartOffer {
  stock: number;
  moq: number;
  packaging: string;
  prices: OctopartPrice[];
}

interface OctopartSeller {
  name: string;
  offers: OctopartOffer[];
}

interface OctopartSpec {
  name: string;
  value: string;
}

interface OctopartResult {
  mpn: string;
  manufacturer: string;
  description: string;
  datasheetUrl: string | null;
  specs: OctopartSpec[];
  sellers: OctopartSeller[];
}

const OctopartSearch = () => {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OctopartResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [addedMpns, setAddedMpns] = useState<Set<string>>(new Set());

  const octopartToProduct = (r: OctopartResult): Product => {
    const allPrices: { qty: number; price: number }[] = [];
    let minMoq = 1;
    let totalStock = getTotalStock(r.sellers);

    for (const s of r.sellers) {
      for (const o of s.offers) {
        if (o.moq && o.moq > 0) minMoq = Math.max(minMoq, 1);
        for (const p of o.prices) {
          allPrices.push({ qty: p.quantity, price: p.price });
        }
      }
    }

    // Deduplicate and sort price tiers
    const tierMap = new Map<number, number>();
    for (const p of allPrices) {
      const existing = tierMap.get(p.qty);
      if (!existing || p.price < existing) tierMap.set(p.qty, p.price);
    }
    const priceTiers = Array.from(tierMap.entries())
      .map(([qty, price]) => ({ qty, price }))
      .sort((a, b) => a.qty - b.qty);

    if (priceTiers.length === 0) priceTiers.push({ qty: 1, price: 0 });

    return {
      id: `octopart-${r.mpn}`,
      partNumber: r.mpn,
      manufacturer: r.manufacturer || "Unknown",
      category: "Octopart",
      subcategory: "",
      description: r.description || "",
      package: r.specs.find((s) => s.name.toLowerCase().includes("package"))?.value || "",
      temperatureRange: r.specs.find((s) => s.name.toLowerCase().includes("temp"))?.value || "",
      rohs: true,
      stock: totalStock,
      leadTime: totalStock > 0 ? "In Stock" : "Contact",
      priceTiers,
      moq: minMoq,
      datasheetUrl: r.datasheetUrl || "",
    };
  };

  const handleAddToCart = (r: OctopartResult) => {
    const product = octopartToProduct(r);
    addToCart(product);
    setAddedMpns((prev) => new Set(prev).add(r.mpn));
    toast.success(t("cart.added"), { description: r.mpn });
    setTimeout(() => {
      setAddedMpns((prev) => {
        const next = new Set(prev);
        next.delete(r.mpn);
        return next;
      });
    }, 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("octopart-search", {
        body: { query: query.trim(), limit: 15 },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResults(data.results || []);
      setTotalHits(data.hits || 0);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const getBestPrice = (sellers: OctopartSeller[]): OctopartPrice | null => {
    let best: OctopartPrice | null = null;
    for (const s of sellers) {
      for (const o of s.offers) {
        for (const p of o.prices) {
          if (!best || p.price < best.price) best = p;
        }
      }
    }
    return best;
  };

  const getTotalStock = (sellers: OctopartSeller[]): number => {
    let total = 0;
    for (const s of sellers) {
      for (const o of s.offers) {
        if (typeof o.stock === "number") total += o.stock;
      }
    }
    return total;
  };

  return (
    <Layout>
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <a href="/" className="hover:text-foreground">{t("catalog.home")}</a>
          <span>/</span>
          <span className="text-foreground font-medium">{t("octopart.title")}</span>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t("octopart.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{t("octopart.subtitle")}</p>

          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("octopart.search_placeholder")}
              className="search-input pl-11 pr-28 h-12 text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("header.search")}
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-3 text-sm text-muted-foreground">
            {t("octopart.found")} {totalHits.toLocaleString()} {t("octopart.results")}
          </div>
        )}

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="min-w-[140px]">{t("catalog.part_number")}</th>
                  <th>{t("catalog.manufacturer")}</th>
                  <th className="min-w-[280px]">{t("catalog.description")}</th>
                  <th>{t("catalog.stock")}</th>
                  <th className="text-right">{t("catalog.price")}</th>
                  <th className="w-10"></th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const bestPrice = getBestPrice(r.sellers);
                  const totalStock = getTotalStock(r.sellers);
                  const isExpanded = expandedRow === r.mpn;

                  return (
                    <tr key={r.mpn} className="group">
                      <td>
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : r.mpn)}
                          className="font-mono text-sm font-medium text-primary hover:text-accent hover:underline text-left"
                        >
                          {r.mpn}
                        </button>
                      </td>
                      <td className="text-sm">{r.manufacturer}</td>
                      <td className="text-xs text-muted-foreground">{r.description}</td>
                      <td>
                        <span className={`chip ${totalStock > 0 ? "chip-success" : "chip-warning"}`}>
                          {totalStock > 0 ? totalStock.toLocaleString() : t("catalog.contact")}
                        </span>
                      </td>
                      <td className="text-right">
                        {bestPrice ? (
                          <div>
                            <div className="text-sm font-semibold">
                              ${bestPrice.price.toFixed(bestPrice.price < 1 ? 4 : 2)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              qty {bestPrice.quantity}+
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleAddToCart(r)}
                          className={`p-1.5 rounded-md transition-colors ${addedMpns.has(r.mpn) ? "text-green-600 bg-green-50" : "text-primary hover:bg-muted"}`}
                          title={t("product.add_to_cart")}
                        >
                          {addedMpns.has(r.mpn) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                        </button>
                      </td>
                      <td>
                        {r.datasheetUrl && (
                          <a
                            href={r.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-accent"
                            title={t("product.datasheet")}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded detail */}
        {expandedRow && (() => {
          const r = results.find((res) => res.mpn === expandedRow);
          if (!r) return null;
          return (
            <div className="mt-4 border border-border rounded-lg p-5 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">{r.mpn}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAddToCart(r)}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t("product.add_to_cart")}
                  </button>
                  <button
                    onClick={() => setExpandedRow(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕ {t("octopart.close")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specs */}
                {r.specs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{t("product.tech_specs")}</h3>
                    <div className="space-y-1">
                      {r.specs.map((s) => (
                        <div key={s.name} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span className="text-muted-foreground">{s.name}</span>
                          <span className="font-medium text-foreground">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sellers */}
                {r.sellers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{t("octopart.sellers")}</h3>
                    <div className="space-y-3">
                      {r.sellers.slice(0, 5).map((s) => (
                        <div key={s.name} className="border border-border rounded-md p-3 bg-background">
                          <div className="font-medium text-sm text-foreground mb-1">{s.name}</div>
                          {s.offers.map((o, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span>{t("catalog.stock")}: {typeof o.stock === "number" ? o.stock.toLocaleString() : "—"}</span>
                              {o.moq && <span className="ml-3">MOQ: {o.moq}</span>}
                              {o.prices.length > 0 && (
                                <div className="mt-1 flex gap-3 flex-wrap">
                                  {o.prices.slice(0, 4).map((p, j) => (
                                    <span key={j} className="text-foreground font-medium">
                                      {p.quantity}+: ${p.price.toFixed(p.price < 1 ? 4 : 2)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {!loading && results.length === 0 && !error && query && (
          <div className="text-center py-16 text-muted-foreground">
            {t("catalog.no_products")}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OctopartSearch;
