'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import VersionIndicator from './version-indicator';
import VersionFlashNotification from './version-flash-notification';

interface VersionProviderContextType {
  /**
   * Show the version history modal
   */
  showVersionHistory: () => void;

  /**
   * Hide the version history modal
   */
  hideVersionHistory: () => void;

  /**
   * Toggle the version history modal
   */
  toggleVersionHistory: () => void;

  /**
   * Navigate to a specific version in the history
   */
  navigateToVersion: (version: string) => void;

  /**
   * Whether the version history is currently expanded
   */
  isVersionHistoryExpanded: boolean;
}

const VersionProviderContext = createContext<VersionProviderContextType | null>(
  null
);

interface VersionProviderProps {
  children: React.ReactNode;

  /**
   * Whether to show the version indicator
   * @default true
   */
  showIndicator?: boolean;

  /**
   * Whether to show flash notifications for new versions
   * @default true
   */
  showFlashNotifications?: boolean;

  /**
   * Position of the version indicator
   * @default 'bottom-right'
   */
  indicatorPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  /**
   * Maximum number of versions to show in history
   * @default 20
   */
  maxVersions?: number;

  /**
   * Custom class name for components
   */
  className?: string;
}

export function VersionProvider({
  children,
  showIndicator = true,
  showFlashNotifications = true,
  indicatorPosition = 'bottom-right',
  maxVersions = 20,
  className = '',
}: VersionProviderProps) {
  const [isVersionHistoryExpanded, setIsVersionHistoryExpanded] =
    useState(false);
  const [, setSelectedVersion] = useState<string | null>(null);

  const showVersionHistory = useCallback(() => {
    setIsVersionHistoryExpanded(true);
  }, []);

  const hideVersionHistory = useCallback(() => {
    setIsVersionHistoryExpanded(false);
  }, []);

  const toggleVersionHistory = useCallback(() => {
    setIsVersionHistoryExpanded(prev => !prev);
  }, []);

  const navigateToVersion = useCallback((version: string) => {
    setSelectedVersion(version);
    setIsVersionHistoryExpanded(true);
  }, []);

  const handleFlashViewDetails = useCallback(
    (version: string) => {
      navigateToVersion(version);
    },
    [navigateToVersion]
  );

  const contextValue: VersionProviderContextType = {
    showVersionHistory,
    hideVersionHistory,
    toggleVersionHistory,
    navigateToVersion,
    isVersionHistoryExpanded,
  };

  return (
    <VersionProviderContext.Provider value={contextValue}>
      {children}

      {/* Version Indicator */}
      {showIndicator && (
        <VersionIndicator
          position={indicatorPosition}
          maxVersions={maxVersions}
          className={className}
        />
      )}

      {/* Flash Notification */}
      {showFlashNotifications && (
        <VersionFlashNotification
          onViewDetails={handleFlashViewDetails}
          className={className}
        />
      )}
    </VersionProviderContext.Provider>
  );
}

/**
 * Hook to use version provider context
 */
export function useVersionProvider(): VersionProviderContextType {
  const context = useContext(VersionProviderContext);

  if (!context) {
    throw new Error('useVersionProvider must be used within a VersionProvider');
  }

  return context;
}

/**
 * Hook to check if version tracking is available
 */
export function useVersionTracking(): {
  isAvailable: boolean;
  showVersionHistory: () => void;
  navigateToVersion: (version: string) => void;
} {
  const context = useContext(VersionProviderContext);

  return {
    isAvailable: context !== null,
    showVersionHistory: context?.showVersionHistory || (() => {}),
    navigateToVersion: context?.navigateToVersion || (() => {}),
  };
}

export default VersionProvider;
