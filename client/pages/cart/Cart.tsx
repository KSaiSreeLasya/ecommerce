import { useCart } from "@/state/cart";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function isUUID(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Cart() {
  const { items, total, update, remove, clear } = useCart();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState<{
    open: boolean;
    orderId?: string;
    items?: number;
    total?: number;
  }>({ open: false });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const placeOrder = async () => {
    const persistLocalAnalytics = () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const raw = localStorage.getItem("demo_analytics");
        const arr = raw ? (JSON.parse(raw) as any[]) : [];
        const idx = arr.findIndex((r) => r.day === today);
        if (idx >= 0) {
          arr[idx].orders += 1;
          arr[idx].revenue += total;
        } else {
          arr.unshift({ day: today, orders: 1, revenue: total });
        }
        localStorage.setItem("demo_analytics", JSON.stringify(arr));
      } catch {}
    };

    const fallbackLocal = (msg?: string) => {
      const order = {
        id: crypto.randomUUID(),
        email,
        items: items.map((it) => ({
          id: it.id,
          title: it.title,
          price: it.price,
          qty: it.quantity,
        })),
        total,
        createdAt: Date.now(),
      };
      const raw = localStorage.getItem("demo_orders");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      arr.unshift(order);
      localStorage.setItem("demo_orders", JSON.stringify(arr));
      persistLocalAnalytics();
      const summary = { items: items.length, total };
      clear();
      setSuccess({ open: true, orderId: order.id, ...summary });
      toast.success(msg || "Order placed (local demo)");
    };

    if (!isSupabaseConfigured || !supabase)
      return fallbackLocal(
        "Order placed (local demo). Connect Supabase for persistence.",
      );

    const { data: order, error } = await supabase
      .from("orders")
      .insert({ email, status: "pending" })
      .select("id")
      .single();
    if (error || !order) {
      console.warn("Failed to create order", error);
      return fallbackLocal(
        "Order placed (local demo). Connect Supabase for persistence.",
      );
    }

    const rows = items.map((it) => ({
      order_id: order.id,
      product_id: isUUID(it.id) ? it.id : null,
      quantity: it.quantity,
      unit_price: it.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      console.warn("Failed to add order items", itemsErr);
      return fallbackLocal(
        "Order placed (local demo). Connect Supabase for persistence.",
      );
    }

    // Decrement inventory per product (if inventory rows exist)
    try {
      const productIds = rows
        .map((r) => r.product_id)
        .filter((id): id is string => Boolean(id));
      if (productIds.length) {
        const { data: inventoryRows } = await supabase
          .from("inventory")
          .select("id,product_id,stock")
          .in("product_id", productIds);
        const qtyByProduct: Record<string, number> = {};
        for (const r of rows) if (r.product_id)
          qtyByProduct[r.product_id] = (qtyByProduct[r.product_id] || 0) + r.quantity;
        for (const inv of inventoryRows || []) {
          const dec = qtyByProduct[inv.product_id] || 0;
          if (dec > 0) {
            const newStock = Math.max(0, (inv.stock || 0) - dec);
            await supabase.from("inventory").update({ stock: newStock }).eq("id", inv.id);
          }
        }
      }
    } catch (e) {
      console.warn("inventory decrement failed", e);
    }

    // Persist analytics (per day aggregate)
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
            revenue: (existing.revenue || 0) + total,
          }
        : { day, orders: 1, revenue: total };
      await supabase.from("analytics").upsert(payload);
    } catch (e) {
      console.warn("analytics upsert failed", e);
    }

    const summary = { items: items.length, total };
    clear();
    setSuccess({ open: true, orderId: order.id, ...summary });
    toast.success("Order placed!");
  };

  return (
    <section className="container py-12">
      <h1 className="text-2xl font-bold">Your Cart</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Cart is empty.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-4 rounded-lg border border-border p-3"
              >
                <img
                  src={it.image}
                  className="h-16 w-16 rounded object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{it.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {inr(it.price)}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    update(it.id, Math.max(1, Number(e.target.value)))
                  }
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
                <Button variant="ghost" onClick={() => remove(it.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border p-4 h-fit">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-extrabold">{inr(total)}</span>
            </div>
            <div className="mt-4 grid gap-2">
              <input
                type="email"
                required
                placeholder="your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={placeOrder}>Place order</Button>
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={success.open}
        onOpenChange={(open) => setSuccess((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order placed successfully</DialogTitle>
            <DialogDescription>
              Thank you! Your order ID is {success.orderId}. A confirmation has
              been prepared.
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
