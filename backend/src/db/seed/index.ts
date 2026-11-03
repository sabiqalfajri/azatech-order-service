import { seedCustomers } from "./customers.seed.js";
import { seedProducts } from "./products.seed.js";
import { seedUsers } from "./users.seed.js";

async function seed() {
  try {
    await seedUsers()
    await seedProducts()
    await seedCustomers()

    console.info("Seeding completed.")
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exitCode = 1
  }
}

await seed()