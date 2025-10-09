'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';

function GitHubCallbackContent() {
  const { githubOAuthLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions in React Strict Mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for OAuth errors
      if (error) {
        setError(`GitHub OAuth error: ${error}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError('Authorization code not received from GitHub');
        setIsProcessing(false);
        return;
      }

      // Verify state parameter (optional but recommended)
      if (state && typeof window !== 'undefined') {
        const storedState = sessionStorage.getItem('github_oauth_state');
        if (storedState && storedState !== state) {
          setError('Invalid state parameter - possible CSRF attack');
          setIsProcessing(false);
          return;
        }
        // Clean up stored state regardless
        sessionStorage.removeItem('github_oauth_state');
      }

      try {
        const result = await githubOAuthLogin(code, state || undefined);

        if (result.success) {
          // Redirect to protected page on success
          router.push('/protected');
        } else {
          setError(result.error || 'GitHub login failed');
          setIsProcessing(false);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, githubOAuthLogin, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Completing GitHub login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            GitHub Login Error
          </h2>
          <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-700 dark:text-red-300">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <a
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Login
            </a>
            <a
              href="/register"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Processing OAuth callback...
            </p>
          </div>
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}
