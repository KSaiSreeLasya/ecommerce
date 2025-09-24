import { useEffect, useState } from "react";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "waaree-130w",
    title: "WAAREE 130 Watt Mono PERC Solar Panel",
    price: 3499,
    mrp: 5106,
    image:
      "https://images.unsplash.com/photo-1583855282680-6dbdc69b0931?q=80&w=1200&auto=format&fit=crop",
    badges: ["On Sale"],
  },
  {
    id: "waaree-365w",
    title: "WAAREE Black/Blue 365Wp Mono PERC Solar Panel",
    price: 4599,
    mrp: 9280,
    image:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
    badges: ["86% Off"],
  },
  {
    id: "waaree-550w",
    title: "WAAREE 550Wp 144 Cells Dual Glass Mono Panel",
    price: 9899,
    mrp: 14148,
    image:
      "https://images.unsplash.com/photo-1503965830912-6d7b07921cfd?q=80&w=1200&auto=format&fit=crop",
    badges: ["39% Off"],
  },
  {
    id: "ador-3kw-kit",
    title: "3kW On‑Grid Solar Kit (Panels + Inverter)",
    price: 124999,
    mrp: 149999,
    image:
      "https://images.unsplash.com/photo-1505483531331-407bc0111723?q=80&w=1200&auto=format&fit=crop",
    badges: ["Bestseller"],
  },
  {
    id: "micro-inverter-600w",
    title: "600W Micro Inverter (IP67)",
    price: 8999,
    mrp: 10999,
    image:
      "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop",
    badges: ["Hot"],
  },
  {
    id: "waaree-200w",
    title: "WAAREE 200 Watt Mono PERC Solar Panel",
    price: 5999,
    mrp: 7999,
    image:
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=1200&auto=format&fit=crop",
    badges: ["New"],
  },
  {
    id: "mc4-cable-10m",
    title: "MC4 Solar Cable 10m (Pair)",
    price: 999,
    mrp: 1499,
    image:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1200&auto=format&fit=crop",
    badges: ["Accessory"],
  },
  {
    id: "waaree-450w",
    title: "WAAREE 450W Mono PERC Half‑cut Panel",
    price: 7999,
    mrp: 10999,
    image:
      "https://images.unsplash.com/photo-1516542076529-1ea3854896e1?q=80&w=1200&auto=format&fit=crop",
    badges: ["Value"],
  },
];

function readLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem("demo_products");
    if (!raw) return [];
    const arr = JSON.parse(raw) as Product[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        const locals = readLocalProducts();
        setProducts([...locals, ...DEFAULT_PRODUCTS]);
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .select("id,title,price,mrp,images,badges")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) {
        const locals = readLocalProducts();
        setProducts([...locals, ...DEFAULT_PRODUCTS]);
        return;
      }
      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        mrp: p.mrp,
        image:
          p.images?.[0] ??
          "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop",
        badges: p.badges ?? [],
      }));
      const locals = readLocalProducts();
      const combined = [...locals, ...mapped];
      setProducts(combined.length ? combined : DEFAULT_PRODUCTS);
    })();
  }, []);

  return (
    <section className="container py-12">
      <h1 className="text-2xl font-bold">All Products</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
