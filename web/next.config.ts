import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "cdn.image.buzzni.com",
      },
      {
        protocol: "https",
        hostname: "image.hmall.com",
      },
      {
        protocol: "https",
        hostname: "img.publichs.com",
      },
      {
        protocol: "https",
        hostname: "image2.lotteimall.com",
      },
    ],
  },
};

export default nextConfig;
