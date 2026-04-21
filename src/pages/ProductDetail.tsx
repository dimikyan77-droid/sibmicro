import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import {
  FileText, ShoppingCart, Heart, GitCompare, Share2, ArrowLeft,
  Download, Copy, Check, Package, Shield, Truck, ExternalLink, TrendingDown, TrendingUp as TrendingUpIcon, Minus,
  ChevronRight
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { products } from "@/data/mockData";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import ProductImage from "@/components/ProductImage";

type Tab = "specs" | "docs" | "analogs" | "pricing";

// Generate fake 12-month price history based on current price
const generatePriceHistory = (basePrice: number) => {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const data: { month: string; price: number }[] = [];
  let price = basePrice * (1 + (Math.random() * 0.3 - 0.1));
  for (const month of months) {
    price = price * (1 + (Math.random() * 0.1 - 0.05));
    data.push({ month, price: Math.round(price * 100) / 100 });
  }
  // Last month should be close to actual price
  data[data.length - 1].price = basePrice;
  return data;
};

const RestockNotifyForm = ({ partNumber }: { partNumber: string }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("restock_notifications" as any).insert({
        part_number: partNumber,
        email,
      } as any);
      if (error) {
        if (error.code === "23505") {
          toast.info("Вы уже подписаны на уведомление");
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast.success("Вы будете уведомлены о поступлении!");
      }
    } catch {
      toast.error("Ошибка при подписке");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
          <Bell className="h-4 w-4" />
          Уведомление оформлено
        </div>
        <p className="text-xs text-muted-foreground mt-1">Мы сообщим на {email}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
        <Bell className="h-4 w-4" />
        Нет в наличии
      </div>
      <p className="text-xs text-muted-foreground">Оставьте email — мы уведомим о поступлении</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Подписаться"}
        </button>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t, tc } = useI18n();
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(product?.moq || 1);
  const [activeTab, setActiveTab] = useState<Tab>("specs");
  const [copied, setCopied] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);

  const relatedProducts = useMemo(() => product ? products.filter((p) => p.id !== product.id && p.subcategory === product.subcategory).slice(0, 4) : [], [product]);
  const analogProducts = useMemo(() => product ? products.filter((p) => p.id !== product.id && p.category === product.category && p.manufacturer !== product.manufacturer).slice(0, 6) : [], [product]);
  const priceHistory = useMemo(() => product ? generatePriceHistory(product.priceTiers[0].price) : [], [product]);
  const maxPrice = Math.max(...priceHistory.map((d) => d.price), 0);
  const minPrice = Math.min(...priceHistory.map((d) => d.price), 0);
  const priceRange = maxPrice - minPrice || 1;

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("product.not_found")}</h1>
          <Link to="/catalog" className="text-accent hover:underline text-sm">{t("product.back_catalog")}</Link>
        </div>
      </Layout>
    );
  }

  const currentTierPrice = product.priceTiers.reduce((best, tier) => (qty >= tier.qty ? tier : best), product.priceTiers[0]);
  const extPrice = (currentTierPrice.price * qty);

  const handleCopy = () => {
    navigator.clipboard.writeText(product.partNumber);
    setCopied(true);
    toast.success(t("product.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const specs: [string, string | undefined][] = [
    [t("spec.part_number"), product.partNumber],
    [t("spec.manufacturer"), product.manufacturer],
    [t("spec.category"), `${tc(product.category)} / ${tc(product.subcategory)}`],
    [t("spec.frequency"), product.frequency],
    [t("spec.gain"), product.gain],
    [t("spec.noise_figure"), product.noiseFigure],
    [t("spec.output_power"), product.powerOutput],
    [t("spec.supply_voltage"), product.supplyVoltage],
    [t("spec.package"), product.package],
    [t("spec.temp_range"), product.temperatureRange],
    [t("spec.rohs"), product.rohs ? t("spec.yes") : t("spec.no")],
    [t("spec.moq"), String(product.moq)],
    [t("spec.lead_time"), product.leadTime],
  ];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "specs", label: t("product.tab_specs") },
    { key: "docs", label: t("product.tab_docs"), count: 3 },
    { key: "analogs", label: t("product.tab_analogs"), count: analogProducts.length + (product.crossReferences?.length || 0) },
    { key: "pricing", label: t("product.tab_pricing") },
  ];

  const availBadge = product.stock > 0
    ? { label: `${product.stock.toLocaleString()} ${t("catalog.in_stock")}`, cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" }
    : product.leadTime === "Contact"
      ? { label: t("catalog.preorder"), cls: "bg-violet-500/15 text-violet-600 border-violet-500/30" }
      : { label: `${product.leadTime}`, cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" };

  const canonical = `https://sibmicro.lovable.app/product/${encodeURIComponent(product.partNumber)}`;
  const seoTitle = `${product.partNumber} — ${product.manufacturer} | SibMicro`;
  const seoDesc = product.description || `Buy ${product.partNumber} from ${product.manufacturer}. Datasheet, price, in-stock availability.`;
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.partNumber,
    sku: product.partNumber,
    mpn: product.partNumber,
    description: seoDesc,
    image: product.image || `https://sibmicro.lovable.app/icon-512.png`,
    url: canonical,
    brand: { "@type": "Brand", name: product.manufacturer },
    category: `${product.category} / ${product.subcategory}`,
    offers: {
      "@type": "Offer",
      price: String(product.priceTiers[0].price),
      priceCurrency: "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonical,
    },
  };
  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("catalog.home"), item: "https://sibmicro.lovable.app/" },
      { "@type": "ListItem", position: 2, name: t("catalog.title"), item: "https://sibmicro.lovable.app/catalog" },
      { "@type": "ListItem", position: 3, name: product.manufacturer, item: `https://sibmicro.lovable.app/catalog?q=${encodeURIComponent(product.manufacturer)}` },
      { "@type": "ListItem", position: 4, name: product.partNumber, item: canonical },
    ],
  };

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        image={product.image || undefined}
        type="product"
        jsonLd={[productJsonLd, breadcrumbJsonLd]}
      />
      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">{t("catalog.home")}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/catalog" className="hover:text-foreground transition-colors">{t("catalog.title")}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/catalog?q=${product.manufacturer}`} className="hover:text-foreground transition-colors">{product.manufacturer}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{product.partNumber}</span>
        </div>
      </div>

      <div className="container py-8">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-6">
          <ArrowLeft className="h-3 w-3" /> {t("product.back")}
        </Link>

        {/* Top section: Image + Info + Pricing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Product Image */}
          <div className="lg:col-span-3">
            <div
              className={`relative rounded-xl border border-border bg-card p-6 flex items-center justify-center cursor-zoom-in transition-all ${imgZoom ? "scale-150 z-50 shadow-2xl" : ""}`}
              onClick={() => setImgZoom(!imgZoom)}
            >
              <ProductImage
                src={product.image}
                alt={product.partNumber}
                wrapperClassName="w-full max-w-[200px] aspect-square"
                className="w-full h-full object-contain"
              />
              {product.rohs && (
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  <Shield className="h-3 w-3" /> RoHS
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{product.manufacturer}</span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${availBadge.cls}`}>
                  {availBadge.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground font-mono tracking-tight">{product.partNumber}</h1>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={t("product.copy_pn")}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
            </div>

            {/* Quick specs */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("spec.package"), value: product.package, icon: Package },
                { label: t("spec.temp_range"), value: product.temperatureRange, icon: TrendingDownIcon },
                { label: t("spec.lead_time"), value: product.leadTime, icon: Truck },
                { label: t("spec.moq"), value: String(product.moq), icon: ShoppingCart },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
                    <div className="text-xs font-semibold text-foreground">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions row */}
            <div className="flex gap-2 pt-1">
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-primary" /> {t("product.datasheet")}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
                <Heart className="h-3.5 w-3.5" /> {t("product.save")}
              </button>
              <button
                onClick={() => isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  isInCompare(product.id)
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:bg-muted"
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" /> {isInCompare(product.id) ? t("product.in_compare") : t("product.compare")}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" /> {t("product.share")}
              </button>
            </div>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 sticky top-24">
              {/* Price display */}
              <div className="text-center pb-3 border-b border-border">
                <div className="text-3xl font-bold text-foreground font-mono">
                  ${currentTierPrice.price.toFixed(currentTierPrice.price < 1 ? 4 : 2)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{t("product.unit_price")}</div>
              </div>

              {/* Price tiers */}
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("product.price_tiers")}</h3>
                <div className="space-y-1">
                  {product.priceTiers.map((tier) => (
                    <div
                      key={tier.qty}
                      className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                        qty >= tier.qty && (product.priceTiers.find((t2) => t2.qty > tier.qty)?.qty ?? Infinity) > qty
                          ? "bg-primary/10 border border-primary/30 font-semibold"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-muted-foreground">{tier.qty}+</span>
                      <span className="font-mono font-semibold text-foreground">${tier.price.toFixed(tier.price < 1 ? 4 : 2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qty + Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("product.qty")}</label>
                    <input
                      type="number"
                      value={qty}
                      min={product.moq}
                      onChange={(e) => setQty(Math.max(parseInt(e.target.value) || product.moq, product.moq))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center font-mono mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("product.ext_price")}</label>
                    <div className="text-lg font-bold text-foreground font-mono mt-1 text-center">
                      ${extPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addToCart(product, qty);
                    toast.success(t("cart.added"), { description: `${product.partNumber} × ${qty}` });
                  }}
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" /> {t("product.add_to_cart")}
                </button>
                <button className="w-full rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t("product.request_quote")}
                </button>

                {/* Notify when back in stock */}
                {product.stock === 0 && (
                  <RestockNotifyForm partNumber={product.partNumber} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "specs" && <SpecsTab specs={specs} />}
          {activeTab === "docs" && <DocsTab product={product} t={t} />}
          {activeTab === "analogs" && <AnalogsTab product={product} analogs={analogProducts} t={t} tc={tc} />}
          {activeTab === "pricing" && <PricingTab priceHistory={priceHistory} maxPrice={maxPrice} minPrice={minPrice} priceRange={priceRange} t={t} />}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">{t("product.related")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="rounded-xl border border-border bg-card p-4 hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <div className="text-xs text-muted-foreground">{p.manufacturer}</div>
                  <div className="text-sm font-bold text-primary font-mono mt-0.5 group-hover:underline">{p.partNumber}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-foreground font-mono">${p.priceTiers[0].price.toFixed(2)}</span>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${p.stock > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : p.leadTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

/* ─── Tab Components ─── */

const SpecsTab = ({ specs }: { specs: [string, string | undefined][] }) => (
  <div className="rounded-xl border border-border overflow-hidden max-w-2xl">
    <table className="w-full text-sm">
      <tbody>
        {specs.filter(([, v]) => v !== undefined).map(([label, value], i) => (
          <tr key={label} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} border-b border-border last:border-0`}>
            <td className="px-5 py-3 font-medium text-muted-foreground w-2/5">{label}</td>
            <td className="px-5 py-3 text-foreground font-mono text-xs">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DocsTab = ({ product, t }: { product: typeof products[0]; t: (k: any) => string }) => {
  const docs = [
    { name: t("product.datasheet"), desc: t("product.datasheet_desc"), url: product.datasheetUrl, icon: FileText, size: "2.4 MB" },
    { name: t("product.app_note"), desc: t("product.app_note_desc"), url: "#", icon: FileText, size: "1.1 MB" },
    { name: t("product.errata"), desc: t("product.errata_desc"), url: "#", icon: FileText, size: "340 KB" },
  ];

  return (
    <div className="space-y-3 max-w-2xl">
      {docs.map((doc) => (
        <a
          key={doc.name}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all group"
        >
          <div className="rounded-lg bg-primary/10 p-3">
            <doc.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{doc.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{doc.desc}</div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">{doc.size}</div>
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
};

const AnalogsTab = ({ product, analogs, t, tc }: { product: typeof products[0]; analogs: typeof products; t: (k: any) => string; tc: (k: string) => string }) => (
  <div className="space-y-6">
    {/* Cross references */}
    {product.crossReferences && product.crossReferences.length > 0 && (
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">{t("product.cross_refs")}</h3>
        <div className="flex flex-wrap gap-2">
          {product.crossReferences.map((ref) => {
            const linked = products.find((p) => p.partNumber === ref);
            return linked ? (
              <Link
                key={ref}
                to={`/product/${linked.id}`}
                className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-mono font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                {ref}
              </Link>
            ) : (
              <span key={ref} className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-mono text-muted-foreground">{ref}</span>
            );
          })}
        </div>
      </div>
    )}

    {/* Analog products */}
    {analogs.length > 0 ? (
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">{t("product.tab_analogs")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analogs.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{p.manufacturer}</div>
                  <div className="text-sm font-bold text-primary font-mono group-hover:underline">{p.partNumber}</div>
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${p.stock > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                  {p.stock > 0 ? `${p.stock}` : p.leadTime}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
              <div className="text-sm font-bold text-foreground font-mono mt-2">${p.priceTiers[0].price.toFixed(2)}</div>
            </Link>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">{t("product.no_analogs")}</p>
    )}
  </div>
);

const PricingTab = ({ priceHistory, maxPrice, minPrice, priceRange, t }: {
  priceHistory: { month: string; price: number }[];
  maxPrice: number; minPrice: number; priceRange: number;
  t: (k: any) => string;
}) => {
  const chartHeight = 200;
  const chartWidth = 700;
  const padding = 40;
  const w = chartWidth - padding * 2;
  const h = chartHeight - padding;

  const points = priceHistory.map((d, i) => ({
    x: padding + (i / (priceHistory.length - 1)) * w,
    y: chartHeight - padding - ((d.price - minPrice) / priceRange) * h,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  const trend = priceHistory[priceHistory.length - 1].price - priceHistory[0].price;
  const trendPct = ((trend / priceHistory[0].price) * 100).toFixed(1);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-bold text-foreground">{t("product.price_history")}</h3>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend < 0 ? "text-emerald-600" : trend > 0 ? "text-red-500" : "text-muted-foreground"}`}>
          {trend < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : trend > 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {trend >= 0 ? "+" : ""}{trendPct}%
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = chartHeight - padding - pct * h;
            const val = minPrice + pct * priceRange;
            return (
              <g key={pct}>
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="hsl(var(--border))" strokeWidth={0.5} />
                <text x={padding - 6} y={y + 3} textAnchor="end" fontSize={9} fill="hsl(var(--muted-foreground))">${val.toFixed(2)}</text>
              </g>
            );
          })}

          {/* Month labels */}
          {points.map((p) => (
            <text key={p.month} x={p.x} y={chartHeight - 10} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">{p.month}</text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="hsl(var(--primary) / 0.08)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {points.map((p) => (
            <circle key={p.month} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
        </svg>
      </div>

      <div className="text-xs text-muted-foreground">{t("product.price_per_unit")}</div>
    </div>
  );
};

// Alias for the trending down icon used in quick specs
const TrendingDownIcon = TrendingDown;

export default ProductDetail;
