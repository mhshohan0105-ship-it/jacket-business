import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WASM from disk, so it must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The dev badge otherwise sits on top of the phone tab bar.
  devIndicators: false,
};

export default nextConfig;
