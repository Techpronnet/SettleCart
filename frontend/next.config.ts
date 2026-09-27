import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_API_INTERNAL_URL ||
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://13.48.219.73";

const cleanBackend = BACKEND_URL.replace(/\/+$/, "").replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  // The backend API routes end in trailing slashes (e.g. POST /api/v1/businesses/).
  // Vercel strips trailing slashes by default (308), which bounces API calls
  // through an absolute http:// backend URL: mixed-content-blocked on phones
  // and stripped of auth headers. Keep slashes so /api/* proxies through once.
  trailingSlash: true,
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

