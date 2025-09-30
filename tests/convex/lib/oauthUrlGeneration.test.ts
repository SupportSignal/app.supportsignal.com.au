/**
 * OAuth URL Generation Tests
 * Tests for Story 8.3: OAuth Production Application Setup
 * Validates OAuth callback URL generation in different environments
 */

// @ts-nocheck - TypeScript NODE_ENV read-only errors don't affect test functionality

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateOAuthCallbackUrl,
  resetUrlConfig,
  getUrlConfig,
  validateUrlConfig
} from '../../../apps/convex/lib/urlConfig';

describe('OAuth URL Generation for Story 8.3', () => {
  beforeEach(() => {
    // Reset configuration cache before each test
    resetUrlConfig();
  });

  describe('GitHub OAuth Callback URLs', () => {
    it('should generate production GitHub callback URL', () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');
    });

    it('should generate development GitHub callback URL', () => {
      // Mock development environment
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';

      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('http://localhost:3200/auth/github/callback');
    });
  });

  describe('Google OAuth Callback URLs', () => {
    it('should generate production Google callback URL', () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('google');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/google/callback');
    });

    it('should generate development Google callback URL', () => {
      // Mock development environment
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';

      const callbackUrl = generateOAuthCallbackUrl('google');

      expect(callbackUrl).toBe('http://localhost:3200/auth/google/callback');
    });
  });

  describe('OAuth Provider Validation', () => {
    it('should throw error for invalid provider', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      expect(() => {
        generateOAuthCallbackUrl('invalid' as any);
      }).toThrow('Provider must be either "github" or "google"');
    });

    it('should throw error for empty provider', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      expect(() => {
        generateOAuthCallbackUrl('' as any);
      }).toThrow('Provider must be either "github" or "google"');
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should validate production environment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const config = getUrlConfig();

      expect(config.environment).toBe('production');
      expect(config.baseUrl).toBe('https://app.supportsignal.com.au');

      // Should not throw any validation errors
      expect(() => validateUrlConfig()).not.toThrow();
    });

    it('should validate development environment configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';

      const config = getUrlConfig();

      expect(config.environment).toBe('development');
      expect(config.baseUrl).toBe('http://localhost:3200');

      // Should not throw any validation errors
      expect(() => validateUrlConfig()).not.toThrow();
    });
  });

  describe('OAuth Callback URL Format Validation', () => {
    it('should generate valid URL format for production GitHub', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('github');

      // Should be valid URL
      expect(() => new URL(callbackUrl)).not.toThrow();

      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/github/callback');
    });

    it('should generate valid URL format for production Google', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('google');

      // Should be valid URL
      expect(() => new URL(callbackUrl)).not.toThrow();

      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/google/callback');
    });

    it('should generate valid URL format for development', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';

      const githubUrl = generateOAuthCallbackUrl('github');
      const googleUrl = generateOAuthCallbackUrl('google');

      // Both should be valid URLs
      expect(() => new URL(githubUrl)).not.toThrow();
      expect(() => new URL(googleUrl)).not.toThrow();

      const githubUrlObj = new URL(githubUrl);
      expect(githubUrlObj.protocol).toBe('http:');
      expect(githubUrlObj.hostname).toBe('localhost');
      expect(githubUrlObj.port).toBe('3200');
      expect(githubUrlObj.pathname).toBe('/auth/github/callback');

      const googleUrlObj = new URL(googleUrl);
      expect(googleUrlObj.protocol).toBe('http:');
      expect(googleUrlObj.hostname).toBe('localhost');
      expect(googleUrlObj.port).toBe('3200');
      expect(googleUrlObj.pathname).toBe('/auth/google/callback');
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_APP_URL;
    resetUrlConfig();
  });
});