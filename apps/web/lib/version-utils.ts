/**
 * Version Utilities for Version Tracking System
 * Handles version manifest fetching, parsing, and validation
 */

export interface VersionEntry {
  version: string;
  commitHash: string;
  timestamp: number;
  description: string;
  commitUrl: string;
}

export interface VersionManifest {
  versions: VersionEntry[];
  current: string;
  lastUpdated: number;
}

export interface VersionManifestResponse {
  success: boolean;
  data?: VersionManifest;
  error?: string;
}

/**
 * Fetch version manifest from static assets
 */
export async function fetchVersionManifest(): Promise<VersionManifestResponse> {
  try {
    const response = await fetch('/version-manifest.json', {
      cache: 'no-cache', // Always fetch fresh version data
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch version manifest: ${response.status} ${response.statusText}`,
      };
    }

    const data: VersionManifest = await response.json();

    // Validate manifest structure
    const validationResult = validateVersionManifest(data);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: `Invalid version manifest: ${validationResult.error}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching version manifest: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate version manifest structure
 */
export function validateVersionManifest(manifest: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!manifest || typeof manifest !== 'object') {
    return { isValid: false, error: 'Manifest is not an object' };
  }

  const manifestObj = manifest as Record<string, unknown>;

  if (!Array.isArray(manifestObj.versions)) {
    return { isValid: false, error: 'Versions is not an array' };
  }

  if (typeof manifestObj.current !== 'string') {
    return { isValid: false, error: 'Current version is not a string' };
  }

  if (typeof manifestObj.lastUpdated !== 'number') {
    return { isValid: false, error: 'Last updated is not a number' };
  }

  // Validate each version entry
  for (let i = 0; i < manifestObj.versions.length; i++) {
    const version = manifestObj.versions[i];
    const versionValidation = validateVersionEntry(version, i);
    if (!versionValidation.isValid) {
      return versionValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validate individual version entry
 */
export function validateVersionEntry(
  entry: unknown,
  index?: number
): { isValid: boolean; error?: string } {
  const prefix =
    index !== undefined ? `Version entry ${index}:` : 'Version entry:';

  if (!entry || typeof entry !== 'object') {
    return { isValid: false, error: `${prefix} Not an object` };
  }

  const entryObj = entry as Record<string, unknown>;

  if (typeof entryObj.version !== 'string') {
    return { isValid: false, error: `${prefix} Version is not a string` };
  }

  if (typeof entryObj.commitHash !== 'string') {
    return { isValid: false, error: `${prefix} Commit hash is not a string` };
  }

  if (typeof entryObj.timestamp !== 'number') {
    return { isValid: false, error: `${prefix} Timestamp is not a number` };
  }

  if (typeof entryObj.description !== 'string') {
    return { isValid: false, error: `${prefix} Description is not a string` };
  }

  if (typeof entryObj.commitUrl !== 'string') {
    return { isValid: false, error: `${prefix} Commit URL is not a string` };
  }

  // Validate semantic version format
  if (!isValidSemanticVersion(entryObj.version)) {
    return {
      isValid: false,
      error: `${prefix} Invalid semantic version format: ${entryObj.version}`,
    };
  }

  return { isValid: true };
}

/**
 * Check if a version string follows semantic versioning
 */
export function isValidSemanticVersion(version: string): boolean {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const parseVersion = (version: string) => {
    const [main, pre] = version.split('-');
    const [major, minor, patch] = main.split('.').map(Number);
    return { major, minor, patch, pre };
  };

  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  // Compare major version
  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }

  // Compare minor version
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }

  // Compare patch version
  if (versionA.patch !== versionB.patch) {
    return versionA.patch - versionB.patch;
  }

  // Compare pre-release versions (simplified)
  if (versionA.pre && !versionB.pre) return -1;
  if (!versionA.pre && versionB.pre) return 1;
  if (versionA.pre && versionB.pre) {
    return versionA.pre.localeCompare(versionB.pre);
  }

  return 0;
}

/**
 * Sort versions in descending order (newest first)
 */
export function sortVersionsDescending(
  versions: VersionEntry[]
): VersionEntry[] {
  return [...versions].sort((a, b) => compareVersions(b.version, a.version));
}

/**
 * Sort versions in ascending order (oldest first)
 */
export function sortVersionsAscending(
  versions: VersionEntry[]
): VersionEntry[] {
  return [...versions].sort((a, b) => compareVersions(a.version, b.version));
}

/**
 * Find a version entry by version string
 */
export function findVersionEntry(
  versions: VersionEntry[],
  version: string
): VersionEntry | undefined {
  return versions.find(v => v.version === version);
}

/**
 * Get the next and previous versions for navigation
 */
export function getVersionNavigation(
  versions: VersionEntry[],
  currentVersion: string
): {
  current: VersionEntry | undefined;
  next: VersionEntry | undefined;
  previous: VersionEntry | undefined;
  currentIndex: number;
} {
  const sortedVersions = sortVersionsDescending(versions);
  const currentIndex = sortedVersions.findIndex(
    v => v.version === currentVersion
  );

  if (currentIndex === -1) {
    return {
      current: undefined,
      next: undefined,
      previous: undefined,
      currentIndex: -1,
    };
  }

  return {
    current: sortedVersions[currentIndex],
    next: currentIndex > 0 ? sortedVersions[currentIndex - 1] : undefined,
    previous:
      currentIndex < sortedVersions.length - 1
        ? sortedVersions[currentIndex + 1]
        : undefined,
    currentIndex,
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const timestampMs = timestamp * 1000;
  const diffMs = now - timestampMs;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return formatTimestamp(timestamp);
  }
}

/**
 * Extract commit type from commit message
 */
export function extractCommitType(description: string): string {
  const match = description.match(/^([a-zA-Z]+)(\(.+\))?:/);
  return match ? match[1] : 'other';
}

/**
 * Get version increment type based on semantic version comparison
 */
export function getVersionIncrementType(
  fromVersion: string,
  toVersion: string
): 'major' | 'minor' | 'patch' | 'unknown' {
  if (
    !isValidSemanticVersion(fromVersion) ||
    !isValidSemanticVersion(toVersion)
  ) {
    return 'unknown';
  }

  const parseVersion = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
  };

  const from = parseVersion(fromVersion);
  const to = parseVersion(toVersion);

  if (to.major > from.major) return 'major';
  if (to.minor > from.minor) return 'minor';
  if (to.patch > from.patch) return 'patch';

  return 'unknown';
}

/**
 * Truncate commit hash for display
 */
export function truncateCommitHash(hash: string, length: number = 8): string {
  return hash.substring(0, length);
}

/**
 * Truncate commit message for display
 */
export function truncateCommitMessage(
  message: string,
  maxLength: number = 50
): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}
