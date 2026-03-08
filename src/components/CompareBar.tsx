import { Link } from "react-router-dom";
import { X, GitCompare } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";

const CompareBar = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { t } = useI18n();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-accent shadow-lg">
      <div className="container py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground shrink-0">
          <GitCompare className="h-4 w-4 text-accent" />
          {t("compare.bar_compare")} ({compareItems.length}/5)
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {compareItems.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs shrink-0"
            >
              <span className="font-mono font-medium text-primary">{p.partNumber}</span>
              <button
                onClick={() => removeFromCompare(p.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("compare.bar_clear")}
          </button>
          <Link
            to="/compare"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            {t("compare.bar_now")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
