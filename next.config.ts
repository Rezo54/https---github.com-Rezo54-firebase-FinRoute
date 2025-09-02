// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove output:'standalone'
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
  },
  // Helpful when bundling firebase-admin on Netlify
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;

