'use client';

import React from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Button } from '@starter/ui/button';
import { cn } from '@/lib/utils';

interface EmbeddedAuthProps {
  className?: string;
}

export function EmbeddedAuth({ className }: EmbeddedAuthProps) {
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sign in to your account
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Access your SupportSignal dashboard
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />

      {/* Sign Up Option */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Don't have an account?
        </p>
        <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white w-full">
          <Link href="/register">
            Create Your Account
          </Link>
        </Button>
      </div>
    </div>
  );
}