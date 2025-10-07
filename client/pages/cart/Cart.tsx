import { useEffect, useMemo, useState } from "react";
import { Gift, Minus, Package, Plus, Truck, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateOfferPricing } from "@/lib/offers";
import {
  FALLBACK_PRODUCT_IMAGE,
  mapSupabaseProduct,
  readLocalProducts,
} from "@/lib/products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useCart, type CartItem } from "@/state/cart";
import type { Product } from "@/components/ProductCard";

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function QuantityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-background">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="h-9 w-9 grid place-items-center text-muted-foreground hover:text-foreground"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) =>
          onChange(Math.max(1, Number(event.target.value) || 1))
        }
        className="h-9 w-12 border-x border-border bg-transparent text-center text-sm text-foreground focus:outline-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className="h-9 w-9 grid place-items-center text-muted-foreground hover:text-foreground"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const offerPricing = calculateOfferPricing(item.price, item.offer);
  const mrpSavings =
    item.mrp && item.mrp > item.price ? item.mrp - item.price : 0;
  const lineTotal = offerPricing.finalPrice * item.quantity;

  return (
    <tr className="border-t border-border text-sm">
      <td className="px-4 py-4">
        <div className="flex gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
            <img
              src={item.image || FALLBACK_PRODUCT_IMAGE}
              alt={item.title}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-foreground">{item.title}</div>
            {item.offer ? (
              <Badge variant="outline" className="border-primary text-primary">
                Offer applied: {item.offer.title}
              </Badge>
            ) : null}
            {mrpSavings > 0 && (
              <div className="text-xs text-muted-foreground">
                MRP: {inr(item.mrp!)} • You save {inr(mrpSavings)}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="font-semibold text-foreground">
          {inr(offerPricing.finalPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          Base: {inr(item.price)}
          {offerPricing.discountAmount > 0 && (
            <span> • Save {inr(offerPricing.discountAmount)}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex items-center gap-3">
          <QuantityControl
            value={item.quantity}
            onChange={(qty) => onUpdate(item.id, qty)}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove item"
            onClick={() => onRemove(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-right font-semibold text-foreground">
        {inr(lineTotal)}
      </td>
    </tr>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={accent ? "font-semibold text-foreground" : "text-foreground"}
      >
        {value}
      </span>
    </div>
  );
}

function RecommendedSection({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
}) {
  if (!products.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Frequently bought together
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted/40">
              <img
                src={product.image || FALLBACK_PRODUCT_IMAGE}
                alt={product.title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                {product.title}
              </h3>
              <div className="text-sm font-extrabold text-foreground">
                {inr(product.price)}
              </div>
            </div>
            <Button onClick={() => onAdd(product)}>Add to cart</Button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Cart() {
  const { items, update, remove, clear, add } = useCart();
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    open: boolean;
    orderId?: string;
    items?: number;
    total?: number;
  }>({ open: false });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const locals = readLocalProducts().slice(0, 4);
      setRecommended(locals);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,mrp,images,badges")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) {
        setRecommended(data.map(mapSupabaseProduct));
      }
    })();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const summary = useMemo(() => {
    const lineItems = items.map((item) => {
      const offerPricing = calculateOfferPricing(item.price, item.offer);
      const lineBase = item.price * item.quantity;
      const offerSavings = offerPricing.discountAmount * item.quantity;
      const mrpSavings =
        item.mrp && item.mrp > item.price
          ? (item.mrp - item.price) * item.quantity
          : 0;
      return {
        finalLine: offerPricing.finalPrice * item.quantity,
        lineBase,
        offerSavings,
        mrpSavings,
      };
    });
    const subtotal = lineItems.reduce((acc, row) => acc + row.lineBase, 0);
    const offerSavings = lineItems.reduce(
      (acc, row) => acc + row.offerSavings,
      0,
    );
    const mrpSavings = lineItems.reduce((acc, row) => acc + row.mrpSavings, 0);
    const finalTotal = lineItems.reduce((acc, row) => acc + row.finalLine, 0);
    const shipping = finalTotal === 0 || finalTotal >= 75000 ? 0 : 999;
    const taxIncluded = Math.round(finalTotal * 0.18);
    const couponSavings = appliedCoupon ? Math.round(finalTotal * 0.05) : 0;
    const grandTotal = Math.max(finalTotal - couponSavings + shipping, 0);
    return {
      subtotal,
      offerSavings,
      mrpSavings,
      finalTotal,
      shipping,
      taxIncluded,
      couponSavings,
      grandTotal,
      totalSavings: offerSavings + mrpSavings + couponSavings,
    };
  }, [items, appliedCoupon]);

  const persistLocalAnalytics = (orderTotal: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem("demo_analytics");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const idx = arr.findIndex((record) => record.day === today);
      if (idx >= 0) {
        arr[idx].orders += 1;
        arr[idx].revenue += orderTotal;
      } else {
        arr.unshift({ day: today, orders: 1, revenue: orderTotal });
      }
      localStorage.setItem("demo_analytics", JSON.stringify(arr));
    } catch (error) {
      console.warn("local analytics error", error);
    }
  };

  const placeOrder = async () => {
    const orderTotal = summary.grandTotal;
    const fallbackLocal = (message?: string) => {
      const order = {
        id: crypto.randomUUID(),
        email,
        items: items.map((item) => {
          const offerPricing = calculateOfferPricing(item.price, item.offer);
          return {
            id: item.id,
            title: item.title,
            price: offerPricing.finalPrice,
            qty: item.quantity,
            offer: item.offer?.title ?? null,
          };
        }),
        total: orderTotal,
        createdAt: Date.now(),
      };
      const raw = localStorage.getItem("demo_orders");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      arr.unshift(order);
      localStorage.setItem("demo_orders", JSON.stringify(arr));
      persistLocalAnalytics(orderTotal);
      clear();
      setSuccess({
        open: true,
        orderId: order.id,
        items: items.length,
        total: orderTotal,
      });
      toast.success(
        message ||
          "Order placed (local demo). Connect Supabase for persistence.",
      );
    };

    if (!isSupabaseConfigured || !supabase) {
      fallbackLocal();
      return;
    }

    const orderPayload: Record<string, unknown> = {
      email,
      status: "pending",
    };
    if (Number.isFinite(orderTotal)) {
      orderPayload.total = orderTotal;
    }

    let orderId: string | null = null;
    let creationError: unknown = null;

    const initialInsert = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (initialInsert.error || !initialInsert.data) {
      creationError = initialInsert.error;
      if (
        initialInsert.error?.message &&
        initialInsert.error.message.includes('column "total"')
      ) {
        const retryInsert = await supabase
          .from("orders")
          .insert({ email, status: "pending" })
          .select("id")
          .single();
        if (!retryInsert.error && retryInsert.data) {
          orderId = retryInsert.data.id;
          creationError = null;
        }
      }
    } else {
      orderId = initialInsert.data.id;
    }

    if (!orderId) {
      console.warn("Failed to create order", creationError);
      fallbackLocal();
      return;
    }

    const rows = items.map((item) => {
      const offerPricing = calculateOfferPricing(item.price, item.offer);
      return {
        order_id: orderId,
        product_id: /[0-9a-f-]{36}/i.test(item.id) ? item.id : null,
        quantity: item.quantity,
        unit_price: offerPricing.finalPrice,
      };
    });

    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      console.warn("Failed to add order items", itemsErr);
      fallbackLocal();
      return;
    }

    try {
      const productIds = rows
        .map((row) => row.product_id)
        .filter((productId): productId is string => Boolean(productId));
      if (productIds.length) {
        const { data: inventoryRows } = await supabase
          .from("inventory")
          .select("id,product_id,stock")
          .in("product_id", productIds);
        const qtyByProduct: Record<string, number> = {};
        for (const row of rows) {
          if (row.product_id) {
            qtyByProduct[row.product_id] =
              (qtyByProduct[row.product_id] || 0) + row.quantity;
          }
        }
        for (const inventory of inventoryRows || []) {
          const decrement = qtyByProduct[inventory.product_id] || 0;
          if (decrement > 0) {
            const newStock = Math.max(0, (inventory.stock || 0) - decrement);
            await supabase
              .from("inventory")
              .update({ stock: newStock })
              .eq("id", inventory.id);
          }
        }
      }
    } catch (inventoryError) {
      console.warn("inventory decrement failed", inventoryError);
    }

    try {
      const day = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("analytics")
        .select("id,day,orders,revenue")
        .eq("day", day)
        .maybeSingle();
      const payload = existing
        ? {
            id: existing.id,
            day,
            orders: (existing.orders || 0) + 1,
            revenue: (existing.revenue || 0) + orderTotal,
          }
        : { day, orders: 1, revenue: orderTotal };
      await supabase.from("analytics").upsert(payload);
    } catch (analyticsError) {
      console.warn("analytics upsert failed", analyticsError);
    }

    clear();
    setSuccess({
      open: true,
      orderId,
      items: items.length,
      total: orderTotal,
    });
    toast.success("Order placed!");
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    if (couponCode.trim().toUpperCase() === "SOLAR5") {
      setAppliedCoupon("SOLAR5");
      toast.success("Coupon SOLAR5 applied (5% off product total)");
    } else {
      toast.error("Coupon not recognized. Try SOLAR5 for a demo discount.");
      setAppliedCoupon(null);
    }
  };

  return (
    <section className="container py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Your cart ({items.length} item{items.length === 1 ? "" : "s"})
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your selections, apply offers, and proceed to secure
            checkout.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            onClick={clear}
            className="text-sm text-muted-foreground"
          >
            Clear cart
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Your cart is empty. Browse our{" "}
          <a href="/products" className="text-primary underline">
            product collection
          </a>{" "}
          to add solar solutions.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="hidden w-full lg:table">
                <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <CartRow
                      key={item.id}
                      item={item}
                      onUpdate={update}
                      onRemove={remove}
                    />
                  ))}
                </tbody>
              </table>
              <div className="grid gap-4 p-4 lg:hidden">
                {items.map((item) => {
                  const offerPricing = calculateOfferPricing(
                    item.price,
                    item.offer,
                  );
                  return (
                    <div
                      key={item.id}
                      className="space-y-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
                          <img
                            src={item.image || FALLBACK_PRODUCT_IMAGE}
                            alt={item.title}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="font-semibold text-foreground">
                            {item.title}
                          </div>
                          {item.offer ? (
                            <Badge
                              variant="outline"
                              className="border-primary text-primary"
                            >
                              {item.offer.title}
                            </Badge>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            Base {inr(item.price)}
                            {offerPricing.discountAmount > 0 && (
                              <span>
                                {" "}
                                • Save {inr(offerPricing.discountAmount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove item"
                          onClick={() => remove(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Quantity</span>
                        <QuantityControl
                          value={item.quantity}
                          onChange={(qty) => update(item.id, qty)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                        <span>Total</span>
                        <span>
                          {inr(offerPricing.finalPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <RecommendedSection
              products={recommended}
              onAdd={(product) =>
                add({
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.image,
                  mrp: product.mrp ?? null,
                })
              }
            />
          </div>
          <aside className="h-fit rounded-xl border border-border bg-muted/20 p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Order summary
            </h2>
            <div className="mt-4 space-y-3">
              <SummaryRow
                label={`Subtotal (${items.length} item${items.length === 1 ? "" : "s"})`}
                value={inr(summary.subtotal)}
              />
              {summary.offerSavings > 0 && (
                <SummaryRow
                  label="Offer savings"
                  value={`- ${inr(summary.offerSavings)}`}
                />
              )}
              {summary.mrpSavings > 0 && (
                <SummaryRow
                  label="Bundle savings"
                  value={`- ${inr(summary.mrpSavings)}`}
                />
              )}
              {summary.couponSavings > 0 && (
                <SummaryRow
                  label="Coupon savings"
                  value={`- ${inr(summary.couponSavings)}`}
                />
              )}
              <SummaryRow
                label="Shipping"
                value={summary.shipping === 0 ? "Free" : inr(summary.shipping)}
              />
              <SummaryRow
                label="Tax included"
                value={inr(summary.taxIncluded)}
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Coupon code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-base font-semibold text-foreground">
              <span>Grand total</span>
              <span>{inr(summary.grandTotal)}</span>
            </div>
            {summary.totalSavings > 0 && (
              <p className="mt-1 text-xs text-primary">
                You save {inr(summary.totalSavings)} on this order.
              </p>
            )}
            <div className="mt-6 space-y-3">
              <input
                type="email"
                required
                placeholder="Billing email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button className="w-full" onClick={placeOrder}>
                Proceed to checkout
              </Button>
              <p className="text-xs text-muted-foreground">
                Payments via Razorpay when configured. Otherwise a demo local
                checkout is used.
              </p>
              <p className="text-xs text-muted-foreground">
                <Truck className="mr-1 inline h-4 w-4 text-primary" />
                Delivery timelines vary by region. Estimate shipping during
                checkout.
              </p>
            </div>
            <div className="mt-6 space-y-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Use coupon SOLAR5 for an additional demo 5% discount.
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Need a custom solar kit quote? Reach out to
                ecommerce@waaree.com.
              </div>
            </div>
          </aside>
        </div>
      )}

      <Dialog
        open={success.open}
        onOpenChange={(open) => setSuccess((current) => ({ ...current, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order placed successfully</DialogTitle>
            <DialogDescription>
              Thank you! Your order ID is {success.orderId}. A confirmation has
              been sent to {email || "your email"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{success.items ?? 0}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{inr(success.total ?? 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccess({ open: false })}>
              Continue shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
