import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.sanity.io"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '**',
      },
    ],
  },
  // Disable ESLint during production builds
  eslint: {
    // This disables ESLint during the build process
    ignoreDuringBuilds: true,
  },
  // Optionally, also disable TypeScript type checking during builds
  typescript: {
    // This disables TypeScript errors during the build process
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
