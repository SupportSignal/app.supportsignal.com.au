'use client';

import { useAuth } from '../../components/auth/auth-provider';
import { LogoutButton } from '../../components/auth/logout-button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ProtectedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Home Navigation */}
        <div className="text-left mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <span className="mr-1">←</span>
            Back to Home
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Protected Content
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                This page is only accessible to authenticated users.
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              User Information
            </h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.role}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member Since
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user._creationTime
                    ? new Date(user._creationTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Recently'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-gray-600 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Available Features
            </h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      AI Chat Assistant
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask questions about this project and get AI-powered answers
                    </p>
                  </div>
                  <Link
                    href="/chat"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Open Chat
                  </Link>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Password Security
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <a
                    href="/change-password"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Change Password
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-gray-600 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Authentication Status
            </h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Successfully Authenticated
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Session-based authentication with Convex backend</li>
                      <li>Real-time user state management</li>
                      <li>Secure token storage and validation</li>
                      <li>Protected route access control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}