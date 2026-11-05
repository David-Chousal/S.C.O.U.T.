/* What Fred knows beyond live data: the knowledge pack (in every system instruction) and the
 * search_docs index, both built by console/scripts/build_assistant_knowledge.py. Keyword ranking
 * (BM25-like) over heading-sized chunks; no vector database. */

import knowledge from "./knowledge.json" with { type: "json" };

const STOP = new Set(("a an and are as at be by can do does for from has have how i in is it its of on or " +
  "that the this to was we what when where which who why will with you your").split(" "));

export const PACK = knowledge.pack;
export const BUILT = knowledge.built;

function terms(text) {
  return text.toLowerCase().match(/[a-z0-9][a-z0-9._-]*[a-z0-9]|[a-z0-9]/g)?.filter((t) => !STOP.has(t)) ?? [];
}

// Built once per isolate: each chunk's term counts, and how many chunks hold each term.
const INDEX = knowledge.chunks.map((chunk) => {
  const counts = new Map();
  for (const term of terms(`${chunk.heading} ${chunk.heading} ${chunk.path} ${chunk.text}`)) counts.set(term, (counts.get(term) ?? 0) + 1);
  return { chunk, counts, length: [...counts.values()].reduce((a, b) => a + b, 0) };
});
const DOC_FREQ = new Map();
for (const { counts } of INDEX) for (const term of counts.keys()) DOC_FREQ.set(term, (DOC_FREQ.get(term) ?? 0) + 1);
const AVG_LENGTH = INDEX.reduce((sum, d) => sum + d.length, 0) / Math.max(1, INDEX.length);

/** The best `limit` passages for `query`, each { path, heading, text }. */
export function searchDocs(query, limit = 5) {
  const wanted = [...new Set(terms(String(query)))];
  if (wanted.length === 0) return [];
  const n = INDEX.length;
  const scored = INDEX.map((doc) => {
    let score = 0;
    for (const term of wanted) {
      const tf = doc.counts.get(term) ?? 0;
      if (!tf) continue;
      const idf = Math.log(1 + (n - DOC_FREQ.get(term) + 0.5) / (DOC_FREQ.get(term) + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * doc.length / AVG_LENGTH));
    }
    return { doc, score };
  }).filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ doc }) => ({ path: doc.chunk.path, heading: doc.chunk.heading, text: doc.chunk.text }));
}
