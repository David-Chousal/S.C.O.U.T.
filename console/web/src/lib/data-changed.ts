/** A change made outside a page's own controls (a confirmed Fred card) tells every page to reload
 * what it shows, so nothing stays stale behind the panel. useApi listens for it. */
export const DATA_CHANGED = "scout:data-changed";

export function announceDataChanged(): void {
  window.dispatchEvent(new Event(DATA_CHANGED));
}
