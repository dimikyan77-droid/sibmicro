import { Clock, Loader2, FileText, ShoppingCart, CheckCircle2, AlertCircle, type LucideIcon } from "lucide-react";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "quote_received",
  "order_placed",
  "completed",
] as const;

export const ALL_STATUSES = [...ORDER_STATUSES, "cancelled"] as const;

export type OrderStatus = (typeof ALL_STATUSES)[number];

export interface StatusConfig {
  label: { en: string; ru: string };
  color: string;
  bg: string;
  progressColor: string;
  icon: LucideIcon;
}

export const orderStatusConfig: Record<string, StatusConfig> = {
  pending: {
    label: { en: "Pending", ru: "В ожидании" },
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    progressColor: "bg-yellow-500",
    icon: Clock,
  },
  processing: {
    label: { en: "Processing", ru: "В обработке" },
    color: "text-blue-600",
    bg: "bg-blue-100",
    progressColor: "bg-blue-500",
    icon: Loader2,
  },
  quote_received: {
    label: { en: "Quote Received", ru: "Получено КП" },
    color: "text-purple-600",
    bg: "bg-purple-100",
    progressColor: "bg-purple-500",
    icon: FileText,
  },
  order_placed: {
    label: { en: "Order Placed", ru: "Заказ размещён" },
    color: "text-orange-600",
    bg: "bg-orange-100",
    progressColor: "bg-orange-500",
    icon: ShoppingCart,
  },
  completed: {
    label: { en: "Completed", ru: "Завершён" },
    color: "text-green-600",
    bg: "bg-green-100",
    progressColor: "bg-green-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: { en: "Cancelled", ru: "Отменён" },
    color: "text-red-500",
    bg: "bg-red-100",
    progressColor: "bg-red-400",
    icon: AlertCircle,
  },
};

export const getStatusLabel = (status: string, lang: "en" | "ru") => {
  return orderStatusConfig[status]?.label[lang] ?? status;
};

export const getStatusIndex = (status: string): number => {
  return ORDER_STATUSES.indexOf(status as any);
};
