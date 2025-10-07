import type { Product } from "@/components/ProductCard";

export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop";

export function normaliseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function readLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem("demo_products");
    const arr = raw ? (JSON.parse(raw) as any[]) : [];
    return arr.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      mrp: p.mrp,
      image: p.image || FALLBACK_PRODUCT_IMAGE,
      badges: normaliseStringArray(p.badges),
    }));
  } catch {
    return [];
  }
}

export function mapSupabaseProduct(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    mrp: row.mrp,
    image:
      (Array.isArray(row.images) && row.images[0]) ||
      (typeof row.images === "string" ? row.images : null) ||
      FALLBACK_PRODUCT_IMAGE,
    badges: normaliseStringArray(row.badges),
  };
}
