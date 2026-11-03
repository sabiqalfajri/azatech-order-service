import { describe, expect, it } from "vitest";
import { calculateDiscount, calculateOrder } from "./calculate-order.js";

describe("calculateDiscount", () => {
  it.each([
    [499_999, 0],
    [500_000, 25_000],
    [999_999, 49_999], 
    [1_000_000, 100_000],
    [1_500_000, 150_000],
    [2_000_000, 150_000], 
  ])("subtotal %i mendapat diskon %i", (subtotal, expected) => {
    expect(calculateDiscount(subtotal)).toBe(expected);
  });
});

describe("calculateOrder", () => {
  it("menghitung subtotal, diskon, dan grand total dari harga server", () => {
    const r = calculateOrder([
      { productId: "a", productName: "A", productCode: "A", unitPrice: 200_000, quantity: 2 },
      { productId: "b", productName: "B", productCode: "B", unitPrice: 50_000, quantity: 4 },
    ]);
    expect(r.subtotal).toBe(600_000);
    expect(r.discountAmount).toBe(30_000);
    expect(r.grandTotal).toBe(570_000);
  });
});