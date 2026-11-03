import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/src/lib/auth-cookie";

const LOGIN_PATH = "/login";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(AUTH_COOKIE);
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};