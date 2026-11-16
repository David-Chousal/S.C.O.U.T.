"use client";

import { Segmented } from "@/components/ui/segmented";
import { RANGES, type RangeId } from "@/lib/dashboard/range";
import type { BoardData } from "./bay-content";

interface RangeBarProps {
  range: RangeId;
  onChange: (range: RangeId) => void;
  loading: boolean;
  data: BoardData;
}

const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The time range every bay shows, from 24 hours to all history, with what is loaded. */
export function RangeBar({ range, onChange, loading, data }: RangeBarProps) {
  const count = Object.values(data.readings).reduce((sum, rows) => sum + rows.length, 0);
  return (
    <div className="sc-rangebar">
      <span className="sc-tag">Time range</span>
      <Segmented label="Time range" value={range} onChange={onChange} options={RANGES.map((r) => ({ value: r.id, label: r.label }))} />
      <span className="sc-help" role="status" aria-live="polite">
        {loading ? "Loading readings…" : `${count.toLocaleString("en-US")} readings, ${day(data.from)} to ${day(data.now)} (UTC)`}
        {!loading && data.truncated && " · the history is longer than one load allows, so the oldest readings are left out"}
        {" · heat stress always uses NOAA CRW's 12-week window"}
      </span>
    </div>
  );
}
