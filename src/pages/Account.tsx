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
import { LogOut, Save, Package, User, LayoutDashboard } from "lucide-react";
import AccountDashboard from "@/components/account/AccountDashboard";

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
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inn, setInn] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "chip chip-success";
      case "processing": return "chip chip-info";
      case "pending": return "chip chip-warning";
      default: return "chip";
    }
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

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />{t("account.profile")}</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><Package className="h-4 w-4" />{t("account.orders")}</TabsTrigger>
          </TabsList>

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
                        <TableCell><span className={statusColor(order.status)}>{order.status}</span></TableCell>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Account;
