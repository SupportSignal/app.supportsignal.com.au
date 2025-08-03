/** @type {import('next').NextConfig} */
const nextConfig = {
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
    CLAUDE_LOGGING_ENABLED: String(
      process.env.NODE_ENV === 'development' &&
        process.env.CLAUDE_LOGGING !== 'false'
    ),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_LOG_WORKER_URL: process.env.NEXT_PUBLIC_LOG_WORKER_URL,
  },
  // Add logging status to build info
  generateBuildId: async () => {
    const buildId = `build_${Date.now()}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Build ID: ${buildId}, Claude Logging: ${process.env.CLAUDE_LOGGING !== 'false'}`
      );
    }
    return buildId;
  },
};

module.exports = nextConfig;
