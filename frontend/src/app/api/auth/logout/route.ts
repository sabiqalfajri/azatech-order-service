import { NextResponse } from "next/server";
import { AUTH_COOKIE, COOKIE_OPTIONS } from "@/src/lib/auth-cookie";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "OK", data: null });
  res.cookies.set(AUTH_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}