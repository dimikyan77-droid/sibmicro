import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Product } from "@/data/mockData";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getUnitPrice: (product: Product, qty: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getStoredCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem("sibmicro-cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(getStoredCart);

  const persist = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("sibmicro-cart", JSON.stringify(newItems));
  };

  const getUnitPrice = useCallback((product: Product, qty: number) => {
    const tiers = [...product.priceTiers].sort((a, b) => b.qty - a.qty);
    for (const tier of tiers) {
      if (qty >= tier.qty) return tier.price;
    }
    return product.priceTiers[0].price;
  }, []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const newItems = existing
        ? prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { product, quantity: Math.max(quantity, product.moq) }];
      localStorage.setItem("sibmicro-cart", JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.product.id !== productId);
      localStorage.setItem("sibmicro-cart", JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const newItems = prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.max(quantity, i.product.moq) } : i
      );
      localStorage.setItem("sibmicro-cart", JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + getUnitPrice(i.product, i.quantity) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, getUnitPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
