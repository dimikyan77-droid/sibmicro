import { useMemo } from "react";
import { TrendingUp, Package, Clock, CheckCircle2, AlertCircle, Loader2, ShoppingBag, Activity } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: any;
  total_amount: number;
  currency: string;
  created_at: string;
}

interface AccountDashboardProps {
  orders: Order[];
  loading: boolean;
  userEmail?: string;
  fullName?: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) => (
  <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-lg ${accent || "bg-primary/10"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-white" : "text-primary"}`} />
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  </div>
);

const statusConfig: Record<string, { label: { en: string; ru: string }; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: { en: "Pending", ru: "В ожидании" }, color: "text-yellow-600", bg: "bg-yellow-100", icon: Clock },
  processing: { label: { en: "Processing", ru: "В обработке" }, color: "text-blue-600", bg: "bg-blue-100", icon: Loader2 },
  completed: { label: { en: "Completed", ru: "Завершён" }, color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
  cancelled: { label: { en: "Cancelled", ru: "Отменён" }, color: "text-red-500", bg: "bg-red-100", icon: AlertCircle },
};

const AccountDashboard = ({ orders, loading, userEmail, fullName }: AccountDashboardProps) => {
  const { lang } = useI18n();

  const stats = useMemo(() => {
    const total = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const itemsTotal = orders.reduce((s, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return s + items.reduce((a: number, i: any) => a + (i.quantity || 0), 0);
    }, 0);
    return { total, byStatus, itemsTotal };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const formatCurrency = (val: number, currency = "USD") =>
    currency === "USD" ? `$${val.toFixed(2)}` : `₽${val.toFixed(2)}`;

  const greetingName = fullName || userEmail?.split("@")[0] || "User";
  const hour = new Date().getHours();
  const greeting =
    lang === "ru"
      ? hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер"
      : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary">{greetingName[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <p className="text-lg font-semibold text-foreground">{greetingName}</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">{lang === "ru" ? "Сегодня" : "Today"}</p>
          <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label={lang === "ru" ? "Всего заказов" : "Total Orders"}
          value={orders.length}
          sub={lang === "ru" ? "за всё время" : "all time"}
        />
        <StatCard
          icon={TrendingUp}
          label={lang === "ru" ? "Общая сумма" : "Total Spent"}
          value={`$${stats.total.toFixed(2)}`}
          sub={lang === "ru" ? "в USD" : "USD"}
          accent="bg-primary"
        />
        <StatCard
          icon={Package}
          label={lang === "ru" ? "Позиций куплено" : "Items Ordered"}
          value={stats.itemsTotal}
          sub={lang === "ru" ? "компонентов" : "components"}
        />
        <StatCard
          icon={CheckCircle2}
          label={lang === "ru" ? "Завершено" : "Completed"}
          value={stats.byStatus["completed"] || 0}
          sub={`${orders.length ? Math.round(((stats.byStatus["completed"] || 0) / orders.length) * 100) : 0}%`}
          accent="bg-green-500"
        />
      </div>

      {/* Status breakdown + recent activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ru" ? "По статусам" : "By Status"}</h3>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === "ru" ? "Нет заказов" : "No orders yet"}</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([status, cfg]) => {
                const count = stats.byStatus[status] || 0;
                const pct = orders.length ? (count / orders.length) * 100 : 0;
                const StatusIcon = cfg.icon;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label[lang as "en" | "ru"] || cfg.label.en}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          status === "completed" ? "bg-green-500" :
                          status === "processing" ? "bg-blue-500" :
                          status === "pending" ? "bg-yellow-500" : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ru" ? "Последние заказы" : "Recent Orders"}</h3>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === "ru" ? "Нет заказов" : "No orders yet"}</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig["pending"];
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                    <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-mono truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(order.total_amount, order.currency)}</p>
                      <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label[lang as "en" | "ru"] || cfg.label.en}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;
