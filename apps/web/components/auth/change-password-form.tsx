'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword } = useAuth();

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
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
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
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Change Password</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Password changed successfully!
          <div className="mt-3 space-y-2">
            <div>
              <a
                href="/protected"
                className="text-green-800 hover:text-green-900 font-medium underline"
              >
                Return to Dashboard
              </a>
            </div>
            <div>
              <a
                href="/login"
                className="text-green-800 hover:text-green-900 font-medium underline"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-900 mb-1"
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
        <p className="text-sm text-gray-700 mt-1">
          Must be at least 8 characters with uppercase, lowercase, number, and
          special character
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-900 mb-1"
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
        {isSubmitting ? 'Changing Password...' : 'Change Password'}
      </button>

      <div className="text-center mt-4">
        <a
          href="/protected"
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Back to Dashboard
        </a>
      </div>
    </form>
  );
}
