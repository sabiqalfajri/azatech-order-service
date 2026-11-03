import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { users } from "../schema/users.js";
import { hashPassword } from "../../lib/crypto.js";

const ADMIN = {
  name: "Admin",
  email: "admin@example.com",
  password: "Admin123!",
}

export async function seedUsers() {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ADMIN.email))
    .limit(1)

  if (existingUser) {
    console.info("Admin user already exists, skipping.")
    return
  }

  const passwordHash = await hashPassword(ADMIN.password)

  await db.insert(users).values({
    name: ADMIN.name,
    email: ADMIN.email,
    passwordHash
  })

  console.info("Admin user seeded successfully.")
}