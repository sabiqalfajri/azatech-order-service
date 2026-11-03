export const AUTH_COOKIE = "access_token";
const MAX_AGE_SECONDS = 60 * 60 * 24; 

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(AUTH_COOKIE.length + 1)) : null;
}

export function setToken(token: string) {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}