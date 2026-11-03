import { db } from "../client.js";
import { products } from "../schema/products.js";

const PRODUCT_SEEDS = [
  {
    productCode: "PRD-001",
    name: "Indomie Goreng",
    price: 3500,
    stock: 100,
  },
  {
    productCode: "PRD-002",
    name: "Aqua 600ml",
    price: 4000,
    stock: 100,
  },
  {
    productCode: "PRD-003",
    name: "Teh Pucuk 350ml",
    price: 5000,
    stock: 100,
  },
  {
    productCode: "PRD-004",
    name: "Chitato Sapi Berbumbu 68g",
    price: 11500,
    stock: 75,
  },
  {
    productCode: "PRD-005",
    name: "Ultra Milk Cokelat 250ml",
    price: 7000,
    stock: 80,
  },
  {
    productCode: "PRD-006",
    name: "Kopi Kenangan Mantan 220ml",
    price: 9500,
    stock: 60,
  },
  {
    productCode: "PRD-007",
    name: "SilverQueen Chunky Bar 62g",
    price: 22000,
    stock: 50,
  },
  {
    productCode: "PRD-008",
    name: "Roma Biskuit Kelapa 300g",
    price: 13000,
    stock: 65,
  },
  {
    productCode: "PRD-009",
    name: "Pocari Sweat 500ml",
    price: 8000,
    stock: 90,
  },
  {
    productCode: "PRD-010",
    name: "Sariwangi Teh Hitam Asli",
    price: 7500,
    stock: 100,
  },
  {
    productCode: "PRD-011",
    name: "Tango Wafer Cokelat 130g",
    price: 9000,
    stock: 70,
  },
  {
    productCode: "PRD-012",
    name: "Sosro Fruit Tea Blackcurrant 350ml",
    price: 4500,
    stock: 85,
  },
  {
    productCode: "PRD-013",
    name: "Milo Active-Go 180ml",
    price: 6500,
    stock: 60,
  },
  {
    productCode: "PRD-014",
    name: "Good Day Cappuccino 250ml",
    price: 7500,
    stock: 80,
  },
  {
    productCode: "PRD-015",
    name: "Qtela Keripik Singkong Balado 60g",
    price: 8500,
    stock: 70,
  },
];

export async function seedProducts() {
  await db
    .insert(products)
    .values(PRODUCT_SEEDS)
    .onConflictDoNothing({ target: products.productCode });

  console.info("Products seeded successfully.");
}