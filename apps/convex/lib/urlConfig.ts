/**
 * Centralized URL configuration for Convex backend
 * Implements environment-aware URL generation with proper validation
 * Bans direct process.env access per coding standards
 */

export interface UrlConfig {
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
  workerUrl?: string;
}

/**
 * Get environment variable with validation and fallback
 */
function getEnvVar(key: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (required && (!value || value.trim().length === 0)) {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value || '';
}

/**
 * Validate URL format
 */
function validateUrl(url: string, urlName: string): void {
  if (!url || url.trim().length === 0) {
    throw new Error(`${urlName} cannot be empty`);
  }

  try {
    new URL(url);
  } catch {
    throw new Error(`${urlName} must be a valid URL: ${url}`);
  }

  // Ensure URLs don't end with trailing slash (for consistent concatenation)
  if (url.endsWith('/')) {
    throw new Error(`${urlName} should not end with a trailing slash: ${url}`);
  }
}

/**
 * Load and validate URL configuration from environment variables
 */
export function loadUrlConfig(): UrlConfig {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

  // In CI/test environments, make URLs optional to allow backend startup
  const isTestEnvironment = environment === 'test' || process.env.CI === 'true';

  // Default URLs based on environment
  const defaultBaseUrl = environment === 'production'
    ? 'https://app.supportsignal.com.au'
    : 'http://localhost:3200';

  const defaultWorkerUrl = environment === 'production'
    ? 'https://log-ingestion-worker.david-0b1.workers.dev'
    : 'https://log-ingestion-worker.david-0b1.workers.dev'; // Same worker for both envs for now

  // Get URLs from environment with fallbacks
  let baseUrl = getEnvVar(
    'NEXT_PUBLIC_APP_URL',
    !isTestEnvironment,
    isTestEnvironment ? 'http://localhost:3200' : undefined
  );

  // If not in test environment and baseUrl is still empty, provide default
  if (!baseUrl && !isTestEnvironment) {
    baseUrl = defaultBaseUrl;
  }

  let workerUrl = getEnvVar(
    'NEXT_PUBLIC_LOG_WORKER_URL',
    false, // Optional
    undefined // No default fallback - let it be empty if not provided
  );

  // Only use fallback if not explicitly set to empty
  if (!workerUrl && process.env.NEXT_PUBLIC_LOG_WORKER_URL !== '') {
    workerUrl = defaultWorkerUrl;
  }

  // Remove trailing slashes for consistent URL building
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  if (workerUrl && workerUrl.endsWith('/')) {
    workerUrl = workerUrl.slice(0, -1);
  }

  // Validate URLs only in non-test environments
  if (!isTestEnvironment) {
    validateUrl(baseUrl, 'Base URL (NEXT_PUBLIC_APP_URL)');
    if (workerUrl) {
      validateUrl(workerUrl, 'Worker URL (NEXT_PUBLIC_LOG_WORKER_URL)');
    }
  }

  const config: UrlConfig = {
    baseUrl,
    environment,
    workerUrl,
  };

  // Log configuration (without sensitive data) in development
  if (environment === 'development') {
    // eslint-disable-next-line no-console
    console.log('URL Configuration loaded:', {
      environment,
      baseUrl,
      hasWorkerUrl: !!workerUrl,
    });
  }

  return config;
}

// Global configuration cache
let globalUrlConfig: UrlConfig | null = null;

/**
 * Get cached URL configuration or load from environment
 */
export function getUrlConfig(): UrlConfig {
  if (!globalUrlConfig) {
    globalUrlConfig = loadUrlConfig();
  }
  return globalUrlConfig;
}

/**
 * Reset configuration cache (useful for testing)
 */
export function resetUrlConfig(): void {
  globalUrlConfig = null;
}

/**
 * Generate password reset URL with token
 */
export function generatePasswordResetUrl(token: string): string {
  if (!token || token.trim().length === 0) {
    throw new Error('Token is required for password reset URL');
  }

  const config = getUrlConfig();
  return `${config.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Generate OAuth callback URL for authentication providers
 */
export function generateOAuthCallbackUrl(provider: 'github' | 'google'): string {
  if (!provider || !['github', 'google'].includes(provider)) {
    throw new Error('Provider must be either "github" or "google"');
  }

  const config = getUrlConfig();
  return `${config.baseUrl}/auth/${provider}/callback`;
}

/**
 * Generate worker URL for log ingestion operations
 */
export function generateWorkerUrl(endpoint?: string): string {
  const config = getUrlConfig();

  if (!config.workerUrl || config.workerUrl.trim().length === 0) {
    throw new Error('Worker URL (NEXT_PUBLIC_LOG_WORKER_URL) is not configured');
  }

  if (!endpoint) {
    return config.workerUrl;
  }

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.workerUrl}/${cleanEndpoint}`;
}

/**
 * Generate base application URL
 */
export function generateBaseUrl(): string {
  const config = getUrlConfig();
  return config.baseUrl;
}

/**
 * Validate that all required URLs are configured
 */
export function validateUrlConfig(): void {
  const config = getUrlConfig();

  if (!config.baseUrl) {
    throw new Error('Base URL is required but not configured');
  }

  // Validate URLs are properly formatted
  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error(`Invalid base URL: ${config.baseUrl}`);
  }

  if (config.workerUrl) {
    try {
      new URL(config.workerUrl);
    } catch {
      throw new Error(`Invalid worker URL: ${config.workerUrl}`);
    }
  }
}

/**
 * URL generation utilities for specific use cases
 */
export const UrlUtils = {
  passwordReset: generatePasswordResetUrl,
  oauthCallback: generateOAuthCallbackUrl,
  worker: generateWorkerUrl,
  base: generateBaseUrl,
  validate: validateUrlConfig,
} as const;