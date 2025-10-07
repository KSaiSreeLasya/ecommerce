declare global {
  interface Window {
    Razorpay?: any;
  }
}

export async function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayOpenOptions = {
  key: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
};

export async function openCheckout(options: RazorpayOpenOptions) {
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) throw new Error("Razorpay SDK failed to load");
  const rzp = new window.Razorpay(options);
  rzp.open();
}
