import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)", // apply to all routes
        headers: [
          {
            key: "X-Frame-Options", // Prevent clickjacking
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options", // Prevent MIME sniffing
            value: "nosniff",
          },
          {
            key: "Referrer-Policy", // limiting info referrer
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
