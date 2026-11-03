import { apiRequest } from "@/src/lib/api-client";
import type { LoginInput } from "./schema";
import type { LoginResult } from "./types";

export async function login(input: LoginInput) {
  const { data } = await apiRequest<LoginResult>("/api/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
  return data.user; 
}

export async function logout() {
  await apiRequest("/api/auth/logout", { method: "POST", auth: false }).catch(() => {});
}