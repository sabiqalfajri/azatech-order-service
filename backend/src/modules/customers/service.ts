import { asc, count, ilike, or } from "drizzle-orm";
import { customers, type CustomerRow } from "../../db/schema/customers.js";
import type { DB } from "../../db/types.js";
import type { CreateCustomerInput, GetCustomersQuery } from "./schema.js";
import { escapeLike } from "../../common/utils/string.js";

export function toCustomerResponse(c: CustomerRow) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}

type CustomerServiceDeps = { db: DB };

export function createCustomerService({ db }: CustomerServiceDeps) {
  return {
    async getCustomers(query: GetCustomersQuery) {
      const { page, per_page, search } = query;

      const pattern = search ? `%${escapeLike(search)}%` : undefined;
      const where = pattern
        ? or(ilike(customers.name, pattern), ilike(customers.email, pattern))
        : undefined;

      const [rows, countRows] = await Promise.all([
        db
          .select()
          .from(customers)
          .where(where)
          .orderBy(asc(customers.name), asc(customers.id))
          .limit(per_page)
          .offset((page - 1) * per_page),
        db.select({ total: count() }).from(customers).where(where),
      ]);

      return {
        items: rows.map(toCustomerResponse),
        meta: { page, per_page, total: countRows[0]?.total ?? 0 },
      };
    },

    async createCustomer(input: CreateCustomerInput) {
      const [row] = await db
        .insert(customers)
        .values({
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
        })
        .returning();

      return toCustomerResponse(row!);
    },
  };
}

export type CustomerService = ReturnType<typeof createCustomerService>;