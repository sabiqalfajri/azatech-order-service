import type { FastifyInstance } from "fastify";
import { expect } from "vitest";

const LOGIN_URL = "/api/auth/login";
const ADMIN = { email: "admin@example.com", password: "Admin123!" };

export async function loginAsAdmin(app: FastifyInstance): Promise<string> {
  const res = await app.inject({ method: "POST", url: LOGIN_URL, payload: ADMIN });
  expect(res.statusCode, res.body).toBe(200);

  const body = res.json<{ data: { access_token: string } }>();
  expect(body.data.access_token).toBeTruthy();
  return body.data.access_token;
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });