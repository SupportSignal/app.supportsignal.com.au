/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  transpilePackages: ['@repo/ui'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
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
