import type { NextConfig } from "next";
import path from "node:path";

// A static export (ADR-0012, SCO-238): `next build` writes HTML/CSS/JS to out/, which the console
// Worker serves as static assets. Every live value comes from the Worker's JSON API at runtime,
// so nothing here may need a Node server: no server actions, cookies, rewrites or headers.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // A package-lock.json above the repo would otherwise be taken as the workspace root.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
