/* Fred's per-person daily caps and usage counts (assistant_usage). Counts only, never text.
 * The caps come from Worker vars, since Google changes the free tier's limits without notice:
 *   ASSISTANT_DAILY_CAP        questions a day for a member or admin   (default 40)
 *   ASSISTANT_DAILY_CAP_GUEST  questions a day for a guest             (default 10) */

const DEFAULT_CAP = 40;
const DEFAULT_GUEST_CAP = 10;

export const today = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

function number(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function capFor(env, role) {
  return role === "guest" ? number(env.ASSISTANT_DAILY_CAP_GUEST, DEFAULT_GUEST_CAP) : number(env.ASSISTANT_DAILY_CAP, DEFAULT_CAP);
}

/** Count a question if the person is under today's cap. @returns {Promise<{ ok: boolean, used: number, cap: number }>} */
export async function takeQuestion(env, user, now = Date.now()) {
  const cap = capFor(env, user.role);
  const day = today(now);
  const row = await env.DB.prepare("SELECT questions FROM assistant_usage WHERE user_id = ? AND day = ?").bind(user.id, day).first();
  const used = row?.questions ?? 0;
  if (used >= cap) return { ok: false, used, cap };
  await env.DB.prepare("INSERT INTO assistant_usage (user_id, day, questions) VALUES (?, ?, 1) " +
    "ON CONFLICT (user_id, day) DO UPDATE SET questions = questions + 1").bind(user.id, day).run();
  return { ok: true, used: used + 1, cap };
}

/** Add one model call's counts. */
export async function countCall(env, userId, { usage, fallback }, now = Date.now()) {
  await env.DB.prepare("UPDATE assistant_usage SET model_calls = model_calls + 1, tokens_in = tokens_in + ?, " +
    "tokens_out = tokens_out + ?, fallbacks = fallbacks + ? WHERE user_id = ? AND day = ?")
    .bind(usage?.in ?? 0, usage?.out ?? 0, fallback ? 1 : 0, userId, today(now)).run();
}

/** Today's totals across everyone, for Developer → Storage and the get_storage tool. */
export async function usageToday(db, now = Date.now()) {
  const row = await db.prepare("SELECT COALESCE(SUM(questions), 0) AS questions, COALESCE(SUM(model_calls), 0) AS model_calls, " +
    "COALESCE(SUM(tokens_in), 0) AS tokens_in, COALESCE(SUM(tokens_out), 0) AS tokens_out, COALESCE(SUM(fallbacks), 0) AS fallbacks, " +
    "COUNT(*) AS people FROM assistant_usage WHERE day = ?").bind(today(now)).first();
  return { day: today(now), ...row };
}
