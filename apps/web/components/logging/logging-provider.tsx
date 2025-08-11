/* eslint-disable no-console, no-restricted-syntax */
'use client';

import React, { useEffect } from 'react';
import {
  initializeConsoleOverride,
  ConsoleLogger,
} from '../../lib/console-override';
import { LoggingStatus } from './logging-status';
import { useAuth } from '../auth/auth-provider';

const isDevelopment = process.env.NODE_ENV === 'development';

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Initialize console override on mount
  useEffect(() => {
    // Only enable logging in development environment
    if (typeof window !== 'undefined' && isDevelopment) {
      window.CLAUDE_LOGGING_ENABLED = 'true'; // Enable for development debugging
      // Make ConsoleLogger globally available for debugging
      (window as any).ConsoleLogger = ConsoleLogger;

      // Initialize console override
      initializeConsoleOverride();

      // Log initialization status
      // eslint-disable-next-line no-console
      console.log(
        'Claude logging provider initialized:',
        ConsoleLogger.getStatus()
      );
    }
  }, []);

  // Update user ID when authentication state changes
  useEffect(() => {
    if (isDevelopment && !isLoading) {
      if (user?.email) {
        // Use email as user ID for better debugging (more readable than database ID)
        ConsoleLogger.setUserId(user.email);
        // eslint-disable-next-line no-console
        console.log(`Claude logging user context updated: ${user.email}`);
      } else {
        // Reset to anonymous when logged out
        ConsoleLogger.setUserId('anonymous');
        // eslint-disable-next-line no-console
        console.log('Claude logging user context reset to anonymous');
      }
    }
  }, [user, isLoading]);

  return (
    <>
      {children}
      <LoggingStatus />
    </>
  );
}
