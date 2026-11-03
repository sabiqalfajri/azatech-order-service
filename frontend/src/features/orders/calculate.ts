const TIERS = [
  { min: 1_000_000, percent: 10 },
  { min: 500_000, percent: 5 },
];
const MAX_DISCOUNT = 150_000;

export function getDiscount(subtotal: number) {
  const tier = TIERS.find((t) => subtotal >= t.min);
  if (!tier) return { percent: 0, amount: 0, capped: false };

  const raw = Math.floor((subtotal * tier.percent) / 100);
  return { percent: tier.percent, amount: Math.min(raw, MAX_DISCOUNT), capped: raw > MAX_DISCOUNT };
}