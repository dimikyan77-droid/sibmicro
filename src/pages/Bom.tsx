import { useState, useCallback, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Search, Trash2, ShoppingCart, FileText } from "lucide-react";

interface BomRow {
  partNumber: string;
  quantity: number;
  description: string;
}

const Bom = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colPart, setColPart] = useState<number | "">("");
  const [colQty, setColQty] = useState<number | "">("");
  const [colDesc, setColDesc] = useState<number | "">("");
  const [fileName, setFileName] = useState<string>("");

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
            // Simple CSV parse (handles commas inside quotes)
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
          }
        } catch {
          toast({ title: t("bom.error_parse"), variant: "destructive" });
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
          }
        } catch {
          toast({ title: t("bom.error_parse"), variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [t, toast]);

  const autoDetectColumns = (hdrs: string[]) => {
    const lower = hdrs.map((h) => h.toLowerCase());
    // Part number
    const partIdx = lower.findIndex((h) =>
      ["part", "pn", "mpn", "partnumber", "part number", "part_number", "артикул", "номер"].some((k) => h.includes(k))
    );
    if (partIdx >= 0) setColPart(partIdx);

    // Quantity
    const qtyIdx = lower.findIndex((h) =>
      ["qty", "quantity", "кол-во", "количество", "count"].some((k) => h.includes(k))
    );
    if (qtyIdx >= 0) setColQty(qtyIdx);

    // Description
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parsedRows: BomRow[] = rawData
    .map((row) => ({
      partNumber: colPart !== "" ? row[colPart] || "" : "",
      quantity: colQty !== "" ? parseInt(row[colQty], 10) || 1 : 1,
      description: colDesc !== "" ? row[colDesc] || "" : "",
    }))
    .filter((r) => r.partNumber.trim() !== "");

  const partNumbersText = parsedRows.map((r) => r.partNumber).join("\n");

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("bom.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("bom.subtitle")}</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors mb-6"
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">{t("bom.drop_zone")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("bom.supported")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-2 mb-6 text-sm text-foreground">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="font-medium">{fileName}</span>
            <span className="text-muted-foreground">— {rawData.length} {t("bom.rows_loaded")}</span>
            <button onClick={handleClear} className="ml-auto text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Column mapping */}
        {headers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("bom.col_part")} *</label>
              <select
                value={colPart}
                onChange={(e) => setColPart(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("bom.col_qty")}</label>
              <select
                value={colQty}
                onChange={(e) => setColQty(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("bom.col_desc")}</label>
              <select
                value={colDesc}
                onChange={(e) => setColDesc(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-3">{t("bom.preview")}</h2>
            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("bom.part_number")}</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-20">{t("bom.quantity")}</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("bom.description")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono text-foreground">{row.partNumber}</td>
                        <td className="px-3 py-2 text-foreground">{row.quantity}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-xs">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/catalog?q=${encodeURIComponent(parsedRows[0]?.partNumber || "")}`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Search className="h-4 w-4" />
                {t("bom.search_all")}
              </Link>
              <Link
                to={`/quote?parts=${encodeURIComponent(partNumbersText)}`}
                className="inline-flex items-center gap-2 rounded-md border border-primary px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                {t("bom.request_quote")}
              </Link>
            </div>
          </>
        )}

        {!fileName && (
          <p className="text-center text-muted-foreground py-10">{t("bom.no_file")}</p>
        )}
      </div>
    </Layout>
  );
};

export default Bom;
