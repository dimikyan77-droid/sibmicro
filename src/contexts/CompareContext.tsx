import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product } from "@/data/mockData";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 5;

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.length >= MAX_COMPARE || prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const isInCompare = useCallback(
    (productId: string) => compareItems.some((p) => p.id === productId),
    [compareItems]
  );

  const clearCompare = useCallback(() => setCompareItems([]), []);

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
