import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Gift, Package, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/state/cart";
import { calculateOfferPricing } from "@/lib/offers";
import type { Product } from "@/components/ProductCard";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Address, readAddresses, upsertAddress, removeAddress } from "@/lib/addresses";

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Checkout() {
  const nav = useNavigate();
  const { items, clear } = useCart();
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Address>({ id: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [method, setMethod] = useState<"upi" | "card" | "netbanking" | "otherupi" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [success, setSuccess] = useState<{ open: boolean; orderId?: string; items?: number; total?: number }>({ open: false });

  useEffect(() => {
    if (!items.length) nav("/cart");
  }, [items.length]);

  useEffect(() => {
    setAddresses(readAddresses());
    if (!selectedAddrId && readAddresses()[0]) setSelectedAddrId(readAddresses()[0].id);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const summary = useMemo(() => {
    const lineItems = items.map((item) => {
      const p = calculateOfferPricing(item.price, item.offer);
      return {
        finalLine: p.finalPrice * item.quantity,
        lineBase: item.price * item.quantity,
        offerSavings: p.discountAmount * item.quantity,
        mrpSavings: item.mrp && item.mrp > item.price ? (item.mrp - item.price) * item.quantity : 0,
      };
    });
    const subtotal = lineItems.reduce((a, r) => a + r.lineBase, 0);
    const offerSavings = lineItems.reduce((a, r) => a + r.offerSavings, 0);
    const mrpSavings = lineItems.reduce((a, r) => a + r.mrpSavings, 0);
    const finalTotal = lineItems.reduce((a, r) => a + r.finalLine, 0);
    const shipping = finalTotal === 0 || finalTotal >= 75000 ? 0 : 999;
    const taxIncluded = Math.round(finalTotal * 0.18);
    const grandTotal = Math.max(finalTotal + shipping, 0);
    return { subtotal, offerSavings, mrpSavings, finalTotal, shipping, taxIncluded, grandTotal, totalSavings: offerSavings + mrpSavings };
  }, [items]);

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddrId) || null, [addresses, selectedAddrId]);

  const saveAddress = () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all required address fields");
      return;
    }
    const record: Address = { ...form, id: form.id || crypto.randomUUID() };
    upsertAddress(record);
    const next = readAddresses();
    setAddresses(next);
    setSelectedAddrId(record.id);
    setEditing(false);
    toast.success("Address saved");
  };

  const removeAddr = (id: string) => {
    removeAddress(id);
    const next = readAddresses();
    setAddresses(next);
    if (selectedAddrId === id) setSelectedAddrId(next[0]?.id ?? null);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Select or add a delivery address");
      return;
    }

    const orderTotal = summary.grandTotal;

    const fallbackLocal = (message?: string) => {
      const order = {
        id: crypto.randomUUID(),
        email,
        address: selectedAddress,
        items: items.map((item) => {
          const p = calculateOfferPricing(item.price, item.offer);
          return { id: item.id, title: item.title, price: p.finalPrice, qty: item.quantity, offer: item.offer?.title ?? null };
        }),
        total: orderTotal,
        createdAt: Date.now(),
        payment: { method, upiId: method === "upi" ? upiId : undefined },
      };
      const raw = localStorage.getItem("demo_orders");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      arr.unshift(order);
      localStorage.setItem("demo_orders", JSON.stringify(arr));
      clear();
      setSuccess({ open: true, orderId: order.id, items: items.length, total: orderTotal });
      toast.success(message || "Order placed (local demo). Connect Supabase/Razorpay for live payments.");
    };

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
    let useRazorpay = Boolean(keyId);
    try {
      const resp = await fetch("/api/payments/razorpay/config");
      const json = await resp.json();
      useRazorpay = useRazorpay && Boolean(json.configured);
    } catch {}

    if (useRazorpay) {
      try {
        const paise = Math.max(1, Math.round(orderTotal * 100));
        const createResp = await fetch("/api/payments/razorpay/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: paise, currency: "INR" }) });
        const data = await createResp.json();
        if (createResp.ok && data.order?.id) {
          const { openCheckout } = await import("@/lib/razorpay");
          await openCheckout({ key: keyId!, amount: data.order.amount, currency: data.order.currency, order_id: data.order.id, name: "Solar Store", description: "Order payment", prefill: { email } , notes: { address: `${selectedAddress.line1}, ${selectedAddress.city}` }, handler: () => fallbackLocal("Payment success (demo)") });
          return;
        }
      } catch (err) {
        console.warn("Razorpay create/open failed", err);
      }
    }

    fallbackLocal();
  };

  return (
    <section className="container py-12">
      <h1 className="text-2xl font-bold text-foreground">Secure checkout</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Delivering to</h2>
              {selectedAddress ? (
                <button className="text-sm text-primary" onClick={() => setEditing((v) => !v)}>{editing ? "Close" : "Change"}</button>
              ) : null}
            </div>
            <div className="p-4 space-y-4">
              {selectedAddress && !editing ? (
                <div className="text-sm text-foreground">
                  <div className="font-semibold">{selectedAddress.name} • {selectedAddress.phone}</div>
                  <div className="text-muted-foreground">{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input" placeholder="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
                    <input className="input" placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/>
                  </div>
                  <input className="input" placeholder="Address line 1" value={form.line1} onChange={(e)=>setForm({...form,line1:e.target.value})}/>
                  <input className="input" placeholder="Address line 2 (optional)" value={form.line2} onChange={(e)=>setForm({...form,line2:e.target.value})}/>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input className="input" placeholder="City" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/>
                    <input className="input" placeholder="State" value={form.state} onChange={(e)=>setForm({...form,state:e.target.value})}/>
                    <input className="input" placeholder="PIN code" value={form.pincode} onChange={(e)=>setForm({...form,pincode:e.target.value})}/>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveAddress}>Save address</Button>
                    {selectedAddress ? <Button variant="outline" onClick={()=>{ setEditing(false); setForm({ id:"", name:"", phone:"", line1:"", line2:"", city:"", state:"", pincode:"" }); }}>Cancel</Button> : null}
                  </div>
                  {addresses.length > 0 && (
                    <div className="mt-2 grid gap-2">
                      {addresses.map((a)=> (
                        <label key={a.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                          <input type="radio" name="addr" checked={selectedAddrId===a.id} onChange={()=>{ setSelectedAddrId(a.id); setForm(a); }}/>
                          <div className="flex-1 text-sm">
                            <div className="font-semibold">{a.name} • {a.phone}</div>
                            <div className="text-muted-foreground">{a.line1}{a.line2?`, ${a.line2}`:""}, {a.city}, {a.state} {a.pincode}</div>
                          </div>
                          <button className="text-xs text-muted-foreground" onClick={(e)=>{ e.preventDefault(); removeAddr(a.id); }}>Remove</button>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment method</h2>
            </div>
            <div className="p-4 grid gap-3">
              <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input type="radio" name="pm" checked={method==='upi'} onChange={()=>setMethod('upi')}/> UPI
              </label>
              {method==='upi' && (
                <div className="pl-9">
                  <input className="input" placeholder="Enter UPI ID (e.g. name@upi)" value={upiId} onChange={(e)=>setUpiId(e.target.value)}/>
                </div>
              )}
              <label className="flex items-center gap-3 rounded-lg border border-border p-3"><input type="radio" name="pm" checked={method==='card'} onChange={()=>setMethod('card')}/> Credit/Debit Card</label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3"><input type="radio" name="pm" checked={method==='netbanking'} onChange={()=>setMethod('netbanking')}/> Net Banking</label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3"><input type="radio" name="pm" checked={method==='otherupi'} onChange={()=>setMethod('otherupi')}/> Other UPI Apps</label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3"><input type="radio" name="pm" checked={method==='cod'} onChange={()=>setMethod('cod')}/> Cash on Delivery</label>
              <div>
                <Button onClick={placeOrder}>Use this payment method</Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Gift className="h-4 w-4 text-primary"/> Use coupon SOLAR5 in cart for demo discount.</div>
            <div className="mt-2 flex items-center gap-2"><Package className="h-4 w-4 text-primary"/> Need GST invoice? Reply to order email.</div>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-muted/20 p-6">
          <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Items</span><span className="text-foreground">{items.length}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{inr(summary.subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{summary.shipping===0? 'Free': inr(summary.shipping)}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Tax included</span><span className="text-foreground">{inr(summary.taxIncluded)}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between text-base font-semibold text-foreground"><span>Order total</span><span>{inr(summary.grandTotal)}</span></div>
          <div className="mt-4 grid gap-3">
            {items.map((item)=> (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <img src={item.image || FALLBACK_PRODUCT_IMAGE} alt={item.title} className="h-12 w-12 object-contain"/>
                <div className="flex-1 text-sm">
                  <div className="font-medium text-foreground">{item.title}</div>
                  <div className="text-muted-foreground">Qty {item.quantity}</div>
                </div>
                <div className="text-sm font-semibold text-foreground">{inr(calculateOfferPricing(item.price, item.offer).finalPrice * item.quantity)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground"><Truck className="mr-1 inline h-4 w-4 text-primary"/> Delivery timelines vary by region.</p>
        </aside>
      </div>

      <Dialog open={success.open} onOpenChange={(open)=>setSuccess((c)=>({ ...c, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order placed successfully</DialogTitle>
            <DialogDescription>Thank you! Your order ID is {success.orderId}. A confirmation has been sent to {email || 'your email'}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between"><span>Items</span><span>{success.items ?? 0}</span></div>
            <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{inr(success.total ?? 0)}</span></div>
          </div>
          <DialogFooter>
            <Button onClick={()=>{ setSuccess({ open:false }); nav('/'); }}>Continue shopping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
