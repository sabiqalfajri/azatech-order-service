export type FieldErrors = Record<string, string[]>;
export type Meta = { page: number; per_page: number; total: number };
export type ApiEnvelope<T> = { success: true; message: string; data: T; meta?: Meta };

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;

  constructor(message: string, status: number, errors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  { body, auth = true, ...init }: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server", 0);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && auth && typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new ApiError(json?.message ?? "Terjadi kesalahan pada server", res.status, json?.errors);
  }
  return json as ApiEnvelope<T>;
}