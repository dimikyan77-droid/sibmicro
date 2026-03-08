import { Link } from "react-router-dom";
import { X, ArrowLeft, GitCompare } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { t, tc } = useI18n();

  const specRows = [
    { label: t("spec.part_number"), getter: (p: any) => p.partNumber },
    { label: t("spec.manufacturer"), getter: (p: any) => p.manufacturer },
    { label: t("spec.category"), getter: (p: any) => `${tc(p.category)} / ${tc(p.subcategory)}` },
    { label: t("spec.description"), getter: (p: any) => p.description },
    { label: t("spec.frequency"), getter: (p: any) => p.frequency || "—" },
    { label: t("spec.gain"), getter: (p: any) => p.gain || "—" },
    { label: t("spec.noise_figure"), getter: (p: any) => p.noiseFigure || "—" },
    { label: t("spec.output_power"), getter: (p: any) => p.powerOutput || "—" },
    { label: t("spec.supply_voltage"), getter: (p: any) => p.supplyVoltage || "—" },
    { label: t("spec.package"), getter: (p: any) => p.package },
    { label: t("spec.temp_range"), getter: (p: any) => p.temperatureRange },
    { label: t("spec.rohs"), getter: (p: any) => p.rohs ? `${t("spec.yes")} ✓` : t("spec.no") },
    { label: t("spec.stock"), getter: (p: any) => p.stock > 0 ? p.stock.toLocaleString() : t("catalog.contact") },
    { label: t("spec.lead_time"), getter: (p: any) => p.leadTime },
    { label: t("spec.moq"), getter: (p: any) => String(p.moq) },
    {
      label: t("spec.price_qty1"),
      getter: (p: any) => {
        const tier = p.priceTiers[0];
        return `$${tier.price.toFixed(tier.price < 1 ? 4 : 2)}`;
      },
    },
  ];

  return (
    <Layout>
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">{t("catalog.home")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{t("compare.breadcrumb")}</span>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/catalog" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              <ArrowLeft className="h-3 w-3" /> {t("compare.back_catalog")}
            </Link>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-accent" />
              {t("compare.title")}
            </h1>
          </div>
          {compareItems.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {t("compare.clear")}
            </button>
          )}
        </div>

        {compareItems.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">{t("compare.empty_title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("compare.empty_text")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-44 sticky left-0 z-10">
                    {t("compare.specification")}
                  </th>
                  {compareItems.map((p) => (
                    <th key={p.id} className="bg-muted px-4 py-3 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <Link to={`/product/${p.id}`} className="font-mono text-sm font-bold text-primary hover:text-accent hover:underline">
                          {p.partNumber}
                        </Link>
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-4 py-2.5 font-medium text-muted-foreground text-xs sticky left-0 z-10 bg-inherit">
                      {row.label}
                    </td>
                    {compareItems.map((p) => {
                      const val = row.getter(p);
                      return (
                        <td key={p.id} className="px-4 py-2.5 font-mono text-xs text-foreground">
                          {val.includes("✓") ? (
                            <span className="text-emerald-600 font-semibold">{val}</span>
                          ) : val === "—" ? (
                            <span className="text-muted-foreground">{val}</span>
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Compare;
