import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  part_number: string;
  manufacturer: string | null;
  description: string | null;
  quantity: number;
  price: number | null;
  currency: string | null;
  location: string | null;
}

export function useInventorySearch(q: string) {
  return useQuery({
    queryKey: ["inventory-search", q],
    queryFn: async () => {
      if (!q) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("id, part_number, manufacturer, description, quantity, price, currency, location")
        .or(`part_number.ilike.%${q}%,manufacturer.ilike.%${q}%,description.ilike.%${q}%`)
        .gt("quantity", 0)
        .limit(50);

      if (error) throw error;
      return (data as InventoryItem[]) ?? [];
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}
