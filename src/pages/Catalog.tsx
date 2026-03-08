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
                  ? t("ext.searching_all")
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

/* ─── Unified item for sorting ─── */
interface UnifiedItem {
  key: string;
  source: "octopart" | "digikey";
  mpn: string;
  manufacturer: string;
  description: string;
  packageType: string;
  stock: number;
  unitPrice: number | null;
  priceLabel: string;
  priceSub: string;
  datasheetUrl: string | null;
  productUrl: string | null;
  raw: OctopartResult | DigiKeyResult;
}

type ExtSortKey = "mpn" | "manufacturer" | "price" | "stock" | "source";

function buildUnifiedItems(
  octoResults: OctopartResult[],
  dkResults: DigiKeyResult[]
): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  for (const r of octoResults) {
    const bestPrice = getBestPrice(r.sellers);
    const totalStock = getTotalStock(r.sellers);
    items.push({
      key: `octo-${r.mpn}`,
      source: "octopart",
      mpn: r.mpn,
      manufacturer: r.manufacturer || "",
      description: r.description || "",
      packageType: r.specs.find((s) => s.name.toLowerCase().includes("package"))?.value || "",
      stock: totalStock,
      unitPrice: bestPrice?.price ?? null,
      priceLabel: bestPrice ? `$${bestPrice.price.toFixed(bestPrice.price < 1 ? 4 : 2)}` : "—",
      priceSub: bestPrice ? `qty ${bestPrice.quantity}+` : "",
      datasheetUrl: r.datasheetUrl || null,
      productUrl: null,
      raw: r,
    });
  }

  for (const r of dkResults) {
    const bestPrice = getDigiKeyBestPrice(r.priceTiers);
    items.push({
      key: `dk-${r.mpn}-${r.digiKeyPn}`,
      source: "digikey",
      mpn: r.mpn,
      manufacturer: r.manufacturer || "",
      description: r.description || "",
      packageType: r.packageType || "",
      stock: r.stock,
      unitPrice: bestPrice?.price ?? null,
      priceLabel: bestPrice ? `$${bestPrice.price.toFixed(bestPrice.price < 1 ? 4 : 2)}` : "—",
      priceSub: bestPrice ? `qty ${bestPrice.quantity}+` : "",
      datasheetUrl: r.datasheetUrl || null,
      productUrl: r.productUrl || null,
      raw: r,
    });
  }

  return items;
}

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
  const [extSortKey, setExtSortKey] = useState<ExtSortKey>("price");
  const [extSortDir, setExtSortDir] = useState<"asc" | "desc">("asc");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (key: string) => quantities[key] ?? 1;
  const setQty = (key: string, val: number) => setQuantities((prev) => ({ ...prev, [key]: Math.max(1, val) }));

  const toggleExtSort = useCallback((key: ExtSortKey) => {
    if (extSortKey === key) setExtSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setExtSortKey(key); setExtSortDir("asc"); }
  }, [extSortKey]);

  const ExtSortIcon = ({ col }: { col: ExtSortKey }) => {
    if (extSortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return extSortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const handleAdd = useCallback((item: UnifiedItem, qty?: number) => {
    const quantity = qty ?? getQty(item.key);
    const product = item.source === "octopart"
      ? octopartToProduct(item.raw as OctopartResult)
      : digikeyToProduct(item.raw as DigiKeyResult);
    addToCart(product, quantity);
    setAddedKeys((prev) => new Set(prev).add(item.key));
    toast.success(t("cart.added"), { description: `${item.mpn} × ${quantity}` });
    setTimeout(() => { setAddedKeys((prev) => { const n = new Set(prev); n.delete(item.key); return n; }); }, 2000);
  }, [addToCart, t, quantities]);

  const allItems = useMemo(
    () => buildUnifiedItems(octopart.results, digikey.results),
    [octopart.results, digikey.results]
  );

  const sortedItems = useMemo(() => {
    let items = [...allItems];

    // Filter by tab
    if (activeTab === "octopart") items = items.filter((i) => i.source === "octopart");
    if (activeTab === "digikey") items = items.filter((i) => i.source === "digikey");

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (extSortKey) {
        case "mpn": cmp = a.mpn.localeCompare(b.mpn); break;
        case "manufacturer": cmp = a.manufacturer.localeCompare(b.manufacturer); break;
        case "price": {
          const pa = a.unitPrice ?? Infinity;
          const pb = b.unitPrice ?? Infinity;
          cmp = pa - pb;
          break;
        }
        case "stock": cmp = a.stock - b.stock; break;
        case "source": cmp = a.source.localeCompare(b.source); break;
      }
      return extSortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [allItems, activeTab, extSortKey, extSortDir]);

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
      {/* Source tabs + sort info */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab("all")}
          className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          {t("ext.all_sources")} ({allItems.length})
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
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {t("ext.sort_label")}: {extSortKey === "price" ? t("ext.sort_price") : extSortKey === "stock" ? t("ext.sort_stock") : extSortKey === "mpn" ? t("ext.sort_mpn") : extSortKey === "manufacturer" ? t("ext.sort_manufacturer") : t("ext.sort_source")} ({extSortDir === "asc" ? "↑" : "↓"})
        </span>
      </div>

      {/* Errors */}
      {octopart.error && activeTab !== "digikey" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">Octopart: {octopart.error}</div>
      )}
      {digikey.error && activeTab !== "octopart" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">DigiKey: {digikey.error}</div>
      )}

      {/* Unified table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th className="w-16 cursor-pointer" onClick={() => toggleExtSort("source")}>
                <span className="flex items-center gap-1">{t("ext.source")} <ExtSortIcon col="source" /></span>
              </th>
              <th className="min-w-[140px] cursor-pointer" onClick={() => toggleExtSort("mpn")}>
                <span className="flex items-center gap-1">{t("catalog.part_number")} <ExtSortIcon col="mpn" /></span>
              </th>
              <th className="cursor-pointer" onClick={() => toggleExtSort("manufacturer")}>
                <span className="flex items-center gap-1">{t("catalog.manufacturer")} <ExtSortIcon col="manufacturer" /></span>
              </th>
              <th className="min-w-[200px]">{t("catalog.description")}</th>
              <th>{t("catalog.package")}</th>
              <th className="cursor-pointer" onClick={() => toggleExtSort("stock")}>
                <span className="flex items-center gap-1">{t("catalog.stock")} <ExtSortIcon col="stock" /></span>
              </th>
              <th className="text-right cursor-pointer" onClick={() => toggleExtSort("price")}>
                <span className="flex items-center gap-1 justify-end">{t("catalog.price")} <ExtSortIcon col="price" /></span>
              </th>
              <th className="w-[130px]">{t("product.qty")}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.key}>
                <td>
                  <button
                    onClick={() => handleAdd(item)}
                    className={`p-1.5 rounded-md transition-colors ${addedKeys.has(item.key) ? "text-green-600 bg-green-50" : "text-primary hover:bg-muted"}`}
                    title={t("product.add_to_cart")}
                  >
                    {addedKeys.has(item.key) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </button>
                </td>
                <td>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                    item.source === "octopart"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/10 text-accent"
                  }`}>
                    {item.source === "octopart" ? "Octopart" : "DigiKey"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => setExpandedRow(expandedRow === item.key ? null : item.key)}
                    className="font-mono text-sm font-medium text-primary hover:text-accent hover:underline text-left"
                  >
                    {item.mpn}
                  </button>
                  {item.source === "digikey" && (item.raw as DigiKeyResult).digiKeyPn && (
                    <div className="text-[10px] text-muted-foreground">{(item.raw as DigiKeyResult).digiKeyPn}</div>
                  )}
                </td>
                <td className="text-sm">{item.manufacturer}</td>
                <td className="text-xs text-muted-foreground">{item.description}</td>
                <td className="text-xs font-mono">{item.packageType}</td>
                <td>
                  <span className={`chip ${item.stock > 0 ? "chip-success" : "chip-warning"}`}>
                    {item.stock > 0 ? item.stock.toLocaleString() : t("catalog.contact")}
                  </span>
                </td>
                <td className="text-right">
                  {item.unitPrice !== null ? (
                    <div>
                      <div className="text-sm font-semibold">{item.priceLabel}</div>
                      <div className="text-[10px] text-muted-foreground">{item.priceSub}</div>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQty(item.key, getQty(item.key) - 1)}
                      className="w-6 h-6 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      value={getQty(item.key)}
                      onChange={(e) => setQty(item.key, parseInt(e.target.value) || 1)}
                      className="w-12 h-6 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQty(item.key, getQty(item.key) + 1)}
                      className="w-6 h-6 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                </td>
                <td>
                  {item.datasheetUrl && (
                    <a href={item.datasheetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent" title={t("product.datasheet")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <button onClick={() => handleAdd(allItems.find((i) => i.key === expandedRow)!)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
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
                <button onClick={() => handleAdd(allItems.find((i) => i.key === expandedRow)!)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
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
                  <h3 className="text-sm font-semibold text-foreground mb-2">{t("ext.digikey_price_tiers")}</h3>
                  <div className="space-y-1">
                    {r.priceTiers.map((tier, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{tier.quantity}+</span>
                        <span className="font-medium text-foreground">${tier.price.toFixed(tier.price < 1 ? 4 : 2)}</span>
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
