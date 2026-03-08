import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Filter, X, Download, GitCompare, Loader2, ShoppingCart, Check, ExternalLink, ArrowUpDown } from "lucide-react";
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
  const digikey = useDigiKeySearch();

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

  // Auto-search external sources when local results are empty and there's a query
  useEffect(() => {
    if (query && filteredProducts.length === 0) {
      octopart.search(query);
      digikey.search(query);
    } else {
      octopart.clear();
      digikey.clear();
    }
  }, [query, filteredProducts.length]);

  const uniqueValues = (key: keyof Product) => [...new Set(products.map((p) => String(p[key])))].sort();

  const activeFilterCount = Object.values(filters).flat().length;

  const showExternalSearch = query && filteredProducts.length === 0;
  const externalLoading = octopart.loading || digikey.loading;
  const externalHasResults = octopart.results.length > 0 || digikey.results.length > 0;

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
              {showExternalSearch
                ? externalLoading
                  ? t("octopart.searching")
                  : `${(octopart.totalHits + digikey.totalHits).toLocaleString()} ${t("octopart.results")} (Octopart + DigiKey)`
                : `${filteredProducts.length} ${t("catalog.products_found")}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!showExternalSearch && (
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

        {showExternalSearch ? (
          <ExternalSearchResults octopart={octopart} digikey={digikey} />
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

/* ─── Combined External Search Results ─── */
const ExternalSearchResults = ({
  octopart,
  digikey,
}: {
  octopart: ReturnType<typeof useOctopartSearch>;
  digikey: ReturnType<typeof useDigiKeySearch>;
}) => {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "octopart" | "digikey">("all");

  const handleAddOctopart = (r: OctopartResult) => {
    const product = octopartToProduct(r);
    addToCart(product);
    const key = `octo-${r.mpn}`;
    setAddedKeys((prev) => new Set(prev).add(key));
    toast.success(t("cart.added"), { description: r.mpn });
    setTimeout(() => { setAddedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; }); }, 2000);
  };

  const handleAddDigiKey = (r: DigiKeyResult) => {
    const product = digikeyToProduct(r);
    addToCart(product);
    const key = `dk-${r.mpn}-${r.digiKeyPn}`;
    setAddedKeys((prev) => new Set(prev).add(key));
    toast.success(t("cart.added"), { description: r.mpn });
    setTimeout(() => { setAddedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; }); }, 2000);
  };

  const bothLoading = octopart.loading && digikey.loading;
  const anyLoading = octopart.loading || digikey.loading;
  const noResults = !anyLoading && octopart.results.length === 0 && digikey.results.length === 0;

  if (bothLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("octopart.searching")}</span>
      </div>
    );
  }

  if (noResults) {
    const errors = [octopart.error, digikey.error].filter(Boolean);
    return (
      <div>
        {errors.length > 0 && (
          <div className="max-w-3xl mx-auto mb-4 space-y-2">
            {errors.map((e, i) => (
              <div key={i} className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{e}</div>
            ))}
          </div>
        )}
        <div className="text-center py-12 text-muted-foreground">{t("catalog.no_products")}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Source tabs */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab("all")}
          className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Все источники
        </button>
        {octopart.results.length > 0 && (
          <button
            onClick={() => setActiveTab("octopart")}
            className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "octopart" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
          >
            Octopart ({octopart.results.length})
          </button>
        )}
        {digikey.results.length > 0 && (
          <button
            onClick={() => setActiveTab("digikey")}
            className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "digikey" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent hover:bg-accent/20"}`}
          >
            DigiKey ({digikey.results.length})
          </button>
        )}
        {anyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        <span className="text-xs text-muted-foreground ml-auto">{t("octopart.fallback_hint")}</span>
      </div>

      {/* Errors */}
      {octopart.error && activeTab !== "digikey" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">Octopart: {octopart.error}</div>
      )}
      {digikey.error && activeTab !== "octopart" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">DigiKey: {digikey.error}</div>
      )}

      {/* Octopart table */}
      {(activeTab === "all" || activeTab === "octopart") && octopart.results.length > 0 && (
        <div className="mb-6">
          {activeTab === "all" && (
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5">Octopart</span>
              {octopart.totalHits.toLocaleString()} {t("octopart.results")}
            </h3>
          )}
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
                  const key = `octo-${r.mpn}`;
                  return (
                    <tr key={key}>
                      <td>
                        <button onClick={() => handleAddOctopart(r)} className={`p-1.5 rounded-md transition-colors ${addedKeys.has(key) ? "text-green-600 bg-green-50" : "text-primary hover:bg-muted"}`} title={t("product.add_to_cart")}>
                          {addedKeys.has(key) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => setExpandedRow(expandedRow === key ? null : key)} className="font-mono text-sm font-medium text-primary hover:text-accent hover:underline text-left">
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
                            <div className="text-sm font-semibold">${bestPrice.price.toFixed(bestPrice.price < 1 ? 4 : 2)}</div>
                            <div className="text-[10px] text-muted-foreground">qty {bestPrice.quantity}+</div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
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
        </div>
      )}

      {/* DigiKey table */}
      {(activeTab === "all" || activeTab === "digikey") && digikey.results.length > 0 && (
        <div className="mb-6">
          {activeTab === "all" && (
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="bg-accent/10 text-accent rounded px-1.5 py-0.5">DigiKey</span>
              {digikey.totalHits.toLocaleString()} {t("octopart.results")}
            </h3>
          )}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th className="min-w-[140px]">{t("catalog.part_number")}</th>
                  <th>{t("catalog.manufacturer")}</th>
                  <th className="min-w-[250px]">{t("catalog.description")}</th>
                  <th>{t("catalog.package")}</th>
                  <th>{t("catalog.stock")}</th>
                  <th className="text-right">{t("catalog.price")}</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {digikey.results.map((r) => {
                  const bestPrice = getDigiKeyBestPrice(r.priceTiers);
                  const key = `dk-${r.mpn}-${r.digiKeyPn}`;
                  return (
                    <tr key={key}>
                      <td>
                        <button onClick={() => handleAddDigiKey(r)} className={`p-1.5 rounded-md transition-colors ${addedKeys.has(key) ? "text-green-600 bg-green-50" : "text-primary hover:bg-muted"}`} title={t("product.add_to_cart")}>
                          {addedKeys.has(key) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => setExpandedRow(expandedRow === key ? null : key)} className="font-mono text-sm font-medium text-primary hover:text-accent hover:underline text-left">
                          {r.mpn}
                        </button>
                        {r.digiKeyPn && <div className="text-[10px] text-muted-foreground">{r.digiKeyPn}</div>}
                      </td>
                      <td className="text-sm">{r.manufacturer}</td>
                      <td className="text-xs text-muted-foreground">{r.description}</td>
                      <td className="text-xs font-mono">{r.packageType}</td>
                      <td>
                        <span className={`chip ${r.stock > 0 ? "chip-success" : "chip-warning"}`}>
                          {r.stock > 0 ? r.stock.toLocaleString() : t("catalog.contact")}
                        </span>
                      </td>
                      <td className="text-right">
                        {bestPrice ? (
                          <div>
                            <div className="text-sm font-semibold">${bestPrice.price.toFixed(bestPrice.price < 1 ? 4 : 2)}</div>
                            <div className="text-[10px] text-muted-foreground">qty {bestPrice.quantity}+</div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
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
        </div>
      )}

      {/* Expanded detail for Octopart */}
      {expandedRow?.startsWith("octo-") && (() => {
        const mpn = expandedRow.replace("octo-", "");
        const r = octopart.results.find((x) => x.mpn === mpn);
        if (!r) return null;
        return (
          <div className="mt-4 border border-border rounded-lg p-5 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{r.mpn} <span className="text-xs font-normal text-primary bg-primary/10 rounded px-1.5 py-0.5 ml-2">Octopart</span></h2>
              <div className="flex items-center gap-3">
                <button onClick={() => handleAddOctopart(r)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <ShoppingCart className="h-4 w-4" /> {t("product.add_to_cart")}
                </button>
                <button onClick={() => setExpandedRow(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ {t("octopart.close")}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  <span key={j} className="text-foreground font-medium">{p.quantity}+: ${p.price.toFixed(p.price < 1 ? 4 : 2)}</span>
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

      {/* Expanded detail for DigiKey */}
      {expandedRow?.startsWith("dk-") && (() => {
        const rest = expandedRow.replace("dk-", "");
        const r = digikey.results.find((x) => `${x.mpn}-${x.digiKeyPn}` === rest);
        if (!r) return null;
        return (
          <div className="mt-4 border border-border rounded-lg p-5 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{r.mpn} <span className="text-xs font-normal text-accent bg-accent/10 rounded px-1.5 py-0.5 ml-2">DigiKey</span></h2>
              <div className="flex items-center gap-3">
                {r.productUrl && (
                  <a href={r.productUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> DigiKey
                  </a>
                )}
                <button onClick={() => handleAddDigiKey(r)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <ShoppingCart className="h-4 w-4" /> {t("product.add_to_cart")}
                </button>
                <button onClick={() => setExpandedRow(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ {t("octopart.close")}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {r.priceTiers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Ценовые уровни DigiKey</h3>
                  <div className="space-y-1">
                    {r.priceTiers.map((t, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{t.quantity}+</span>
                        <span className="font-medium text-foreground">${t.price.toFixed(t.price < 1 ? 4 : 2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
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

function digikeyToProduct(r: DigiKeyResult): Product {
  const priceTiers = r.priceTiers.map((t) => ({ qty: t.quantity, price: t.price }));
  if (priceTiers.length === 0) priceTiers.push({ qty: 1, price: 0 });

  return {
    id: `digikey-${r.digiKeyPn || r.mpn}`,
    partNumber: r.mpn,
    manufacturer: r.manufacturer || "Unknown",
    category: "DigiKey",
    subcategory: "",
    description: r.description || "",
    package: r.packageType || "",
    temperatureRange: r.specs.find((s) => s.name.toLowerCase().includes("temp"))?.value || "",
    rohs: r.rohs?.toLowerCase().includes("compliant") ?? false,
    stock: r.stock,
    leadTime: r.stock > 0 ? "In Stock" : "Contact",
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
