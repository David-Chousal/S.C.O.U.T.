// Merge fields for Title and Text blocks: {title}, {buoys}, {from}, {to}, {period}, {zone}, {made}.

export const MERGE_FIELDS = ["title", "buoys", "from", "to", "period", "zone", "made"] as const;
export type MergeField = (typeof MERGE_FIELDS)[number];
export type MergeValues = Record<MergeField, string>;

export const FIELD_HELP: Record<MergeField, string> = {
  title: "Report title", buoys: "Buoy names", from: "First day", to: "Last day",
  period: "First to last day", zone: "Time zone", made: "When the report was made",
};

/** Replaces each known {field} with its value; anything else in braces is left as typed. */
export function fillFields(text: string, values: MergeValues): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => ((MERGE_FIELDS as readonly string[]).includes(name) ? values[name as MergeField] : whole));
}
