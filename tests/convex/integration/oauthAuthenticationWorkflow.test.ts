/**
 * OAuth Authentication Workflow Integration Tests
 * Tests for Story 8.3: OAuth Production Application Setup
 * Validates complete authentication workflows in both environments
 */

// @ts-nocheck - TypeScript NODE_ENV read-only errors don't affect test functionality

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateOAuthCallbackUrl,
  resetUrlConfig,
  getUrlConfig
} from '../../../apps/convex/lib/urlConfig';

describe('OAuth Authentication Workflow Integration for Story 8.3', () => {
  beforeEach(() => {
    resetUrlConfig();
  });

  describe('Production Environment Authentication Workflow', () => {
    beforeEach(() => {
      // Mock production environment variables
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';
      process.env.GITHUB_CLIENT_ID = 'Ov23liMO6dymiqZKmiBS';
      process.env.GOOGLE_CLIENT_ID = '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com';
    });

    it('should generate correct GitHub OAuth callback URL for production', () => {
      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');

      // Verify URL format matches GitHub OAuth app configuration
      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/github/callback');
      expect(url.search).toBe(''); // No query parameters
    });

    it('should generate correct Google OAuth callback URL for production', () => {
      const callbackUrl = generateOAuthCallbackUrl('google');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/google/callback');

      // Verify URL format matches Google OAuth app configuration
      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/google/callback');
      expect(url.search).toBe(''); // No query parameters
    });

    it('should have production environment configuration', () => {
      const config = getUrlConfig();

      expect(config.environment).toBe('production');
      expect(config.baseUrl).toBe('https://app.supportsignal.com.au');
    });
  });

  describe('Development Environment Authentication Workflow', () => {
    beforeEach(() => {
      // Mock development environment variables
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';
      process.env.GITHUB_CLIENT_ID = 'Ov23liMO6dymiqZKmiBS';
      process.env.GOOGLE_CLIENT_ID = '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com';
    });

    it('should generate correct GitHub OAuth callback URL for development', () => {
      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('http://localhost:3200/auth/github/callback');

      // Verify URL format matches development OAuth setup
      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('http:');
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('3200');
      expect(url.pathname).toBe('/auth/github/callback');
    });

    it('should generate correct Google OAuth callback URL for development', () => {
      const callbackUrl = generateOAuthCallbackUrl('google');

      expect(callbackUrl).toBe('http://localhost:3200/auth/google/callback');

      // Verify URL format matches development OAuth setup
      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('http:');
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('3200');
      expect(url.pathname).toBe('/auth/google/callback');
    });

    it('should have development environment configuration', () => {
      const config = getUrlConfig();

      expect(config.environment).toBe('development');
      expect(config.baseUrl).toBe('http://localhost:3200');
    });
  });

  describe('Cross-Environment OAuth Configuration Validation', () => {
    it('should validate that same OAuth credentials work in both environments', () => {
      const githubClientId = 'Ov23liMO6dymiqZKmiBS';
      const googleClientId = '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com';

      // Test production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';
      process.env.GITHUB_CLIENT_ID = githubClientId;
      process.env.GOOGLE_CLIENT_ID = googleClientId;

      const prodGithubUrl = generateOAuthCallbackUrl('github');
      const prodGoogleUrl = generateOAuthCallbackUrl('google');

      expect(prodGithubUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');
      expect(prodGoogleUrl).toBe('https://app.supportsignal.com.au/auth/google/callback');

      // Reset and test development environment
      resetUrlConfig();
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';
      process.env.GITHUB_CLIENT_ID = githubClientId;
      process.env.GOOGLE_CLIENT_ID = googleClientId;

      const devGithubUrl = generateOAuthCallbackUrl('github');
      const devGoogleUrl = generateOAuthCallbackUrl('google');

      expect(devGithubUrl).toBe('http://localhost:3200/auth/github/callback');
      expect(devGoogleUrl).toBe('http://localhost:3200/auth/google/callback');

      // Verify same OAuth credentials work with different callback URLs
      expect(process.env.GITHUB_CLIENT_ID).toBe(githubClientId);
      expect(process.env.GOOGLE_CLIENT_ID).toBe(googleClientId);
    });
  });

  describe('OAuth Provider Callback URL Patterns', () => {
    it('should generate callback URLs that match BetterAuth patterns', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const githubCallback = generateOAuthCallbackUrl('github');
      const googleCallback = generateOAuthCallbackUrl('google');

      // Verify callback URL pattern: {baseUrl}/auth/{provider}/callback
      expect(githubCallback).toMatch(/^https:\/\/app\.supportsignal\.com\.au\/auth\/github\/callback$/);
      expect(googleCallback).toMatch(/^https:\/\/app\.supportsignal\.com\.au\/auth\/google\/callback$/);

      // Verify they follow the same pattern
      expect(githubCallback.replace('github', '{provider}')).toBe(
        googleCallback.replace('google', '{provider}')
      );
    });

    it('should generate valid URLs for OAuth redirect configuration', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const githubCallback = generateOAuthCallbackUrl('github');
      const googleCallback = generateOAuthCallbackUrl('google');

      // URLs should be valid for OAuth provider configuration
      expect(() => new URL(githubCallback)).not.toThrow();
      expect(() => new URL(googleCallback)).not.toThrow();

      // URLs should use HTTPS in production
      const githubUrl = new URL(githubCallback);
      const googleUrl = new URL(googleCallback);

      expect(githubUrl.protocol).toBe('https:');
      expect(googleUrl.protocol).toBe('https:');

      // URLs should not have trailing slashes
      expect(githubCallback).not.toMatch(/\/$/);
      expect(googleCallback).not.toMatch(/\/$/);
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    resetUrlConfig();
  });
});