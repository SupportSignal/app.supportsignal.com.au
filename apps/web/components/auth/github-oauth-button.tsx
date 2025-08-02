'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';

interface GitHubOAuthButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function GitHubOAuthButton({
  className = '',
  variant = 'secondary',
}: GitHubOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getGitHubOAuthUrl } = useAuth();
  
  // Check if we're in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getGitHubOAuthUrl();

      if (result.success && result.url) {
        // Store state for verification
        if (result.state && typeof window !== 'undefined') {
          sessionStorage.setItem('github_oauth_state', result.state);
        }

        // Redirect to GitHub OAuth
        window.location.href = result.url;
      } else {
        setError(result.error || 'Failed to initialize GitHub login');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const baseClasses =
    'flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  const variantClasses =
    variant === 'primary'
      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
      : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-gray-500';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses} ${className} w-full`}
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
            clipRule="evenodd"
          />
        </svg>
        {isLoading ? 'Connecting...' : 'Continue with GitHub'}
      </button>

      {isDevelopment && (
        <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-2 rounded-md">
          <strong>Development Notice:</strong> GitHub OAuth is configured for production only. Use Google OAuth or email/password for local testing.
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
