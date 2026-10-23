import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
