import { Link } from "react-router-dom";
import { X, ArrowLeft, GitCompare } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCompare } from "@/contexts/CompareContext";

const specRows: { label: string; key: string; getter: (p: any) => string }[] = [
  { label: "Part Number", key: "partNumber", getter: (p) => p.partNumber },
  { label: "Manufacturer", key: "manufacturer", getter: (p) => p.manufacturer },
  { label: "Category", key: "category", getter: (p) => `${p.category} / ${p.subcategory}` },
  { label: "Description", key: "description", getter: (p) => p.description },
  { label: "Frequency Range", key: "frequency", getter: (p) => p.frequency || "—" },
  { label: "Gain", key: "gain", getter: (p) => p.gain || "—" },
  { label: "Noise Figure", key: "noiseFigure", getter: (p) => p.noiseFigure || "—" },
  { label: "Output Power", key: "powerOutput", getter: (p) => p.powerOutput || "—" },
  { label: "Supply Voltage", key: "supplyVoltage", getter: (p) => p.supplyVoltage || "—" },
  { label: "Package", key: "package", getter: (p) => p.package },
  { label: "Temperature Range", key: "temperatureRange", getter: (p) => p.temperatureRange },
  { label: "RoHS", key: "rohs", getter: (p) => p.rohs ? "Yes ✓" : "No" },
  { label: "Stock", key: "stock", getter: (p) => p.stock > 0 ? p.stock.toLocaleString() : "Contact" },
  { label: "Lead Time", key: "leadTime", getter: (p) => p.leadTime },
  { label: "MOQ", key: "moq", getter: (p) => String(p.moq) },
  {
    label: "Price (qty 1)",
    key: "price",
    getter: (p) => {
      const t = p.priceTiers[0];
      return `$${t.price.toFixed(t.price < 1 ? 4 : 2)}`;
    },
  },
];

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  return (
    <Layout>
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Compare Components</span>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/catalog" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to catalog
            </Link>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-accent" />
              Component Comparison
            </h1>
          </div>
          {compareItems.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {compareItems.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">No components to compare</h2>
            <p className="text-sm text-muted-foreground">
              Add components from the{" "}
              <Link to="/catalog" className="text-accent hover:underline">catalog</Link>{" "}
              using the compare checkbox.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-44 sticky left-0 z-10">
                    Specification
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
                  <tr key={row.key} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-4 py-2.5 font-medium text-muted-foreground text-xs sticky left-0 z-10 bg-inherit">
                      {row.label}
                    </td>
                    {compareItems.map((p) => {
                      const val = row.getter(p);
                      return (
                        <td key={p.id} className="px-4 py-2.5 font-mono text-xs text-foreground">
                          {row.key === "rohs" && val.includes("✓") ? (
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
