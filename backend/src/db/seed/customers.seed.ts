import { inArray } from "drizzle-orm";
import { db } from "../client.js";
import { customers } from "../schema/customers.js";

const SEED_CUSTOMERS = [
  { name: "Budi Santoso", email: "budi.santoso@example.com", phone: "081234567801" },
  { name: "Siti Rahayu", email: "siti.rahayu@example.com", phone: "081234567802" },
  { name: "Agus Wijaya", email: "agus.wijaya@example.com", phone: "081234567803" },
  { name: "Dewi Lestari", email: "dewi.lestari@example.com", phone: "081234567804" },
  { name: "Eko Prasetyo", email: "eko.prasetyo@example.com", phone: "081234567805" },
  { name: "Rina Marlina", email: "rina.marlina@example.com", phone: "081234567806" },
  { name: "Hendra Gunawan", email: "hendra.gunawan@example.com", phone: "081234567807" },
  { name: "Maya Anggraini", email: "maya.anggraini@example.com", phone: "081234567808" },
  { name: "Fajar Nugroho", email: "fajar.nugroho@example.com", phone: "081234567809" },
  { name: "Lestari Putri", email: "lestari.putri@example.com", phone: "081234567810" },
];

export async function seedCustomers() {
  const emails = SEED_CUSTOMERS.map((c) => c.email);

  const existing = await db
    .select({ email: customers.email })
    .from(customers)
    .where(inArray(customers.email, emails));

  const existingEmails = new Set(existing.map((c) => c.email));
  const toInsert = SEED_CUSTOMERS.filter((c) => !existingEmails.has(c.email));

  if (toInsert.length === 0) {
    console.info("Customers already seeded, skipping.");
    return;
  }

  await db.insert(customers).values(toInsert);
  console.info(
    `Seeded ${toInsert.length} customers (${existingEmails.size} already existed).`
  );
}