import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useCart } from "@/state/cart";
import type { Product } from "@/components/ProductCard";
import { CheckCircle2, ShieldCheck, Sparkles, Truck } from "lucide-react";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function readLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem("demo_products");
    const arr = raw ? (JSON.parse(raw) as any[]) : [];
    return arr.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      badges: p.badges,
    }));
  } catch {
    return [];
  }
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop";

type ProductDetailData = Product & {
  description?: string | null;
  brand?: string | null;
  wattage?: number | null;
  panel_type?: string | null;
  offers: string[];
  highlights: string[];
  warranty?: string | null;
  delivery_time?: string | null;
};

const DEFAULT_OFFERS = [
  "No-cost EMI starting at ₹8,999/month",
  "Flat ₹5,000 instant discount on select bank cards",
  "Free site survey and installation support worth ₹4,999",
];

const DEFAULT_HIGHLIGHTS = [
  "High efficiency mono PERC cells with excellent low-light performance",
  "Weather-sealed junction box with IP68 rating",
  "Robust anodized aluminium frame engineered for Indian conditions",
];

function toDetailProduct(base: Product): ProductDetailData {
  return {
    ...base,
    description: null,
    brand: null,
    wattage: null,
    panel_type: null,
    offers: [],
    highlights: [],
    warranty: null,
    delivery_time: null,
  };
}

function normaliseList(value: unknown): string[] {
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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navState = (location.state as { product?: Product } | null) || null;
  const [product, setProduct] = useState<ProductDetailData | null>(
    navState?.product ? toDetailProduct(navState.product) : null,
  );
  const [images, setImages] = useState<string[]>(
    navState?.product ? [navState.product.image] : [],
  );
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    (async () => {
      if (!id) return;
      // If we already have product from navigation, still try enhancing with Supabase images
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("products")
          .select(
            "id,title,price,mrp,images,badges,description,brand,wattage,panel_type,offers,highlights,warranty,delivery_time",
          )
          .eq("id", id)
          .maybeSingle();
        if (data) {
          setProduct((prev) => ({
            id: data.id,
            title: data.title,
            price: data.price,
            mrp: data.mrp,
            image:
              data.images?.[0] ||
              prev?.image ||
              "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop",
            badges: data.badges ?? prev?.badges ?? [],
          }));
          setImages(data.images ?? []);
          return;
        }
      }
      // Fallback to local products if Supabase is unavailable or item not found
      const locals = readLocalProducts();
      const p = locals.find((x) => x.id === id);
      if (p) {
        setProduct(p);
        setImages([p.image]);
      }
    })();
  }, [id]);

  const discount = useMemo(() => {
    if (!product?.mrp || !product) return 0;
    return product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  }, [product]);

  if (!product) return <section className="container py-12">Loading…</section>;

  return (
    <section className="container py-12 grid gap-8 lg:grid-cols-2">
      <div className="grid gap-3">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 p-6">
          <img
            src={images[0] || product.image}
            alt={product.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() =>
                  setImages((prev) => [src, ...prev.filter((x) => x !== src)])
                }
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-border bg-muted/20 p-2"
              >
                <img
                  src={src}
                  alt="thumb"
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <Link
          to="/products"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{product.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-2xl font-extrabold">{inr(product.price)}</div>
          {product.mrp && product.mrp > product.price && (
            <div className="text-sm text-muted-foreground line-through">
              {inr(product.mrp)}
            </div>
          )}
          {discount > 0 && (
            <div className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
              {discount}% OFF
            </div>
          )}
        </div>
        <div className="mt-6 grid gap-3 max-w-prose text-sm text-muted-foreground">
          <p>
            High‑efficiency mono PERC module built for Indian conditions. Robust
            frame, excellent low‑light performance and easy installation.
          </p>
          <ul className="list-disc pl-5">
            <li>Premium quality cells</li>
            <li>Weather‑sealed junction box</li>
            <li>25‑year performance warranty</li>
          </ul>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() =>
              add({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
              })
            }
          >
            Add to cart
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              add({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
              });
              navigate("/cart");
            }}
          >
            Buy now
          </Button>
        </div>
      </div>
    </section>
  );
}
