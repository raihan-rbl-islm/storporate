import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "drizzle-orm"],
};

export default nextConfig;
