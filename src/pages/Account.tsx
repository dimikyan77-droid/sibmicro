import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Package, User, LayoutDashboard, FileText, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { orderStatusConfig, getStatusLabel } from "@/components/order/orderStatusConfig";
import AccountDashboard from "@/components/account/AccountDashboard";
import OrderStatusTimeline from "@/components/order/OrderStatusTimeline";

interface QuoteRequest {
  id: string;
  part_numbers: string;
  quantities: string | null;
  status: string;
  created_at: string;
  message: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: any;
  total_amount: number;
  currency: string;
  created_at: string;
}

const Account = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inn, setInn] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCompanyName(profile.company_name || "");
      setInn(profile.inn || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setOrdersLoading(false);
        });

      supabase
        .from("quote_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setQuotes((data as any) || []);
          setQuotesLoading(false);
        });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, company_name: companyName, inn })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: t("account.saved") });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getOrderStatusBadge = (status: string) => {
    const cfg = orderStatusConfig[status] || orderStatusConfig["pending"];
    const StatusIcon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
        <StatusIcon className="h-3 w-3" />
        {getStatusLabel(status, lang as "en" | "ru")}
      </span>
    );
  };

  const quoteStatusConfig: Record<string, { label: { en: string; ru: string }; color: string; bg: string; icon: React.ElementType }> = {
    new: { label: { en: "New", ru: "Новый" }, color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
    processing: { label: { en: "Processing", ru: "В обработке" }, color: "text-yellow-600", bg: "bg-yellow-100", icon: Loader2 },
    quoted: { label: { en: "Quoted", ru: "Расценён" }, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
    closed: { label: { en: "Closed", ru: "Закрыт" }, color: "text-muted-foreground", bg: "bg-muted", icon: AlertCircle },
  };

  if (loading) {
    return <Layout><div className="container py-16 text-center text-muted-foreground">Loading...</div></Layout>;
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container max-w-4xl py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t("account.title")}</h1>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t("account.logout")}
          </Button>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="h-4 w-4" />{t("account.dashboard")}</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />{t("account.profile")}</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><Package className="h-4 w-4" />{t("account.orders")}</TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2"><FileText className="h-4 w-4" />{t("account.quotes")}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AccountDashboard
              orders={orders}
              loading={ordersLoading}
              userEmail={user.email}
              fullName={profile?.full_name || ""}
            />
          </TabsContent>

          <TabsContent value="profile">
            <div className="rounded-lg border border-border bg-card p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div>
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="full-name">{t("auth.full_name")}</Label>
                  <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">{t("account.phone")}</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" />
                </div>
                <div>
                  <Label htmlFor="company">{t("auth.company")}</Label>
                  <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="inn">{t("account.inn")}</Label>
                  <Input id="inn" value={inn} onChange={(e) => setInn(e.target.value)} placeholder="1234567890" />
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("account.save")}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="rounded-lg border border-border bg-card">
              {ordersLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t("account.no_orders")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("account.order_number")}</TableHead>
                      <TableHead>{t("account.date")}</TableHead>
                      <TableHead>{t("account.status")}</TableHead>
                      <TableHead className="text-right">{t("account.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link to={`/order/${order.id}`} className="font-mono font-medium text-primary hover:underline">
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {order.currency === "USD" ? "$" : "₽"}{order.total_amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quotes">
            <div className="rounded-lg border border-border bg-card">
              {quotesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : quotes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t("account.no_quotes")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("account.quote_date")}</TableHead>
                      <TableHead>{t("account.quote_parts")}</TableHead>
                      <TableHead>{t("account.quote_status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((q) => {
                      const cfg = quoteStatusConfig[q.status] || quoteStatusConfig["new"];
                      const StatusIcon = cfg.icon;
                      return (
                        <TableRow key={q.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(q.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium text-foreground">{q.part_numbers.substring(0, 80)}{q.part_numbers.length > 80 ? "…" : ""}</span>
                            {q.quantities && <span className="block text-xs text-muted-foreground mt-0.5">Кол-во: {q.quantities}</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label[lang as "en" | "ru"] || cfg.label.en}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Account;
