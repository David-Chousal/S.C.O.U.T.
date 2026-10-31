// What each reading column is called on screen, and its unit (docs/engineering/data-schema.md).

export const VARIABLES: Record<string, { label: string; unit: string }> = {
  temp_c: { label: "Water temperature", unit: "°C" },
  turbidity_fau: { label: "Turbidity", unit: "FAU" },
  turbidity_v: { label: "Turbidity sensor", unit: "V" },
  turbidity_adc: { label: "Turbidity ADC", unit: "counts" },
  battery_v: { label: "Battery", unit: "V" },
  internal_temp_c: { label: "Housing temperature", unit: "°C" },
  internal_humidity_pct: { label: "Housing humidity", unit: "%" },
  lvl_anthro_cdb: { label: "Sound level, human band", unit: "cdB" },
  lvl_mixed_cdb: { label: "Sound level, mixed band", unit: "cdB" },
  lvl_bio_cdb: { label: "Sound level, biological band", unit: "cdB" },
  lvl_broad_cdb: { label: "Sound level, broadband", unit: "cdB" },
  ndsi_e4: { label: "Soundscape index (NDSI)", unit: "×10⁻⁴" },
  snap_count: { label: "Snapping-shrimp snaps", unit: "count" },
  clip_count: { label: "Clipped samples", unit: "count" },
  flags: { label: "Flags", unit: "" },
  soh: { label: "State of health", unit: "" },
  tx_count: { label: "Transmits a day", unit: "" },
  uptime_s: { label: "Uptime", unit: "s" },
  audio_file: { label: "Audio file", unit: "" },
  fw_version: { label: "Firmware", unit: "" },
  schema_version: { label: "Schema version", unit: "" },
};

export const variableLabel = (column: string): string => VARIABLES[column]?.label ?? column;
