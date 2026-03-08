import { useState, useCallback, useRef, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, Search, Trash2, ShoppingCart, Download,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Package, DollarSign, TrendingUp
} from "lucide-react";
import { products, Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";

interface BomRow {
  partNumber: string;
  quantity: number;
  description: string;
}

interface MatchedRow extends BomRow {
  status: "matched" | "not_found" | "alternative";
  matchedProduct?: Product;
  alternatives?: Product[];
  unitPrice: number;
  extPrice: number;
  stock: number;
  manufacturer: string;
  selectedAlt?: Product;
}

type Step = "upload" | "map" | "results";

const Bom = () => {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colPart, setColPart] = useState<number | "">("");
  const [colQty, setColQty] = useState<number | "">("");
  const [colDesc, setColDesc] = useState<number | "">("");
  const [fileName, setFileName] = useState<string>("");
  const [matching, setMatching] = useState(false);
  const [matchedResults, setMatchedResults] = useState<MatchedRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    setFileName(file.name);

    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          const rows = lines.map((line) => {
            const result: string[] = [];
            let cell = "";
            let inQuotes = false;
            for (const ch of line) {
              if (ch === '"') {
                inQuotes = !inQuotes;
              } else if (ch === "," && !inQuotes) {
                result.push(cell.trim());
                cell = "";
              } else {
                cell += ch;
              }
            }
            result.push(cell.trim());
            return result;
          });
          if (rows.length > 0) {
            setHeaders(rows[0]);
            setRawData(rows.slice(1));
            autoDetectColumns(rows[0]);
            setStep("map");
          }
        } catch {
          toast.error(t("bom.error_parse"));
        }
      };
      reader.readAsText(file);
    } else if (ext === "xls" || ext === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          if (json.length > 0) {
            setHeaders(json[0].map(String));
            setRawData(json.slice(1).map((row) => row.map(String)));
            autoDetectColumns(json[0].map(String));
            setStep("map");
          }
        } catch {
          toast.error(t("bom.error_parse"));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [t]);

  const autoDetectColumns = (hdrs: string[]) => {
    const lower = hdrs.map((h) => h.toLowerCase());
    const partIdx = lower.findIndex((h) =>
      ["part", "pn", "mpn", "partnumber", "part number", "part_number", "артикул", "номер"].some((k) => h.includes(k))
    );
    if (partIdx >= 0) setColPart(partIdx);

    const qtyIdx = lower.findIndex((h) =>
      ["qty", "quantity", "кол-во", "количество", "count"].some((k) => h.includes(k))
    );
    if (qtyIdx >= 0) setColQty(qtyIdx);

    const descIdx = lower.findIndex((h) =>
      ["desc", "description", "описание", "name", "название"].some((k) => h.includes(k))
    );
    if (descIdx >= 0) setColDesc(descIdx);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleClear = () => {
    setRawData([]);
    setHeaders([]);
    setColPart("");
    setColQty("");
    setColDesc("");
    setFileName("");
    setMatchedResults([]);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parsedRows: BomRow[] = useMemo(() => {
    return rawData
      .map((row) => ({
        partNumber: colPart !== "" ? row[colPart] || "" : "",
        quantity: colQty !== "" ? parseInt(row[colQty], 10) || 1 : 1,
        description: colDesc !== "" ? row[colDesc] || "" : "",
      }))
      .filter((r) => r.partNumber.trim() !== "");
  }, [rawData, colPart, colQty, colDesc]);

  const matchComponents = useCallback(() => {
    if (colPart === "") {
      toast.error("Please select a Part Number column");
      return;
    }

    setMatching(true);
    setTimeout(() => {
      const results: MatchedRow[] = parsedRows.map((row) => {
        const pn = row.partNumber.trim().toUpperCase();

        // Try exact match
        let matched = products.find((p) => p.partNumber.toUpperCase() === pn);

        if (matched) {
          const tier = matched.priceTiers.reduce((best, t) => (row.quantity >= t.qty ? t : best), matched.priceTiers[0]);
          const alternatives = products
            .filter((p) => p.id !== matched!.id && p.category === matched!.category && p.manufacturer !== matched!.manufacturer)
            .slice(0, 3);

          return {
            ...row,
            status: "matched" as const,
            matchedProduct: matched,
            alternatives,
            unitPrice: tier.price,
            extPrice: tier.price * row.quantity,
            stock: matched.stock,
            manufacturer: matched.manufacturer,
          };
        }

        // Try fuzzy match (starts with or contains)
        matched = products.find((p) => {
          const upperPN = p.partNumber.toUpperCase();
          return upperPN.startsWith(pn) || upperPN.includes(pn) || pn.includes(upperPN);
        });

        if (matched) {
          const tier = matched.priceTiers.reduce((best, t) => (row.quantity >= t.qty ? t : best), matched.priceTiers[0]);
          const alternatives = products
            .filter((p) => p.id !== matched!.id && p.category === matched!.category)
            .slice(0, 3);

          return {
            ...row,
            status: "alternative" as const,
            matchedProduct: matched,
            alternatives,
            unitPrice: tier.price,
            extPrice: tier.price * row.quantity,
            stock: matched.stock,
            manufacturer: matched.manufacturer,
          };
        }

        // Not found - suggest alternatives from description keywords
        const keywords = row.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const alternatives = products.filter((p) => {
          const desc = p.description.toLowerCase();
          return keywords.some((kw) => desc.includes(kw));
        }).slice(0, 3);

        return {
          ...row,
          status: "not_found" as const,
          alternatives,
          unitPrice: 0,
          extPrice: 0,
          stock: 0,
          manufacturer: "—",
        };
      });

      setMatchedResults(results);
      setStep("results");
      setMatching(false);
      toast.success(`${t("bom.matched_count")}: ${results.filter((r) => r.status === "matched").length}/${results.length}`);
    }, 800);
  }, [parsedRows, colPart, t]);

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAlternative = (rowIdx: number, alt: Product) => {
    setMatchedResults((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const tier = alt.priceTiers.reduce((best, t) => (r.quantity >= t.qty ? t : best), alt.priceTiers[0]);
        return {
          ...r,
          status: "alternative" as const,
          matchedProduct: alt,
          selectedAlt: alt,
          unitPrice: tier.price,
          extPrice: tier.price * r.quantity,
          stock: alt.stock,
          manufacturer: alt.manufacturer,
        };
      })
    );
    toast.success(`${alt.partNumber} selected`);
  };

  const handleAddAllToCart = () => {
    let added = 0;
    matchedResults.forEach((row) => {
      const prod = row.matchedProduct;
      if (prod && (row.status === "matched" || row.status === "alternative")) {
        addToCart(prod, row.quantity);
        added++;
      }
    });
    toast.success(`${added} ${added === 1 ? "item" : "items"} added to cart`);
  };

  const exportCSV = () => {
    const csvRows = [
      ["Line", "Status", "Part Number", "Matched PN", "Manufacturer", "Qty", "Unit Price", "Ext. Price", "Stock", "Description"],
      ...matchedResults.map((r, i) => [
        String(i + 1),
        r.status,
        r.partNumber,
        r.matchedProduct?.partNumber || "—",
        r.manufacturer,
        String(r.quantity),
        r.unitPrice > 0 ? `$${r.unitPrice.toFixed(4)}` : "—",
        r.extPrice > 0 ? `$${r.extPrice.toFixed(2)}` : "—",
        r.stock > 0 ? String(r.stock) : "—",
        r.description,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bom-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Line", "Status", "Part Number", "Matched PN", "Manufacturer", "Qty", "Unit Price", "Ext. Price", "Stock", "Description"],
      ...matchedResults.map((r, i) => [
        i + 1,
        r.status,
        r.partNumber,
        r.matchedProduct?.partNumber || "—",
        r.manufacturer,
        r.quantity,
        r.unitPrice,
        r.extPrice,
        r.stock,
        r.description,
      ]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM Results");
    XLSX.writeFile(wb, `bom-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("XLSX exported");
  };

  const summary = useMemo(() => {
    const total = matchedResults.length;
    const matched = matchedResults.filter((r) => r.status === "matched").length;
    const notFound = matchedResults.filter((r) => r.status === "not_found").length;
    const totalCost = matchedResults.reduce((sum, r) => sum + r.extPrice, 0);
    return { total, matched, notFound, totalCost };
  }, [matchedResults]);

  return (
    <Layout>
      <div className="container py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">{t("bom.title")}</h1>
          {fileName && (
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> {t("bom.clear")}
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("bom.subtitle")}</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "map", "results"] as const).map((s, i) => {
            const active = s === step;
            const completed = (s === "upload" && (step === "map" || step === "results")) || (s === "map" && step === "results");
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="font-bold">{i + 1}</span>
                  {s === "upload" && t("bom.step1")}
                  {s === "map" && t("bom.step2")}
                  {s === "results" && t("bom.step3")}
                </div>
                {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-16 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">{t("bom.drop_zone")}</p>
              <p className="text-xs text-muted-foreground">{t("bom.supported")}</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">{t("bom.no_file")}</p>
          </>
        )}

        {/* Step 2: Map columns */}
        {step === "map" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-xs text-muted-foreground">— {rawData.length} {t("bom.rows_loaded")}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">{t("bom.col_part")} *</label>
                <select
                  value={colPart}
                  onChange={(e) => setColPart(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">{t("bom.col_qty")}</label>
                <select
                  value={colQty}
                  onChange={(e) => setColQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">{t("bom.col_desc")}</label>
                <select
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            <h2 className="text-sm font-bold text-foreground mb-3">{t("bom.preview")}</h2>
            <div className="border border-border rounded-xl overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">{t("bom.part_number")}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">{t("bom.quantity")}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">{t("bom.description")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-2 font-mono text-xs text-foreground">{row.partNumber}</td>
                        <td className="px-4 py-2 text-foreground">{row.quantity}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs truncate max-w-xs">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={matchComponents}
              disabled={colPart === "" || matching}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {matching ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  {t("bom.matching")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {t("bom.match_components")}
                </>
              )}
            </button>
          </>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{t("bom.total_lines")}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600">{t("bom.matched_lines")}</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{summary.matched}</div>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">{t("bom.not_found_lines")}</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{summary.notFound}</div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary">{t("bom.total_cost")}</span>
                </div>
                <div className="text-2xl font-bold text-primary">${summary.totalCost.toFixed(2)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleAddAllToCart}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("bom.add_all_cart")}
              </button>
              <button
                onClick={exportCSV}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("bom.export_csv")}
              </button>
              <button
                onClick={exportXLSX}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("bom.export_xlsx")}
              </button>
            </div>

            {/* Results table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-foreground">#</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">{t("bom.status")}</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">{t("bom.part_number")}</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">{t("bom.manufacturer")}</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">{t("bom.quantity")}</th>
                      <th className="px-4 py-3 text-right font-bold text-foreground">{t("bom.unit_price")}</th>
                      <th className="px-4 py-3 text-right font-bold text-foreground">{t("bom.ext_price")}</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">{t("bom.stock")}</th>
                      <th className="px-4 py-3 text-center font-bold text-foreground">{t("bom.alternatives")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedResults.map((row, idx) => (
                      <>
                        <tr key={idx} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                          <td className="px-4 py-3">
                            {row.status === "matched" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> {t("bom.matched")}
                              </span>
                            )}
                            {row.status === "alternative" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-600">
                                <AlertTriangle className="h-3 w-3" /> {t("bom.alternative")}
                              </span>
                            )}
                            {row.status === "not_found" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-600">
                                <XCircle className="h-3 w-3" /> {t("bom.not_found")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-foreground font-semibold">{row.partNumber}</div>
                            {row.matchedProduct && row.matchedProduct.partNumber !== row.partNumber && (
                              <div className="text-xs text-muted-foreground mt-0.5">→ {row.matchedProduct.partNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground text-xs">{row.manufacturer}</td>
                          <td className="px-4 py-3 text-foreground font-medium">{row.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                            {row.unitPrice > 0 ? `$${row.unitPrice.toFixed(row.unitPrice < 1 ? 4 : 2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {row.extPrice > 0 ? `$${row.extPrice.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground text-xs">
                            {row.stock > 0 ? (
                              <span className="text-emerald-600 font-medium">{row.stock.toLocaleString()}</span>
                            ) : row.matchedProduct ? (
                              <span className="text-amber-600">{row.matchedProduct.leadTime}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.alternatives && row.alternatives.length > 0 && (
                              <button
                                onClick={() => toggleRow(idx)}
                                className="text-xs text-primary hover:underline font-medium flex items-center gap-1 mx-auto"
                              >
                                {expandedRows.has(idx) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" /> {t("bom.hide_alts")}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" /> {t("bom.show_alts")} ({row.alternatives.length})
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Alternatives row */}
                        {expandedRows.has(idx) && row.alternatives && row.alternatives.length > 0 && (
                          <tr className="border-t border-border bg-muted/20">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="text-xs font-semibold text-muted-foreground mb-2">{t("bom.alternatives")}:</div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {row.alternatives.map((alt) => {
                                  const tier = alt.priceTiers.reduce((best, t) => (row.quantity >= t.qty ? t : best), alt.priceTiers[0]);
                                  return (
                                    <div key={alt.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <div className="text-xs text-muted-foreground">{alt.manufacturer}</div>
                                          <Link to={`/product/${alt.id}`} className="text-xs font-mono font-semibold text-primary hover:underline">
                                            {alt.partNumber}
                                          </Link>
                                        </div>
                                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${alt.stock > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                                          {alt.stock > 0 ? alt.stock : alt.leadTime}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{alt.description}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-foreground font-mono">${tier.price.toFixed(tier.price < 1 ? 4 : 2)}</span>
                                        <button
                                          onClick={() => selectAlternative(idx, alt)}
                                          className="text-xs text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded transition-colors font-medium"
                                        >
                                          {t("bom.use_this")}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Bom;
