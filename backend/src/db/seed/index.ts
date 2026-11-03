import { seedUsers } from "./users.seed.js";

async function seed() {
  try {
    await seedUsers()

    console.info("Seeding completed.")
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exitCode = 1
  }
}

await seed()