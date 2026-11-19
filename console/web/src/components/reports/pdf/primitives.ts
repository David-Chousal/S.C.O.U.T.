// The react-pdf pieces the PDF renderers draw with, in one place so the screen-versus-PDF text
// test can stand them in with plain elements. Only loaded through Download PDF's dynamic import.
export { Document, Page, View, Text, Svg, G, Line, Path, Rect, Circle, Image, Font } from "@react-pdf/renderer";
