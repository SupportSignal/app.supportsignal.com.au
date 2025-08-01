'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { GitHubOAuthButton } from './github-oauth-button';
import { GoogleOAuthButton } from './google-oauth-button';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();

  const validateForm = () => {
    if (!name.trim()) {
      return 'Name is required';
    }

    if (!email || !email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (!password) {
      return 'Password is required';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await register(name.trim(), email, password);

      if (!result.success) {
        setError(result.error || 'Registration failed');
      }
      // If successful, the auth provider will automatically redirect
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500"
          placeholder="Enter your password (min 6 characters)"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500"
          placeholder="Confirm your password"
        />
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <GitHubOAuthButton />
          <GoogleOAuthButton />
        </div>
      </div>
    </form>
  );
}
