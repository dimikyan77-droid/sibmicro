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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileSpreadsheet, Search, Package, AlertCircle, CheckCircle2, ShieldAlert, Edit2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as XLSX from "xlsx";

interface CatalogProduct {
  id: string;
  part_number: string;
  manufacturer: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  package: string | null;
  quantity: number;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  datasheet_url: string | null;
  is_new: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ParsedRow {
  part_number: string;
  manufacturer?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  package?: string;
  quantity: number;
  price?: number;
  currency?: string;
}

const AdminProducts = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch catalog products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog-products", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("catalog_products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (searchQuery) {
        query = query.or(`part_number.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CatalogProduct[];
    },
    enabled: !!isAdmin,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      toast({ title: "Позиция удалена" });
    },
  });

  // Toggle is_new
  const toggleNewMutation = useMutation({
    mutationFn: async ({ id, is_new }: { id: string; is_new: boolean }) => {
      const { error } = await supabase.from("catalog_products").update({ is_new }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    },
  });

  // Bulk upsert
  const bulkInsertMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      // Dedupe by part_number
      const map = new Map<string, ParsedRow>();
      for (const row of rows) {
        const key = row.part_number.trim();
        if (!key) continue;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, { ...row, part_number: key });
        } else {
          map.set(key, {
            ...prev,
            quantity: (prev.quantity ?? 0) + (row.quantity ?? 0),
            price: row.price ?? prev.price,
            manufacturer: row.manufacturer ?? prev.manufacturer,
            description: row.description ?? prev.description,
            category: row.category ?? prev.category,
            subcategory: row.subcategory ?? prev.subcategory,
            package: row.package ?? prev.package,
            currency: row.currency ?? prev.currency,
          });
        }
      }

      const deduped = Array.from(map.values());
      
      const { error } = await supabase.from("catalog_products").upsert(
        deduped.map((r) => ({
          part_number: r.part_number,
          manufacturer: r.manufacturer || null,
          category: r.category || null,
          subcategory: r.subcategory || null,
          description: r.description || null,
          package: r.package || null,
          quantity: r.quantity,
          price: r.price || null,
          currency: r.currency || "RUB",
          is_new: true,
        })),
        { onConflict: "part_number" }
      );
      if (error) throw error;
      return deduped.length;
    },
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      queryClient.invalidateQueries({ queryKey: ["new-catalog-products"] });
      setParsedData([]);
      setShowPreview(false);
      toast({
        title: "Каталог обновлён",
        description: `Загружено позиций: ${_data}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

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

      const rows: ParsedRow[] = json
        .map((row) => {
          const pn = getCol(row, "part_number", "partnumber", "артикул", "mpn", "partno");
          const qtyStr = getCol(row, "quantity", "qty", "кол-во", "количество", "in_stock", "наличие");
          const qty = parseInt(qtyStr, 10);
          const priceStr = getCol(row, "price", "цена");
          const price = parseFloat(priceStr) || undefined;
          const manufacturer = getCol(row, "manufacturer", "производитель", "mfg") || undefined;
          const description = getCol(row, "description", "описание", "desc") || undefined;
          const category = getCol(row, "category", "категория") || undefined;
          const subcategory = getCol(row, "subcategory", "подкатегория") || undefined;
          const pkg = getCol(row, "package", "корпус") || undefined;
          const currency = getCol(row, "currency", "валюта") || "RUB";

          return {
            part_number: pn,
            quantity: isNaN(qty) ? 0 : qty,
            price,
            manufacturer,
            description,
            category,
            subcategory,
            package: pkg,
            currency,
          };
        })
        .filter((r) => r.part_number);

      setParsedData(rows);
      setShowPreview(true);
    } catch {
      toast({ title: "Ошибка", description: "Ошибка чтения файла", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [toast]);

  const confirmUpload = () => {
    if (parsedData.length === 0) return;
    bulkInsertMutation.mutate(parsedData);
  };

  const currencySymbol: Record<string, string> = { USD: "$", RUB: "₽", EUR: "€" };

  if (!user || roleLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-muted-foreground">Доступ только для администраторов</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Управление каталогом</h1>
            <p className="text-muted-foreground">Загружайте товары из Excel — они появятся в каталоге и новинках</p>
          </div>
          <Label htmlFor="catalog-file-upload" className="cursor-pointer">
            <Button asChild variant="default" disabled={uploading}>
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Загрузить Excel/CSV
                <input
                  id="catalog-file-upload"
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Всего позиций</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Новинки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{products.filter((p) => p.is_new).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Общий остаток</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{products.reduce((s, p) => s + p.quantity, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Preview */}
        {showPreview && (
          <Card className="mb-8 border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <CardTitle>Предпросмотр загрузки</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setParsedData([]); setShowPreview(false); }}>
                  Отмена
                </Button>
                <Button size="sm" onClick={confirmUpload} disabled={bulkInsertMutation.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Загрузить ({parsedData.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Артикул</TableHead>
                    <TableHead>Производитель</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 15).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{row.part_number}</TableCell>
                      <TableCell>{row.manufacturer || "—"}</TableCell>
                      <TableCell>{row.category || "—"}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>
                        {row.price
                          ? `${currencySymbol[row.currency?.toUpperCase() ?? "RUB"] ?? "₽"}${row.price}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {parsedData.length > 15 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        ...и ещё {parsedData.length - 15} строк
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
              placeholder="Поиск по артикулу, производителю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Каталог пуст. Загрузите товары из Excel.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Артикул</TableHead>
                      <TableHead>Производитель</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead className="text-right">Кол-во</TableHead>
                      <TableHead className="text-right">Цена</TableHead>
                      <TableHead className="text-center">Новинка</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.part_number}</TableCell>
                        <TableCell>{item.manufacturer || "—"}</TableCell>
                        <TableCell className="text-xs">{item.category || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs">{item.description || "—"}</TableCell>
                        <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.price
                            ? `${currencySymbol[(item.currency || "RUB").toUpperCase()] ?? "₽"}${Number(item.price).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!item.is_new}
                            onCheckedChange={(checked) =>
                              toggleNewMutation.mutate({ id: item.id, is_new: checked })
                            }
                          />
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

export default AdminProducts;
