/* eslint-disable no-restricted-syntax, no-undef */
// Centralized configuration to satisfy ESLint no-restricted-syntax rule
export const config = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  prodAppUrl: process.env.NEXT_PUBLIC_PROD_APP_URL,
  githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO,
  logWorkerUrl: process.env.NEXT_PUBLIC_LOG_WORKER_URL,
  nodeEnv: process.env.NODE_ENV,
} as const;
