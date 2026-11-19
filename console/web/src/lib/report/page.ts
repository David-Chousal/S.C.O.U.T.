// Paper sizes for the report preview, Print and the PDF. The preview lays pages out in CSS
// pixels (96 per inch); the PDF uses points (72 per inch), so 1 px = 0.75 pt everywhere.

export interface PageSetup { size: "letter" | "a4"; orientation: "portrait" | "landscape" }

export const DEFAULT_PAGE: PageSetup = { size: "letter", orientation: "portrait" };

/** Portrait width and height in CSS pixels. */
const PAPER_PX: Record<PageSetup["size"], [number, number]> = { letter: [816, 1056], a4: [794, 1123] };
/** Half an inch on every side. */
export const PAGE_MARGIN_PX = 48;
/** Room at the foot of each page for the page number. */
export const PAGE_FOOTER_PX = 24;
export const PT_PER_PX = 0.75;

export interface PageBox { width: number; height: number; contentWidth: number; contentHeight: number }

export function pageBox(page: PageSetup): PageBox {
  const [w, h] = PAPER_PX[page.size];
  const [width, height] = page.orientation === "portrait" ? [w, h] : [h, w];
  return { width, height, contentWidth: width - 2 * PAGE_MARGIN_PX, contentHeight: height - 2 * PAGE_MARGIN_PX - PAGE_FOOTER_PX };
}

/** The CSS @page size keyword for Print. */
export const cssPageSize = (page: PageSetup) => `${page.size === "a4" ? "A4" : "letter"} ${page.orientation}`;
