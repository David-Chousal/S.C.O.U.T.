"""The "Ask Fred" chat widget."""

CSS = """/* ── Ask Fred — centred frosted-glass chat (Fin-style) ───────────────────────── */
.chat{z-index:60}
.chat-toggle{border:none;background:none;cursor:pointer;color:inherit;padding:0;font:inherit}
/* Navbar launcher (desktop) — matches the GitHub/LinkedIn icons in .nav-social. */
.nav-chat{display:inline-flex;color:var(--muted);transition:color var(--dur) var(--ease)}
.nav-chat:hover,.chat.chat-open .nav-chat{color:var(--accent)}
.nav-chat svg{width:15px;height:15px}
/* Floating launcher — shown only on mobile, where .nav-social is hidden. */
.chat-fab{position:fixed;right:clamp(1rem,2vw,1.6rem);bottom:clamp(1rem,2vw,1.6rem);z-index:60;
  width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--on-accent);
  display:none;place-items:center;box-shadow:var(--shadow-2);
  transition:transform var(--dur) var(--ease),opacity var(--dur) var(--ease)}
.chat-fab:hover{transform:translateY(-2px) scale(1.04)}
.chat-fab svg{width:24px;height:24px}
@media(max-width:720px){.chat-fab{display:grid}}
.chat.chat-open .chat-fab{opacity:0;pointer-events:none}
/* The widget: a centred column holding the frosted conversation card and, detached below it,
   the input pill. The column is click-through (pointer-events:none) so the page stays fully
   usable around and between its pieces — only the card and pill capture clicks. Never dims the
   page; closes only via the header chevron or Escape. */
.chat-panel{position:fixed;left:50%;bottom:clamp(1rem,2vw,1.4rem);z-index:60;pointer-events:none;
  width:min(442px,calc(100vw - 2rem));max-height:calc(100dvh - 2.5rem);
  display:flex;flex-direction:column;gap:0.7rem;
  transform:translateX(-50%) translateY(14px);visibility:hidden;
  transition:transform .3s var(--ease),visibility 0s .3s}
.chat.chat-open .chat-panel{visibility:visible;transform:translateX(-50%);
  transition:transform .32s var(--ease),visibility 0s}
/* Opacity lives on the leaves, never on their shared ancestor: `backdrop-filter` samples the
   backdrop *behind* its element, and an ancestor mid-fade is a composited group with nothing
   in it, so the blur read as absent until the fade landed and then snapped into focus. */
.chat-panel>*{opacity:0;transition:opacity .24s ease}
.chat.chat-open .chat-panel>*{opacity:1;transition:opacity .28s ease .04s}
.chat.chat-open .chat-glass{backdrop-filter:blur(22px) saturate(1.2);
  -webkit-backdrop-filter:blur(22px) saturate(1.2)}
/* Frosted conversation card — smoked deep-ocean glass; the page shows through, blurred. */
.chat-glass{pointer-events:auto;display:flex;flex-direction:column;overflow:hidden;
  height:min(364px,calc(100dvh - 9rem));border-radius:22px;color:#fff;
  background:linear-gradient(155deg,rgba(38,64,68,.62),rgba(15,32,36,.74));
  backdrop-filter:blur(4px) saturate(1.05);-webkit-backdrop-filter:blur(4px) saturate(1.05);
  transition:backdrop-filter .34s var(--ease),-webkit-backdrop-filter .34s var(--ease);
  border:1px solid rgba(255,255,255,.14);box-shadow:0 34px 90px -34px rgba(8,22,26,.65)}
/* Header on the glass. */
.chat-head{display:flex;align-items:center;gap:0.7rem;padding:0.95rem 1.1rem;
  border-bottom:1px solid rgba(255,255,255,.12)}
.chat-avatar{flex:none;width:34px;height:34px;border-radius:50%;background:var(--accent);
  display:grid;place-items:center;overflow:hidden}
.chat-avatar img{width:22px;height:22px;object-fit:contain;display:block;filter:brightness(0) invert(1)}
.chat-id{min-width:0;line-height:1.25}
.chat-id b{display:block;font-size:0.98rem;color:#fff}
.chat-id span{display:block;font-size:var(--text-micro);color:rgba(255,255,255,.62)}
.chat-close{margin-left:auto;border:none;background:none;color:rgba(255,255,255,.72);cursor:pointer;
  padding:0.3rem;display:grid;place-items:center;border-radius:50%}
.chat-close svg{width:20px;height:20px;display:block}
.chat-close:hover{color:#fff;background:rgba(255,255,255,.14)}
/* Messages — bot text plain on the glass, user in a subtle translucent bubble. */
.chat-log{flex:1;min-height:0;overflow-y:auto;padding:1.1rem;display:flex;flex-direction:column;gap:0.95rem}
.chat-row{display:flex;flex-direction:column;max-width:88%}
.chat-row-user{align-self:flex-end;align-items:flex-end}
.chat-row-bot{align-self:flex-start;align-items:flex-start;max-width:94%}
.chat-msg{font-size:0.95rem;line-height:1.55}
.chat-bot{color:rgba(255,255,255,.92)}
.chat-user{padding:0.55rem 0.85rem;border-radius:16px;border-bottom-right-radius:5px;
  background:rgba(255,255,255,.16);color:#fff}
.chat-meta{margin-top:0.32rem;font-size:var(--text-micro);color:rgba(255,255,255,.5)}
.chat-typing{color:rgba(255,255,255,.55);letter-spacing:0.18em}
/* Starter-question chips shown with the greeting — translucent light chips on the glass. */
.chat-chips{display:flex;flex-wrap:wrap;gap:0.45rem;margin-top:0.15rem}
.chat-chip{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.07);color:#fff;
  border-radius:999px;padding:0.42rem 0.85rem;font:inherit;font-size:0.83rem;cursor:pointer;
  transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}
.chat-chip:hover{background:rgba(255,255,255,.17);border-color:rgba(255,255,255,.42)}
/* Composer — a detached solid pill floating below the glass. */
.chat-form{pointer-events:auto;display:flex;flex-direction:column}
.chat-field{display:flex;align-items:center;gap:0.5rem;background:var(--surface);
  border:1px solid var(--color-line-strong);border-radius:999px;padding:0.35rem 0.35rem 0.35rem 1.15rem;
  box-shadow:0 18px 44px -22px rgba(8,22,26,.5);transition:border-color var(--dur) var(--ease)}
.chat-field:focus-within{border-color:var(--accent)}
.chat-input{flex:1;min-width:0;border:none;background:none;padding:0.5rem 0;font:inherit;
  font-size:0.95rem;color:var(--ink)}
.chat-input::placeholder{color:var(--muted)}
.chat-input:focus{outline:none}
.chat-send{flex:none;width:40px;height:40px;border:none;border-radius:50%;background:var(--accent);
  color:var(--on-accent);display:grid;place-items:center;cursor:pointer;
  transition:filter var(--dur) var(--ease)}
.chat-send:hover{filter:brightness(1.08)}
.chat-send svg{width:18px;height:18px}
@media(max-width:720px){
  .chat-panel{width:calc(100vw - 1.4rem);max-height:calc(100dvh - 1.4rem)}
  .chat-glass{height:calc(100dvh - 8rem)}}
@media (prefers-reduced-motion:reduce){
  .chat-fab,.chat.chat-open .chat-fab,.chat-panel,.chat.chat-open .chat-panel{transition:none}}
"""
