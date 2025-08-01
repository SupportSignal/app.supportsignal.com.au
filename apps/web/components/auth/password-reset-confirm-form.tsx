'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';

interface PasswordResetConfirmFormProps {
  token: string;
}

export function PasswordResetConfirmForm({
  token,
}: PasswordResetConfirmFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const { resetPassword } = useAuth();
  const router = useRouter();

  // Auto-redirect after successful password reset
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      router.push(
        '/login?message=Password reset successful. Please log in with your new password.'
      );
    }
  }, [success, redirectCountdown, router]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setError(passwordValidation);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        setSuccess(true);
        setRedirectCountdown(3); // Start 3-second countdown
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Set New Password
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Password reset successful!
          </div>
          <p className="mt-2">
            {redirectCountdown > 0 ? (
              <>Redirecting to login page in {redirectCountdown} seconds...</>
            ) : (
              <>Redirecting now...</>
            )}
          </p>
          <div className="mt-2">
            <a
              href="/login"
              className="text-green-800 hover:text-green-900 font-medium"
            >
              Click here if not redirected automatically
            </a>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
        <p className="text-sm text-gray-600 mt-1">
          Must be at least 8 characters with uppercase, lowercase, number, and
          special character
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}
