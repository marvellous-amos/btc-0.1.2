import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname, // specify the root directory of your project
  },
};

export default nextConfig;
