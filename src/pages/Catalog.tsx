import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Filter, X, Download, GitCompare } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { products, categories, Product } from "@/data/mockData";
import { useCompare } from "@/contexts/CompareContext";

type SortKey = "partNumber" | "manufacturer" | "price" | "stock";

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const subSlug = searchParams.get("sub") || "";

  const [sortKey, setSortKey] = useState<SortKey>("partNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(true);

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

  const uniqueValues = (key: keyof Product) => [...new Set(products.map((p) => String(p[key])))].sort();

  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {query ? `Search: "${query}"` : categorySlug ? categories.find((c) => c.slug === categorySlug)?.name || "Catalog" : "Full Catalog"}
          </span>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {query ? `Results for "${query}"` : "Product Catalog"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filteredProducts.length} products found</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-56 shrink-0 hidden lg:block space-y-5">
              <FilterGroup
                title="Manufacturer"
                options={uniqueValues("manufacturer")}
                selected={filters.manufacturer || []}
                onToggle={(v) => toggleFilter("manufacturer", v)}
              />
              <FilterGroup
                title="Package"
                options={uniqueValues("package")}
                selected={filters.package || []}
                onToggle={(v) => toggleFilter("package", v)}
              />
              <FilterGroup
                title="RoHS"
                options={["Yes", "No"]}
                selected={filters.rohs || []}
                onToggle={(v) => toggleFilter("rohs", v)}
              />
              <FilterGroup
                title="Availability"
                options={["In Stock"]}
                selected={filters.stock || []}
                onToggle={(v) => toggleFilter("stock", v)}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <X className="h-3 w-3" /> Clear all filters
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
                    <span className="flex items-center gap-1">Part Number <SortIcon col="partNumber" /></span>
                  </th>
                  <th onClick={() => toggleSort("manufacturer")}>
                    <span className="flex items-center gap-1">Manufacturer <SortIcon col="manufacturer" /></span>
                  </th>
                  <th className="min-w-[250px]">Description</th>
                  <th>Package</th>
                  <th onClick={() => toggleSort("stock")}>
                    <span className="flex items-center gap-1">Stock <SortIcon col="stock" /></span>
                  </th>
                  <th onClick={() => toggleSort("price")} className="text-right">
                    <span className="flex items-center gap-1 justify-end">Price <SortIcon col="price" /></span>
                  </th>
                </tr>
              </thead>
              <CatalogBody products={filteredProducts} />
            </table>
          </div>
        </div>
      </div>
    </Layout>
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
