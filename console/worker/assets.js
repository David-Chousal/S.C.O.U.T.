/* Serving the static front end (console/web's export) from the ASSETS binding: each HTML page
 * gets a fresh script nonce and a CSP that allows only it. Kept out of index.js because a
 * Worker's entry module may export nothing but its handlers. */

import { apiError } from "./http.js";
import { randomToken } from "./crypto.js";

/** One-time message for the sign-in page (index.js sets it after a failed OAuth round trip). */
export const FLASH_COOKIE = "__Host-scout_flash";

/** The CSP for an HTML page: scripts only with this response's nonce (and what they load). */
export function pageCsp(nonce) {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    // React style props render as style="" attributes; nonces cannot cover attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self' https://github.com https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'none'",
  ].join("; ");
}

/** Give every <script> (and script preload) in our own build's HTML the nonce. The HTML is ours, so a tag match is
 * exact; a script injected later through the DOM gets no nonce and is blocked. */
export function addNonce(html, nonce) {
  return html
    .replace(/<script(?=[\s>])/g, `<script nonce="${nonce}"`)
    // Next's script preloads are fetched under script-src too; without the nonce they are blocked.
    .replace(/<link(?=[^>]*\bas="script")/g, `<link nonce="${nonce}"`);
}

const PAGE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export async function staticAsset(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") return apiError("method not allowed", 405);
  const asset = await env.ASSETS.fetch(request);
  const type = asset.headers.get("Content-Type") || "";
  const headers = new Headers(asset.headers);
  for (const [name, value] of Object.entries(PAGE_HEADERS)) headers.set(name, value);
  if (!type.startsWith("text/html")) return new Response(asset.body, { status: asset.status, headers });
  const nonce = randomToken(18);
  headers.set("Content-Security-Policy", pageCsp(nonce));
  headers.set("Cache-Control", "no-store");
  headers.delete("Content-Length");
  return new Response(addNonce(await asset.text(), nonce), { status: asset.status, headers });
}

