'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error); // eslint-disable-line no-console
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
