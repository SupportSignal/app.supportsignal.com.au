'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';
import { EmbeddedAuth } from '@/components/auth/embedded-auth';
import { NAVIGATION_CONFIG } from '@/lib/navigation/navigation-config';
import { Button } from '@starter/ui/button';
import { 
  Shield, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  // If user is signed in, show direct access to app functions
  if (user) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-900">
        {/* Welcome Header for Signed-In Users */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 capitalize">
                  {user.role?.replace('_', ' ')} Access
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Link href="/dashboard">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/new-incident">
                    <Shield className="w-5 h-5 mr-2" />
                    Report Incident
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Action Cards */}
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Your workspace tools:
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/new-incident" className="group">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
                  <Shield className="w-8 h-8 text-teal-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Report Incident</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quick incident entry and tracking
                  </p>
                  <ArrowRight className="w-4 h-4 text-teal-600 mt-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link href="/dashboard" className="group">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
                  <BarChart3 className="w-8 h-8 text-teal-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Dashboard</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analytics and insights overview
                  </p>
                  <ArrowRight className="w-4 h-4 text-teal-600 mt-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link href="/users" className="group">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
                  <Users className="w-8 h-8 text-teal-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Manage Team</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    User management and permissions
                  </p>
                  <ArrowRight className="w-4 h-4 text-teal-600 mt-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is signed out, show auth-first minimal + feature gateway
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Auth-First Section Above the Fold */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome to Your NDIS Intelligence Platform
              </h1>
            </div>
            
            {/* Embedded Auth Form */}
            <EmbeddedAuth />
            
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium">New to SupportSignal?</p>
              <p>→ Quick 2-minute setup</p>
              <p>→ No credit card required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Gateway Section Below the Fold */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-8">
            What you can do once signed in:
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Shield className="w-8 h-8 text-teal-600 mb-4" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                🚨 Report an Incident
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Quick incident entry and tracking with AI-guided assistance
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/login">
                  Sign in to start →
                </Link>
              </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <BarChart3 className="w-8 h-8 text-teal-600 mb-4" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                📊 View Dashboard
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Analytics and insights overview with real-time monitoring
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/login">
                  Sign in to access →
                </Link>
              </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Users className="w-8 h-8 text-teal-600 mb-4" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                👥 Manage Team
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                User management and role-based permissions setup
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/login">
                  Sign in to manage →
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ready to get started?
            </p>
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Link href="/register">
                Create Your Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
