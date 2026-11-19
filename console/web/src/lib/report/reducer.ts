// Every change to a report is one of these actions; undo and redo replay the document history.

import type { Block, BlockOptions, ReportDocument } from "./document";
import type { PageSetup } from "./page";
import type { BlockOverride, ReportVariables } from "./variables";

export type ReportAction =
  | { type: "setTitle"; title: string }
  | { type: "setVariables"; variables: ReportVariables }
  | { type: "setPage"; page: PageSetup }
  | { type: "add"; block: Block; after?: string | null; at?: number }
  | { type: "update"; id: string; options: Partial<BlockOptions[keyof BlockOptions]> }
  | { type: "setOverride"; id: string; override: BlockOverride }
  | { type: "toggleHidden"; id: string }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "move"; id: string; to: number }
  | { type: "moveBy"; id: string; delta: number }
  | { type: "replace"; document: ReportDocument };

/** `reset` starts a fresh history: opening a saved report is not undoable, so undo can never put
 * one report's document under another report's Save. */
export type HistoryAction = ReportAction | { type: "undo" } | { type: "redo" } | { type: "reset"; document: ReportDocument };

export interface History {
  past: ReportDocument[];
  present: ReportDocument;
  future: ReportDocument[];
  /** The last change's coalescing key: a run of edits to the same text field is one undo step. */
  lastKey: string | null;
}

const MAX_HISTORY = 100;

/** An override without the keys set back to the report's, so saved JSON stays minimal. */
const clean = (override: BlockOverride): BlockOverride =>
  Object.fromEntries(Object.entries(override).filter(([, value]) => value !== undefined));

function withBlock(doc: ReportDocument, id: string, change: (block: Block) => Block): ReportDocument {
  return { ...doc, blocks: doc.blocks.map((b) => (b.id === id ? change(b) : b)) };
}

function moved(doc: ReportDocument, id: string, to: number): ReportDocument {
  const from = doc.blocks.findIndex((b) => b.id === id);
  const target = Math.max(0, Math.min(doc.blocks.length - 1, to));
  if (from < 0 || from === target) return doc;
  const rest = doc.blocks.filter((b) => b.id !== id);
  return { ...doc, blocks: [...rest.slice(0, target), doc.blocks[from], ...rest.slice(target)] };
}

function inserted(blocks: Block[], block: Block, after: string | null | undefined): Block[] {
  const at = after ? blocks.findIndex((b) => b.id === after) : -1;
  return at < 0 ? [...blocks, block] : [...blocks.slice(0, at + 1), block, ...blocks.slice(at + 1)];
}

export function reportReducer(doc: ReportDocument, action: ReportAction): ReportDocument {
  switch (action.type) {
    case "setTitle": return { ...doc, title: action.title };
    case "setVariables": return { ...doc, variables: action.variables };
    case "setPage": return { ...doc, page: action.page };
    case "add": return action.at === undefined
      ? { ...doc, blocks: inserted(doc.blocks, action.block, action.after) }
      : { ...doc, blocks: [...doc.blocks.slice(0, action.at), action.block, ...doc.blocks.slice(action.at)] };
    case "update": return withBlock(doc, action.id, (b) => ({ ...b, options: { ...b.options, ...action.options } }) as Block);
    case "setOverride": return withBlock(doc, action.id, (b) => ({ ...b, override: clean(action.override) }));
    case "toggleHidden": return withBlock(doc, action.id, (b) => ({ ...b, hidden: !b.hidden }));
    case "remove": return { ...doc, blocks: doc.blocks.filter((b) => b.id !== action.id) };
    case "duplicate": {
      const source = doc.blocks.find((b) => b.id === action.id);
      return source ? { ...doc, blocks: inserted(doc.blocks, structuredClone({ ...source, id: action.newId }), source.id) } : doc;
    }
    case "move": return moved(doc, action.id, action.to);
    case "moveBy": {
      const from = doc.blocks.findIndex((b) => b.id === action.id);
      const to = from + action.delta;
      return from < 0 || to < 0 || to >= doc.blocks.length ? doc : moved(doc, action.id, to);
    }
    case "replace": return action.document;
  }
}

/** Typing into a title or a text block coalesces; everything else is its own step. */
function coalesceKey(action: ReportAction): string | null {
  if (action.type === "setTitle") return "title";
  if (action.type === "update" && "text" in action.options) return `text:${action.id}`;
  if (action.type === "update" && "subtitle" in action.options) return `subtitle:${action.id}`;
  return null;
}

export const initialHistory = (present: ReportDocument): History => ({ past: [], present, future: [], lastKey: null });

export function historyReducer(history: History, action: HistoryAction): History {
  if (action.type === "reset") return initialHistory(action.document);
  if (action.type === "undo") {
    const previous = history.past.at(-1);
    return previous ? { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future], lastKey: null } : history;
  }
  if (action.type === "redo") {
    const [next, ...rest] = history.future;
    return next ? { past: [...history.past, history.present], present: next, future: rest, lastKey: null } : history;
  }
  const present = reportReducer(history.present, action);
  // Unchanged values (the same title again, an id that is gone) add no step and keep redo.
  if (present === history.present || JSON.stringify(present) === JSON.stringify(history.present)) return history;
  const key = coalesceKey(action);
  if (key !== null && key === history.lastKey) return { ...history, present, future: [] };
  return { past: [...history.past, history.present].slice(-MAX_HISTORY), present, future: [], lastKey: key };
}
