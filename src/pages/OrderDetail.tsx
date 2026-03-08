import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package } from "lucide-react";

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

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setOrder(data as unknown as Order);
        setLoading(false);
      });
  }, [user, id]);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "processing": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

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

  return (
    <Layout>
      <div className="container max-w-4xl py-10">
        <Button variant="ghost" asChild className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/account"><ArrowLeft className="h-4 w-4" />{t("order.back_to_orders")}</Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t("account.order_number")} {order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString()} · {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

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
