import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileText, ShoppingCart, Heart, GitCompare, Share2, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { products } from "@/data/mockData";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t } = useI18n();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(product?.moq || 1);
  const product2 = products.find((p) => p.id === id);

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

  const relatedProducts = products.filter((p) => p.id !== product.id && p.subcategory === product.subcategory).slice(0, 4);

  const specs: [string, string | undefined][] = [
    [t("spec.part_number"), product.partNumber],
    [t("spec.manufacturer"), product.manufacturer],
    [t("spec.category"), `${product.category} / ${product.subcategory}`],
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

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">{t("catalog.home")}</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-foreground">{t("catalog.title")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{product.partNumber}</span>
        </div>
      </div>

      <div className="container py-8">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mb-6">
          <ArrowLeft className="h-3 w-3" /> {t("product.back")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{product.manufacturer}</div>
              <h1 className="text-2xl font-bold text-foreground font-mono">{product.partNumber}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
            </div>

            {/* Specs Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-4 py-2.5">
                <h2 className="text-sm font-semibold text-foreground">{t("product.tech_specs")}</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {specs.filter(([, v]) => v !== undefined).map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="px-4 py-2 font-medium text-muted-foreground w-1/3">{label}</td>
                      <td className="px-4 py-2 text-foreground font-mono text-xs">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cross References */}
            {product.crossReferences && product.crossReferences.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">{t("product.cross_refs")}</h2>
                <div className="flex flex-wrap gap-2">
                  {product.crossReferences.map((ref) => {
                    const linked = products.find((p) => p.partNumber === ref);
                    return linked ? (
                      <Link key={ref} to={`/product/${linked.id}`} className="chip chip-info hover:underline font-mono">
                        {ref}
                      </Link>
                    ) : (
                      <span key={ref} className="chip chip-info font-mono">{ref}</span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stock & Pricing */}
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("product.availability")}</span>
                <span className={`chip ${product.stock > 0 ? "chip-success" : "chip-warning"}`}>
                  {product.stock > 0 ? `${product.stock.toLocaleString()} ${t("catalog.in_stock")}` : product.leadTime}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">{t("product.price_tiers")}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left pb-1">{t("product.qty")}</th>
                      <th className="text-right pb-1">{t("product.unit_price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.priceTiers.map((tier) => (
                      <tr key={tier.qty} className="border-t border-border">
                        <td className="py-1.5">{tier.qty}+</td>
                        <td className="text-right font-semibold font-mono">
                          ${tier.price.toFixed(tier.price < 1 ? 4 : 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  defaultValue={product.moq}
                  min={product.moq}
                  className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-center"
                />
                <button className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> {t("product.add_to_cart")}
                </button>
              </div>
              <button className="w-full rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                {t("product.request_quote")}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
                <FileText className="h-3.5 w-3.5" /> {t("product.datasheet")}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
                <Heart className="h-3.5 w-3.5" /> {t("product.save")}
              </button>
              <button
                onClick={() => product && (isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product))}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-colors ${
                  product && isInCompare(product.id)
                    ? "border-accent bg-accent/10 text-accent font-semibold"
                    : "border-border hover:bg-muted"
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" /> {product && isInCompare(product.id) ? t("product.in_compare") : t("product.compare")}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
                <Share2 className="h-3.5 w-3.5" /> {t("product.share")}
              </button>
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-foreground mb-4">{t("product.related")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-accent transition-all"
                >
                  <div className="text-xs text-muted-foreground">{p.manufacturer}</div>
                  <div className="text-sm font-semibold text-primary font-mono mt-0.5">{p.partNumber}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>
                  <div className="text-sm font-bold text-foreground mt-2">${p.priceTiers[0].price.toFixed(2)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
