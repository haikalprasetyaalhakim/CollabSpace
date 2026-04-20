import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:
  https://lh3.googleusercontent.com
  https://ufs.sh
  https://*.ufs.sh;
  connect-src 'self' https://*.ingest.uploadthing.com https://*.uploadthing.com;
  font-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)", // apply to all routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
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
