import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, COOKIE_OPTIONS, maxAgeFromJwt } from "@/src/lib/auth-cookie";
import { BACKEND_URL } from "@/src/lib/backend-url";

export async function POST(request: NextRequest) {
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend tidak dapat dihubungi" },
      { status: 502 }
    );
  }

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok || !json?.data?.access_token) {
    return NextResponse.json(
      json ?? { success: false, message: "Terjadi kesalahan pada server" },
      { status: upstream.ok ? 502 : upstream.status }
    );
  }

  const { access_token, ...data } = json.data;
  const res = NextResponse.json({ ...json, data });
  res.cookies.set(AUTH_COOKIE, access_token, {
    ...COOKIE_OPTIONS,
    maxAge: maxAgeFromJwt(access_token),
  });
  return res;
}