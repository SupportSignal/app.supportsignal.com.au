import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GitHubOAuthButton } from '../github-oauth-button';
import { AuthProvider } from '../auth-provider';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    getGitHubOAuthUrl: jest.fn(),
  },
}));

import { authService } from '../../../lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthService.getCurrentUser.mockResolvedValue(null);
  mockAuthService.getSessionToken.mockReturnValue(null);
});

test('GitHubOAuthButton renders with correct text', () => {
  render(
    <AuthProvider>
      <GitHubOAuthButton />
    </AuthProvider>
  );

  expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});

test('GitHubOAuthButton shows loading state when clicked', async () => {
  mockAuthService.getGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: 'https://github.com/login/oauth/authorize?test=1',
    state: 'test-state',
  });

  render(
    <AuthProvider>
      <GitHubOAuthButton />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(screen.getByText('Connecting...')).toBeInTheDocument();
  expect(button).toBeDisabled();
});

test('GitHubOAuthButton handles successful OAuth URL generation', async () => {
  const mockUrl = 'https://github.com/login/oauth/authorize?client_id=test';
  const mockState = 'test-state';

  // Reset window state
  window.location.href = '';
  window.sessionStorage.setItem = jest.fn();

  mockAuthService.getGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: mockUrl,
    state: mockState,
  });

  render(
    <AuthProvider>
      <GitHubOAuthButton />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(mockAuthService.getGitHubOAuthUrl).toHaveBeenCalled();
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'github_oauth_state',
      mockState
    );
    expect(window.location.href).toBe(mockUrl);
  });
});

test('GitHubOAuthButton handles OAuth URL generation error', async () => {
  mockAuthService.getGitHubOAuthUrl.mockResolvedValue({
    success: false,
    error: 'GitHub OAuth not configured',
  });

  render(
    <AuthProvider>
      <GitHubOAuthButton />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('GitHub OAuth not configured')).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});

test('GitHubOAuthButton applies custom className', () => {
  render(
    <AuthProvider>
      <GitHubOAuthButton className="custom-class" />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('custom-class');
});

test('GitHubOAuthButton renders with primary variant', () => {
  render(
    <AuthProvider>
      <GitHubOAuthButton variant="primary" />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-white');
});

test('GitHubOAuthButton renders with secondary variant (default)', () => {
  render(
    <AuthProvider>
      <GitHubOAuthButton variant="secondary" />
    </AuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-gray-50');
});
