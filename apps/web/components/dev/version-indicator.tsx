'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  GitCommit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@starter/ui';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import {
  fetchVersionManifest,
  formatTimestamp,
  formatRelativeTime,
  sortVersionsDescending,
  extractCommitType,
  truncateCommitHash,
  truncateCommitMessage,
  getVersionNavigation,
  type VersionManifest,
} from '@/lib/version-utils';
import {
  shouldShowProminentIndicator,
  markIndicatorAcknowledged,
} from '@/lib/version-storage';
import { useAuth } from '@/components/auth/auth-provider';

interface VersionIndicatorProps {
  /**
   * Custom class name for styling
   */
  className?: string;

  /**
   * Position of the indicator
   * @default 'bottom-right'
   */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  /**
   * Maximum number of versions to display in history
   * @default 20
   */
  maxVersions?: number;
}

export function VersionIndicator({
  className = '',
  position = 'bottom-right',
  maxVersions = 20,
}: VersionIndicatorProps) {
  const { sessionToken } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [, setLastRefresh] = useState<number>(Date.now());
  const [isProminent, setIsProminent] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch - only show after client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check owner access
  const ownerAccess = useQuery(
    api.auth.verifyOwnerAccess,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Don't show indicator if user doesn't have owner access
  const hasAccess = ownerAccess?.hasAccess === true;

  // Prevent hydration mismatch - don't render anything until client-side hydration
  if (!isHydrated) {
    return null;
  }

  // Don't show if no access
  if (!hasAccess) {
    return null;
  }

  const fetchManifest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchVersionManifest();
      if (response.success && response.data) {
        setManifest(response.data);
        if (!selectedVersion) {
          setSelectedVersion(response.data.current);
        }

        // Check if indicator should be prominent
        const shouldBeProminent = shouldShowProminentIndicator(
          response.data.current
        );
        setIsProminent(shouldBeProminent);
      } else {
        setError(response.error || 'Failed to fetch version manifest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, [selectedVersion]);

  useEffect(() => {
    if (hasAccess) {
      fetchManifest();
    }
  }, [hasAccess, fetchManifest]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);

    // Mark indicator as acknowledged when user clicks on it
    if (manifest && isProminent) {
      markIndicatorAcknowledged(manifest.current);
      setIsProminent(false);
    }
  };

  const handleRefresh = () => {
    fetchManifest();
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
  };

  const handleCommitUrlClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        // Position above the logging status indicator (which is at bottom-4 right-4)
        return 'bottom-16 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        // Default position above logging status
        return 'bottom-16 right-4';
    }
  };

  const getCommitTypeColor = (type: string) => {
    switch (type) {
      case 'feat':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fix':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'docs':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'style':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'refactor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'test':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'chore':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Don't render if user doesn't have access
  if (!hasAccess) {
    return null;
  }

  if (loading && !manifest) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        <Card className="w-auto">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-600">Loading version...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        <Card className="w-auto border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Version error</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-auto p-1"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!manifest) {
    return null;
  }

  const sortedVersions = sortVersionsDescending(manifest.versions).slice(
    0,
    maxVersions
  );
  const currentVersionEntry =
    sortedVersions.find(v => v.version === selectedVersion) ||
    sortedVersions[0];
  const navigation = getVersionNavigation(
    sortedVersions,
    selectedVersion || manifest.current
  );

  return (
    <TooltipProvider>
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        {/* Collapsed indicator */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleExpanded}
                    className={`${
                      isProminent
                        ? 'bg-yellow-300 hover:bg-yellow-400 border-yellow-400 shadow-lg animate-pulse'
                        : 'bg-white hover:bg-gray-50 border-gray-200 shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        v{manifest.current}
                      </Badge>
                      <ChevronUp className="w-3 h-3" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current version: v{manifest.current}</p>
                  <p className="text-xs text-gray-500">
                    {isProminent
                      ? 'New version deployed! Click to view'
                      : 'Click to view history'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded history modal */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-96 max-h-[80vh] overflow-hidden shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <span>Version History</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="h-auto p-1"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleExpanded}
                        className="h-auto p-1"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Current version details */}
                  {currentVersionEntry && (
                    <div className="px-4 pb-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="font-mono">
                            v{currentVersionEntry.version}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getCommitTypeColor(
                              extractCommitType(currentVersionEntry.description)
                            )}
                          >
                            {extractCommitType(currentVersionEntry.description)}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          {currentVersionEntry.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatRelativeTime(
                                currentVersionEntry.timestamp
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitCommit className="w-3 h-3" />
                            <span>
                              {truncateCommitHash(
                                currentVersionEntry.commitHash
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-blue-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigation.previous &&
                              handleVersionSelect(navigation.previous.version)
                            }
                            disabled={!navigation.previous}
                            className="text-xs"
                          >
                            <ChevronLeft className="w-3 h-3 mr-1" />
                            Previous
                          </Button>

                          <span className="text-xs text-blue-600 font-medium">
                            {navigation.currentIndex + 1} of{' '}
                            {sortedVersions.length}
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigation.next &&
                              handleVersionSelect(navigation.next.version)
                            }
                            disabled={!navigation.next}
                            className="text-xs"
                          >
                            Next
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>

                        {/* Commit link */}
                        {currentVersionEntry.commitUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCommitUrlClick(
                                currentVersionEntry.commitUrl
                              )
                            }
                            className="w-full mt-2 text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Commit on GitHub
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Version list */}
                  <div className="max-h-64 overflow-y-auto">
                    {sortedVersions.map((version, index) => (
                      <div key={version.version}>
                        <div
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedVersion === version.version
                              ? 'bg-blue-50'
                              : ''
                          }`}
                          onClick={() => handleVersionSelect(version.version)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant={
                                selectedVersion === version.version
                                  ? 'default'
                                  : 'outline'
                              }
                              className="font-mono text-xs"
                            >
                              v{version.version}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getCommitTypeColor(extractCommitType(version.description))}`}
                              >
                                {extractCommitType(version.description)}
                              </Badge>
                              {version.version === manifest.current && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-1">
                            {truncateCommitMessage(version.description, 50)}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatRelativeTime(version.timestamp)}</span>
                            <span className="font-mono">
                              {truncateCommitHash(version.commitHash)}
                            </span>
                          </div>
                        </div>
                        {index < sortedVersions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>

                  {/* Footer info */}
                  <div className="px-4 py-3 bg-gray-50 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Last updated: {formatTimestamp(manifest.lastUpdated)}
                      </span>
                      <span>{sortedVersions.length} versions shown</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export default VersionIndicator;
