/**
 * Version Storage Utilities for Local Storage Management
 * Handles version tracking, new version detection, and flash notification persistence
 */

const VERSION_STORAGE_KEY = 'version-tracking';
const FLASH_NOTIFICATION_KEY = 'version-flash-shown';

export interface VersionStorageData {
  lastSeenVersion: string;
  lastChecked: number;
  flashNotificationShown: boolean;
  indicatorAcknowledged: boolean; // Whether user has clicked on the indicator for current version
}

/**
 * Get version storage data from localStorage
 */
export function getVersionStorageData(): VersionStorageData | null {
  if (typeof window === 'undefined') {
    return null; // SSR safety
  }

  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    // Validate data structure
    if (
      typeof data.lastSeenVersion === 'string' &&
      typeof data.lastChecked === 'number' &&
      typeof data.flashNotificationShown === 'boolean'
    ) {
      // Add default for new field if missing (backward compatibility)
      if (typeof data.indicatorAcknowledged !== 'boolean') {
        data.indicatorAcknowledged = false;
      }
      return data;
    }

    return null;
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Error reading version storage data:', error);
    return null;
  }
}

/**
 * Save version storage data to localStorage
 */
export function saveVersionStorageData(data: VersionStorageData): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR safety
  }

  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Error saving version storage data:', error);
    return false;
  }
}

/**
 * Initialize version storage with current version
 */
export function initializeVersionStorage(
  currentVersion: string
): VersionStorageData {
  const data: VersionStorageData = {
    lastSeenVersion: currentVersion,
    lastChecked: Date.now(),
    flashNotificationShown: false,
    indicatorAcknowledged: false,
  };

  saveVersionStorageData(data);
  return data;
}

/**
 * Check if a new version is available
 */
export function checkForNewVersion(currentVersion: string): {
  hasNewVersion: boolean;
  previousVersion: string | null;
  shouldShowFlash: boolean;
} {
  const stored = getVersionStorageData();

  if (!stored) {
    // First time visiting, initialize storage
    initializeVersionStorage(currentVersion);
    return {
      hasNewVersion: false,
      previousVersion: null,
      shouldShowFlash: false,
    };
  }

  const hasNewVersion = stored.lastSeenVersion !== currentVersion;
  const shouldShowFlash = hasNewVersion && !stored.flashNotificationShown;

  return {
    hasNewVersion,
    previousVersion: stored.lastSeenVersion,
    shouldShowFlash,
  };
}

/**
 * Mark new version as seen and update storage
 * This is called when a new version is first detected
 */
export function markVersionAsSeen(currentVersion: string): boolean {
  const updatedData: VersionStorageData = {
    lastSeenVersion: currentVersion,
    lastChecked: Date.now(),
    flashNotificationShown: false, // Reset flash for future versions
    indicatorAcknowledged: false, // Reset acknowledgment for new version (triggers prominence)
  };

  return saveVersionStorageData(updatedData);
}

/**
 * Mark flash notification as shown to prevent repeated displays
 */
export function markFlashNotificationShown(): boolean {
  const stored = getVersionStorageData();

  if (!stored) {
    return false;
  }

  const updatedData: VersionStorageData = {
    ...stored,
    flashNotificationShown: true,
  };

  return saveVersionStorageData(updatedData);
}

/**
 * Clear all version storage data
 */
export function clearVersionStorage(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR safety
  }

  try {
    localStorage.removeItem(VERSION_STORAGE_KEY);
    localStorage.removeItem(FLASH_NOTIFICATION_KEY); // Legacy cleanup
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Error clearing version storage:', error);
    return false;
  }
}

/**
 * Get time since last version check
 */
export function getTimeSinceLastCheck(): number | null {
  const stored = getVersionStorageData();

  if (!stored) {
    return null;
  }

  return Date.now() - stored.lastChecked;
}

/**
 * Check if version storage needs refresh (older than specified time)
 */
export function shouldRefreshVersionData(
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  const timeSinceCheck = getTimeSinceLastCheck();

  if (timeSinceCheck === null) {
    return true; // No data, should refresh
  }

  return timeSinceCheck > maxAgeMs;
}

/**
 * Update last checked timestamp without changing version
 */
export function updateLastCheckedTimestamp(): boolean {
  const stored = getVersionStorageData();

  if (!stored) {
    return false;
  }

  const updatedData: VersionStorageData = {
    ...stored,
    lastChecked: Date.now(),
  };

  return saveVersionStorageData(updatedData);
}

/**
 * Get version storage statistics for debugging
 */
export function getVersionStorageStats(): {
  hasStoredData: boolean;
  lastSeenVersion?: string;
  lastChecked?: number;
  timeSinceLastCheck?: number;
  flashNotificationShown?: boolean;
} {
  const stored = getVersionStorageData();

  if (!stored) {
    return { hasStoredData: false };
  }

  return {
    hasStoredData: true,
    lastSeenVersion: stored.lastSeenVersion,
    lastChecked: stored.lastChecked,
    timeSinceLastCheck: Date.now() - stored.lastChecked,
    flashNotificationShown: stored.flashNotificationShown,
  };
}

/**
 * Migrate legacy version storage format (if any exists)
 */
export function migrateLegacyVersionStorage(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR safety
  }

  try {
    // Check for old flash notification key
    const legacyFlashKey = localStorage.getItem(FLASH_NOTIFICATION_KEY);
    if (legacyFlashKey) {
      localStorage.removeItem(FLASH_NOTIFICATION_KEY);
    }

    // Add any other legacy migration logic here as needed
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Error migrating legacy version storage:', error);
    return false;
  }
}

/**
 * Check if the version indicator should be visually prominent
 * Returns true if there's a new version that hasn't been acknowledged
 */
export function shouldShowProminentIndicator(currentVersion: string): boolean {
  const stored = getVersionStorageData();

  if (!stored) {
    return false; // No stored data, not prominent
  }

  // Show prominence if it's a new version and user hasn't acknowledged it
  return (
    stored.lastSeenVersion !== currentVersion || !stored.indicatorAcknowledged
  );
}

/**
 * Mark the version indicator as acknowledged (user has interacted with it)
 * This removes the visual prominence
 */
export function markIndicatorAcknowledged(currentVersion: string): boolean {
  const stored = getVersionStorageData();

  if (!stored) {
    // Initialize with acknowledged state
    const data = initializeVersionStorage(currentVersion);
    data.indicatorAcknowledged = true;
    return saveVersionStorageData(data);
  }

  const updatedData: VersionStorageData = {
    ...stored,
    lastSeenVersion: currentVersion, // Update to current version
    indicatorAcknowledged: true,
    lastChecked: Date.now(),
  };

  return saveVersionStorageData(updatedData);
}

/**
 * Reset indicator acknowledgment (for testing or when new version is detected)
 */
export function resetIndicatorAcknowledgment(): boolean {
  const stored = getVersionStorageData();

  if (!stored) {
    return false;
  }

  const updatedData: VersionStorageData = {
    ...stored,
    indicatorAcknowledged: false,
  };

  return saveVersionStorageData(updatedData);
}
