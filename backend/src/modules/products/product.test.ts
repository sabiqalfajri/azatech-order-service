import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { products } from "../../db/schema/products.js";
import { createTestData } from "../../test/helpers/test-data.js";
import { bearer, loginAsAdmin } from "../../test/helpers/auth.js";

const testData = createTestData("PRODUCT");

describe("Products API", () => {
  let app: FastifyInstance
  let accessToken: string

  const headers = () => bearer(accessToken);

  const createProduct = (overrides: Record<string, unknown> = {}) =>
    app.inject({
      method: "POST",
      url: "/api/products",
      headers: headers(),
      payload: {
        product_code: testData.code(),
        name: testData.name("Produk"),
        price: 15_000,
        stock: 10,
        ...overrides,
      },
    })

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    accessToken = await loginAsAdmin(app);
  })

  afterAll(async () => {
    if (!app) return;

    await app.db
      .delete(products)
      .where(like(products.productCode, `${testData.prefix}%`));

    await app.close();
  });

  it("menolak akses tanpa token (401)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/products" })

    expect(res.statusCode).toBe(401)
    expect(res.json().success).toBe(false)
  })

  it("GET dengan token valid mengembalikan 200 beserta meta", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/products?page=1&per_page=5",
      headers: headers(),
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta).toMatchObject({ page: 1, per_page: 5 })
    expect(typeof body.meta.total).toBe("number")
  })

  it("search mengembalikan hanya produk yang cocok", async () => {
    const needle = `needle${testData.run.toLowerCase()}`;

    const created = await createProduct({
      name: `Hydrococo ${needle} 150ml`,
    });

    expect(created.statusCode).toBe(201);

    const res = await app.inject({
      method: "GET",
      url: `/api/products?search=${encodeURIComponent(needle)}`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].product_code).toBe(
      created.json().data.product_code
    );
    expect(body.meta.total).toBe(1);
  });

  it("membuat produk baru (201)", async () => {
    const code = testData.code();

    const res = await createProduct({
      product_code: code,
      price: 25_000,
      stock: 7,
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data).toMatchObject({
      product_code: code,
      price: 25_000,
      stock: 7,
    });
  });

  it("search berdasarkan product_code", async () => {
    const code = testData.code();

    const created = await createProduct({
      product_code: code,
      name: testData.name("Produk Khusus"),
    });

    expect(created.statusCode).toBe(201);

    const res = await app.inject({
      method: "GET",
      url: `/api/products?search=${encodeURIComponent(code)}`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].product_code).toBe(code);
  })

  it("menolak product_code duplikat (409)", async () => {
    const code = testData.code();

    expect(
      (await createProduct({ product_code: code })).statusCode
    ).toBe(201);

    const res = await createProduct({
      product_code: code,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().success).toBe(false);
    expect(res.json().errors.product_code).toBeDefined();
  });

  it("menolak price 0 dengan 422 dan errors per field", async () => {
    const res = await createProduct({
      price: 0,
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().errors.price).toBeDefined();
  });

  it("memperbarui produk (200)", async () => {
    const created = await createProduct();
    const { id, product_code } = created.json().data;

    const res = await app.inject({
      method: "PUT",
      url: `/api/products/${id}`,
      headers: headers(),
      payload: { product_code, name: "Nama Baru", price: 99000, stock: 3 },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ 
      id, 
      product_code,
      name: "Nama Baru", 
      price: 99000, 
      stock: 3 
    })
  })

  it("update produk yang tidak ada mengembalikan 404", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/api/products/${randomUUID()}`,
      headers: headers(),
      payload: {
        product_code: testData.code(),
        name: "X",
        price: 1_000,
        stock: 1,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().success).toBe(false);
  });
})