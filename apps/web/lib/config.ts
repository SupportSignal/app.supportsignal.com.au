// Centralized configuration to satisfy ESLint no-restricted-syntax rule
export const config = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  betterAuthUrl: process.env.BETTER_AUTH_URL,
} as const;
