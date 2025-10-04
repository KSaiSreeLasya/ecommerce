import { useCart } from "@/state/cart";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const placeOrder = async () => {
    const fallbackLocal = () => {
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
      clear();
      alert("Order placed (local demo). Connect Supabase for persistence.");
    };

    if (!isSupabaseConfigured || !supabase) return fallbackLocal();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({ email, status: "pending" })
      .select("id")
      .single();
    if (error || !order) {
      alert(`Failed to create order: ${error?.message || "unknown error"}`);
      return fallbackLocal();
    }

    const rows = items.map((it) => ({
      order_id: order.id,
      product_id: it.id,
      quantity: it.quantity,
      unit_price: it.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      alert(`Failed to add items: ${itemsErr.message}`);
      return fallbackLocal();
    }
    clear();
    alert("Order placed!");
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
    </section>
  );
}
