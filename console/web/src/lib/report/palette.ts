// Paper colours for report charts. The page is always printed light, so these are the light
// theme's tokens (tokens.css) as hex: react-pdf cannot read CSS variables.
import { SERIES_ORDER } from "@/components/dashboard/trace-bay";

const SERIES_HEX: Record<number, string> = { 1: "#0068a7", 2: "#c54a05", 3: "#158561", 4: "#9e497d", 5: "#3292b3" };

/** The dashboard's series order (adjacent pairs pass colour-vision checks), as paper hex. */
export const seriesHex = (index: number) => SERIES_HEX[SERIES_ORDER[index % SERIES_ORDER.length]];
export const ANNOTATION_HEX = "#c54a05";
export const GRID_HEX = "#ddd6d0";
export const AXIS_HEX = "#6f6760";
export const INK_HEX = "#2b2520";
