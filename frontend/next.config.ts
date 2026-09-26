import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_API_INTERNAL_URL ||
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://13.48.219.73";

const cleanBackend = BACKEND_URL.replace(/\/+$/, "").replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBackend}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${cleanBackend}/health`,
      },
    ];
  },
};

export default nextConfig;

