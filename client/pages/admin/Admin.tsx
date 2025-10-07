import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { OfferDetail } from "@/lib/offers";

type AdminOffer = OfferDetail;

export type AdminProduct = {
  id: string;
  title: string;
  brand?: string | null;
  wattage?: number | null;
  panel_type?: string | null;
  category: string;
  sku?: string | null;
  mrp?: number | null;
  price: number;
  images: string[];
  badges: string[];
  description?: string | null;
  availability?: string | null;
  delivery_time?: string | null;
  warranty?: string | null;
  highlights?: string[];
  offers?: AdminOffer[];
  active: boolean;
};

const ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || undefined;

function normaliseTextList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function generateOfferId(prefix: string, index: number) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${index}`;
}

function ensureOfferShape(value: any, index: number): AdminOffer {
  const discountTypeRaw = value?.discountType ?? value?.discount_type;
  const discountType =
    discountTypeRaw === "percentage" || discountTypeRaw === "percent"
      ? "percentage"
      : "flat";
  const discountValueRaw =
    value?.discountValue ?? value?.discount_value ?? value?.value ?? 0;
  const discountValue = Number.isFinite(Number(discountValueRaw))
    ? Number(discountValueRaw)
    : 0;
  return {
    id: value?.id ?? generateOfferId("offer", index),
    title: value?.title ?? value?.name ?? `Offer ${index + 1}`,
    description: value?.description ?? value?.details ?? null,
    couponCode: value?.couponCode ?? value?.coupon_code ?? null,
    terms: value?.terms ?? value?.conditions ?? null,
    badge: value?.badge ?? null,
    discountType,
    discountValue,
  };
}

function parseOffersInput(input: string): AdminOffer[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ensureOfferShape(item, index));
    }
  } catch {
    // fall back to simple list parsing
  }
  return normaliseTextList(input).map((title, index) =>
    ensureOfferShape({ title, discountType: "flat", discountValue: 0 }, index),
  );
}

function formatOffersInput(offers?: AdminOffer[]): string {
  if (!offers || offers.length === 0) return "";
  try {
    return JSON.stringify(offers, null, 2);
  } catch {
    return offers.map((offer) => offer.title).join("\n");
  }
}

function saveLocalProduct(p: any) {
  const raw = localStorage.getItem("demo_products");
  const arr = raw ? (JSON.parse(raw) as any[]) : [];
  arr.unshift(p);
  localStorage.setItem("demo_products", JSON.stringify(arr));
}

function readLocalProducts(): AdminProduct[] {
  try {
    const raw = localStorage.getItem("demo_products");
    return raw ? (JSON.parse(raw) as AdminProduct[]) : [];
  } catch {
    return [] as AdminProduct[];
  }
}

function writeLocalProducts(list: AdminProduct[]) {
  localStorage.setItem("demo_products", JSON.stringify(list));
}

function readLocalOrders() {
  try {
    const raw = localStorage.getItem("demo_orders");
    return raw ? (JSON.parse(raw) as any[]) : [];
  } catch {
    return [];
  }
}

function readLocalAnalytics() {
  try {
    const raw = localStorage.getItem("demo_analytics");
    return raw ? (JSON.parse(raw) as any[]) : [];
  } catch {
    return [];
  }
}
function writeLocalAnalytics(rows: any[]) {
  localStorage.setItem("demo_analytics", JSON.stringify(rows));
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pass, setPass] = useState("");
  const location = useLocation();
  const requirePassword = true;

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
    availability: "",
    delivery_time: "",
    warranty: "",
    highlights: "",
    offers: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<AdminProduct[]>([]);
  const [warehouse, setWarehouse] = useState({ name: "", location: "" });
  const [inventory, setInventory] = useState({
    product_id: "",
    warehouse_id: "",
    stock: 0,
  });
  const [analyticsRows, setAnalyticsRows] = useState<
    { id?: string; day: string; orders: number; revenue: number }[]
  >([]);
  const [newAnalytics, setNewAnalytics] = useState({
    day: new Date().toISOString().slice(0, 10),
    orders: 0,
    revenue: 0,
  });

  const [productOptions, setProductOptions] = useState<
    { id: string; title: string }[]
  >([]);
  const [warehouseOptions, setWarehouseOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [warehouses, setWarehouses] = useState<
    { id: string; name: string; location: string | null }[]
  >([]);
  const [inventoryRows, setInventoryRows] = useState<
    { product_id: string; warehouse_id: string; stock: number }[]
  >([]);

  // Load current user, check password gate, and initial products
  useEffect(() => {
    (async () => {
      // Password gate takes precedence if configured
      if (requirePassword) {
        setExisting(readLocalProducts());
        setAnalyticsRows(readLocalAnalytics());
        setIsAdmin(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setIsAdmin(true); // Demo mode
        setExisting(readLocalProducts());
        setAnalyticsRows(readLocalAnalytics());
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
      } else {
        const { data, error } = await supabase
          .from("admin_emails")
          .select("email")
          .eq("email", user.email!)
          .maybeSingle();
        setIsAdmin(!!data && !error);
      }

      const { data } = await supabase
        .from("products")
        .select(
          "id,title,price,mrp,images,badges,brand,wattage,panel_type,category,sku,description,active,availability,delivery_time,warranty,highlights,offers",
        )
        .order("created_at", { ascending: false });
      const mapped: AdminProduct[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        mrp: p.mrp,
        images: Array.isArray(p.images) ? p.images : [],
        badges: Array.isArray(p.badges) ? p.badges : [],
        brand: p.brand ?? null,
        wattage: p.wattage ?? null,
        panel_type: p.panel_type ?? null,
        category: p.category ?? "panel",
        sku: p.sku ?? null,
        description: p.description ?? null,
        availability: p.availability ?? null,
        delivery_time: p.delivery_time ?? null,
        warranty: p.warranty ?? null,
        highlights: Array.isArray(p.highlights) ? p.highlights : [],
        offers: Array.isArray(p.offers) ? p.offers : [],
        active: Boolean(p.active ?? true),
      }));
      setExisting(mapped);

      // Analytics rows from backend
      const { data: rows } = await supabase
        .from("analytics")
        .select("id,day,orders,revenue")
        .order("day", { ascending: false });
      setAnalyticsRows(rows || []);
    })();
  }, [requirePassword]);

  // After unlocking, fetch data from Supabase (products, analytics, options)
  useEffect(() => {
    (async () => {
      if (!isAdmin) return;
      if (!isSupabaseConfigured || !supabase) return;

      // Products for manage list
      const { data: prodFull } = await supabase
        .from("products")
        .select(
          "id,title,price,mrp,images,badges,brand,wattage,panel_type,category,sku,description,active,availability,delivery_time,warranty,highlights,offers",
        )
        .order("created_at", { ascending: false });
      const mapped: AdminProduct[] = (prodFull || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        mrp: p.mrp,
        images: Array.isArray(p.images) ? p.images : [],
        badges: Array.isArray(p.badges) ? p.badges : [],
        brand: p.brand ?? null,
        wattage: p.wattage ?? null,
        panel_type: p.panel_type ?? null,
        category: p.category ?? "panel",
        sku: p.sku ?? null,
        description: p.description ?? null,
        availability: p.availability ?? null,
        delivery_time: p.delivery_time ?? null,
        warranty: p.warranty ?? null,
        highlights: Array.isArray(p.highlights) ? p.highlights : [],
        offers: Array.isArray(p.offers) ? p.offers : [],
        active: Boolean(p.active ?? true),
      }));
      setExisting(mapped);

      // Analytics rows
      const { data: rows } = await supabase
        .from("analytics")
        .select("id,day,orders,revenue")
        .order("day", { ascending: false });
      setAnalyticsRows(rows || []);

      // Options and lists for inventory/warehouses
      const { data: products } = await supabase
        .from("products")
        .select("id,title")
        .order("title");
      const prodOpts = (products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
      }));
      setProductOptions(prodOpts);

      const { data: wh } = await supabase
        .from("warehouses")
        .select("id,name,location")
        .order("name");
      const whOpts = (wh || []).map((w: any) => ({ id: w.id, name: w.name }));
      setWarehouseOptions(whOpts);
      setWarehouses((wh || []) as any);

      const { data: inv } = await supabase
        .from("inventory")
        .select("product_id,warehouse_id,stock");
      setInventoryRows((inv || []) as any);

      setInventory((prev) => ({
        ...prev,
        product_id: prev.product_id || prodOpts[0]?.id || "",
        warehouse_id: prev.warehouse_id || whOpts[0]?.id || "",
      }));
    })();
  }, [isAdmin]);

  const unlock = () => {
    if (!requirePassword) return;
    if (pass === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else {
      toast.error("Incorrect password");
    }
  };

  const orders = readLocalOrders();
  const analytics = useMemo(() => {
    const totals = orders.map((o) => o.total || 0);
    const revenue = totals.reduce((a, b) => a + b, 0);
    const count = orders.length;
    const avg = count ? Math.round(revenue / count) : 0;
    const productMap: Record<
      string,
      { title: string; units: number; revenue: number }
    > = {};
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

  if (requirePassword && isAdmin === false)
    return (
      <section className="container py-16 max-w-sm">
        <h1 className="text-2xl font-bold">Admin access</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter admin password to continue.
        </p>
        <div className="mt-4 grid gap-2">
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={unlock}>Unlock</Button>
        </div>
      </section>
    );

  if (!isAdmin)
    return (
      <section className="container py-12">
        Not authorized. Sign in with an admin email.
      </section>
    );

  const logoutAdmin = async () => {
    try {
      if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    } catch {}
    setIsAdmin(false);
  };

  const uploadImagesIfNeeded = async (): Promise<string[]> => {
    if (!imageFiles.length)
      return product.images
        ? product.images.split(",").map((s) => s.trim())
        : [];
    if (!isSupabaseConfigured || !supabase) {
      toast.error(
        "Connect Supabase and create a 'product-images' storage bucket to upload.",
      );
      return [];
    }
    const urls: string[] = [];
    for (const file of imageFiles) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(path, file, {
          upsert: false,
        });
      if (error) {
        toast.error(`Upload failed for ${file.name}: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    return urls;
  };

  const addProduct = async () => {
    const uploaded = await uploadImagesIfNeeded();
    const badgeList = normaliseTextList(product.badges ?? "");
    const highlightList = normaliseTextList(product.highlights ?? "");
    const offersList = parseOffersInput(product.offers ?? "");
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
      images: [
        ...(product.images
          ? product.images.split(",").map((s) => s.trim())
          : []),
        ...uploaded,
      ],
      badges: badgeList,
      description: product.description || null,
      availability: product.availability || null,
      delivery_time: product.delivery_time || null,
      warranty: product.warranty || null,
      highlights: highlightList,
      offers: offersList,
      active: true,
    };

    if (!isSupabaseConfigured || !supabase) {
      saveLocalProduct({
        ...payload,
        image:
          payload.images?.[0] ||
          "https://images.unsplash.com/photo-1584270354949-1f2f7d1c1447?q=80&w=1200&auto=format&fit=crop",
      });
      setExisting((prev) => [
        {
          ...payload,
        },
        ...prev,
      ]);
      toast.success("Product added locally (demo mode)");
      return;
    }

    const { error } = await supabase.from("products").insert(payload);
    if (error) toast.error(error.message);
    else {
      setExisting((prev) => [payload, ...prev]);
      toast.success("Product added");
    }
  };

  const updateProduct = async (p: AdminProduct) => {
    if (!isSupabaseConfigured || !supabase) {
      const list = readLocalProducts();
      const idx = list.findIndex((x) => x.id === p.id);
      if (idx !== -1) {
        list[idx] = p;
        writeLocalProducts(list);
        setExisting(list);
        toast.success("Product updated locally");
      }
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({
        title: p.title,
        brand: p.brand,
        wattage: p.wattage,
        panel_type: p.panel_type,
        category: p.category,
        sku: p.sku,
        mrp: p.mrp,
        price: p.price,
        images: p.images,
        badges: p.badges,
        description: p.description,
        availability: p.availability,
        delivery_time: p.delivery_time,
        warranty: p.warranty,
        highlights: p.highlights,
        offers: p.offers,
        active: p.active,
      })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Product updated");
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    if (!isSupabaseConfigured || !supabase) {
      const next = readLocalProducts().filter((p) => p.id !== id);
      writeLocalProducts(next);
      setExisting(next);
      toast.success("Deleted locally");
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setExisting((prev) => prev.filter((p) => p.id !== id));
  };

  const addWarehouse = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Warehouses require backend. Connect Supabase to enable.");
      return;
    }
    const { data, error } = await supabase
      .from("warehouses")
      .insert(warehouse)
      .select("id,name,location")
      .single();
    if (error) toast.error(error.message);
    else {
      setWarehouseOptions((prev) => [
        { id: data!.id, name: data!.name },
        ...prev,
      ]);
      setWarehouses((prev) => [
        { id: data!.id, name: data!.name, location: data!.location || null },
        ...prev,
      ]);
      setInventory((prev) => ({ ...prev, warehouse_id: data!.id }));
      setWarehouse({ name: "", location: "" });
      toast.success("Warehouse added");
    }
  };

  const updateWarehouse = async (w: {
    id: string;
    name: string;
    location: string | null;
  }) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase
      .from("warehouses")
      .update({ name: w.name, location: w.location })
      .eq("id", w.id);
    if (error) toast.error(error.message);
    else toast.success("Warehouse updated");
  };
  const deleteWarehouse = async (id: string) => {
    if (!confirm("Delete this warehouse?")) return;
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from("warehouses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setWarehouses((prev) => prev.filter((x) => x.id !== id));
      setWarehouseOptions((prev) => prev.filter((x) => x.id !== id));
      toast.success("Warehouse deleted");
    }
  };

  const saveInventoryRow = async (row: {
    product_id: string;
    warehouse_id: string;
    stock: number;
  }) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from("inventory").upsert(row);
    if (error) toast.error(error.message);
    else toast.success("Inventory saved");
  };
  const deleteInventoryRow = async (row: {
    product_id: string;
    warehouse_id: string;
  }) => {
    if (!confirm("Delete this inventory row?")) return;
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("product_id", row.product_id)
      .eq("warehouse_id", row.warehouse_id);
    if (error) toast.error(error.message);
    else {
      setInventoryRows((prev) =>
        prev.filter(
          (r) =>
            !(
              r.product_id === row.product_id &&
              r.warehouse_id === row.warehouse_id
            ),
        ),
      );
      toast.success("Inventory deleted");
    }
  };

  const setStock = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Inventory requires backend. Connect Supabase to enable.");
      return;
    }
    if (!inventory.product_id || !inventory.warehouse_id) {
      toast.error("Select product and warehouse first");
      return;
    }
    const { error } = await supabase.from("inventory").upsert({
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      stock: Number(inventory.stock),
    });
    if (error) toast.error(error.message);
    else toast.success("Inventory updated");
  };

  const generateDemoOrders = () => {
    const pool = existing.length
      ? existing
      : [
          { id: "waaree-130w", title: "WAAREE 130W Panel", price: 3499 } as any,
          { id: "waaree-365w", title: "WAAREE 365W Panel", price: 4599 } as any,
          { id: "waaree-550w", title: "WAAREE 550W Panel", price: 9899 } as any,
        ];
    const orders = Array.from({ length: 12 }).map((_, i) => {
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = Array.from({ length: itemCount }).map(() => {
        const p = pool[Math.floor(Math.random() * pool.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        return { id: p.id, title: p.title, price: p.price, qty };
      });
      const total = items.reduce((s, it) => s + it.price * it.qty, 0);
      return {
        id: crypto.randomUUID(),
        items,
        total,
        createdAt: Date.now() - i * 86400000,
      };
    });
    localStorage.setItem("demo_orders", JSON.stringify(orders));
    toast.success("Demo orders generated. Analytics updated.");
  };

  // Analytics CRUD
  const addAnalytics = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const list = [{ ...newAnalytics }, ...readLocalAnalytics()];
      writeLocalAnalytics(list);
      setAnalyticsRows(list);
      toast.success("Analytics row added locally");
      return;
    }
    const { error } = await supabase.from("analytics").insert(newAnalytics);
    if (error) return toast.error(error.message);
    const { data } = await supabase
      .from("analytics")
      .select("id,day,orders,revenue")
      .order("day", { ascending: false });
    setAnalyticsRows(data || []);
    toast.success("Analytics row added");
  };

  const saveAnalytics = async (row: {
    id?: string;
    day: string;
    orders: number;
    revenue: number;
  }) => {
    if (!isSupabaseConfigured || !supabase) {
      const list = readLocalAnalytics();
      const idx = list.findIndex((r: any) => r.day === row.day);
      if (idx >= 0) list[idx] = row;
      else list.unshift(row);
      writeLocalAnalytics(list);
      setAnalyticsRows(list);
      toast.success("Analytics updated locally");
      return;
    }
    const { error } = await supabase.from("analytics").upsert(row);
    if (error) return toast.error(error.message);
    const { data } = await supabase
      .from("analytics")
      .select("id,day,orders,revenue")
      .order("day", { ascending: false });
    setAnalyticsRows(data || []);
    toast.success("Analytics saved");
  };

  const deleteAnalytics = async (idOrDay: string) => {
    if (!confirm("Delete this analytics row?")) return;
    if (!isSupabaseConfigured || !supabase) {
      const next = readLocalAnalytics().filter((r: any) => r.day !== idOrDay);
      writeLocalAnalytics(next);
      setAnalyticsRows(next);
      toast.success("Deleted locally");
      return;
    }
    const { error } = await supabase
      .from("analytics")
      .delete()
      .or(`id.eq.${idOrDay},day.eq.${idOrDay}`);
    if (error) return toast.error(error.message);
    setAnalyticsRows((prev) => prev.filter((r) => (r.id || r.day) !== idOrDay));
    toast.success("Deleted");
  };

  return (
    <section className="container py-12 grid gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {requirePassword && (
          <Button variant="outline" onClick={logoutAdmin}>
            Logout
          </Button>
        )}
      </div>

      {/* Analytics */}
      <div className="grid gap-4">
        <h2 className="font-semibold">Store analytics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Total revenue</div>
            <div className="mt-1 text-3xl font-extrabold">
              ₹{analytics.revenue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Orders (count)</div>
            <div className="mt-1 text-3xl font-extrabold">
              {analytics.count}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Avg order value</div>
            <div className="mt-1 text-3xl font-extrabold">
              ₹{analytics.avg.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
        {analytics.top.length > 0 && (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm font-semibold">Top products</div>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {analytics.top.map((p) => (
                <li
                  key={p.title}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate pr-2">{p.title}</span>
                  <span className="text-muted-foreground">{p.units} units</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={generateDemoOrders}>
            Generate demo orders
          </Button>
        </div>

        {/* Analytics store (CRUD) */}
        <div className="grid gap-3">
          <h3 className="font-semibold">Analytics store</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className="input"
              type="date"
              value={newAnalytics.day}
              onChange={(e) =>
                setNewAnalytics({ ...newAnalytics, day: e.target.value })
              }
            />
            <input
              className="input"
              type="number"
              placeholder="Orders"
              value={newAnalytics.orders}
              onChange={(e) =>
                setNewAnalytics({
                  ...newAnalytics,
                  orders: Number(e.target.value),
                })
              }
            />
            <input
              className="input"
              type="number"
              placeholder="Revenue"
              value={newAnalytics.revenue}
              onChange={(e) =>
                setNewAnalytics({
                  ...newAnalytics,
                  revenue: Number(e.target.value),
                })
              }
            />
          </div>
          <Button onClick={addAnalytics}>Add row</Button>
          {analyticsRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No analytics rows.</p>
          ) : (
            <div className="grid gap-2">
              {analyticsRows.map((r) => (
                <div
                  key={r.id || r.day}
                  className="grid gap-2 sm:grid-cols-5 items-center rounded-lg border border-border p-3"
                >
                  <input
                    className="input"
                    type="date"
                    value={r.day}
                    onChange={(e) =>
                      setAnalyticsRows((prev) =>
                        prev.map((x) =>
                          x === r ? { ...x, day: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    value={r.orders}
                    onChange={(e) =>
                      setAnalyticsRows((prev) =>
                        prev.map((x) =>
                          x === r
                            ? { ...x, orders: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    value={r.revenue}
                    onChange={(e) =>
                      setAnalyticsRows((prev) =>
                        prev.map((x) =>
                          x === r
                            ? { ...x, revenue: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                  <Button variant="outline" onClick={() => saveAnalytics(r)}>
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteAnalytics(r.id || r.day)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
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

          <div className="sm:col-span-2 grid gap-2">
            <input
              className="input"
              placeholder="Image URLs (comma separated) – optional if uploading files"
              value={product.images}
              onChange={(e) =>
                setProduct({ ...product, images: e.target.value })
              }
            />
            <input
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Connect Supabase and create a storage bucket named{" "}
              <strong>product-images</strong> to persist uploaded files.
            </p>
          </div>

          <input
            className="input sm:col-span-2"
            placeholder="Badges (comma or newline separated)"
            value={product.badges}
            onChange={(e) => setProduct({ ...product, badges: e.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Availability (e.g. In stock, Ships in 2 days)"
            value={product.availability}
            onChange={(e) =>
              setProduct({ ...product, availability: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Delivery timeline"
            value={product.delivery_time}
            onChange={(e) =>
              setProduct({ ...product, delivery_time: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Warranty summary"
            value={product.warranty}
            onChange={(e) =>
              setProduct({ ...product, warranty: e.target.value })
            }
          />
          <textarea
            className="input sm:col-span-2"
            placeholder={"Highlights (one per line)"}
            value={product.highlights}
            onChange={(e) =>
              setProduct({ ...product, highlights: e.target.value })
            }
          />
          <textarea
            className="input sm:col-span-2"
            placeholder={"Offers (JSON array or one offer title per line)"}
            value={product.offers}
            onChange={(e) => setProduct({ ...product, offers: e.target.value })}
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
        <p className="text-xs text-muted-foreground">
          Offers accept a JSON array of objects with keys like title, discountType (flat/percentage), discountValue, couponCode, badge, terms. Leave blank to reuse defaults.
        </p>
        <Button onClick={addProduct}>Add product</Button>
      </div>

      {/* Manage existing products */}
      <div className="grid gap-4">
        <h2 className="font-semibold">Manage products</h2>
        {existing.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <div className="grid gap-3">
            {existing.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                onChange={(np) =>
                  setExisting((prev) =>
                    prev.map((x) => (x.id === np.id ? np : x)),
                  )
                }
                onSave={updateProduct}
                onDelete={deleteProduct}
              />
            ))}
          </div>
        )}
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

            {warehouses.length > 0 && (
              <div className="grid gap-2 mt-4">
                <h3 className="text-sm font-semibold">Manage warehouses</h3>
                {warehouses.map((w) => (
                  <div
                    key={w.id}
                    className="grid gap-2 sm:grid-cols-3 rounded-lg border border-border p-3"
                  >
                    <input
                      className="input"
                      value={w.name}
                      onChange={(e) =>
                        setWarehouses((prev) =>
                          prev.map((x) =>
                            x.id === w.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      className="input"
                      value={w.location || ""}
                      onChange={(e) =>
                        setWarehouses((prev) =>
                          prev.map((x) =>
                            x.id === w.id
                              ? { ...x, location: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => updateWarehouse(w)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteWarehouse(w.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <h2 className="font-semibold">Set inventory</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                className="input"
                value={inventory.product_id}
                onChange={(e) =>
                  setInventory({ ...inventory, product_id: e.target.value })
                }
              >
                <option value="">Select product</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={inventory.warehouse_id}
                onChange={(e) =>
                  setInventory({ ...inventory, warehouse_id: e.target.value })
                }
              >
                <option value="">Select warehouse</option>
                {warehouseOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
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
            <p className="text-xs text-muted-foreground">
              Tip: If selects are empty, first add a product and a warehouse.
              These fields save stock for the selected (product, warehouse)
              pair.
            </p>

            {inventoryRows.length > 0 && (
              <div className="grid gap-2 mt-4">
                <h3 className="text-sm font-semibold">Inventory list</h3>
                {inventoryRows.map((r) => (
                  <div
                    key={`${r.product_id}-${r.warehouse_id}`}
                    className="grid gap-2 sm:grid-cols-5 rounded-lg border border-border p-3 items-center"
                  >
                    <div className="text-sm truncate">
                      {productOptions.find((p) => p.id === r.product_id)
                        ?.title || r.product_id}
                    </div>
                    <div className="text-sm truncate">
                      {warehouseOptions.find((w) => w.id === r.warehouse_id)
                        ?.name || r.warehouse_id}
                    </div>
                    <input
                      className="input"
                      type="number"
                      value={r.stock}
                      onChange={(e) =>
                        setInventoryRows((prev) =>
                          prev.map((x) =>
                            x === r
                              ? { ...x, stock: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => saveInventoryRow(r)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteInventoryRow(r)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`.input{border-radius:.375rem;border:1px solid hsl(var(--input));background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem;outline:none} .input:focus{box-shadow:0 0 0 2px hsl(var(--ring))}`}</style>
    </section>
  );
}

function ProductRow({
  p,
  onChange,
  onSave,
  onDelete,
}: {
  p: AdminProduct;
  onChange: (p: AdminProduct) => void;
  onSave: (p: AdminProduct) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState<AdminProduct>(p);
  const [badgesText, setBadgesText] = useState(
    (p.badges || []).join(", "),
  );
  const [highlightsText, setHighlightsText] = useState(
    (p.highlights || []).join("\n"),
  );
  const [offersText, setOffersText] = useState(formatOffersInput(p.offers));

  useEffect(() => {
    setLocal(p);
    setBadgesText((p.badges || []).join(", "));
    setHighlightsText((p.highlights || []).join("\n"));
    setOffersText(formatOffersInput(p.offers));
  }, [p]);

  return (
    <div className="grid gap-3 rounded-lg border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          className="input sm:col-span-2"
          placeholder="Title"
          value={local.title}
          onChange={(e) => setLocal({ ...local, title: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Price"
          value={local.price}
          onChange={(e) => setLocal({ ...local, price: Number(e.target.value) })}
        />
        <input
          className="input"
          type="number"
          placeholder="MRP"
          value={local.mrp ?? 0}
          onChange={(e) =>
            setLocal({ ...local, mrp: Number(e.target.value) || null })
          }
        />
        <input
          className="input"
          placeholder="Brand"
          value={local.brand ?? ""}
          onChange={(e) => setLocal({ ...local, brand: e.target.value || null })}
        />
        <input
          className="input"
          placeholder="Category"
          value={local.category}
          onChange={(e) => setLocal({ ...local, category: e.target.value })}
        />
        <input
          className="input"
          placeholder="SKU"
          value={local.sku ?? ""}
          onChange={(e) => setLocal({ ...local, sku: e.target.value || null })}
        />
        <input
          className="input"
          placeholder="Panel type"
          value={local.panel_type ?? ""}
          onChange={(e) =>
            setLocal({ ...local, panel_type: e.target.value || null })
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Wattage"
          value={local.wattage ?? 0}
          onChange={(e) =>
            setLocal({ ...local, wattage: Number(e.target.value) || null })
          }
        />
        <input
          className="input"
          placeholder="Availability"
          value={local.availability ?? ""}
          onChange={(e) =>
            setLocal({ ...local, availability: e.target.value || null })
          }
        />
        <input
          className="input"
          placeholder="Delivery timeline"
          value={local.delivery_time ?? ""}
          onChange={(e) =>
            setLocal({ ...local, delivery_time: e.target.value || null })
          }
        />
        <input
          className="input"
          placeholder="Warranty"
          value={local.warranty ?? ""}
          onChange={(e) =>
            setLocal({ ...local, warranty: e.target.value || null })
          }
        />
        <input
          className="input sm:col-span-3"
          placeholder="Image URLs (comma separated)"
          value={(local.images || []).join(", ")}
          onChange={(e) =>
            setLocal({
              ...local,
              images: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
        <input
          className="input sm:col-span-3"
          placeholder="Badges (comma or newline separated)"
          value={(badgesText)}
          onChange={(e) => {
            const value = e.target.value;
            setBadgesText(value);
            setLocal({
              ...local,
              badges: normaliseTextList(value),
            });
          }}
        />
      </div>
      <textarea
        className="input"
        placeholder="Description"
        value={local.description ?? ""}
        onChange={(e) =>
          setLocal({ ...local, description: e.target.value || null })
        }
      />
      <textarea
        className="input"
        placeholder="Highlights (one per line)"
        value={highlightsText}
        onChange={(e) => {
          const value = e.target.value;
          setHighlightsText(value);
          setLocal({ ...local, highlights: normaliseTextList(value) });
        }}
      />
      <textarea
        className="input"
        placeholder="Offers (JSON array or one title per line)"
        value={offersText}
        onChange={(e) => {
          const value = e.target.value;
          setOffersText(value);
          setLocal({ ...local, offers: parseOffersInput(value) });
        }}
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          Offers accept keys: title, discountType, discountValue, couponCode,
          badge, terms.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mr-2"
            checked={local.active}
            onChange={(e) => setLocal({ ...local, active: e.target.checked })}
          />
          Active
        </label>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              onSave({
                ...local,
                badges: normaliseTextList(badgesText),
                highlights: normaliseTextList(highlightsText),
                offers: parseOffersInput(offersText),
              })
            }
          >
            Save
          </Button>
          <Button variant="destructive" onClick={() => onDelete(local.id)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function WarehouseRow({
  w,
  onChange,
  onSave,
  onDelete,
}: {
  w: { id: string; name: string; location: string };
  onChange: (w: { id: string; name: string; location: string }) => void;
  onSave: (w: { id: string; name: string; location: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(w);
  useEffect(() => setLocal(w), [w]);

  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
      <input
        className="input"
        placeholder="Name"
        value={local.name}
        onChange={(e) => setLocal({ ...local, name: e.target.value })}
      />
      <input
        className="input"
        placeholder="Location"
        value={local.location}
        onChange={(e) => setLocal({ ...local, location: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onSave(local)}>
          Save
        </Button>
        <Button variant="destructive" onClick={() => onDelete(local.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
