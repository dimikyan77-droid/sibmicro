import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Filter, X, Download, GitCompare, Loader2, ShoppingCart, Check, ExternalLink } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { products, categories, Product } from "@/data/mockData";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useOctopartSearch, getBestPrice, getTotalStock, type OctopartResult } from "@/hooks/useOctopartSearch";
import { useDigiKeySearch, getDigiKeyBestPrice, type DigiKeyResult } from "@/hooks/useDigiKeySearch";
import { toast } from "sonner";

type SortKey = "partNumber" | "manufacturer" | "price" | "stock";

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const subSlug = searchParams.get("sub") || "";
  const { t } = useI18n();

  const [sortKey, setSortKey] = useState<SortKey>("partNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(true);

  const octopart = useOctopartSearch();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const toggleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }

    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) result = result.filter((p) => p.category === cat.name);
    }

    if (subSlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) {
        const sub = cat.subcategories.find((s) => s.slug === subSlug);
        if (sub) result = result.filter((p) => p.subcategory === sub.name);
      }
    }

    if (filters.manufacturer?.length) {
      result = result.filter((p) => filters.manufacturer.includes(p.manufacturer));
    }
    if (filters.package?.length) {
      result = result.filter((p) => filters.package.includes(p.package));
    }
    if (filters.rohs?.length) {
      const rohsFilter = filters.rohs.includes("Yes");
      result = result.filter((p) => p.rohs === rohsFilter);
    }
    if (filters.stock?.length) {
      if (filters.stock.includes("In Stock")) result = result.filter((p) => p.stock > 0);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "partNumber": cmp = a.partNumber.localeCompare(b.partNumber); break;
        case "manufacturer": cmp = a.manufacturer.localeCompare(b.manufacturer); break;
        case "price": cmp = a.priceTiers[0].price - b.priceTiers[0].price; break;
        case "stock": cmp = a.stock - b.stock; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [query, categorySlug, subSlug, filters, sortKey, sortDir]);

  // Auto-search Octopart when local results are empty and there's a query
  useEffect(() => {
    if (query && filteredProducts.length === 0) {
      octopart.search(query);
    } else {
      octopart.clear();
    }
  }, [query, filteredProducts.length]);

  const uniqueValues = (key: keyof Product) => [...new Set(products.map((p) => String(p[key])))].sort();

  const activeFilterCount = Object.values(filters).flat().length;

  const showOctopart = query && filteredProducts.length === 0;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">{t("catalog.home")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {query ? `${t("catalog.results_for")}: "${query}"` : categorySlug ? categories.find((c) => c.slug === categorySlug)?.name || t("catalog.title") : t("catalog.title")}
          </span>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {query ? `${t("catalog.results_for")} "${query}"` : t("catalog.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {showOctopart
                ? octopart.loading
                  ? t("octopart.searching")
                  : `${octopart.totalHits.toLocaleString()} ${t("octopart.results")} (Octopart)`
                : `${filteredProducts.length} ${t("catalog.products_found")}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!showOctopart && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <Filter className="h-3.5 w-3.5" />
                {t("catalog.filters")} {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            )}
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5" />
              {t("catalog.export")}
            </button>
          </div>
        </div>

        {showOctopart ? (
          <OctopartResults octopart={octopart} />
        ) : (
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            {showFilters && (
              <aside className="w-56 shrink-0 hidden lg:block space-y-5">
                <FilterGroup
                  title={t("catalog.manufacturer")}
                  options={uniqueValues("manufacturer")}
                  selected={filters.manufacturer || []}
                  onToggle={(v) => toggleFilter("manufacturer", v)}
                />
                <FilterGroup
                  title={t("catalog.package")}
                  options={uniqueValues("package")}
                  selected={filters.package || []}
                  onToggle={(v) => toggleFilter("package", v)}
                />
                <FilterGroup
                  title={t("catalog.rohs")}
                  options={["Yes", "No"]}
                  selected={filters.rohs || []}
                  onToggle={(v) => toggleFilter("rohs", v)}
                />
                <FilterGroup
                  title={t("catalog.availability")}
                  options={["In Stock"]}
                  selected={filters.stock || []}
                  onToggle={(v) => toggleFilter("stock", v)}
                />
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters({})}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <X className="h-3 w-3" /> {t("catalog.clear_filters")}
                  </button>
                )}
              </aside>
            )}

            {/* Results Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <GitCompare className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                    </th>
                    <th onClick={() => toggleSort("partNumber")} className="min-w-[160px]">
                      <span className="flex items-center gap-1">{t("catalog.part_number")} <SortIcon col="partNumber" /></span>
                    </th>
                    <th onClick={() => toggleSort("manufacturer")}>
                      <span className="flex items-center gap-1">{t("catalog.manufacturer")} <SortIcon col="manufacturer" /></span>
                    </th>
                    <th className="min-w-[250px]">{t("catalog.description")}</th>
                    <th>{t("catalog.package")}</th>
                    <th onClick={() => toggleSort("stock")}>
                      <span className="flex items-center gap-1">{t("catalog.stock")} <SortIcon col="stock" /></span>
                    </th>
                    <th onClick={() => toggleSort("price")} className="text-right">
                      <span className="flex items-center gap-1 justify-end">{t("catalog.price")} <SortIcon col="price" /></span>
                    </th>
                  </tr>
                </thead>
                <CatalogBody products={filteredProducts} />
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

/* ─── Octopart Results Section ─── */
const OctopartResults = ({ octopart }: { octopart: ReturnType<typeof useOctopartSearch> }) => {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const [addedMpns, setAddedMpns] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleAddToCart = (r: OctopartResult) => {
    const product = octopartToProduct(r);
    addToCart(product);
    setAddedMpns((prev) => new Set(prev).add(r.mpn));
    toast.success(t("cart.added"), { description: r.mpn });
    setTimeout(() => {
      setAddedMpns((prev) => { const n = new Set(prev); n.delete(r.mpn); return n; });
    }, 2000);
  };

  if (octopart.loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("octopart.searching")}</span>
      </div>
    );
  }

  if (octopart.error) {
    return (
      <div className="max-w-3xl mx-auto mb-6 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
        {octopart.error}
      </div>
    );
  }

  if (octopart.results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("catalog.no_products")}
      </div>
    );
  }

  const expandedResult = expandedRow ? octopart.results.find((r) => r.mpn === expandedRow) : null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-primary bg-primary/10 rounded px-2 py-0.5">Octopart</span>
        <span className="text-xs text-muted-foreground">{t("octopart.fallback_hint")}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th className="min-w-[140px]">{t("catalog.part_number")}</th>
              <th>{t("catalog.manufacturer")}</th>
              <th className="min-w-[250px]">{t("catalog.description")}</th>
              <th>{t("catalog.stock")}</th>
              <th className="text-right">{t("catalog.price")}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {octopart.results.map((r) => {
              const bestPrice = getBestPrice(r.sellers);
              const totalStock = getTotalStock(r.sellers);

              return (
                <tr key={r.mpn}>
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
                    <button
                      onClick={() => setExpandedRow(expandedRow === r.mpn ? null : r.mpn)}
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
                        <div className="text-[10px] text-muted-foreground">qty {bestPrice.quantity}+</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td>
                    {r.datasheetUrl && (
                      <a href={r.datasheetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent" title={t("product.datasheet")}>
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

      {/* Expanded detail */}
      {expandedResult && (
        <div className="mt-4 border border-border rounded-lg p-5 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{expandedResult.mpn}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => handleAddToCart(expandedResult)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <ShoppingCart className="h-4 w-4" />
                {t("product.add_to_cart")}
              </button>
              <button onClick={() => setExpandedRow(null)} className="text-xs text-muted-foreground hover:text-foreground">
                ✕ {t("octopart.close")}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expandedResult.specs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{t("product.tech_specs")}</h3>
                <div className="space-y-1">
                  {expandedResult.specs.map((s) => (
                    <div key={s.name} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-medium text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expandedResult.sellers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{t("octopart.sellers")}</h3>
                <div className="space-y-3">
                  {expandedResult.sellers.slice(0, 5).map((s) => (
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
      )}
    </div>
  );
};

/* ─── Helpers ─── */
function octopartToProduct(r: OctopartResult): Product {
  const allPrices: { qty: number; price: number }[] = [];
  const totalStock = getTotalStock(r.sellers);

  for (const s of r.sellers) {
    for (const o of s.offers) {
      for (const p of o.prices) {
        allPrices.push({ qty: p.quantity, price: p.price });
      }
    }
  }

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
    moq: 1,
    datasheetUrl: r.datasheetUrl || "",
  };
}

const CatalogBody = ({ products: filteredProducts }: { products: Product[] }) => {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t } = useI18n();

  return (
    <tbody>
      {filteredProducts.map((p) => (
        <tr key={p.id}>
          <td className="text-center">
            <input
              type="checkbox"
              checked={isInCompare(p.id)}
              onChange={() => isInCompare(p.id) ? removeFromCompare(p.id) : addToCompare(p)}
              className="rounded border-border text-accent focus:ring-accent h-3.5 w-3.5"
              title={t("product.compare")}
            />
          </td>
          <td>
            <Link to={`/product/${p.id}`} className="font-mono text-sm font-medium text-primary hover:text-accent hover:underline">
              {p.partNumber}
            </Link>
          </td>
          <td className="text-sm">{p.manufacturer}</td>
          <td className="text-xs text-muted-foreground">{p.description}</td>
          <td className="text-xs font-mono">{p.package}</td>
          <td>
            <span className={`chip ${p.stock > 0 ? "chip-success" : "chip-warning"}`}>
              {p.stock > 0 ? p.stock.toLocaleString() : t("catalog.contact")}
            </span>
          </td>
          <td className="text-right">
            <div className="text-sm font-semibold">${p.priceTiers[0].price.toFixed(p.priceTiers[0].price < 1 ? 4 : 2)}</div>
            <div className="text-[10px] text-muted-foreground">qty {p.priceTiers[0].qty}+</div>
          </td>
        </tr>
      ))}
      {filteredProducts.length === 0 && (
        <tr>
          <td colSpan={7} className="text-center py-12 text-muted-foreground">
            {t("catalog.no_products")}
          </td>
        </tr>
      )}
    </tbody>
  );
};

const FilterGroup = ({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) => (
  <div>
    <h3 className="text-xs font-semibold text-foreground mb-2">{title}</h3>
    <div className="space-y-1">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="rounded border-border text-accent focus:ring-accent h-3.5 w-3.5"
          />
          <span className="truncate">{opt}</span>
        </label>
      ))}
    </div>
  </div>
);

export default Catalog;
