import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://13.57.40.22:5050/api/:path*",
      },
    ];
  },
};

export default nextConfig;
