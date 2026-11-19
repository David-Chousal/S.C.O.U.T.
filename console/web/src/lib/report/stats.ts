import type { Reading } from "@/lib/api/types";

export interface ColumnSummary {
  column: string;
  count: number;
  min: number | null;
  mean: number | null;
  max: number | null;
}

/** Per variable: how many readings carried a number, and their min, mean and max. Blank cells
 * (not measured) and text are skipped, never counted as zero. */
export function summarize(rows: Reading[], columns: readonly string[]): ColumnSummary[] {
  return columns.map((column) => {
    const values = rows.map((row) => row[column]).filter((v) => v !== "" && v !== undefined).map(Number).filter(Number.isFinite);
    if (values.length === 0) return { column, count: 0, min: null, mean: null, max: null };
    const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
    return { column, count: values.length, min: Math.min(...values), mean, max: Math.max(...values) };
  });
}
