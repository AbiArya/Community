import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // CloudFront CDN for user photos
        protocol: "https",
        hostname: "d2rld0uk0j0fpj.cloudfront.net",
        pathname: "/photos/**",
      },
      {
        // Allow any CloudFront domain (for flexibility with multiple environments)
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/photos/**",
      },
      {
        // Placeholder images for test/seed data
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
