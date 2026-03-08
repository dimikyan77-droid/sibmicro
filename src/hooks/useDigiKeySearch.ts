import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DigiKeyPriceTier {
  quantity: number;
  price: number;
}

export interface DigiKeySpec {
  name: string;
  value: string;
}

export interface DigiKeyResult {
  mpn: string;
  manufacturer: string;
  description: string;
  datasheetUrl: string | null;
  productUrl: string | null;
  photoUrl: string | null;
  stock: number;
  rohs: string;
  priceTiers: DigiKeyPriceTier[];
  specs: DigiKeySpec[];
  digiKeyPn: string;
  packageType: string;
}

export const getDigiKeyBestPrice = (tiers: DigiKeyPriceTier[]): DigiKeyPriceTier | null => {
  if (tiers.length === 0) return null;
  return tiers[0]; // First tier = lowest qty = unit price
};

export function useDigiKeySearch() {
  const [results, setResults] = useState<DigiKeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);

  const search = useCallback(async (query: string, limit = 10) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("digikey-search", {
        body: { query: query.trim(), limit },
      });

      if (fnError) {
        let detailedMessage = fnError.message;
        const maybeContext = (fnError as any)?.context;
        if (maybeContext && typeof maybeContext.json === "function") {
          try {
            const payload = await maybeContext.json();
            if (payload?.error) detailedMessage = payload.error;
          } catch { /* ignore */ }
        }
        throw new Error(detailedMessage);
      }

      if (data?.error) throw new Error(data.error);

      setResults(data.results || []);
      setTotalHits(data.hits || 0);
    } catch (err: any) {
      setError(err.message || "DigiKey search failed");
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
