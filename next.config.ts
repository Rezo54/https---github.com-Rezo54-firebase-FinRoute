// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'placehold.co', pathname: '/**' }],
  },
  // ✅ Next 15: use top-level serverExternalPackages (not under experimental)
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
