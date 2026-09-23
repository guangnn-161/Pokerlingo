import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["@pokerlingo/contracts", "@pokerlingo/db"],
  experimental: { serverActions: { bodySizeLimit: "1mb" } }
};
export default nextConfig;