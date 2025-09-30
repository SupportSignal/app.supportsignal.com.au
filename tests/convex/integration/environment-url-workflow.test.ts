/**
 * End-to-end integration tests for environment-aware URL configuration workflow
 * Tests complete workflows spanning email, auth, and worker sync functions
 */

import {
  loadUrlConfig,
  resetUrlConfig,
  generatePasswordResetUrl,
  generateOAuthCallbackUrl,
  generateWorkerUrl,
  validateUrlConfig,
  UrlUtils,
} from '../../../apps/convex/lib/urlConfig';

// Store original environment for restoration
const originalEnv = process.env;

// Complete environment configurations for workflow testing
const completeEnvironments = {
  developmentComplete: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3200',
    NEXT_PUBLIC_LOG_WORKER_URL: 'https://log-ingestion-worker.david-0b1.workers.dev',
    NODE_ENV: 'development',
    GITHUB_CLIENT_ID: 'dev-github-client-id',
    GOOGLE_CLIENT_ID: 'dev-google-client-id',
  },
  productionComplete: {
    NEXT_PUBLIC_APP_URL: 'https://app.supportsignal.com.au',
    NEXT_PUBLIC_LOG_WORKER_URL: 'https://log-ingestion-worker.david-0b1.workers.dev',
    NODE_ENV: 'production',
    GITHUB_CLIENT_ID: 'prod-github-client-id',
    GOOGLE_CLIENT_ID: 'prod-google-client-id',
  },
  stagingEnvironment: {
    NEXT_PUBLIC_APP_URL: 'https://staging.supportsignal.com.au',
    NEXT_PUBLIC_LOG_WORKER_URL: 'https://staging-log-worker.example.com',
    NODE_ENV: 'production', // Staging uses production NODE_ENV
    GITHUB_CLIENT_ID: 'staging-github-client-id',
    GOOGLE_CLIENT_ID: 'staging-google-client-id',
  },
} as const;

describe('Environment-Aware URL Configuration Workflow', () => {
  beforeEach(() => {
    
    resetUrlConfig();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetUrlConfig();
    jest.restoreAllMocks();
  });

  describe('Complete Development Workflow', () => {
    beforeEach(() => {
      process.env = { ...completeEnvironments.developmentComplete };
    });

    it('should handle complete password reset workflow in development', () => {
      // 1. Configuration loading
      const config = loadUrlConfig();
      expect(config.environment).toBe('development');
      expect(config.baseUrl).toBe('http://localhost:3200');

      // 2. Password reset token generation (simulating auth.ts)
      const resetToken = 'dev-secure-token-' + Date.now();

      // 3. Reset URL generation (simulating email.ts)
      const resetUrl = generatePasswordResetUrl(resetToken);
      expect(resetUrl).toBe(`http://localhost:3200/reset-password?token=${resetToken}`);

      // 4. Email payload construction (simulating email worker call)
      const emailPayload = {
        type: 'password_reset',
        to: 'developer@example.com',
        resetUrl: resetUrl,
        token: resetToken,
      };

      expect(emailPayload.resetUrl).toContain('http://localhost:3200');
      expect(emailPayload.resetUrl).toContain('reset-password?token=');

      // 5. Worker health check (simulating workerSync.ts)
      const workerHealthUrl = generateWorkerUrl('health');
      expect(workerHealthUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/health');

      // 6. Validation
      expect(() => validateUrlConfig()).not.toThrow();
    });

    it('should handle complete OAuth workflow in development', () => {
      // 1. OAuth URL generation for both providers (simulating auth.ts)
      const githubCallback = generateOAuthCallbackUrl('github');
      const googleCallback = generateOAuthCallbackUrl('google');

      expect(githubCallback).toBe('http://localhost:3200/auth/github/callback');
      expect(googleCallback).toBe('http://localhost:3200/auth/google/callback');

      // 2. Complete OAuth URL construction (simulating auth.ts functions)
      const state = 'dev-oauth-state-123';

      const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubOAuthUrl.searchParams.set('client_id', 'dev-github-client-id');
      githubOAuthUrl.searchParams.set('redirect_uri', githubCallback);
      githubOAuthUrl.searchParams.set('scope', 'user:email');
      githubOAuthUrl.searchParams.set('state', state);

      const googleOAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleOAuthUrl.searchParams.set('client_id', 'dev-google-client-id');
      googleOAuthUrl.searchParams.set('redirect_uri', googleCallback);
      googleOAuthUrl.searchParams.set('response_type', 'code');
      googleOAuthUrl.searchParams.set('scope', 'openid email profile');
      googleOAuthUrl.searchParams.set('state', state);

      // 3. Verify OAuth URLs are correctly constructed
      expect(githubOAuthUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3200/auth/github/callback');
      expect(googleOAuthUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3200/auth/google/callback');

      // 4. Verify URLs are valid
      expect(() => new URL(githubOAuthUrl.toString())).not.toThrow();
      expect(() => new URL(googleOAuthUrl.toString())).not.toThrow();
    });

    it('should handle complete worker sync workflow in development', () => {
      // 1. Worker health check (simulating workerSync.ts getRedisStats)
      const healthUrl = generateWorkerUrl('health');
      expect(healthUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/health');

      // 2. Trace fetching (simulating workerSync.ts syncAllLogs)
      const tracesUrl = generateWorkerUrl('traces/recent');
      expect(tracesUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/traces/recent');

      // 3. Log fetching by trace ID (simulating workerSync.ts syncByTrace)
      const traceId = 'dev-trace-123';
      const logsUrl = generateWorkerUrl(`logs?trace_id=${traceId}`);
      expect(logsUrl).toBe(`https://log-ingestion-worker.david-0b1.workers.dev/logs?trace_id=${traceId}`);

      // 4. Clear logs operation (simulating workerSync.ts clearRedisLogs)
      const clearUrl = generateWorkerUrl('logs/clear');
      expect(clearUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/logs/clear');

      // 5. User-specific logs (simulating workerSync.ts syncByUser)
      const userId = 'dev-user-456';
      const userLogsUrl = generateWorkerUrl(`logs?user_id=${userId}`);
      expect(userLogsUrl).toBe(`https://log-ingestion-worker.david-0b1.workers.dev/logs?user_id=${userId}`);
    });
  });

  describe('Complete Production Workflow', () => {
    beforeEach(() => {
      process.env = { ...completeEnvironments.productionComplete };
    });

    it('should handle complete password reset workflow in production', () => {
      // 1. Configuration loading
      const config = loadUrlConfig();
      expect(config.environment).toBe('production');
      expect(config.baseUrl).toBe('https://app.supportsignal.com.au');

      // 2. Password reset workflow
      const resetToken = 'prod-secure-token-' + Date.now();
      const resetUrl = generatePasswordResetUrl(resetToken);

      expect(resetUrl).toBe(`https://app.supportsignal.com.au/reset-password?token=${resetToken}`);

      // 3. Production email payload
      const emailPayload = {
        type: 'password_reset',
        to: 'user@company.com',
        resetUrl: resetUrl,
        token: resetToken,
      };

      expect(emailPayload.resetUrl).toContain('https://app.supportsignal.com.au');
      expect(emailPayload.resetUrl).not.toContain('localhost');

      // 4. Validation ensures production readiness
      expect(() => validateUrlConfig()).not.toThrow();
    });

    it('should handle complete OAuth workflow in production', () => {
      const githubCallback = generateOAuthCallbackUrl('github');
      const googleCallback = generateOAuthCallbackUrl('google');

      expect(githubCallback).toBe('https://app.supportsignal.com.au/auth/github/callback');
      expect(googleCallback).toBe('https://app.supportsignal.com.au/auth/google/callback');

      // Ensure no development URLs leak into production
      expect(githubCallback).not.toContain('localhost');
      expect(googleCallback).not.toContain('localhost');
    });

    it('should handle production worker sync workflow', () => {
      const healthUrl = generateWorkerUrl('health');
      const tracesUrl = generateWorkerUrl('traces/recent');

      expect(healthUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/health');
      expect(tracesUrl).toBe('https://log-ingestion-worker.david-0b1.workers.dev/traces/recent');

      // Worker URLs should be the same across environments for now
      expect(healthUrl).toContain('log-ingestion-worker.david-0b1.workers.dev');
      expect(tracesUrl).toContain('log-ingestion-worker.david-0b1.workers.dev');
    });
  });

  describe('Environment Switching Scenarios', () => {
    it('should handle clean environment switches during runtime', () => {
      // Start in development
      process.env = { ...completeEnvironments.developmentComplete };

      let config = loadUrlConfig();
      expect(config.environment).toBe('development');

      let resetUrl = generatePasswordResetUrl('token123');
      expect(resetUrl).toContain('localhost:3200');

      // Switch to production environment
      resetUrlConfig(); // Clear cache
      process.env = { ...completeEnvironments.productionComplete };

      config = loadUrlConfig();
      expect(config.environment).toBe('production');

      resetUrl = generatePasswordResetUrl('token123');
      expect(resetUrl).toContain('app.supportsignal.com.au');
    });

    it('should handle staging environment configuration', () => {
      process.env = { ...completeEnvironments.stagingEnvironment };

      const config = loadUrlConfig();
      expect(config.environment).toBe('production'); // Staging uses production NODE_ENV
      expect(config.baseUrl).toBe('https://staging.supportsignal.com.au');

      const resetUrl = generatePasswordResetUrl('staging-token');
      const githubCallback = generateOAuthCallbackUrl('github');
      const workerUrl = generateWorkerUrl('health');

      expect(resetUrl).toBe('https://staging.supportsignal.com.au/reset-password?token=staging-token');
      expect(githubCallback).toBe('https://staging.supportsignal.com.au/auth/github/callback');
      expect(workerUrl).toBe('https://staging-log-worker.example.com/health');
    });
  });

  describe('Cross-Function Integration Validation', () => {
    it('should ensure URL consistency across all functions', () => {
      process.env = { ...completeEnvironments.productionComplete };

      // Generate URLs for different functions
      const passwordResetUrl = generatePasswordResetUrl('test-token');
      const githubCallbackUrl = generateOAuthCallbackUrl('github');
      const googleCallbackUrl = generateOAuthCallbackUrl('google');
      const workerHealthUrl = generateWorkerUrl('health');

      // All application URLs should use the same base
      const appUrls = [passwordResetUrl, githubCallbackUrl, googleCallbackUrl];
      appUrls.forEach(url => {
        expect(url.startsWith('https://app.supportsignal.com.au')).toBe(true);
      });

      // Worker URL should use the worker base
      expect(workerHealthUrl.startsWith('https://log-ingestion-worker.david-0b1.workers.dev')).toBe(true);

      // All URLs should be valid
      appUrls.concat([workerHealthUrl]).forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it('should validate realistic end-to-end user workflow', () => {
      process.env = { ...completeEnvironments.productionComplete };

      // Simulate a complete user workflow
      const userEmail = 'john.doe@company.com';
      const resetToken = 'secure-prod-token-abc123xyz789';

      // 1. User requests password reset (triggers email.ts)
      const resetUrl = generatePasswordResetUrl(resetToken);

      // 2. User receives email and clicks reset link (validates URL format)
      const resetUrlObj = new URL(resetUrl);
      expect(resetUrlObj.hostname).toBe('app.supportsignal.com.au');
      expect(resetUrlObj.pathname).toBe('/reset-password');
      expect(resetUrlObj.searchParams.get('token')).toBe(resetToken);

      // 3. User chooses OAuth login instead (triggers auth.ts)
      const githubAuthUrl = generateOAuthCallbackUrl('github');
      const googleAuthUrl = generateOAuthCallbackUrl('google');

      const githubUrlObj = new URL(githubAuthUrl);
      const googleUrlObj = new URL(googleAuthUrl);

      expect(githubUrlObj.hostname).toBe('app.supportsignal.com.au');
      expect(githubUrlObj.pathname).toBe('/auth/github/callback');
      expect(googleUrlObj.hostname).toBe('app.supportsignal.com.au');
      expect(googleUrlObj.pathname).toBe('/auth/google/callback');

      // 4. System logs activity (triggers workerSync.ts)
      const logWorkerUrl = generateWorkerUrl('logs');
      const workerUrlObj = new URL(logWorkerUrl);

      expect(workerUrlObj.hostname).toBe('log-ingestion-worker.david-0b1.workers.dev');
      expect(workerUrlObj.pathname).toBe('/logs');

      // 5. Validate entire workflow URLs are production-ready
      const allUrls = [resetUrl, githubAuthUrl, googleAuthUrl, logWorkerUrl];
      allUrls.forEach(url => {
        expect(url).not.toContain('localhost');
        expect(url).toMatch(/^https:/);
        expect(() => new URL(url)).not.toThrow();
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle partial configuration gracefully', () => {
      // Missing worker URL but has app URL
      process.env = {
        NEXT_PUBLIC_APP_URL: 'https://app.supportsignal.com.au',
        NEXT_PUBLIC_LOG_WORKER_URL: '', // Explicitly empty
        NODE_ENV: 'production',
      } as any;

      resetUrlConfig(); // Force reload

      // App functions should work
      expect(() => generatePasswordResetUrl('token')).not.toThrow();
      expect(() => generateOAuthCallbackUrl('github')).not.toThrow();

      // Worker functions should fail gracefully
      expect(() => generateWorkerUrl()).toThrow(
        'Worker URL (NEXT_PUBLIC_LOG_WORKER_URL) is not configured'
      );
    });

    it('should provide actionable error messages for debugging', () => {
      process.env = {
        NODE_ENV: 'production',
        // Missing all URL configuration
      };

      try {
        generatePasswordResetUrl('token');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_PUBLIC_APP_URL');
        expect((error as Error).message).toContain('not set');
      }

      try {
        generateOAuthCallbackUrl('github');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_PUBLIC_APP_URL');
        expect((error as Error).message).toContain('not set');
      }
    });

    it('should handle invalid environment configurations', () => {
      process.env = {
        NEXT_PUBLIC_APP_URL: 'invalid-url-format',
        NODE_ENV: 'production',
      };

      expect(() => loadUrlConfig()).toThrow(
        'Base URL (NEXT_PUBLIC_APP_URL) must be a valid URL: invalid-url-format'
      );
    });
  });

  describe('Performance and Caching', () => {
    it('should cache configuration for performance', () => {
      process.env = { ...completeEnvironments.productionComplete };

      // First call loads configuration
      const start1 = performance.now();
      const url1 = generatePasswordResetUrl('token1');
      const time1 = performance.now() - start1;

      // Second call should use cached configuration
      const start2 = performance.now();
      const url2 = generatePasswordResetUrl('token2');
      const time2 = performance.now() - start2;

      // URLs should be consistent
      expect(url1).toContain('https://app.supportsignal.com.au');
      expect(url2).toContain('https://app.supportsignal.com.au');

      // Second call should be faster (cached)
      expect(time2).toBeLessThan(time1);
    });

    it('should handle concurrent URL generation efficiently', () => {
      process.env = { ...completeEnvironments.productionComplete };

      // Generate multiple URLs concurrently
      const promises = Promise.all([
        Promise.resolve(generatePasswordResetUrl('token1')),
        Promise.resolve(generateOAuthCallbackUrl('github')),
        Promise.resolve(generateOAuthCallbackUrl('google')),
        Promise.resolve(generateWorkerUrl('health')),
        Promise.resolve(generatePasswordResetUrl('token2')),
      ]);

      return promises.then(urls => {
        expect(urls).toHaveLength(5);
        urls.forEach(url => {
          expect(url).toMatch(/^https:/);
          expect(() => new URL(url)).not.toThrow();
        });
      });
    });
  });
});