import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer AVIF (≈30% smaller than WebP at equal quality), fall back to WebP.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // The studio routes read files by a runtime path, so file tracing
  // pulled the whole repo (public/ is ~250 MB of video) into its function
  // and Vercel rejected it for going over the 250 MB function limit.
  // It never needs those files at runtime.
  outputFileTracingExcludes: {
    "/api/studio/local-files": ["./public/**/*", "./assets/**/*"],
    "/api/studio/stream": ["./public/**/*", "./assets/**/*"],
  },
  // Friendly public URL: /books is the shareable entry point for the
  // move-better ebook catalog, which lives at /ebooks (keeps the existing
  // download routes and dashboard share links intact).
  async redirects() {
    return [
      {
        source: "/books",
        destination: "/ebooks",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
