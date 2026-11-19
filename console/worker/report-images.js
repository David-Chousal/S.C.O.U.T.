/* Report builder (SCO-317): images for the Image block. PNG or JPEG only (what the browser's PDF
 * renderer can embed), at most 1 MB, 50 per person; stored in R2 through the guarded storage
 * module, under report-images/, and served to anyone signed in. */

import { record } from "./audit.js";
import { apiError } from "./http.js";
import { guardedGet, guardedPut } from "./storage.js";

export const MAX_IMAGE_BYTES = 1_000_000;
const MAX_PER_PERSON = 50;
/** The bucket rule deletes report-images/ after this many days; rows past it describe no file. */
const KEEP_MS = 365 * 24 * 3600 * 1000;

/** The type from the file's own first bytes, not from what the browser claims. */
export function sniffImage(bytes) {
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

/** @returns {Promise<{ id?: string, error?: string }>} */
export async function uploadReportImage(env, actor, body) {
  const bytes = new Uint8Array(body);
  if (bytes.length === 0) return { error: "Choose an image to upload." };
  if (bytes.length > MAX_IMAGE_BYTES) return { error: "Images are at most 1 MB. Make it smaller and try again." };
  const type = sniffImage(bytes);
  if (!type) return { error: "Only PNG and JPEG images can go in a report." };
  // Rows whose file the lifecycle rule has deleted are dropped, so they never count toward the cap.
  const now = Date.now();
  await env.DB.prepare("DELETE FROM report_images WHERE created_at <= ?").bind(now - KEEP_MS).run();
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM report_images WHERE owner_id = ?").bind(actor.id).first();
  if (n >= MAX_PER_PERSON) return { error: `You can keep ${MAX_PER_PERSON} report images.` };
  const id = crypto.randomUUID();
  const stored = await guardedPut(env, `report-images/${id}`, bytes);
  if (stored.error) return stored;
  await env.DB.prepare("INSERT INTO report_images (id, owner_id, content_type, bytes, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, actor.id, type, bytes.length, now).run();
  await record(env.DB, { actor, action: "report_image.upload", target: id });
  return { id };
}

/** The image itself, for anyone signed in. Cached in the browser for a day; the id never changes. */
export async function serveReportImage(env, id) {
  const row = await env.DB.prepare("SELECT content_type FROM report_images WHERE id = ?").bind(id).first();
  if (!row) return apiError("No such image.", 404);
  const got = await guardedGet(env, `report-images/${id}`);
  if (got.error) return apiError(got.error, 404);
  return new Response(got.object.body, { headers: {
    "Content-Type": row.content_type, "Cache-Control": "private, max-age=86400, immutable", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
  } });
}
