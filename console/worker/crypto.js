/* Tokens, hashes and passwords for the console (ADR-0012). WebCrypto only, no dependencies.
 *
 * Passwords use PBKDF2-HMAC-SHA256 at 100,000 iterations, chosen for the Workers Free plan's
 * 10 ms CPU limit per request (decided 2026-10-25, ADR-0012). That is below OWASP's 600,000 for
 * this hash: an accepted risk. It is not a runtime cap: local workerd ran 600,000 too, and
 * 100,000 took about 10-11 ms there, so a sign-in may brush the free-plan limit (to measure on
 * the deployed Worker). Workers Paid + argon2id is the documented upgrade. The stored format
 * names its own cost, so the count can be raised later without a migration. */

export const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const encoder = new TextEncoder();

export function b64url(bytes) {
  let text = "";
  for (const b of bytes) text += String.fromCharCode(b);
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function fromB64url(text) {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** A URL-safe random token with `bytes` of entropy (default 32 = 256 bits). */
export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Equal-length comparison with no early exit. */
export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password, stored) {
  const parts = (stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) return false;
  const hash = await pbkdf2(password, fromB64url(parts[2]), iterations);
  return constantTimeEqual(b64url(hash), parts[3]);
}

/** A password the console accepts: 12-256 characters (NIST 800-63B length, no composition rules). */
export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 12) return "Use at least 12 characters.";
  if (password.length > 256) return "Use at most 256 characters.";
  return null;
}
