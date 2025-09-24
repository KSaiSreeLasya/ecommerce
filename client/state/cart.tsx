import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "azorix_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartState>(() => {
    const add: CartState["add"] = (item, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((p) => p.id === item.id);
        if (existing) {
          return prev.map((p) =>
            p.id === item.id ? { ...p, quantity: p.quantity + qty } : p,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
    };

    const remove: CartState["remove"] = (id) => {
      setItems((prev) => prev.filter((p) => p.id !== id));
    };

    const update: CartState["update"] = (id, qty) => {
      setItems((prev) =>
        prev
          .map((p) => (p.id === id ? { ...p, quantity: qty } : p))
          .filter((p) => p.quantity > 0),
      );
    };

    const clear: CartState["clear"] = () => setItems([]);

    const count = items.reduce((a, b) => a + b.quantity, 0);
    const total = items.reduce((a, b) => a + b.price * b.quantity, 0);

    return { items, add, remove, update, clear, count, total };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
