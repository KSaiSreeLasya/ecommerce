import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

function saveLocalProduct(p: any) {
  const raw = localStorage.getItem("demo_products");
  const arr = raw ? (JSON.parse(raw) as any[]) : [];
  arr.unshift(p);
  localStorage.setItem("demo_products", JSON.stringify(arr));
}

function readLocalOrders() {
  try {
    const raw = localStorage.getItem("demo_orders");
    return raw ? (JSON.parse(raw) as any[]) : [];
  } catch {
    return [];
  }
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [product, setProduct] = useState({
    title: "",
    brand: "",
    wattage: 0,
    panel_type: "Mono Perc",
    category: "panel",
    sku: "",
    mrp: "",
    price: "",
    images: "",
    badges: "Bestseller",
    description: "",
  });
  const [warehouse, setWarehouse] = useState({ name: "", location: "" });
  const [inventory, setInventory] = useState({
    product_id: "",
    warehouse_id: "",
    stock: 0,
  });

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        setIsAdmin(true); // Demo mode
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);
      const { data, error } = await supabase
        .from("admin_emails")
        .select("email")
        .eq("email", user.email!)
        .maybeSingle();
      setIsAdmin(!!data && !error);
    })();
  }, []);

  const orders = readLocalOrders();
  const analytics = useMemo(() => {
    const totals = orders.map((o) => o.total || 0);
    const revenue = totals.reduce((a, b) => a + b, 0);
    const count = orders.length;
    const avg = count ? Math.round(revenue / count) : 0;
    const productMap: Record<string, { title: string; units: number; revenue: number }> = {};
    for (const o of orders) {
      for (const it of o.items || []) {
        if (!productMap[it.id])
          productMap[it.id] = { title: it.title, units: 0, revenue: 0 };
        productMap[it.id].units += it.qty || 1;
        productMap[it.id].revenue += (it.price || 0) * (it.qty || 1);
      }
    }
    const top = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
    return { revenue, count, avg, top };
  }, [orders]);

  if (isAdmin === null)
    return <section className="container py-12">Checking...</section>;
  if (!isAdmin)
    return (
      <section className="container py-12">
        Not authorized. Sign in with an admin email.
      </section>
    );

  const addProduct = async () => {
    const payload: any = {
      id: crypto.randomUUID(),
      title: product.title,
      brand: product.brand || null,
      wattage: Number(product.wattage) || null,
      panel_type: product.panel_type || null,
      category: product.category,
      sku: product.sku || null,
      mrp: product.mrp ? Number(product.mrp) : null,
      price: Number(product.price),
      images: product.images
        ? product.images.split(",").map((s) => s.trim())
        : [],
      badges: product.badges
        ? product.badges.split(",").map((s) => s.trim())
        : [],
      description: product.description || null,
      active: true,
    };

    if (!isSupabaseConfigured || !supabase) {
      saveLocalProduct({
        id: payload.id,
        title: payload.title,
        price: payload.price,
        mrp: payload.mrp,
        image:
          payload.images?.[0] ??
          "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop",
        badges: payload.badges,
      });
      alert("Product added locally (demo mode)");
      return;
    }

    const { error } = await supabase.from("products").insert(payload);
    if (error) alert(error.message);
    else alert("Product added");
  };

  const addWarehouse = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("Warehouses require backend. Connect Supabase to enable.");
      return;
    }
    const { error } = await supabase.from("warehouses").insert(warehouse);
    if (error) alert(error.message);
    else alert("Warehouse added");
  };

  const setStock = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("Inventory requires backend. Connect Supabase to enable.");
      return;
    }
    const { error } = await supabase.from("inventory").upsert({
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      stock: Number(inventory.stock),
    });
    if (error) alert(error.message);
    else alert("Inventory updated");
  };

  const generateDemoOrders = () => {
    const raw = localStorage.getItem("demo_products");
    const products = raw ? (JSON.parse(raw) as any[]) : [];
    const pool = products.length
      ? products
      : [
          { id: "waaree-130w", title: "WAAREE 130W Panel", price: 3499 },
          { id: "waaree-365w", title: "WAAREE 365W Panel", price: 4599 },
          { id: "waaree-550w", title: "WAAREE 550W Panel", price: 9899 },
        ];
    const orders = Array.from({ length: 12 }).map((_, i) => {
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = Array.from({ length: itemCount }).map(() => {
        const p = pool[Math.floor(Math.random() * pool.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        return { id: p.id, title: p.title, price: p.price, qty };
      });
      const total = items.reduce((s, it) => s + it.price * it.qty, 0);
      return { id: crypto.randomUUID(), items, total, createdAt: Date.now() - i * 86400000 };
    });
    localStorage.setItem("demo_orders", JSON.stringify(orders));
    alert("Demo orders generated. Analytics updated.");
  };

  return (
    <section className="container py-12 grid gap-10">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Analytics */}
      <div className="grid gap-4">
        <h2 className="font-semibold">Store analytics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Total revenue</div>
            <div className="mt-1 text-2xl font-extrabold">₹{analytics.revenue.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Orders</div>
            <div className="mt-1 text-2xl font-extrabold">{analytics.count}</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Avg order value</div>
            <div className="mt-1 text-2xl font-extrabold">₹{analytics.avg.toLocaleString("en-IN")}</div>
          </div>
        </div>
        {analytics.top.length > 0 && (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm font-semibold">Top products</div>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {analytics.top.map((p) => (
                <li key={p.title} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{p.title}</span>
                  <span className="text-muted-foreground">{p.units} units</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={generateDemoOrders}>Generate demo orders</Button>
        </div>
      </div>

      {/* Add product */}
      <div className="grid gap-4">
        <h2 className="font-semibold">Add product</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Title"
            value={product.title}
            onChange={(e) => setProduct({ ...product, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="Brand"
            value={product.brand}
            onChange={(e) => setProduct({ ...product, brand: e.target.value })}
          />
          <input
            className="input"
            placeholder="Wattage"
            type="number"
            value={product.wattage}
            onChange={(e) =>
              setProduct({ ...product, wattage: Number(e.target.value) })
            }
          />
          <input
            className="input"
            placeholder="Panel type"
            value={product.panel_type}
            onChange={(e) =>
              setProduct({ ...product, panel_type: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Category (panel/kit/inverter/accessory)"
            value={product.category}
            onChange={(e) =>
              setProduct({ ...product, category: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="SKU"
            value={product.sku}
            onChange={(e) => setProduct({ ...product, sku: e.target.value })}
          />
          <input
            className="input"
            placeholder="MRP"
            type="number"
            value={product.mrp}
            onChange={(e) => setProduct({ ...product, mrp: e.target.value })}
          />
          <input
            className="input"
            placeholder="Price"
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Images (comma separated URLs)"
            value={product.images}
            onChange={(e) => setProduct({ ...product, images: e.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Badges (comma separated)"
            value={product.badges}
            onChange={(e) => setProduct({ ...product, badges: e.target.value })}
          />
          <textarea
            className="input sm:col-span-2"
            placeholder="Description"
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
          />
        </div>
        <Button onClick={addProduct}>Add product</Button>
      </div>

      {/* Backend-only sections */}
      {isSupabaseConfigured && (
        <>
          <div className="grid gap-4">
            <h2 className="font-semibold">Add warehouse</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input"
                placeholder="Name"
                value={warehouse.name}
                onChange={(e) =>
                  setWarehouse({ ...warehouse, name: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Location"
                value={warehouse.location}
                onChange={(e) =>
                  setWarehouse({ ...warehouse, location: e.target.value })
                }
              />
            </div>
            <Button onClick={addWarehouse}>Add warehouse</Button>
          </div>

          <div className="grid gap-4">
            <h2 className="font-semibold">Set inventory</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="input"
                placeholder="Product ID"
                value={inventory.product_id}
                onChange={(e) =>
                  setInventory({ ...inventory, product_id: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Warehouse ID"
                value={inventory.warehouse_id}
                onChange={(e) =>
                  setInventory({ ...inventory, warehouse_id: e.target.value })
                }
              />
              <input
                className="input"
                type="number"
                placeholder="Stock"
                value={inventory.stock}
                onChange={(e) =>
                  setInventory({ ...inventory, stock: Number(e.target.value) })
                }
              />
            </div>
            <Button onClick={setStock}>Save inventory</Button>
          </div>
        </>
      )}

      <style>{`.input{border-radius:.375rem;border:1px solid hsl(var(--input));background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem;outline:none} .input:focus{box-shadow:0 0 0 2px hsl(var(--ring))}`}</style>
    </section>
  );
}
