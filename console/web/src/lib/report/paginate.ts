// Flows measured blocks onto pages (docs/engineering/console-report-builder-plan.md, "How the
// preview stays live"). Pure, so the preview, Print and the PDF all use one set of page breaks.

/** One piece of a block that flows on its own: a buoy's table, a chart, a paragraph. */
export interface MeasuredUnit {
  height: number;
  /** A table that may split by rows: its heading and column header, then each row. */
  split?: { head: number; rows: number[] };
}

export interface MeasuredBlock { id: string; pageBreak: boolean; units: MeasuredUnit[] }

/** A unit on a page; `rows` is the slice [start, end) when a table split. */
export interface Fragment { blockId: string; unit: number; rows?: [number, number] }
export type Page = Fragment[];

export interface Gaps { block: number; unit: number }

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** How many rows from `start` fit in `room` under the repeated header. */
function rowsThatFit(split: NonNullable<MeasuredUnit["split"]>, start: number, room: number): number {
  let used = split.head;
  let end = start;
  while (end < split.rows.length && used + split.rows[end] <= room) used += split.rows[end++];
  return end - start;
}

export function paginate(blocks: MeasuredBlock[], pageHeight: number, gaps: Gaps): Page[] {
  const pages: Page[] = [[]];
  let used = 0;
  const newPage = () => { if (pages[pages.length - 1].length > 0) pages.push([]); used = 0; };
  const place = (fragment: Fragment, height: number, gap: number) => {
    pages[pages.length - 1].push(fragment);
    used += (used > 0 ? gap : 0) + height;
  };

  for (const block of blocks) {
    if (block.pageBreak) { newPage(); continue; }
    block.units.forEach((unit, index) => {
      const gap = index === 0 ? gaps.block : gaps.unit;
      const room = () => pageHeight - used - (used > 0 ? gap : 0);
      if (unit.height <= room()) return place({ blockId: block.id, unit: index }, unit.height, gap);
      if (!unit.split) {
        newPage();
        return place({ blockId: block.id, unit: index }, unit.height, gap);
      }
      splitTable(block.id, index, unit.split, { room, newPage, place: (f, h) => place(f, h, gap), pageHeight });
    });
  }
  // A page break at the very end opens nothing after it.
  return pages.length > 1 && pages[pages.length - 1].length === 0 ? pages.slice(0, -1) : pages;
}

interface Flow { room: () => number; newPage: () => void; place: (fragment: Fragment, height: number) => void; pageHeight: number }

function splitTable(blockId: string, unit: number, split: NonNullable<MeasuredUnit["split"]>, flow: Flow) {
  let start = 0;
  if (rowsThatFit(split, 0, flow.room()) === 0) flow.newPage();
  while (start < split.rows.length) {
    const count = Math.max(1, rowsThatFit(split, start, flow.room()));
    const end = start + count;
    const whole = start === 0 && end === split.rows.length;
    flow.place(whole ? { blockId, unit } : { blockId, unit, rows: [start, end] }, split.head + sum(split.rows.slice(start, end)));
    start = end;
    if (start < split.rows.length) flow.newPage();
  }
}
