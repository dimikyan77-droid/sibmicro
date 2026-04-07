import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ArrowRight, Cpu, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

interface Alternative {
  partNumber: string;
  manufacturer: string;
  compatibility: "drop-in" | "functional" | "similar";
  notes: string;
  package: string;
}

const compatBadge: Record<string, { label: string; className: string }> = {
  "drop-in": { label: "Drop-in", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  functional: { label: "Функциональный", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  similar: { label: "Похожий", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
};

const CrossReference = () => {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Alternative[]>([]);
  const [searchedPart, setSearchedPart] = useState("");

  const handleSearch = async () => {
    const pn = query.trim();
    if (!pn) return;

    setLoading(true);
    setResults([]);
    setSearchedPart(pn);

    try {
      const { data, error } = await supabase.functions.invoke("cross-reference", {
        body: { partNumber: pn },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const alts = (data?.alternatives || []) as Alternative[];
      setResults(alts);

      if (alts.length === 0) {
        toast.info("Аналоги не найдены для данного компонента");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Ошибка при поиске аналогов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Cpu className="h-4 w-4" />
            AI Cross-Reference
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Поиск аналогов компонентов
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Введите номер компонента — AI найдёт совместимые аналоги и замены от разных производителей
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 max-w-xl mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Например: STM32F103C8T6, LM7805, NE555..."
            className="text-base"
            disabled={loading}
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()} size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Найти</span>
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">AI анализирует компонент <span className="font-mono font-semibold text-foreground">{searchedPart}</span>...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Аналоги для <span className="font-mono text-primary">{searchedPart}</span>
              </h2>
              <Badge variant="secondary">{results.length} найдено</Badge>
            </div>

            <div className="grid gap-3">
              {results.map((alt, idx) => {
                const badge = compatBadge[alt.compatibility] || compatBadge.similar;
                return (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Part info */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-foreground text-base">
                              {alt.partNumber}
                            </span>
                            <Badge variant="outline" className={badge.className}>
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {alt.manufacturer}
                            {alt.package && <span className="ml-2">• {alt.package}</span>}
                          </div>
                          {alt.notes && (
                            <p className="text-sm text-muted-foreground/80">{alt.notes}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuery(alt.partNumber);
                              handleSearch();
                            }}
                            title="Найти аналоги для этого компонента"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(
                                `https://www.google.com/search?q=${encodeURIComponent(alt.partNumber + " datasheet")}`,
                                "_blank"
                              );
                            }}
                          >
                            Datasheet <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && searchedPart && results.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Cpu className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              Аналоги для <span className="font-mono font-semibold">{searchedPart}</span> не найдены
            </p>
            <p className="text-sm text-muted-foreground/70">Попробуйте другой номер компонента</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CrossReference;
