import type { RequestHandler } from "express";
import Razorpay from "razorpay";

function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export const createOrder: RequestHandler = async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      res.status(400).json({ error: "Razorpay not configured on server" });
      return;
    }
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }
    const currency = (req.body.currency as string) || "INR";
    const receipt = (req.body.receipt as string) || `rcpt_${Date.now()}`;

    const order = await client.orders.create({ amount, currency, receipt });
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Order creation failed" });
  }
};

export const configStatus: RequestHandler = (_req, res) => {
  const configured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
  res.json({ configured });
};
