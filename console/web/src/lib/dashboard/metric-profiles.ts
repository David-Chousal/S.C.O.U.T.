// How each measured column is drawn, quality-checked and read. The QC limits follow IOOS QARTOD's
// real-time tests (gross range, spike, rate of change, flat line): a value outside what the sensor
// can report fails; one outside what this site should see is suspect. Sensor limits come from the
// parts and the packet's integer ranges (shore/scout_shore/packet.py); the "expected" ranges and
// spike sizes are first-pass settings for a tropical reef, to be tuned on real data.

export type MetricForm = "line" | "bars" | "diverging";

export interface Reference { value: number; label: string }

export interface MetricProfile {
  /** A shorter name for the tile, where its group heading already says the rest. */
  title?: string;
  /** line: a continuous quantity. bars: a count per recording. diverging: signed about a midpoint. */
  form: MetricForm;
  /** QARTOD gross range, sensor limits: outside is Fail. */
  sensor: [number, number];
  /** QARTOD gross range, site limits: outside is Suspect. */
  expected?: [number, number];
  /** QARTOD spike: a point this far from its neighbours' mean is Suspect. */
  spike?: number;
  /** QARTOD flat line: `count` readings in a row within `eps` of each other is Suspect (a stuck sensor). */
  flat?: { eps: number; count: number };
  /** Acoustic: a reading whose recording clipped heavily is Suspect (QARTOD's multi-variate idea). */
  clipAware?: boolean;
  /** Fixed lines worth reading the values against. */
  references?: Reference[];
  /** One line on how a scientist reads this metric. */
  read: string;
}

const ACOUSTIC_LEVEL: MetricProfile = {
  form: "line", sensor: [-32767, 32766], spike: 1500, flat: { eps: 0, count: 6 }, clipAware: true,
  read: "Band level in centi-decibels (100 cdB = 1 dB) relative to full scale; read the bands together, and their daily cycle in the diel view.",
};

export const METRIC_PROFILES: Record<string, MetricProfile> = {
  temp_c: {
    form: "line", sensor: [-55, 125], expected: [15, 35], spike: 1, flat: { eps: 0.001, count: 6 },
    read: "Read the daily cycle (diel view) and the trend; for coral, against the site's MMM and MMM + 1 °C (Heat stress bay).",
  },
  turbidity_fau: {
    form: "line", sensor: [0, 4000], spike: 50,
    read: "Turbidity is skewed: short spikes after storms or resuspension are normal, so read the median and IQR rather than the mean.",
  },
  turbidity_v: {
    title: "Turbidity", form: "line", sensor: [0, 3.3], expected: [0.05, 3.25], spike: 0.3, flat: { eps: 0.0005, count: 6 },
    read: "Raw sensor volts until turbidity is calibrated to FAU. A value pinned at either rail is suspect; a slow drift can be biofouling.",
  },
  turbidity_adc: {
    form: "line", sensor: [0, 4095], expected: [16, 4079], spike: 400, flat: { eps: 0, count: 6 },
    read: "Raw 12-bit counts behind the turbidity volts; useful only for checking the ADC.",
  },
  battery_v: {
    form: "line", sensor: [0, 5.5], expected: [3.1, 4.3], spike: 0.2,
    references: [{ value: 3.2, label: "Conserve 3.2 V (default)" }, { value: 3.1, label: "Critical 3.1 V (default)" }],
    read: "Read the slope, not the wiggle: primary cells hold flat and then fall fast, and cold water lowers the voltage for a while.",
  },
  internal_temp_c: {
    title: "Housing temp.", form: "line", sensor: [-40, 125], expected: [0, 45], spike: 3,
    read: "Housing air temperature; it should follow the water with a lag. A housing much warmer than the water means heat inside.",
  },
  internal_humidity_pct: {
    form: "line", sensor: [0, 100], expected: [0, 70], spike: 10,
    references: [{ value: 70, label: "Humidity alert 70 % (default)" }],
    read: "A steady rise is the first sign of a leak, well before water reaches the boards.",
  },
  lvl_broad_cdb: { ...ACOUSTIC_LEVEL, title: "Broadband level" },
  lvl_bio_cdb: { ...ACOUSTIC_LEVEL, title: "Biological band", read: "Biophony band (fish, invertebrates). Reefs are louder at dawn and dusk; read it in the diel view." },
  lvl_anthro_cdb: { ...ACOUSTIC_LEVEL, title: "Human band", read: "Anthrophony band (boats, engines). Peaks track human activity, often by day." },
  lvl_mixed_cdb: { ...ACOUSTIC_LEVEL, title: "Mixed band" },
  ndsi_e4: {
    title: "NDSI", form: "diverging", sensor: [-10000, 10000], spike: 5000, clipAware: true,
    references: [{ value: 0, label: "Balanced" }],
    read: "NDSI runs from −1 (all human noise) to +1 (all biological sound), stored ×10⁻⁴. Read it with the band levels, not alone.",
  },
  snap_count: {
    title: "Shrimp snaps", form: "bars", sensor: [0, 65534], clipAware: true,
    read: "Snapping-shrimp snaps per recording: a count, so each recording is a bar. Snapping is a sign of an active reef.",
  },
  clip_count: {
    form: "bars", sensor: [0, 65534], expected: [0, 100],
    read: "Samples that hit full scale. Over 100 (about 0.01 % of a 60 s recording) biases that recording's band levels and NDSI, so those are marked suspect.",
  },
};

export const profileFor = (column: string): MetricProfile => METRIC_PROFILES[column] ?? { form: "line", sensor: [-Infinity, Infinity], read: "" };
