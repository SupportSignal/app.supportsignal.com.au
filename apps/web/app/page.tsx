'use client';

import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '../components/auth/auth-provider';
import { LogoutButton } from '../components/auth/logout-button';
import Link from 'next/link';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { Menu, User, Settings, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const testMessage = useQuery(api.queries.getTestMessage);
  const testMessages = useQuery(api.queries.getTestMessages);
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <Menu className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Starter App
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              {user && (
                <>
                  <Link
                    href="/chat"
                    className="flex items-center text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/protected"
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Protected
                  </Link>
                  <Link
                    href="/debug-logs"
                    className="flex items-center text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Debug
                  </Link>
                </>
              )}
              <Link
                href="/showcase"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Components
              </Link>
              <Link
                href="/wizard-demo"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Wizard Demo
              </Link>
              <Link
                href="/dev"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dev
              </Link>
            </div>

            {/* Right side - Auth & Theme */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                  </div>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Welcome - Auto Deploy Test
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
              to the Agentic Starter Template
            </p>

            {/* Welcome Message */}
            {user && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <p className="text-green-600 dark:text-green-400 text-lg">
                  👋 Welcome back, {user.name}!
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  Use the navigation menu above to explore the app.
                </p>
              </div>
            )}
            <div className="pt-8 space-y-4">
              <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors">
                🚀 Next.js App Router + TypeScript + Tailwind CSS
              </div>

              {/* Convex Connection Test */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📡 Convex Connection Test
                </h3>

                {testMessage === undefined ? (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Loading...
                  </p>
                ) : testMessage === null ? (
                  <p className="text-red-600 dark:text-red-400">
                    Connection failed
                  </p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-green-600 dark:text-green-400">
                      ✅ Connected!
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Message: {testMessage.message}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Status: {testMessage.status}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Messages in DB: {testMessages?.length || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
