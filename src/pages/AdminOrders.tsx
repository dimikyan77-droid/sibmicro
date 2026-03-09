import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, Search, ArrowRight } from "lucide-react";
import {
  ORDER_STATUSES,
  ALL_STATUSES,
  orderStatusConfig,
  getStatusLabel,
  getStatusIndex,
  type OrderStatus,
} from "@/components/order/orderStatusConfig";

interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  user_id: string;
}

const AdminOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (!data) { navigate("/account"); return; }
      setIsAdmin(true);
      setChecking(false);
    });
  }, [user, authLoading, navigate]);

  // Fetch all orders (admin RLS allows select via service or we query with admin check)
  const fetchOrders = useCallback(async () => {
    // Admin can read all orders via RLS select policy — but current RLS only allows own orders.
    // We'll use an edge function or rpc. For simplicity, let's query directly —
    // we need an admin-select policy. We'll add it via migration.
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, currency, created_at, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      toast({ title: lang === "ru" ? "Ошибка загрузки" : "Load error", variant: "destructive" });
    } else {
      setOrders((data as AdminOrder[]) || []);
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [isAdmin, fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchesSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openChangeDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNote("");
    setDialogOpen(true);
  };

  // Determine allowed next statuses (sequential only, plus cancel)
  const getAllowedStatuses = (currentStatus: string): string[] => {
    if (currentStatus === "completed" || currentStatus === "cancelled") return [];
    const idx = getStatusIndex(currentStatus);
    const next: string[] = [];
    if (idx >= 0 && idx < ORDER_STATUSES.length - 1) {
      next.push(ORDER_STATUSES[idx + 1]);
    }
    next.push("cancelled");
    return next;
  };

  const handleSave = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) return;
    setSaving(true);

    // Update order status
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", selectedOrder.id);

    if (updateErr) {
      toast({ title: lang === "ru" ? "Ошибка обновления" : "Update error", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Insert history entry
    await supabase.from("order_status_history").insert({
      order_id: selectedOrder.id,
      status: newStatus,
      changed_by: user!.id,
      note: note.trim() || null,
    });

    toast({
      title: lang === "ru" ? "Статус обновлён" : "Status updated",
      description: `${selectedOrder.order_number}: ${getStatusLabel(newStatus, lang as "en" | "ru")}`,
    });

    setDialogOpen(false);
    setSaving(false);
    fetchOrders();
  };

  if (authLoading || checking) {
    return <Layout><div className="container py-16 text-center text-muted-foreground">Loading...</div></Layout>;
  }

  if (!isAdmin) return null;

  const currencySymbol = (c: string) => (c === "USD" ? "$" : "₽");

  return (
    <Layout>
      <div className="container max-w-6xl py-10">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ru" ? "Управление заказами" : "Order Management"}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang === "ru" ? "Поиск по номеру заказа..." : "Search by order number..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "ru" ? "Все статусы" : "All statuses"}</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{getStatusLabel(s, lang as "en" | "ru")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ru" ? "Номер" : "Number"}</TableHead>
                <TableHead>{lang === "ru" ? "Дата" : "Date"}</TableHead>
                <TableHead>{lang === "ru" ? "Сумма" : "Amount"}</TableHead>
                <TableHead>{lang === "ru" ? "Статус" : "Status"}</TableHead>
                <TableHead className="text-right">{lang === "ru" ? "Действие" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang === "ru" ? "Нет заказов" : "No orders"}</TableCell></TableRow>
              ) : (
                filtered.map((order) => {
                  const cfg = orderStatusConfig[order.status] || orderStatusConfig["pending"];
                  const StatusIcon = cfg.icon;
                  const allowed = getAllowedStatuses(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {currencySymbol(order.currency)}{order.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-transparent gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(order.status, lang as "en" | "ru")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {allowed.length > 0 ? (
                          <Button size="sm" variant="outline" onClick={() => openChangeDialog(order)} className="gap-1">
                            <ArrowRight className="h-3.5 w-3.5" />
                            {lang === "ru" ? "Изменить" : "Change"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{lang === "ru" ? "Финальный" : "Final"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Change status dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ru" ? "Изменить статус" : "Change Status"} — {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {lang === "ru" ? "Текущий статус" : "Current status"}
                </p>
                <Badge variant="outline" className={`${orderStatusConfig[selectedOrder.status]?.bg} ${orderStatusConfig[selectedOrder.status]?.color} border-transparent`}>
                  {getStatusLabel(selectedOrder.status, lang as "en" | "ru")}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-1.5">
                  {lang === "ru" ? "Новый статус" : "New status"}
                </p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllowedStatuses(selectedOrder.status).map((s) => {
                      const cfg = orderStatusConfig[s];
                      return (
                        <SelectItem key={s} value={s}>
                          <span className={`${cfg.color}`}>{getStatusLabel(s, lang as "en" | "ru")}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-1.5">
                  {lang === "ru" ? "Комментарий (необязательно)" : "Note (optional)"}
                </p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === "ru" ? "Комментарий к смене статуса..." : "Comment on status change..."}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {lang === "ru" ? "Отмена" : "Cancel"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !newStatus || newStatus === selectedOrder?.status}
            >
              {saving
                ? (lang === "ru" ? "Сохранение..." : "Saving...")
                : (lang === "ru" ? "Сохранить" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminOrders;
