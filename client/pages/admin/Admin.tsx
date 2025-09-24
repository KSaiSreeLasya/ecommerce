import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

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
    const { error } = await supabase.from("products").insert(payload);
    if (error) alert(error.message);
    else alert("Product added");
  };

  const addWarehouse = async () => {
    const { error } = await supabase.from("warehouses").insert(warehouse);
    if (error) alert(error.message);
    else alert("Warehouse added");
  };

  const setStock = async () => {
    const { error } = await supabase.from("inventory").upsert({
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      stock: Number(inventory.stock),
    });
    if (error) alert(error.message);
    else alert("Inventory updated");
  };

  return (
    <section className="container py-12 grid gap-10">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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

      <style>{`.input{border-radius:.375rem;border:1px solid hsl(var(--input));background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem;outline:none} .input:focus{box-shadow:0 0 0 2px hsl(var(--ring))}`}</style>
    </section>
  );
}
