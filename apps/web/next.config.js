/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  transpilePackages: ['@repo/ui'],
  
  // Webpack configuration for shared package resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/shared': require('path').resolve(__dirname, '../../packages/shared'),
    };
    return config;
  },
  eslint: {
    // TEMPORARY: Ignore lint during builds until technical debt cleanup (see docs/lessons-learned/eslint-technical-debt-275-errors.md)
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Suppress hydration warnings in development for better DX
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // output: 'export', // Removed - prevents dynamic routes. @cloudflare/next-on-pages supports SSR
  env: {
    // Computed variables that need to be evaluated at build time
    CLAUDE_LOGGING_ENABLED: String(
      process.env.NODE_ENV === 'development' &&
        process.env.CLAUDE_LOGGING !== 'false'
    ),
    // NEXT_PUBLIC_* variables are automatically handled by Next.js
    // No need to explicitly define them here
  },
  // Add logging status to build info
  generateBuildId: async () => {
    const buildId = `build_${Date.now()}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Build ID: ${buildId}, Claude Logging: ${process.env.CLAUDE_LOGGING !== 'false'}`
      );
      console.log('🔧 Environment Variables:');
      console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
      console.log(`  NEXT_PUBLIC_CONVEX_URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`);
      console.log(`  NEXT_PUBLIC_LOG_WORKER_URL: ${process.env.NEXT_PUBLIC_LOG_WORKER_URL}`);
    }
    return buildId;
  },
};

module.exports = nextConfig;
