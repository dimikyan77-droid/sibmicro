import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Cpu, Radio, CircuitBoard, Cable, Gauge, Lightbulb, ArrowRight, Shield, Truck, Headphones } from "lucide-react";
import Layout from "@/components/layout/Layout";
import heroImg from "@/assets/hero-electronics.jpg";
import { categories, manufacturers, products } from "@/data/mockData";
import { useI18n } from "@/contexts/I18nContext";

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="h-7 w-7" />,
  Radio: <Radio className="h-7 w-7" />,
  CircuitBoard: <CircuitBoard className="h-7 w-7" />,
  Cable: <Cable className="h-7 w-7" />,
  Gauge: <Gauge className="h-7 w-7" />,
  Lightbulb: <Lightbulb className="h-7 w-7" />,
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t, tc } = useI18n();

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
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/70" />
        <div className="relative container py-20 md:py-28 text-primary-foreground">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              Electronic Components Distributor
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] mb-5 tracking-tight">
              {t("hero.title_1")}
              <br />
              <span className="text-accent">{t("hero.title_2")}</span>
            </h1>
            <p className="text-base text-primary-foreground/70 mb-10 leading-relaxed max-w-lg">{t("hero.subtitle")}</p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("hero.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-card text-foreground pl-10 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shrink-0 shadow-lg"
              >
                {t("header.search")}
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-5">
              {["HMC8205", "AD9361", "QPA2628", "RF Amplifier", "GaN"].map((term) => (
                <Link
                  key={term}
                  to={`/catalog?q=${encodeURIComponent(term)}`}
                  className="rounded-md border border-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground/60 hover:text-primary-foreground hover:border-primary-foreground/40 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card">
        <div className="container py-5 flex flex-wrap justify-center gap-12 md:gap-20">
          {[
            { icon: <Shield className="h-5 w-5 text-accent" />, label: t("stats.parts"), sub: t("stats.in_stock") },
            { icon: <Truck className="h-5 w-5 text-accent" />, label: t("stats.same_day"), sub: t("stats.shipping") },
            { icon: <Headphones className="h-5 w-5 text-accent" />, label: t("stats.expert"), sub: t("stats.support") },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">{s.icon}</div>
              <div>
                <div className="text-sm font-semibold text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("index.browse_category")}</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse our complete product catalog by category</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-muted-foreground group-hover:text-accent transition-colors">
                {iconMap[cat.icon]}
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-card-foreground">{tc(cat.name)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {cat.subcategories.reduce((acc, s) => acc + s.count, 0).toLocaleString()} {t("index.parts")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("index.featured")}</h2>
              <p className="text-sm text-muted-foreground mt-1">High-performance components for demanding applications</p>
            </div>
            <Link to="/catalog" className="text-sm text-accent hover:underline flex items-center gap-1.5 font-medium">
              {t("index.view_all")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:border-accent/40 transition-all duration-200"
              >
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">{p.manufacturer}</div>
                <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors font-mono tracking-wide">
                  {p.partNumber}
                </div>
                <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">{p.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
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
      <section className="container py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("index.auth_manufacturers")}</h2>
          <p className="text-sm text-muted-foreground mt-1">Authorized distribution partnerships</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {manufacturers.map((m) => (
            <Link
              key={m.slug}
              to={`/manufacturers/${m.slug}`}
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 h-24 hover:border-accent/40 hover:shadow-md transition-all duration-200"
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
