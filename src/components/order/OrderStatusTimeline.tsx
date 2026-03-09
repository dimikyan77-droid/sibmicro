import { useI18n } from "@/contexts/I18nContext";
import { ORDER_STATUSES, orderStatusConfig, getStatusIndex } from "./orderStatusConfig";
import { Check } from "lucide-react";

interface StatusHistoryEntry {
  status: string;
  created_at: string;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  history?: StatusHistoryEntry[];
}

const OrderStatusTimeline = ({ currentStatus, history = [] }: OrderStatusTimelineProps) => {
  const { lang } = useI18n();
  const isCancelled = currentStatus === "cancelled";
  const currentIdx = isCancelled ? -1 : getStatusIndex(currentStatus);

  const historyMap = new Map<string, string>();
  history.forEach((h) => {
    if (!historyMap.has(h.status)) {
      historyMap.set(h.status, h.created_at);
    }
  });

  return (
    <div className="w-full">
      {isCancelled ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <orderStatusConfig.cancelled.icon className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {orderStatusConfig.cancelled.label[lang as "en" | "ru"]}
          </span>
        </div>
      ) : (
        <div className="flex items-center w-full">
          {ORDER_STATUSES.map((status, idx) => {
            const cfg = orderStatusConfig[status];
            const Icon = cfg.icon;
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isLast = idx === ORDER_STATUSES.length - 1;
            const date = historyMap.get(status);

            return (
              <div key={status} className="flex items-center flex-1 last:flex-none">
                {/* Step circle */}
                <div className="flex flex-col items-center relative">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? `${cfg.bg} border-transparent`
                        : isCurrent
                        ? `${cfg.bg} border-current ${cfg.color} ring-2 ring-offset-2 ring-offset-background`
                        : "bg-muted border-border"
                    }`}
                    
                  >
                    {isCompleted ? (
                      <Check className={`h-4 w-4 ${cfg.color}`} />
                    ) : (
                      <Icon className={`h-4 w-4 ${isCurrent ? cfg.color : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 text-center whitespace-nowrap max-w-[80px] leading-tight ${
                      isCurrent ? `font-semibold ${cfg.color}` : isCompleted ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {cfg.label[lang as "en" | "ru"]}
                  </span>
                  {date && (
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {new Date(date).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx < currentIdx ? cfg.progressColor : "bg-transparent"
                      }`}
                      style={{ width: idx < currentIdx ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderStatusTimeline;
