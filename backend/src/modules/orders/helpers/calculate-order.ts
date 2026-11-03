export const DISCOUNT_TIERS = [
  { minSubtotal: 1_000_000, percent: 10 },
  { minSubtotal: 500_000, percent: 5 },
] as const;
export const MAX_DISCOUNT = 150_000;

export function calculateDiscount(subtotal: number): number {
  const tier = DISCOUNT_TIERS.find((t) => subtotal >= t.minSubtotal);
  if (!tier) return 0;
  return Math.min(Math.floor((subtotal * tier.percent) / 100), MAX_DISCOUNT);
}

export type OrderLineInput = {
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
};

export function calculateOrder(lines: OrderLineInput[]) {
  const items = lines.map((l) => ({ ...l, subtotal: l.unitPrice * l.quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = calculateDiscount(subtotal);
  return { items, subtotal, discountAmount, grandTotal: subtotal - discountAmount };
}