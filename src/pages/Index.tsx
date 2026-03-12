import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Cpu, Radio, CircuitBoard, Cable, Gauge, Lightbulb, ArrowRight, Shield, Truck, Headphones, Wrench, Zap, MemoryStick, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import heroImg from "@/assets/hero-electronics.jpg";
import { categories, manufacturers, products } from "@/data/mockData";
import { useI18n } from "@/contexts/I18nContext";

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="h-8 w-8" />,
  Radio: <Radio className="h-8 w-8" />,
  CircuitBoard: <CircuitBoard className="h-8 w-8" />,
  Cable: <Cable className="h-8 w-8" />,
  Gauge: <Gauge className="h-8 w-8" />,
  Lightbulb: <Lightbulb className="h-8 w-8" />,
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t, tc, lang } = useI18n();

  // Fetch new products from DB
  const { data: newProducts = [] } = useQuery({
    queryKey: ["new-catalog-products-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_products")
        .select("id, part_number, manufacturer, description, quantity, price, currency, is_new, created_at")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="relative container py-16 md:py-24 text-primary-foreground">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              {t("hero.title_1")}
              <br />
              <span className="text-accent">{t("hero.title_2")}</span>
            </h1>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">{t("hero.subtitle")}</p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-50" />
                <input
                  type="text"
                  placeholder={t("hero.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-primary-foreground/95 text-foreground pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shrink-0"
              >
                {t("header.search")}
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              {["HMC8205", "AD9361", "QPA2628", "RF Amplifier", "GaN"].map((term) => (
                <Link
                  key={term}
                  to={`/catalog?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-primary-foreground/30 px-3 py-1 text-xs hover:bg-primary-foreground/10 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-muted border-b border-border">
        <div className="container py-4 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {[
            { icon: <Shield className="h-5 w-5 text-accent" />, label: t("stats.parts"), sub: t("stats.in_stock") },
            { icon: <Truck className="h-5 w-5 text-accent" />, label: t("stats.same_day"), sub: t("stats.shipping") },
            { icon: <Headphones className="h-5 w-5 text-accent" />, label: t("stats.expert"), sub: t("stats.support") },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              {s.icon}
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t("index.browse_category")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 hover:border-accent hover:shadow-md transition-all"
            >
              <div className="text-primary group-hover:text-accent transition-colors">
                {iconMap[cat.icon]}
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-card-foreground">{tc(cat.name)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {cat.subcategories.reduce((acc, s) => acc + s.count, 0).toLocaleString()} {t("index.parts")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/50">
        <div className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{t("index.featured")}</h2>
            <Link to="/catalog" className="text-sm text-accent hover:underline flex items-center gap-1">
              {t("index.view_all")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-accent transition-all"
              >
                <div className="text-xs text-muted-foreground mb-1">{p.manufacturer}</div>
                <div className="text-sm font-semibold text-primary group-hover:text-accent transition-colors font-mono">
                  {p.partNumber}
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    <div className="text-sm font-bold text-foreground">${p.priceTiers[0].price.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">qty {p.priceTiers[0].qty}+</div>
                  </div>
                  <span className={`chip ${p.stock > 0 ? "chip-success" : "chip-warning"}`}>
                    {p.stock > 0 ? `${p.stock.toLocaleString()} ${t("index.in_stock")}` : t("index.lead_time")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturers */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t("index.auth_manufacturers")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {manufacturers.map((m) => (
            <Link
              key={m.slug}
              to={`/manufacturers/${m.slug}`}
              className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-4 h-24 hover:border-accent hover:shadow-sm transition-all"
            >
              <div className="text-sm font-semibold text-foreground text-center">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.productCount.toLocaleString()} {t("index.parts")}</div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
