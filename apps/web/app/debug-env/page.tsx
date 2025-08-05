'use client';

/* eslint-disable no-restricted-syntax, no-undef */

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'NOT SET',
    NEXT_PUBLIC_LOG_WORKER_URL:
      process.env.NEXT_PUBLIC_LOG_WORKER_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <pre className="text-sm">{JSON.stringify(envVars, null, 2)}</pre>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        This page shows NEXT_PUBLIC_* environment variables that are available
        in the browser.
      </p>
    </div>
  );
}