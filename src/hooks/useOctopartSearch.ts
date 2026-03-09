import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OctopartPrice {
  quantity: number;
  price: number;
  currency: string;
}

export interface OctopartOffer {
  stock: number;
  moq: number;
  packaging: string;
  prices: OctopartPrice[];
}

export interface OctopartSeller {
  name: string;
  offers: OctopartOffer[];
}

export interface OctopartSpec {
  name: string;
  value: string;
}

export interface OctopartResult {
  mpn: string;
  manufacturer: string;
  description: string;
  datasheetUrl: string | null;
  specs: OctopartSpec[];
  sellers: OctopartSeller[];
}

export const getBestPrice = (sellers: OctopartSeller[]): OctopartPrice | null => {
  let best: OctopartPrice | null = null;
  for (const s of sellers) {
    for (const o of s.offers) {
      for (const p of o.prices) {
        if (!best || p.price < best.price) best = p;
      }
    }
  }
  return best;
};

export const getTotalStock = (sellers: OctopartSeller[]): number => {
  let total = 0;
  for (const s of sellers) {
    for (const o of s.offers) {
      if (typeof o.stock === "number") total += o.stock;
    }
  }
  return total;
};

export function useOctopartSearch() {
  const [results, setResults] = useState<OctopartResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);

  const search = useCallback(async (query: string, limit = 15) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("octopart-search", {
        body: { query: query.trim(), limit },
      });

      if (fnError) {
        let detailedMessage = fnError.message;

        const maybeContext = (fnError as any)?.context;
        if (maybeContext && typeof maybeContext.json === "function") {
          try {
            const payload = await maybeContext.json();
            if (payload?.error) detailedMessage = payload.error;
          } catch {
            // ignore parsing issues, fallback to default message
          }
        }

        throw new Error(detailedMessage);
      }
      
      if (data?.error) {
        // Handle API limit exceeded case specifically
        if (data.code === "OCTOPART_LIMIT_EXCEEDED") {
          throw new Error("Octopart API daily limit reached. Search will be available again tomorrow. Try searching our warehouse inventory in the meantime.");
        }
        throw new Error(data.error);
      }

      setResults(data.results || []);
      setTotalHits(data.hits || 0);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setTotalHits(0);
    setError(null);
  }, []);

  return { results, loading, error, totalHits, search, clear };
}
