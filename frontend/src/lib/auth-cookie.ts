export const AUTH_COOKIE = "access_token";
const FALLBACK_MAX_AGE = 60 * 60 * 24;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
};

export function maxAgeFromJwt(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return FALLBACK_MAX_AGE;
  }
}