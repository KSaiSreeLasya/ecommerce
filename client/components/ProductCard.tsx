import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/state/cart";

export type Product = {
  id: string;
  title: string;
  image: string;
  price: number;
  mrp?: number | null;
  rating?: number;
  badges?: string[];
};

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.badges?.[0] && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
            <Tag className="h-3.5 w-3.5" /> {product.badges[0]}
          </div>
        )}
        {discount > 0 && (
          <div className="absolute right-2 top-2 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
            {discount}% OFF
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2">
            {product.title}
          </h3>
          <div className="text-right">
            <div className="text-sm font-extrabold">{inr(product.price)}</div>
            {product.mrp && product.mrp > product.price && (
              <div className="text-xs text-muted-foreground line-through">
                {inr(product.mrp)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button
            className="h-9 px-3"
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
            className="h-9 px-3"
            onClick={() =>
              add({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
              })
            }
          >
            Buy now
          </Button>
        </div>
      </div>
    </div>
  );
}
