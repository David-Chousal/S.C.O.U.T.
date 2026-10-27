import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles";

// Tideline's typefaces (analytics/telemetry/site/static/fonts, OFL): DM Sans for words and
// readouts, JetBrains Mono for tags, codes and every measured value.
const sans = localFont({
  src: [{ path: "./fonts/dmsans-latin.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-sans-face",
  display: "swap",
});

const mono = localFont({
  src: [{ path: "./fonts/jetbrainsmono-latin.woff2", weight: "400 600", style: "normal" }],
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "S.C.O.U.T. Console", template: "%s · S.C.O.U.T. Console" },
  description: "The S.C.O.U.T. team console: fleet settings, shore stations and the team.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
