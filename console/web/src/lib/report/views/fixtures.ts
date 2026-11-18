// Sample console data for view-model and screen-versus-PDF tests. Imported only by tests.
import type { AlertHistoryItem, HeatStressDay, HeatStressView } from "@/lib/api/types";
import type { Remote, ViewContext } from "./types";

export const FLEET: ViewContext["fleet"] = [
  { buoy_id: 1, label: "Buoy 1", last_seen_at: Date.parse("2026-11-18T08:00:00Z"), settings_state: "confirmed", mmm_c: 27.6 },
  { buoy_id: 2, label: "Buoy 2", last_seen_at: null, settings_state: "pending", mmm_c: null },
];

const day = (i: number): HeatStressDay => ({ day: `2026-11-${String(10 + i).padStart(2, "0")}`, sst: 28 + i * 0.1, hotspot: 0.4 + i * 0.1, dhw: i * 0.3,
  alert: "Bleaching Watch", level: 1, window_coverage: 1 });

export const HEAT: Remote<HeatStressView> = {
  status: "ready",
  data: {
    window_days: 84, alert_levels: ["No Stress", "Bleaching Watch"] as HeatStressView["alert_levels"], generated_at: "2026-11-18T06:00:00Z",
    buoys: [
      { buoy_id: 1, label: "Buoy 1", threshold_c: 28.6, current: { ...day(8), days_old: 0 }, series: Array.from({ length: 9 }, (_, i) => day(i)),
        mmm: { value_c: 27.6, source: "noaa_crw_5km", latitude: 21.4, longitude: -157.8, cell_latitude: 21.425, cell_longitude: -157.775, set_by: "admin", set_at: 1 },
        summary: { peak_dhw: 2.4, peak_dhw_day: "2026-11-18", peak_alert: "Bleaching Watch", days: 9, days_at_or_above_threshold: 3 }, note: null },
      { buoy_id: 2, label: "Buoy 2", threshold_c: null, current: null, series: [], mmm: null, summary: null, note: "No MMM yet." },
    ],
  },
};

export const ALERTS: Remote<AlertHistoryItem[]> = {
  status: "ready",
  data: [
    { id: 1, rule_id: "r1", buoy_id: 1, at: Date.parse("2026-11-15T03:00:00Z"), kind: "alert", summary: "Water temperature above 29 °C", status: "sent", reason: null },
    { id: 2, rule_id: null, buoy_id: null, at: Date.parse("2026-11-16T03:00:00Z"), kind: "test", summary: "Test email", status: "sent", reason: null },
  ],
};
