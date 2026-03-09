import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, History } from "lucide-react";
import OrderStatusTimeline from "@/components/order/OrderStatusTimeline";
import { orderStatusConfig, getStatusLabel } from "@/components/order/orderStatusConfig";

interface OrderItem {
  productId: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  created_at: string;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  created_at: string;
  note: string | null;
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;

    // Fetch order and status history in parallel
    Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]).then(([orderRes, historyRes]) => {
      setOrder(orderRes.data as unknown as Order);
      setStatusHistory((historyRes.data as unknown as StatusHistoryEntry[]) || []);
      setLoading(false);
    });
  }, [user, id]);

  if (authLoading || loading) {
    return <Layout><div className="container py-16 text-center text-muted-foreground">Loading...</div></Layout>;
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground mb-4">{t("order.not_found")}</p>
          <Button variant="outline" asChild><Link to="/account">{t("order.back_to_orders")}</Link></Button>
        </div>
      </Layout>
    );
  }

  const items = order.items as OrderItem[];
  const currencySymbol = order.currency === "USD" ? "$" : "₽";
  const cfg = orderStatusConfig[order.status] || orderStatusConfig["pending"];

  return (
    <Layout>
      <div className="container max-w-4xl py-10">
        <Button variant="ghost" asChild className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/account"><ArrowLeft className="h-4 w-4" />{t("order.back_to_orders")}</Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t("account.order_number")} {order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")} · {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`}>
            <cfg.icon className="h-4 w-4" />
            {getStatusLabel(order.status, lang as "en" | "ru")}
          </span>
        </div>

        {/* Status Timeline */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            {lang === "ru" ? "Прогресс заказа" : "Order Progress"}
          </h2>
          <OrderStatusTimeline currentStatus={order.status} history={statusHistory} />
        </div>

        {/* Status History */}
        {statusHistory.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {lang === "ru" ? "История статусов" : "Status History"}
              </h2>
            </div>
            <div className="space-y-3">
              {statusHistory.map((entry) => {
                const entryCfg = orderStatusConfig[entry.status] || orderStatusConfig["pending"];
                const EntryIcon = entryCfg.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className={`h-7 w-7 rounded-full ${entryCfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <EntryIcon className={`h-3.5 w-3.5 ${entryCfg.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${entryCfg.color}`}>
                        {getStatusLabel(entry.status, lang as "en" | "ru")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")} · {new Date(entry.created_at).toLocaleTimeString()}
                      </p>
                      {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order.part_number")}</TableHead>
                <TableHead>{t("order.manufacturer")}</TableHead>
                <TableHead className="text-right">{t("order.quantity")}</TableHead>
                <TableHead className="text-right">{t("order.unit_price")}</TableHead>
                <TableHead className="text-right">{t("account.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Link to={`/product/${item.productId}`} className="font-mono font-medium text-primary hover:underline">
                      {item.partNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.manufacturer}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{currencySymbol}{item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end p-4 border-t border-border">
            <div className="text-right">
              <span className="text-muted-foreground mr-4">{t("account.total")}:</span>
              <span className="text-xl font-bold text-foreground">{currencySymbol}{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetail;
