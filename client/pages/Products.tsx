import { useEffect, useState } from "react";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,mrp,images,badges")
        .eq("active", true)
        .order("created_at", { ascending: false });
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
      setProducts(mapped);
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
