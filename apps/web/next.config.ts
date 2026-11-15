import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.3",
    "192.168.1.3:3000",
    "192.168.1.3:3001",
    "localhost",
    "localhost:3000",
    "localhost:3001",
  ],
};

export default createNextIntlPlugin()(nextConfig);
