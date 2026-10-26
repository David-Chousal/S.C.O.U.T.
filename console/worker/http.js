/* JSON responses, redirects, security headers and cookies for the console Worker. */

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self' https://github.com " +
    "https://accounts.google.com; frame-ancestors 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
};

export const SESSION_COOKIE = "__Host-scout_session";
export const OAUTH_COOKIE = "__Host-scout_oauth";

export function json(data, status = 200) {
  return new Response(JSON.stringify({ ok: status < 400, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

export function apiError(error, status) {
  return json({ error }, status);
}

/** A 303 with the security headers; `cookies` are appended as separate Set-Cookie headers. */
export function redirect(location, headers = {}, cookies = []) {
  const out = new Headers({ Location: location, ...SECURITY_HEADERS, ...headers });
  for (const c of cookies) out.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers: out });
}

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

/** A __Host- cookie: Secure, HttpOnly, Path=/, no Domain. */
export function setCookie(name, value, maxAgeSeconds) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearCookie(name) {
  return setCookie(name, "", 0);
}

/** True when a request with a body declares a length within `max`. Checked before any body is
 * read, so an oversized or unlengthed upload is never buffered. */
export function bodyWithin(request, max) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const header = request.headers.get("Content-Length");
  if (header === null || !/^\d+$/.test(header)) return false;  // Number(null) would read as 0
  return Number(header) <= max;
}

/** POSTs must come from this origin (a CSRF guard alongside the session's X-CSRF-Token).
 * Browsers send Origin on every cross-site POST, so a missing header is a same-site or
 * non-browser client, which the CSRF token and the JSON-only body still have to satisfy. */
export function sameOrigin(request, appUrl) {
  const origin = request.headers.get("Origin");
  return origin === null || origin === new URL(appUrl).origin;
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}
