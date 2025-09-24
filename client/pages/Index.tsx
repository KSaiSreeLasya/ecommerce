import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,title,price,mrp,images,badges")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(8);
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
      setLoading(false);
    })();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              Solar panels, kits & inverters
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Power your home with the sun
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-prose">
              Shop premium solar solutions with fast delivery across India. Save
              more with smart bundles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="h-11 px-6">Most loved</Button>
              <Button variant="outline" className="h-11 px-6">
                Solar kits
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-2">
              <img
                src="https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1600&auto=format&fit=crop"
                alt="Solar array"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products like screenshot */}
      <section className="container py-12 md:py-16">
        <h2 className="text-center text-xl sm:text-2xl font-extrabold">
          Most Loved By Customers
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(loading ? Array.from({ length: 8 }) : products).map(
            (p: any, i: number) => (
              <div key={p?.id ?? i}>
                {p ? (
                  <ProductCard product={p} />
                ) : (
                  <div className="aspect-[4/5] w-full animate-pulse rounded-lg bg-muted" />
                )}
              </div>
            ),
          )}
        </div>
      </section>

      {/* Perks */}
      <section className="bg-secondary/60 py-12 md:py-16">
        <div className="container grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Free shipping", desc: "On orders over ₹3,000" },
            { title: "Fast support", desc: "We reply within hours" },
            { title: "Easy returns", desc: "30‑day return window" },
            { title: "Secure checkout", desc: "256‑bit SSL encryption" },
          ].map((perk) => (
            <div
              key={perk.title}
              className="rounded-lg border border-border bg-background p-6"
            >
              <h3 className="font-semibold">{perk.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container py-12 md:py-16">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h3 className="text-2xl font-bold">Join the insider list</h3>
              <p className="mt-2 text-muted-foreground">
                Be first to know about new drops, exclusive deals, and more.
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button className="h-10">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
