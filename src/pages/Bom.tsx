import { useState, useCallback, useRef, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, Search, Trash2, ShoppingCart, Download,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Package,
  DollarSign, ChevronRight, Warehouse, Globe, Loader2, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface BomRow {
  partNumber: string;
  quantity: number;
  description: string;
}

interface DigiKeyPriceTier {
  quantity: number;
  price: number;
}

interface MatchedRow extends BomRow {
  status: "inventory" | "digikey" | "not_found";
  source: string;
  matchedPn: string;
  manufacturer: string;
  unitPrice: number;
  extPrice: number;
  stock: number;
  currency: string;
  datasheetUrl: string | null;
  productUrl: string | null;
  digiKeyPn: string;
  priceTiers: DigiKeyPriceTier[];
  inventoryLocation: string;
  digiKeyAlternatives: DigiKeyAlt[];
}

interface DigiKeyAlt {
  mpn: string;
  manufacturer: string;
  description: string;
  stock: number;
  unitPrice: number;
  digiKeyPn: string;
  productUrl: string | null;
  datasheetUrl: string | null;
}

type Step = "upload" | "map" | "results";

const Bom = () => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colPart, setColPart] = useState<number | "">("");
  const [colQty, setColQty] = useState<number | "">("");
  const [colDesc, setColDesc] = useState<number | "">("");
  const [fileName, setFileName] = useState<string>("");
  const [matching, setMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [matchStage, setMatchStage] = useState("");
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
              if (ch === '"') inQuotes = !inQuotes;
              else if (ch === "," && !inQuotes) { result.push(cell.trim()); cell = ""; }
              else cell += ch;
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
        } catch { toast.error(t("bom.error_parse")); }
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
        } catch { toast.error(t("bom.error_parse")); }
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleClear = () => {
    setRawData([]); setHeaders([]); setColPart(""); setColQty(""); setColDesc("");
    setFileName(""); setMatchedResults([]); setStep("upload"); setExpandedRows(new Set());
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

  const matchComponents = useCallback(async () => {
    if (colPart === "") { toast.error("Выберите колонку Part Number"); return; }
    setMatching(true);
    setMatchProgress(0);
    setMatchStage("Поиск по складу...");

    const results: MatchedRow[] = [];
    const unmatchedIndices: number[] = [];

    // Step 1: Search inventory for each part
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const pn = row.partNumber.trim();
      setMatchProgress(Math.round(((i + 1) / parsedRows.length) * 40));

      try {
        const { data } = await supabase
          .from("inventory")
          .select("part_number, manufacturer, description, quantity, price, currency, location")
          .ilike("part_number", `%${pn}%`)
          .gt("quantity", 0)
          .limit(1);

        if (data && data.length > 0) {
          const inv = data[0];
          const unitPrice = inv.price ?? 0;
          results.push({
            ...row,
            status: "inventory",
            source: "Склад",
            matchedPn: inv.part_number,
            manufacturer: inv.manufacturer || "—",
            unitPrice,
            extPrice: unitPrice * row.quantity,
            stock: inv.quantity,
            currency: inv.currency || "RUB",
            datasheetUrl: null,
            productUrl: null,
            digiKeyPn: "",
            priceTiers: [],
            inventoryLocation: inv.location || "",
            digiKeyAlternatives: [],
          });
        } else {
          unmatchedIndices.push(i);
          results.push({
            ...row,
            status: "not_found",
            source: "",
            matchedPn: "",
            manufacturer: "—",
            unitPrice: 0,
            extPrice: 0,
            stock: 0,
            currency: "USD",
            datasheetUrl: null,
            productUrl: null,
            digiKeyPn: "",
            priceTiers: [],
            inventoryLocation: "",
            digiKeyAlternatives: [],
          });
        }
      } catch {
        unmatchedIndices.push(i);
        results.push({
          ...row,
          status: "not_found",
          source: "",
          matchedPn: "",
          manufacturer: "—",
          unitPrice: 0,
          extPrice: 0,
          stock: 0,
          currency: "USD",
          datasheetUrl: null,
          productUrl: null,
          digiKeyPn: "",
          priceTiers: [],
          inventoryLocation: "",
          digiKeyAlternatives: [],
        });
      }
    }

    // Step 2: Search DigiKey for unmatched parts
    if (unmatchedIndices.length > 0) {
      setMatchStage("Поиск DigiKey...");
      for (let j = 0; j < unmatchedIndices.length; j++) {
        const idx = unmatchedIndices[j];
        const row = parsedRows[idx];
        setMatchProgress(40 + Math.round(((j + 1) / unmatchedIndices.length) * 55));

        try {
          const { data, error } = await supabase.functions.invoke("digikey-search", {
            body: { query: row.partNumber.trim(), limit: 5 },
          });

          if (!error && data?.results?.length > 0) {
            const best = data.results[0];
            const bestTier = best.priceTiers?.[0];
            const unitPrice = bestTier?.price ?? 0;

            // Other results as alternatives
            const alts: DigiKeyAlt[] = data.results.slice(1).map((r: any) => ({
              mpn: r.mpn,
              manufacturer: r.manufacturer,
              description: r.description,
              stock: r.stock,
              unitPrice: r.priceTiers?.[0]?.price ?? 0,
              digiKeyPn: r.digiKeyPn,
              productUrl: r.productUrl,
              datasheetUrl: r.datasheetUrl,
            }));

            results[idx] = {
              ...row,
              status: "digikey",
              source: "DigiKey",
              matchedPn: best.mpn,
              manufacturer: best.manufacturer || "—",
              unitPrice,
              extPrice: unitPrice * row.quantity,
              stock: best.stock ?? 0,
              currency: "USD",
              datasheetUrl: best.datasheetUrl,
              productUrl: best.productUrl,
              digiKeyPn: best.digiKeyPn || "",
              priceTiers: best.priceTiers || [],
              inventoryLocation: "",
              digiKeyAlternatives: alts,
            };
          }
        } catch {
          // keep as not_found
        }
      }
    }

    setMatchProgress(100);
    setMatchStage("Готово!");
    setMatchedResults(results);
    setStep("results");
    setMatching(false);

    const invCount = results.filter((r) => r.status === "inventory").length;
    const dkCount = results.filter((r) => r.status === "digikey").length;
    const notFound = results.filter((r) => r.status === "not_found").length;
    toast.success(`Склад: ${invCount}, DigiKey: ${dkCount}, Не найдено: ${notFound}`);
  }, [parsedRows, colPart]);

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const exportCSV = () => {
    const csvRows = [
      ["#", "Источник", "Статус", "Запрошен PN", "Найден PN", "Производитель", "Кол-во", "Цена за шт.", "Итого", "На складе", "Описание"],
      ...matchedResults.map((r, i) => [
        String(i + 1), r.source, r.status, r.partNumber, r.matchedPn || "—",
        r.manufacturer, String(r.quantity),
        r.unitPrice > 0 ? r.unitPrice.toFixed(4) : "—",
        r.extPrice > 0 ? r.extPrice.toFixed(2) : "—",
        r.stock > 0 ? String(r.stock) : "—", r.description,
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
    toast.success("CSV экспортирован");
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["#", "Источник", "Статус", "Запрошен PN", "Найден PN", "Производитель", "Кол-во", "Цена за шт.", "Итого", "На складе", "Описание"],
      ...matchedResults.map((r, i) => [
        i + 1, r.source, r.status, r.partNumber, r.matchedPn || "—",
        r.manufacturer, r.quantity, r.unitPrice, r.extPrice, r.stock, r.description,
      ]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM Results");
    XLSX.writeFile(wb, `bom-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("XLSX экспортирован");
  };

  const summary = useMemo(() => {
    const total = matchedResults.length;
    const inventory = matchedResults.filter((r) => r.status === "inventory").length;
    const digikey = matchedResults.filter((r) => r.status === "digikey").length;
    const notFound = matchedResults.filter((r) => r.status === "not_found").length;
    const totalCostRub = matchedResults.filter(r => r.status === "inventory").reduce((s, r) => s + r.extPrice, 0);
    const totalCostUsd = matchedResults.filter(r => r.status === "digikey").reduce((s, r) => s + r.extPrice, 0);
    return { total, inventory, digikey, notFound, totalCostRub, totalCostUsd };
  }, [matchedResults]);

  const statusBadge = (row: MatchedRow) => {
    if (row.status === "inventory") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        <Warehouse className="h-3 w-3" /> Склад
      </span>
    );
    if (row.status === "digikey") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-600">
        <Globe className="h-3 w-3" /> DigiKey
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-600">
        <XCircle className="h-3 w-3" /> Не найден
      </span>
    );
  };

  return (
    <Layout>
      <div className="container py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">BOM Матчинг</h1>
          {fileName && (
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Очистить
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Загрузите BOM файл — автоматический поиск по складу и DigiKey с ценами и наличием
        </p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "map", "results"] as const).map((s, i) => {
            const labels = ["Загрузка", "Сопоставление", "Результаты"];
            const active = s === step;
            const completed = (s === "upload" && (step === "map" || step === "results")) || (s === "map" && step === "results");
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <span className="font-bold">{i + 1}</span> {labels[i]}
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
              <p className="text-lg font-semibold text-foreground mb-1">Перетащите файл или нажмите для выбора</p>
              <p className="text-xs text-muted-foreground">Поддерживаемые форматы: CSV, XLS, XLSX</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="mt-6 p-4 rounded-xl border border-border bg-muted/20">
              <h3 className="text-sm font-semibold text-foreground mb-2">Как это работает:</h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Загрузите BOM файл с перечнем компонентов</li>
                <li>Укажите колонки с номерами деталей и количеством</li>
                <li>Система автоматически проверит наличие на складе</li>
                <li>Ненайденные позиции будут найдены в DigiKey с ценами</li>
              </ol>
            </div>
          </>
        )}

        {/* Step 2: Map columns */}
        {step === "map" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-xs text-muted-foreground">— {rawData.length} строк</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Part Number *</label>
                <select
                  value={colPart}
                  onChange={(e) => setColPart(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Количество</label>
                <select
                  value={colQty}
                  onChange={(e) => setColQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Описание</label>
                <select
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
            </div>

            {/* Preview */}
            <h2 className="text-sm font-bold text-foreground mb-3">Предпросмотр</h2>
            <div className="border border-border rounded-xl overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Part Number</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Кол-во</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Описание</th>
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

            {/* Match button with progress */}
            {matching ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">{matchStage}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{matchProgress}%</span>
                </div>
                <Progress value={matchProgress} className="h-2" />
              </div>
            ) : (
              <button
                onClick={matchComponents}
                disabled={colPart === ""}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Найти компоненты (Склад + DigiKey)
              </button>
            )}
          </>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Всего</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Warehouse className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600">Склад</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{summary.inventory}</div>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600">DigiKey</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{summary.digikey}</div>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">Не найдено</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{summary.notFound}</div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary">Итого</span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {summary.totalCostRub > 0 && <div>{summary.totalCostRub.toFixed(2)} ₽</div>}
                  {summary.totalCostUsd > 0 && <div>${summary.totalCostUsd.toFixed(2)}</div>}
                  {summary.totalCostRub === 0 && summary.totalCostUsd === 0 && "—"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={exportCSV} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" /> CSV
              </button>
              <button onClick={exportXLSX} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" /> XLSX
              </button>
              <button onClick={handleClear} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 ml-auto">
                <Upload className="h-4 w-4" /> Новый BOM
              </button>
            </div>

            {/* Results table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-foreground">#</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Источник</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Запрос</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Найден</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Производитель</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Кол-во</th>
                      <th className="px-4 py-3 text-right font-bold text-foreground">Цена</th>
                      <th className="px-4 py-3 text-right font-bold text-foreground">Итого</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground">Наличие</th>
                      <th className="px-4 py-3 text-center font-bold text-foreground">Ещё</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedResults.map((row, idx) => (
                      <>
                        <tr key={`row-${idx}`} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                          <td className="px-4 py-3">{statusBadge(row)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">{row.partNumber}</td>
                          <td className="px-4 py-3">
                            {row.matchedPn ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-foreground font-semibold">{row.matchedPn}</span>
                                {row.productUrl && (
                                  <a href={row.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {row.datasheetUrl && (
                                  <a href={row.datasheetUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" title="Datasheet">
                                    <FileSpreadsheet className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground text-xs">{row.manufacturer}</td>
                          <td className="px-4 py-3 text-foreground font-medium">{row.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                            {row.unitPrice > 0 ? (
                              <span>{row.unitPrice.toFixed(row.unitPrice < 1 ? 4 : 2)} {row.currency === "RUB" ? "₽" : "$"}</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {row.extPrice > 0 ? (
                              <span>{row.extPrice.toFixed(2)} {row.currency === "RUB" ? "₽" : "$"}</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {row.stock > 0 ? (
                              <span className="text-emerald-600 font-medium">{row.stock.toLocaleString()} шт.</span>
                            ) : "—"}
                            {row.inventoryLocation && (
                              <div className="text-muted-foreground text-[10px]">{row.inventoryLocation}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.status === "digikey" && row.digiKeyAlternatives.length > 0 && (
                              <button
                                onClick={() => toggleRow(idx)}
                                className="text-xs text-primary hover:underline font-medium flex items-center gap-1 mx-auto"
                              >
                                {expandedRows.has(idx) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {row.digiKeyAlternatives.length}
                              </button>
                            )}
                            {row.status === "digikey" && row.priceTiers.length > 1 && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {row.priceTiers.length} тиров
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* DigiKey alternatives */}
                        {expandedRows.has(idx) && row.digiKeyAlternatives.length > 0 && (
                          <tr key={`alt-${idx}`} className="border-t border-border bg-blue-500/5">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="text-xs font-semibold text-muted-foreground mb-2">Альтернативы DigiKey:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {row.digiKeyAlternatives.map((alt, aIdx) => (
                                  <div key={aIdx} className="rounded-lg border border-border bg-card p-3 hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-start justify-between mb-1">
                                      <div>
                                        <div className="text-xs text-muted-foreground">{alt.manufacturer}</div>
                                        <div className="text-xs font-mono font-semibold text-foreground">{alt.mpn}</div>
                                      </div>
                                      {alt.stock > 0 ? (
                                        <span className="text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5">
                                          {alt.stock.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold rounded-full bg-red-500/15 text-red-600 px-2 py-0.5">0</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mb-1 line-clamp-2">{alt.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-foreground font-mono">
                                        {alt.unitPrice > 0 ? `$${alt.unitPrice.toFixed(alt.unitPrice < 1 ? 4 : 2)}` : "—"}
                                      </span>
                                      <div className="flex gap-1">
                                        {alt.productUrl && (
                                          <a href={alt.productUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                            DigiKey
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Price tiers */}
                              {row.priceTiers.length > 1 && (
                                <div className="mt-3">
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Тиражные цены:</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {row.priceTiers.map((tier, tIdx) => (
                                      <span key={tIdx} className="text-[10px] bg-muted rounded px-2 py-0.5">
                                        {tier.quantity}+ → ${tier.price.toFixed(4)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
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
