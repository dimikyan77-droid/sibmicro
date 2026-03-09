import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileSpreadsheet, Search, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface InventoryItem {
  id: string;
  part_number: string;
  manufacturer: string | null;
  description: string | null;
  quantity: number;
  price: number | null;
  currency: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface ParsedRow {
  part_number: string;
  manufacturer?: string;
  description?: string;
  quantity: number;
  price?: number;
  currency?: string;
  location?: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "RUB" | "EUR">("USD");

  // Fetch inventory
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("inventory")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      
      if (searchQuery) {
        query = query.or(`part_number.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: t("inventory.deleted") });
    },
  });

  // Bulk upsert mutation (updates existing by part_number, inserts new ones)
  const bulkInsertMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const { error } = await supabase.from("inventory").upsert(
        rows.map((r) => ({
          part_number: r.part_number,
          manufacturer: r.manufacturer || null,
          description: r.description || null,
          quantity: r.quantity,
          price: r.price || null,
          currency: r.currency || "RUB",
          location: r.location || null,
        })),
        { onConflict: "part_number" }
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setParsedData([]);
      setShowPreview(false);
      toast({
        title: t("inventory.uploaded"),
        description: `${variables.length} уникальных позиций загружено`,
      });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const dedupeRowsByPartNumber = (rows: ParsedRow[]): ParsedRow[] => {
    const map = new Map<string, ParsedRow>();

    for (const row of rows) {
      const key = row.part_number.trim();
      if (!key) continue;

      const prev = map.get(key);
      if (!prev) {
        map.set(key, { ...row, part_number: key });
        continue;
      }

      map.set(key, {
        part_number: key,
        quantity: (prev.quantity ?? 0) + (row.quantity ?? 0),
        price: row.price ?? prev.price,
        currency: row.currency ?? prev.currency,
        manufacturer: row.manufacturer ?? prev.manufacturer,
        description: row.description ?? prev.description,
        location: row.location ?? prev.location,
      });
    }

    return Array.from(map.values());
  };

  // Parse file
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      // Flexible column name resolver (handles composite headers like "Part_Number (Артикул)")
      const getCol = (row: Record<string, unknown>, ...keys: string[]): string => {
        for (const key of keys) {
          for (const col of Object.keys(row)) {
            if (col.toLowerCase().replace(/[\s_\-()]/g, "").includes(key.toLowerCase().replace(/[\s_\-()]/g, ""))) {
              const val = String(row[col] ?? "").trim();
              if (val) return val;
            }
          }
        }
        return "";
      };

      // Map columns (flexible naming — supports EN/RU and composite headers)
      const rows: ParsedRow[] = json
        .map((row) => {
          const pn = getCol(row, "part_number", "partnumber", "артикул", "mpn", "partno");
          const qtyStr = getCol(row, "in_stock", "instock", "наличие", "quantity", "кол-во", "qty");
          const qty = parseInt(qtyStr, 10);
          const priceStr = getCol(row, "price", "цена");
          const price = parseFloat(priceStr) || undefined;
          const manufacturer = getCol(row, "manufacturer", "производитель") || undefined;
          const description = getCol(row, "description", "описание") || undefined;
          const location = getCol(row, "location", "место", "склад") || undefined;
          const currency = getCol(row, "currency", "валюта") || defaultCurrency;

          return {
            part_number: pn,
            quantity: isNaN(qty) ? 0 : qty,
            price,
            manufacturer,
            description,
            location,
            currency,
          };
        })
        .filter((r) => r.part_number);

      setParsedData(rows);
      setShowPreview(true);
    } catch (err) {
      toast({ title: t("auth.error"), description: "Ошибка чтения файла", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [toast, t, defaultCurrency]);

  const confirmUpload = () => {
    if (parsedData.length === 0) return;
    const deduped = dedupeRowsByPartNumber(parsedData);
    bulkInsertMutation.mutate(deduped);
  };

  const cancelUpload = () => {
    setParsedData([]);
    setShowPreview(false);
  };

  const totalQuantity = inventory.reduce((acc, i) => acc + i.quantity, 0);

  // Group total value by currency
  const totalValueByCurrency = inventory.reduce((acc, i) => {
    if (!i.price) return acc;
    const cur = (i.currency || "RUB").toUpperCase();
    acc[cur] = (acc[cur] || 0) + i.price * i.quantity;
    return acc;
  }, {} as Record<string, number>);

  const currencySymbol: Record<string, string> = { USD: "$", RUB: "₽", EUR: "€" };

  const totalValueDisplay = Object.entries(totalValueByCurrency)
    .map(([cur, val]) => `${currencySymbol[cur] ?? cur}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    .join(" + ") || "—";

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("cart.login_hint")}</p>
          <Button className="mt-4" onClick={() => window.location.href = "/auth"}>
            {t("header.login")}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("inventory.title")}</h1>
            <p className="text-muted-foreground">{t("inventory.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value as "USD" | "RUB" | "EUR")}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="USD">$ USD</option>
              <option value="RUB">₽ RUB</option>
              <option value="EUR">€ EUR</option>
            </select>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild variant="default" disabled={uploading}>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t("inventory.upload")}
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </span>
              </Button>
            </Label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("inventory.positions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("inventory.total_qty")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("inventory.total_value")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₽{totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Preview */}
        {showPreview && (
          <Card className="mb-8 border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <CardTitle>{t("inventory.preview")}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelUpload}>{t("common.cancel")}</Button>
                <Button size="sm" onClick={confirmUpload} disabled={bulkInsertMutation.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {t("inventory.confirm")} ({parsedData.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("catalog.part_number")}</TableHead>
                    <TableHead>{t("catalog.manufacturer")}</TableHead>
                    <TableHead>{t("order.quantity")}</TableHead>
                    <TableHead>{t("catalog.price")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{row.part_number}</TableCell>
                      <TableCell>{row.manufacturer || "—"}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.price ? `${row.currency === "USD" ? "$" : "₽"}${row.price}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {parsedData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ...и ещё {parsedData.length - 10} строк
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("inventory.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : inventory.length === 0 ? (
              <div className="p-16 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("inventory.empty")}</p>
                <Label htmlFor="file-upload-empty" className="cursor-pointer">
                  <Button asChild variant="outline">
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t("inventory.upload")}
                      <input
                        id="file-upload-empty"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </span>
                  </Button>
                </Label>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("catalog.part_number")}</TableHead>
                      <TableHead>{t("catalog.manufacturer")}</TableHead>
                      <TableHead>{t("catalog.description")}</TableHead>
                      <TableHead className="text-right">{t("order.quantity")}</TableHead>
                      <TableHead className="text-right">{t("catalog.price")}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.part_number}</TableCell>
                        <TableCell>{item.manufacturer || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.description || "—"}</TableCell>
                        <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.price ? `${item.currency === "USD" ? "$" : "₽"}${item.price.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventory;
