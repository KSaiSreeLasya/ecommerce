import { createContext, useContext, useEffect, useMemo, useState } from "react";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { calculateOfferPricing, type OfferDetail } from "@/lib/offers";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  mrp?: number | null;
  offer?: OfferDetail | null;
};

type AddCartItemInput = Omit<CartItem, "quantity">;

type CartState = {
  items: CartItem[];
  add: (item: AddCartItemInput, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  applyOffer: (id: string, offer: OfferDetail | null) => void;
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
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<CartItem>[];
      return parsed
        .filter((item): item is CartItem => Boolean(item?.id))
        .map((item) => ({
          id: String(item.id),
          title: String(item.title ?? ""),
          price: Number(item.price ?? 0),
          image: item.image,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          mrp:
            item.mrp !== undefined && item.mrp !== null
              ? Number(item.mrp)
              : null,
          offer: item.offer ?? null,
        }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartState>(() => {
    const add: CartState["add"] = (item, qty = 1) => {
      if (qty <= 0) return;
      setItems((prev) => {
        const existing = prev.find((p) => p.id === item.id);
        if (existing) {
          return prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  quantity: p.quantity + qty,
                  price: Number.isFinite(item.price) ? item.price : p.price,
                  image: item.image ?? p.image,
                  mrp:
                    item.mrp !== undefined
                      ? item.mrp
                      : p.mrp ?? null,
                  offer: item.offer ?? p.offer ?? null,
                }
              : p,
          );
        }
        return [
          ...prev,
          {
            ...item,
            quantity: qty,
            mrp: item.mrp ?? null,
            offer: item.offer ?? null,
          },
        ];
      });
    };

    const remove: CartState["remove"] = (id) => {
      setItems((prev) => prev.filter((p) => p.id !== id));
    };

    const update: CartState["update"] = (id, qty) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
      );
    };

    const applyOffer: CartState["applyOffer"] = (id, offer) => {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, offer } : p)));
    };

    const clear: CartState["clear"] = () => setItems([]);

    const count = items.reduce((a, b) => a + b.quantity, 0);
    const total = items.reduce((acc, item) => {
      const { finalPrice } = calculateOfferPricing(item.price, item.offer);
      return acc + finalPrice * item.quantity;
    }, 0);

    return { items, add, remove, update, applyOffer, clear, count, total };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
