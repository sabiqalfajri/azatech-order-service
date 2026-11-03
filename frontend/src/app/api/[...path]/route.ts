import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, COOKIE_OPTIONS } from "@/src/lib/auth-cookie";
import { BACKEND_URL } from "@/src/lib/backend-url";

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, { params }: Context) {
  const { path } = await params;

  if (path.some((segment) => segment === "." || segment === "..")) {
    return NextResponse.json({ success: false, message: "Path tidak valid" }, { status: 400 });
  }

  const target = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: text || undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend tidak dapat dihubungi" },
      { status: 502 }
    );
  }

  const noBody = upstream.status === 204 || upstream.status === 205 || upstream.status === 304;
  const res = new NextResponse(noBody ? null : await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });

  if (upstream.status === 401) {
    res.cookies.set(AUTH_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  }
  return res;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };