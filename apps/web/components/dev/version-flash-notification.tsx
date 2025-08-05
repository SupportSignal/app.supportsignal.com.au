'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, X, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button, Badge } from '@starter/ui';
import {
  checkForNewVersion,
  markFlashNotificationShown,
  markVersionAsSeen,
} from '@/lib/version-storage';
import {
  fetchVersionManifest,
  formatRelativeTime,
  extractCommitType,
  truncateCommitMessage,
  getVersionIncrementType,
} from '@/lib/version-utils';

interface VersionFlashNotificationProps {
  /**
   * Whether to auto-hide the notification after a delay
   * @default true
   */
  autoHide?: boolean;

  /**
   * Auto-hide delay in milliseconds
   * @default 8000
   */
  autoHideDelay?: number;

  /**
   * Custom class name for styling
   */
  className?: string;

  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void;

  /**
   * Callback when "View Details" is clicked
   */
  onViewDetails?: (version: string) => void;
}

export function VersionFlashNotification({
  autoHide = true,
  autoHideDelay = 8000,
  className = '',
  onDismiss,
  onViewDetails,
}: VersionFlashNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{
    currentVersion: string;
    previousVersion: string;
    timestamp: number;
    description: string;
    commitUrl: string;
    incrementType?: 'major' | 'minor' | 'patch' | 'unknown';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkForNewVersions = async () => {
      try {
        setIsLoading(true);

        // Fetch current version manifest
        const manifestResponse = await fetchVersionManifest();
        if (!manifestResponse.success || !manifestResponse.data) {
          // eslint-disable-next-line no-console, no-undef
          console.warn(
            'Failed to fetch version manifest:',
            manifestResponse.error
          );
          return;
        }

        const { data: manifest } = manifestResponse;
        const currentVersion = manifest.current;

        // Check if there's a new version
        const versionCheck = checkForNewVersion(currentVersion);

        if (versionCheck.shouldShowFlash) {
          // Find the current version details
          const currentVersionEntry = manifest.versions.find(
            v => v.version === currentVersion
          );

          if (currentVersionEntry) {
            const incrementType = versionCheck.previousVersion
              ? getVersionIncrementType(
                  versionCheck.previousVersion,
                  currentVersion
                )
              : undefined;

            setVersionInfo({
              currentVersion: currentVersionEntry.version,
              previousVersion: versionCheck.previousVersion || 'Unknown',
              timestamp: currentVersionEntry.timestamp,
              description: currentVersionEntry.description,
              commitUrl: currentVersionEntry.commitUrl,
              incrementType,
            });

            setIsVisible(true);

            // Mark flash as shown immediately to prevent duplicate displays
            markFlashNotificationShown();

            // Set up auto-hide
            if (autoHide) {
              timeoutId = setTimeout(() => {
                handleDismiss();
              }, autoHideDelay);
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console, no-undef
        console.warn('Error checking for new version:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForNewVersions();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);

    // Mark version as seen when dismissed
    if (versionInfo) {
      markVersionAsSeen(versionInfo.currentVersion);
    }

    onDismiss?.();
  };

  const handleViewDetails = () => {
    if (versionInfo) {
      onViewDetails?.(versionInfo.currentVersion);
      handleDismiss();
    }
  };

  const handleCommitUrlClick = () => {
    if (versionInfo?.commitUrl) {
      window.open(versionInfo.commitUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getIncrementTypeColor = (type?: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCommitTypeColor = (type: string) => {
    switch (type) {
      case 'feat':
        return 'bg-blue-100 text-blue-800';
      case 'fix':
        return 'bg-green-100 text-green-800';
      case 'docs':
        return 'bg-purple-100 text-purple-800';
      case 'style':
        return 'bg-pink-100 text-pink-800';
      case 'refactor':
        return 'bg-yellow-100 text-yellow-800';
      case 'test':
        return 'bg-orange-100 text-orange-800';
      case 'chore':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !versionInfo) {
    return null;
  }

  const commitType = extractCommitType(versionInfo.description);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration: 0.3,
          }}
          className={`fixed top-4 right-4 z-50 max-w-md ${className}`}
        >
          <div className="bg-white border border-green-200 rounded-lg shadow-lg overflow-hidden">
            {/* Header with success indicator */}
            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    New Version Deployed!
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Version info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Version:</span>
                  <Badge variant="outline" className="font-mono">
                    v{versionInfo.currentVersion}
                  </Badge>
                  {versionInfo.incrementType && (
                    <Badge
                      variant="outline"
                      className={getIncrementTypeColor(
                        versionInfo.incrementType
                      )}
                    >
                      {versionInfo.incrementType}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(versionInfo.timestamp)}
                </span>
              </div>

              {/* Commit info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={getCommitTypeColor(commitType)}
                  >
                    {commitType}
                  </Badge>
                  <span className="text-sm text-gray-700">
                    {truncateCommitMessage(versionInfo.description, 40)}
                  </span>
                </div>
              </div>

              {/* Previous version */}
              {versionInfo.previousVersion !== 'Unknown' && (
                <div className="text-xs text-gray-500">
                  Updated from v{versionInfo.previousVersion}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDetails}
                  className="text-xs"
                >
                  View Details
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>

                {versionInfo.commitUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCommitUrlClick}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    View Commit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VersionFlashNotification;
