import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Filter, X, Download, GitCompare, Loader2, ShoppingCart, Check, ExternalLink, ArrowUpDown, ArrowLeft, Search, Upload, LayoutGrid, List, ChevronRight, SlidersHorizontal, Warehouse } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { products, categories, Product } from "@/data/mockData";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useOctopartSearch, getBestPrice, getTotalStock, type OctopartResult } from "@/hooks/useOctopartSearch";
import { useDigiKeySearch, getDigiKeyBestPrice, type DigiKeyResult } from "@/hooks/useDigiKeySearch";
import { useInventorySearch, type InventoryItem } from "@/hooks/useInventorySearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SortKey = "partNumber" | "manufacturer" | "price" | "stock";

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const subSlug = searchParams.get("sub") || "";
  const { t, tc } = useI18n();
  const { addToCart } = useCart();

  const [sortKey, setSortKey] = useState<SortKey>("partNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [localSearch, setLocalSearch] = useState("");
  const [mfgSearch, setMfgSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [authorizedOnly, setAuthorizedOnly] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ category: true, manufacturer: true, availability: true });

  const octopart = useOctopartSearch();
  const digikey = useDigiKeySearch();
  const searchTerm = query || localSearch;
  const inventorySearch = useInventorySearch(searchTerm);

  // Fetch distinct manufacturers from inventory DB
  const { data: inventoryManufacturers } = useQuery({
    queryKey: ["inventory-manufacturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("manufacturer")
        .not("manufacturer", "is", null);
      if (error) throw error;
      const unique = new Set<string>();
      data?.forEach((row) => { if (row.manufacturer) unique.add(row.manufacturer); });
      return Array.from(unique);
    },
    staleTime: 60_000,
  });

  // Fetch inventory items filtered by selected manufacturers
  const selectedMfgs = filters.manufacturer || [];
  const { data: inventoryByMfg, isLoading: inventoryByMfgLoading } = useQuery({
    queryKey: ["inventory-by-manufacturer", selectedMfgs],
    queryFn: async () => {
      if (selectedMfgs.length === 0) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("id, part_number, manufacturer, description, quantity, price, currency, location")
        .in("manufacturer", selectedMfgs)
        .gt("quantity", 0)
        .limit(100);
      if (error) throw error;
      return (data as InventoryItem[]) ?? [];
    },
    enabled: selectedMfgs.length > 0,
    staleTime: 30_000,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const toggleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const handleAddToCart = useCallback((p: Product) => {
    addToCart(p, 1);
    setAddedIds((prev) => new Set(prev).add(p.id));
    toast.success(t("cart.added"), { description: p.partNumber });
    setTimeout(() => { setAddedIds((prev) => { const n = new Set(prev); n.delete(p.id); return n; }); }, 2000);
  }, [addToCart, t]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Global query from URL
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

    // Local search within catalog
    if (localSearch) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
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
    if (filters.stock?.length) {
      result = result.filter((p) => {
        if (filters.stock.includes("In Stock") && p.stock > 0) return true;
        if (filters.stock.includes("On Order") && p.stock === 0 && p.leadTime !== "Contact") return true;
        if (filters.stock.includes("Preorder") && p.leadTime === "Contact") return true;
        return false;
      });
    }

    if (inStockOnly) result = result.filter((p) => p.stock > 0);

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
  }, [query, localSearch, categorySlug, subSlug, filters, sortKey, sortDir, inStockOnly]);

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

  const uniqueManufacturers = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.manufacturer] = (counts[p.manufacturer] || 0) + 1;
    }
    // Merge manufacturers from inventory DB
    if (inventoryManufacturers) {
      for (const m of inventoryManufacturers) {
        if (!counts[m]) counts[m] = 0;
      }
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([name]) => !mfgSearch || name.toLowerCase().includes(mfgSearch.toLowerCase()));
  }, [mfgSearch, inventoryManufacturers]);

  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, []);

  const stockCounts = useMemo(() => {
    const inStock = products.filter((p) => p.stock > 0).length;
    const onOrder = products.filter((p) => p.stock === 0 && p.leadTime !== "Contact").length;
    const preorder = products.filter((p) => p.leadTime === "Contact").length;
    return { inStock, onOrder, preorder };
  }, []);

  const activeFilterCount = Object.values(filters).flat().length;
  const showExternalSearch = query && filteredProducts.length === 0;
  const externalLoading = octopart.loading || digikey.loading;

  // Determine if warehouse items will be shown
  const hasWarehouseItems = useMemo(() => {
    const hasSearch = searchTerm.length >= 2;
    if (hasSearch && selectedMfgs.length > 0) {
      return (inventorySearch.data ?? []).some(item => item.manufacturer && selectedMfgs.includes(item.manufacturer));
    }
    if (hasSearch) return (inventorySearch.data ?? []).length > 0;
    if (selectedMfgs.length > 0) return (inventoryByMfg ?? []).length > 0;
    return false;
  }, [searchTerm, selectedMfgs, inventorySearch.data, inventoryByMfg]);

  const getAvailabilityBadge = (p: Product) => {
    if (p.stock > 0) return { label: t("catalog.in_stock"), cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    if (p.leadTime === "Contact") return { label: t("catalog.preorder"), cls: "bg-violet-500/15 text-violet-400 border-violet-500/30" };
    return { label: t("catalog.on_order"), cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  };

  return (
    <Layout>
      {/* Top bar with back, search, BOM */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground shrink-0">
              {query ? `${t("catalog.results_for")} "${query}"` : t("catalog.title")}
            </h1>
            <div className="flex-1 max-w-lg ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("catalog.search_placeholder")}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <Link
              to="/bom"
              className="flex items-center gap-2 rounded-md border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
            >
              <Upload className="h-4 w-4" />
              {t("catalog.upload_bom")}
            </Link>
          </div>

          {/* Filter chips + view toggle */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${inStockOnly ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
            >
              {t("catalog.in_stock_only")}
            </button>
            <button
              onClick={() => setAuthorizedOnly(!authorizedOnly)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${authorizedOnly ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
            >
              {t("catalog.authorized")}
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Warehouse section */}
        {(() => {
          const hasSearch = searchTerm.length >= 2;
          let warehouseItems = hasSearch ? (inventorySearch.data ?? []) : [];
          let warehouseLoading = hasSearch ? inventorySearch.isLoading : false;
          let warehouseLabel = searchTerm;

          // Filter search results by selected manufacturers
          if (hasSearch && selectedMfgs.length > 0) {
            warehouseItems = warehouseItems.filter(item => item.manufacturer && selectedMfgs.includes(item.manufacturer));
          }

          // If no search but manufacturer filter active, use manufacturer query
          if (!hasSearch && selectedMfgs.length > 0) {
            warehouseItems = inventoryByMfg ?? [];
            warehouseLoading = inventoryByMfgLoading;
            warehouseLabel = selectedMfgs.join(", ");
          }

          
          const show = (hasSearch || selectedMfgs.length > 0) && (warehouseItems.length > 0 || warehouseLoading);
          return show ? (
            <WarehouseSection
              items={warehouseItems}
              loading={warehouseLoading}
              searchTerm={warehouseLabel}
            />
          ) : null;
        })()}

        {showExternalSearch ? (
          <ExternalSearchResults octopart={octopart} digikey={digikey} />
        ) : (
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="w-64 shrink-0 hidden lg:block">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                  <span className="font-bold text-foreground text-base">{t("catalog.filters")}</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => setFilters({})}
                      className="ml-auto text-xs text-destructive hover:underline"
                    >
                      {t("catalog.clear_filters")}
                    </button>
                  )}
                </div>

                {/* Category filter */}
                <div className="border-b border-border">
                  <button
                    onClick={() => setOpenSections(s => ({ ...s, category: !s.category }))}
                    className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {t("catalog.category")}
                    {openSections.category ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {openSections.category && (
                    <div className="px-5 pb-4 space-y-3">
                      {categories.map((cat) => (
                        <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={categorySlug === cat.slug}
                            onChange={() => {
                              if (categorySlug === cat.slug) navigate("/catalog");
                              else navigate(`/catalog?category=${cat.slug}`);
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground truncate flex-1">{tc(cat.name)}</span>
                          <span className="text-xs text-muted-foreground/60">({categoryProductCounts[cat.name] || 0})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manufacturer filter */}
                <div className="border-b border-border">
                  <button
                    onClick={() => setOpenSections(s => ({ ...s, manufacturer: !s.manufacturer }))}
                    className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {t("catalog.manufacturer")}
                    {openSections.manufacturer ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {openSections.manufacturer && (
                    <div className="px-5 pb-4">
                      <input
                        type="text"
                        placeholder={t("catalog.search_manufacturer")}
                        value={mfgSearch}
                        onChange={(e) => setMfgSearch(e.target.value)}
                        className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      />
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {uniqueManufacturers.map(([name, count]) => (
                          <label key={name} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(filters.manufacturer || []).includes(name)}
                              onChange={() => toggleFilter("manufacturer", name)}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
                            />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground truncate flex-1">{name}</span>
                            <span className="text-xs text-muted-foreground/60">({count})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability filter */}
                <div>
                  <button
                    onClick={() => setOpenSections(s => ({ ...s, availability: !s.availability }))}
                    className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {t("catalog.availability")}
                    {openSections.availability ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {openSections.availability && (
                    <div className="px-5 pb-4 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={(filters.stock || []).includes("In Stock")} onChange={() => toggleFilter("stock", "In Stock")} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{t("catalog.in_stock")}</span>
                        <span className="text-xs text-muted-foreground/60">({stockCounts.inStock})</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={(filters.stock || []).includes("On Order")} onChange={() => toggleFilter("stock", "On Order")} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{t("catalog.on_order")}</span>
                        <span className="text-xs text-muted-foreground/60">({stockCounts.onOrder})</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={(filters.stock || []).includes("Preorder")} onChange={() => toggleFilter("stock", "Preorder")} className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{t("catalog.preorder")}</span>
                        <span className="text-xs text-muted-foreground/60">({stockCounts.preorder})</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* Count */}
              {(filteredProducts.length > 0 || !hasWarehouseItems) && (
              <div className="text-sm text-muted-foreground mb-4">
                {t("catalog.shown_of")} <span className="font-bold text-foreground">{filteredProducts.length}</span> {t("catalog.of")} {products.length} {t("catalog.products")}
              </div>
              )}

              {(filteredProducts.length > 0 || !hasWarehouseItems) && (viewMode === "list" ? (
                /* List / Table view */
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("partNumber")}>
                          <span className="flex items-center gap-1">{t("catalog.part_number")} <SortIcon col="partNumber" /></span>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("manufacturer")}>
                          <span className="flex items-center gap-1">{t("catalog.manufacturer")} <SortIcon col="manufacturer" /></span>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[200px]">{t("catalog.description")}</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("stock")}>
                          <span className="flex items-center gap-1">{t("catalog.stock")} <SortIcon col="stock" /></span>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("price")}>
                          <span className="flex items-center gap-1">{t("catalog.price")} <SortIcon col="price" /></span>
                        </th>
                        <th className="px-4 py-3 w-[120px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const badge = getAvailabilityBadge(p);
                        const added = addedIds.has(p.id);
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3">
                              <Link to={`/product/${p.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                {p.description.split(",")[0] || p.partNumber}
                              </Link>
                              <div className="text-xs text-primary font-mono mt-0.5">{p.partNumber}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{p.manufacturer}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{p.description}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-foreground">${p.priceTiers[0].price.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleAddToCart(p)}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                  added
                                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                    : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                }`}
                              >
                                {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                                {t("catalog.add_to_cart")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && !hasWarehouseItems && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            {t("catalog.no_products")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid view */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => {
                    const badge = getAvailabilityBadge(p);
                    const added = addedIds.has(p.id);
                    return (
                      <div key={p.id} className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow">
                        <Link to={`/product/${p.id}`} className="font-semibold text-foreground hover:text-primary text-sm transition-colors">
                          {p.description.split(",")[0] || p.partNumber}
                        </Link>
                        <div className="text-xs text-primary font-mono mt-0.5">{p.partNumber}</div>
                        <div className="text-xs text-muted-foreground mt-1">{p.manufacturer}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-foreground">${p.priceTiers[0].price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className={`w-full mt-3 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                            added
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          }`}
                        >
                          {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                          {t("catalog.add_to_cart")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

/* ─── Warehouse Section ─── */
function WarehouseSection({
  items,
  loading,
  searchTerm,
}: {
  items: InventoryItem[];
  loading: boolean;
  searchTerm: string;
}) {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (item: InventoryItem) => {
    const product: Product = {
      id: `inv-${item.id}`,
      partNumber: item.part_number,
      manufacturer: item.manufacturer || "",
      description: item.description || "",
      category: "Inventory",
      subcategory: "",
      stock: item.quantity,
      leadTime: "In Stock",
      rohs: true,
      datasheetUrl: "",
      temperatureRange: "",
      priceTiers: [{ qty: 1, price: item.price ?? 0 }],
      moq: 1,
      package: "",
    };
    addToCart(product, 1);
    setAddedIds((prev) => new Set(prev).add(item.id));
    toast.success("Добавлено в корзину", { description: `${item.part_number} × 1` });
    setTimeout(() => {
      setAddedIds((prev) => {
        const n = new Set(prev);
        n.delete(item.id);
        return n;
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="mb-5 rounded-lg border border-border bg-card p-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Поиск по складу…
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/20">
        <Warehouse className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Наш склад</span>
        <span className="ml-1 rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-medium">{items.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Артикул</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Производитель</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">Описание</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Кол-во</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цена</th>
              <th className="px-4 py-2 w-[110px]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const added = addedIds.has(item.id);
              return (
                <tr key={item.id} className="border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold text-primary">{item.part_number}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{item.manufacturer || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.description || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground text-sm">
                    {item.price != null ? `${item.price.toFixed(2)} ${item.currency ?? "RUB"}` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => handleAdd(item)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        added
                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                          : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                      В корзину
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
    if (activeTab === "octopart") items = items.filter((i) => i.source === "octopart");
    if (activeTab === "digikey") items = items.filter((i) => i.source === "digikey");

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
      {/* Source tabs */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <button onClick={() => setActiveTab("all")} className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          {t("ext.all_sources")} ({allItems.length})
        </button>
        {octopart.results.length > 0 && (
          <button onClick={() => setActiveTab("octopart")} className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "octopart" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            Octopart ({octopart.results.length})
          </button>
        )}
        {digikey.results.length > 0 && (
          <button onClick={() => setActiveTab("digikey")} className={`text-xs font-medium rounded px-2 py-0.5 transition-colors ${activeTab === "digikey" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent hover:bg-accent/20"}`}>
            DigiKey ({digikey.results.length})
          </button>
        )}
        {anyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {t("ext.sort_label")}: {extSortKey === "price" ? t("ext.sort_price") : extSortKey === "stock" ? t("ext.sort_stock") : extSortKey === "mpn" ? t("ext.sort_mpn") : extSortKey === "manufacturer" ? t("ext.sort_manufacturer") : t("ext.sort_source")} ({extSortDir === "asc" ? "↑" : "↓"})
        </span>
      </div>

      {octopart.error && activeTab !== "digikey" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">Octopart: {octopart.error}</div>
      )}
      {digikey.error && activeTab !== "octopart" && (
        <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">DigiKey: {digikey.error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 w-10"></th>
              <th className="px-3 py-2.5 w-16 cursor-pointer text-left text-xs font-semibold text-muted-foreground uppercase" onClick={() => toggleExtSort("source")}>
                <span className="flex items-center gap-1">{t("ext.source")} <ExtSortIcon col="source" /></span>
              </th>
              <th className="px-3 py-2.5 min-w-[140px] cursor-pointer text-left text-xs font-semibold text-muted-foreground uppercase" onClick={() => toggleExtSort("mpn")}>
                <span className="flex items-center gap-1">{t("catalog.part_number")} <ExtSortIcon col="mpn" /></span>
              </th>
              <th className="px-3 py-2.5 cursor-pointer text-left text-xs font-semibold text-muted-foreground uppercase" onClick={() => toggleExtSort("manufacturer")}>
                <span className="flex items-center gap-1">{t("catalog.manufacturer")} <ExtSortIcon col="manufacturer" /></span>
              </th>
              <th className="px-3 py-2.5 min-w-[200px] text-left text-xs font-semibold text-muted-foreground uppercase">{t("catalog.description")}</th>
              <th className="px-3 py-2.5 cursor-pointer text-left text-xs font-semibold text-muted-foreground uppercase" onClick={() => toggleExtSort("stock")}>
                <span className="flex items-center gap-1">{t("catalog.stock")} <ExtSortIcon col="stock" /></span>
              </th>
              <th className="px-3 py-2.5 text-right cursor-pointer text-xs font-semibold text-muted-foreground uppercase" onClick={() => toggleExtSort("price")}>
                <span className="flex items-center gap-1 justify-end">{t("catalog.price")} <ExtSortIcon col="price" /></span>
              </th>
              <th className="px-3 py-2.5 w-[130px] text-xs font-semibold text-muted-foreground uppercase">{t("product.qty")}</th>
              <th className="px-3 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.key} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleAdd(item)}
                    className={`p-1.5 rounded-md transition-colors ${addedKeys.has(item.key) ? "text-emerald-600 bg-emerald-50" : "text-primary hover:bg-muted"}`}
                    title={t("product.add_to_cart")}
                  >
                    {addedKeys.has(item.key) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                    item.source === "octopart" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    {item.source === "octopart" ? "Octopart" : "DigiKey"}
                  </span>
                </td>
                <td className="px-3 py-2">
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
                <td className="px-3 py-2 text-sm">{item.manufacturer}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{item.description}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${item.stock > 0 ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}`}>
                    {item.stock > 0 ? item.stock.toLocaleString() : t("catalog.contact")}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {item.unitPrice !== null ? (
                    <div>
                      <div className="text-sm font-semibold">{item.priceLabel}</div>
                      <div className="text-[10px] text-muted-foreground">{item.priceSub}</div>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setQty(item.key, getQty(item.key) - 1)} className="w-6 h-6 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center">−</button>
                    <input
                      type="number"
                      min={1}
                      value={getQty(item.key)}
                      onChange={(e) => setQty(item.key, parseInt(e.target.value) || 1)}
                      className="w-12 h-6 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => setQty(item.key, getQty(item.key) + 1)} className="w-6 h-6 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center">+</button>
                  </div>
                </td>
                <td className="px-3 py-2">
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

      {/* Expanded detail rows (kept from original) */}
      {expandedRow?.startsWith("octo-") && (() => {
        const mpn = expandedRow.replace("octo-", "");
        const r = octopart.results.find((x) => x.mpn === mpn);
        if (!r) return null;
        return (
          <div className="mt-4 border border-border rounded-lg p-5 bg-card">
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

      {expandedRow?.startsWith("dk-") && (() => {
        const rest = expandedRow.replace("dk-", "");
        const r = digikey.results.find((x) => `${x.mpn}-${x.digiKeyPn}` === rest);
        if (!r) return null;
        return (
          <div className="mt-4 border border-border rounded-lg p-5 bg-card">
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

export default Catalog;
