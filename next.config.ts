import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // Prevent Next from inferring the monorepo root from other lockfiles.
    root: __dirname,
  },
};

export default nextConfig;
