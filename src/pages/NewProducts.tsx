import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Package, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CatalogProduct {
  id: string;
  part_number: string;
  manufacturer: string | null;
  category: string | null;
  description: string | null;
  quantity: number;
  price: number | null;
  currency: string | null;
  is_new: boolean | null;
  created_at: string;
}

const NewProducts = () => {
  const { t, lang } = useI18n();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["new-catalog-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_products")
        .select("id, part_number, manufacturer, category, description, quantity, price, currency, is_new, created_at")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  const currencySymbol: Record<string, string> = { USD: "$", RUB: "₽", EUR: "€" };

  return (
    <Layout>
      <SEO
        title="Новинки электронных компонентов | SibMicro"
        description="Новые поступления электронных компонентов на склад: микроконтроллеры, датчики, силовые элементы. Свежие позиции от ведущих производителей."
        canonical="https://sibmicro.lovable.app/new-products"
      />
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ru" ? "Новинки" : "New Products"}
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          {lang === "ru"
            ? "Недавно добавленные позиции в наш каталог"
            : "Recently added items to our catalog"}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {lang === "ru" ? "Новинок пока нет" : "No new products yet"}
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1 text-accent hover:underline mt-4 text-sm"
            >
              {t("catalog.title")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/catalog?q=${encodeURIComponent(p.part_number)}`}
                className="group rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-accent transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{p.manufacturer || "—"}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent">
                    <Sparkles className="h-2.5 w-2.5" />
                    {lang === "ru" ? "Новинка" : "New"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary group-hover:text-accent transition-colors font-mono">
                  {p.part_number}
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {p.description || (lang === "ru" ? "Без описания" : "No description")}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    {p.price ? (
                      <>
                        <div className="text-sm font-bold text-foreground">
                          {currencySymbol[(p.currency || "RUB").toUpperCase()] ?? "₽"}
                          {Number(p.price).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {lang === "ru" ? "По запросу" : "On request"}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      p.quantity > 0
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {p.quantity > 0
                      ? `${p.quantity.toLocaleString()} ${lang === "ru" ? "шт." : "pcs"}`
                      : lang === "ru"
                      ? "Под заказ"
                      : "On order"}
                  </span>
                </div>
                {p.category && (
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {p.category}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NewProducts;
