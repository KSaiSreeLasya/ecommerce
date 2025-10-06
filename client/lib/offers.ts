export type DiscountType = "percentage" | "flat";

export type OfferDetail = {
  id: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  couponCode?: string | null;
  description?: string | null;
  terms?: string | null;
  badge?: string | null;
};

export type OfferSource = OfferDetail | null | undefined;

export function calculateOfferPricing(
  price: number,
  offer?: OfferSource,
): { finalPrice: number; discountAmount: number } {
  if (!offer) return { finalPrice: Math.round(price), discountAmount: 0 };
  const normalizedValue = Number.isFinite(offer.discountValue)
    ? offer.discountValue
    : 0;
  const rawDiscount =
    offer.discountType === "flat"
      ? normalizedValue
      : (price * normalizedValue) / 100;
  const discountAmount = Math.min(price, Math.round(rawDiscount));
  const finalPrice = Math.max(0, Math.round(price - discountAmount));
  return { finalPrice, discountAmount };
}

export function getCartItemUnitPrice(item: CartItem): number {
  const { finalPrice } = calculateOfferPricing(item.price, item.offer);
  return finalPrice;
}
