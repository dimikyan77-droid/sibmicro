import { useMemo } from "react";
import { TrendingUp, Package, Clock, ShoppingBag, Activity } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { ALL_STATUSES, orderStatusConfig, getStatusLabel } from "@/components/order/orderStatusConfig";

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
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accentClass?: string;
}) => (
  <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className={`p-2 rounded-lg ${accentClass || "bg-accent/10"}`}>
        <Icon className={`h-4 w-4 ${accentClass ? "text-card" : "text-accent"}`} />
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  </div>
);

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
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-accent">{greetingName[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{greeting},</p>
          <p className="text-lg font-semibold text-foreground tracking-tight">{greetingName}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard
          icon={ShoppingBag}
          label={lang === "ru" ? "Заказов" : "Orders"}
          value={orders.length}
          sub={lang === "ru" ? "за всё время" : "all time"}
        />
        <StatCard
          icon={TrendingUp}
          label={lang === "ru" ? "Сумма" : "Total Spent"}
          value={`$${stats.total.toFixed(2)}`}
          sub="USD"
          accentClass="bg-accent"
        />
        <StatCard
          icon={Package}
          label={lang === "ru" ? "Позиций" : "Items"}
          value={stats.itemsTotal}
          sub={lang === "ru" ? "компонентов" : "components"}
        />
        <StatCard
          icon={Clock}
          label={lang === "ru" ? "Завершено" : "Completed"}
          value={stats.byStatus["completed"] || 0}
          sub={`${orders.length ? Math.round(((stats.byStatus["completed"] || 0) / orders.length) * 100) : 0}%`}
          accentClass="bg-emerald-500"
        />
      </div>

      {/* Status breakdown + recent */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ru" ? "По статусам" : "By Status"}</h3>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === "ru" ? "Нет заказов" : "No orders yet"}</p>
          ) : (
            <div className="space-y-4">
              {ALL_STATUSES.map((status) => {
                const cfg = orderStatusConfig[status];
                const count = stats.byStatus[status] || 0;
                const pct = orders.length ? (count / orders.length) * 100 : 0;
                const StatusIcon = cfg.icon;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label[lang as "en" | "ru"]}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.progressColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ru" ? "Последние заказы" : "Recent Orders"}</h3>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === "ru" ? "Нет заказов" : "No orders yet"}</p>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((order) => {
                const cfg = orderStatusConfig[order.status] || orderStatusConfig["pending"];
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-mono truncate">{order.order_number}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(order.total_amount, order.currency)}</p>
                      <p className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label[lang as "en" | "ru"]}</p>
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
