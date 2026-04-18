import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Cpu, Tag, Factory, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { products, categories } from "@/data/mockData";
import { useI18n } from "@/contexts/I18nContext";

interface Suggestion {
  type: "product" | "manufacturer" | "category" | "subcategory";
  label: string;
  sublabel?: string;
  url: string;
  icon: "product" | "manufacturer" | "category";
}

const POPULAR_SEARCHES = [
  "STM32", "ESP32", "LM358", "NE555", "ATmega328",
  "TL072", "ADS1115", "LM7805", "IRFZ44N", "MPU6050",
];

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, tc } = useI18n();

  // Unique manufacturers
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.manufacturer));
    return Array.from(set).sort();
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: Suggestion[] = [];

    // Products (by partNumber) — max 5
    const matchedProducts = products
      .filter((p) => p.partNumber.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .slice(0, 5);
    matchedProducts.forEach((p) => {
      results.push({
        type: "product",
        label: p.partNumber,
        sublabel: `${p.manufacturer} — ${p.description.slice(0, 60)}`,
        url: `/product/${p.id}`,
        icon: "product",
      });
    });

    // Manufacturers — max 3
    const matchedMfg = manufacturers
      .filter((m) => m.toLowerCase().includes(q))
      .slice(0, 3);
    matchedMfg.forEach((m) => {
      results.push({
        type: "manufacturer",
        label: m,
        sublabel: `${products.filter((p) => p.manufacturer === m).length} ${t("smart_search.products")}`,
        url: `/catalog?q=${encodeURIComponent(m)}`,
        icon: "manufacturer",
      });
    });

    // Categories & subcategories — max 4
    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(q)) {
        results.push({
          type: "category",
          label: tc(cat.name),
          sublabel: `${cat.subcategories.reduce((s, sc) => s + sc.count, 0).toLocaleString()} ${t("smart_search.products")}`,
          url: `/catalog?category=${cat.slug}`,
          icon: "category",
        });
      }
      cat.subcategories.forEach((sub) => {
        if (sub.name.toLowerCase().includes(q)) {
          results.push({
            type: "subcategory",
            label: tc(sub.name),
            sublabel: `${tc(cat.name)} · ${sub.count.toLocaleString()} ${t("smart_search.products")}`,
            url: `/catalog?category=${cat.slug}&sub=${sub.slug}`,
            icon: "category",
          });
        }
      });
    });

    return results.slice(0, 10);
  }, [query, manufacturers, t, tc]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      setQuery("");
      navigate(url);
    },
    [navigate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelect(suggestions[activeIndex].url);
    } else if (query.trim()) {
      setOpen(false);
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = suggestions.length || POPULAR_SEARCHES.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + total) % total);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const IconForType = ({ type }: { type: Suggestion["icon"] }) => {
    switch (type) {
      case "product": return <Cpu className="h-4 w-4 text-primary shrink-0" />;
      case "manufacturer": return <Factory className="h-4 w-4 text-accent shrink-0" />;
      case "category": return <Tag className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  const showPopular = open && query.length < 2;
  const showSuggestions = open && suggestions.length > 0 && query.length >= 2;

  return (
    <div className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("header.search_placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="search-input pl-10 pr-20"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-primary px-2.5 sm:px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
            aria-label={t("header.search")}
          >
            <Search className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">{t("header.search")}</span>
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {(showPopular || showSuggestions) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {showPopular && (
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 pb-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("smart_search.popular")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setOpen(true);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      activeIndex === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-foreground border-border hover:bg-muted hover:border-muted-foreground/20"
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="py-1">
              {/* Group headers */}
              {["product", "manufacturer", "category", "subcategory"].map((type) => {
                const items = suggestions.filter((s) => s.type === type);
                if (!items.length) return null;
                const groupLabel =
                  type === "product" ? t("smart_search.parts") :
                  type === "manufacturer" ? t("smart_search.manufacturers") :
                  t("smart_search.categories");
                return (
                  <div key={type}>
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {groupLabel}
                      </span>
                    </div>
                    {items.map((item) => {
                      const idx = suggestions.indexOf(item);
                      return (
                        <button
                          key={`${item.type}-${item.label}`}
                          onClick={() => handleSelect(item.url)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                            activeIndex === idx ? "bg-muted" : "hover:bg-muted/50"
                          }`}
                        >
                          <IconForType type={item.icon} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
                            {item.sublabel && (
                              <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Search all */}
              <div className="border-t border-border">
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted/50 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  {t("smart_search.search_all")} "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
