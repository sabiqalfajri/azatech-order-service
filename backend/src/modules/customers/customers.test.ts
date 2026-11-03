import { like } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { customers } from "../../db/schema/customers.js";
import { createTestData } from "../../test/helpers/test-data.js";
import { bearer, loginAsAdmin } from "../../test/helpers/auth.js";

const testData = createTestData("CUSTOMER")

describe("Customers API", () => {
  let app: FastifyInstance;
  let accessToken: string;

  const headers = () => bearer(accessToken);

  const createCustomer = (payload: Record<string, unknown> = {}) =>
    app.inject({
      method: "POST",
      url: "/api/customers",
      headers: headers(),
      payload: {
        name: testData.name("Pelanggan"),
        ...payload,
      },
    });

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    accessToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.db
      .delete(customers)
      .where(like(customers.name, `${testData.prefix}%`));

    await app.close();
  });

  it("menolak akses tanpa token (401)", async () => {
    const get = await app.inject({ method: "GET", url: "/api/customers" });
    const post = await app.inject({ method: "POST", url: "/api/customers", payload: { name: "X" } });

    expect(get.statusCode).toBe(401);
    expect(post.statusCode).toBe(401);
  });

  it("GET dengan token valid mengembalikan 200 beserta meta", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/customers?page=1&per_page=5",
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toMatchObject({ page: 1, per_page: 5 });
    expect(typeof body.meta.total).toBe("number");
  });

  it("membuat pelanggan lengkap (201), tanggal berupa string ISO", async () => {
    const name = testData.name("Pelanggan");
    const res = await createCustomer({ name, email: "tes@example.com", phone: "081234567890" });

    expect(res.statusCode).toBe(201);
    const data = res.json().data;
    expect(data).toMatchObject({ name, email: "tes@example.com", phone: "081234567890" });
    expect(typeof data.id).toBe("string");
    expect(new Date(data.created_at).toISOString()).toBe(data.created_at);
  });

  it("membuat pelanggan hanya dengan nama: email dan phone bernilai null (201)", async () => {
    const res = await createCustomer();

    expect(res.statusCode).toBe(201);
    expect(res.json().data.email).toBeNull();
    expect(res.json().data.phone).toBeNull();
  });

  it("menolak nama kosong dan email tidak valid dengan 422", async () => {
    const res = await createCustomer({ name: "   ", email: "bukan-email" });

    expect(res.statusCode).toBe(422);
    expect(res.json().success).toBe(false);
    expect(res.json().errors.name).toBeDefined();
    expect(res.json().errors.email).toBeDefined();
  });

  it("search mengembalikan hanya pelanggan yang cocok", async () => {
    const needle = `needle${testData.run.toLowerCase()}`;
    const created = await createCustomer({
      name: `${testData.prefix} ${needle}`,
    });
    expect(created.statusCode).toBe(201);

    const res = await app.inject({
      method: "GET",
      url: `/api/customers?search=${needle}`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].id).toBe(created.json().data.id);
    expect(res.json().meta.total).toBe(1);
  });
});