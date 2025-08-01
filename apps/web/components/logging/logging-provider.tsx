/* eslint-disable no-console, no-restricted-syntax */
'use client';

import React, { useEffect } from 'react';
import {
  initializeConsoleOverride,
  ConsoleLogger,
} from '../../lib/console-override';
import { LoggingStatus } from './logging-status';

const isDevelopment = process.env.NODE_ENV === 'development';

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set the logging flag on window for the console override to check
    if (typeof window !== 'undefined') {
      window.CLAUDE_LOGGING_ENABLED = isDevelopment ? 'true' : 'false';
      // Make ConsoleLogger globally available for debugging
      (window as any).ConsoleLogger = ConsoleLogger;
    }

    // Initialize console override for development
    if (isDevelopment) {
      initializeConsoleOverride();

      // Set user context if available from localStorage
      const userId = localStorage.getItem('userId');
      if (userId) {
        ConsoleLogger.setUserId(userId);
      }

      // Log initialization status
      console.log(
        'Claude logging provider initialized:',
        ConsoleLogger.getStatus()
      );
    }
  }, []);

  return (
    <>
      {children}
      <LoggingStatus />
    </>
  );
}
