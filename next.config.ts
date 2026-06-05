import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiUrl =
  configuredApiUrl && configuredApiUrl !== "undefined"
    ? configuredApiUrl
    : "http://localhost:5001";

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
