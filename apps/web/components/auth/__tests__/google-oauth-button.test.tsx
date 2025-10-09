import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { AuthProvider } from '@/components/auth/auth-provider';
import userEvent from '@testing-library/user-event';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    getGoogleOAuthUrl: jest.fn(),
  },
}));

import { authService } from '@/lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('GoogleOAuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.getGoogleOAuthUrl.mockResolvedValue({
      success: true,
      url: 'https://accounts.google.com/oauth/authorize?...',
      state: 'test-state-123',
    });
  });

  it('renders Google OAuth button with default props', () => {
    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gray-50');
  });

  it('renders with primary variant', () => {
    render(
      <AuthProvider>
        <GoogleOAuthButton variant="primary" />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    expect(button).toHaveClass('bg-white');
  });

  it('applies custom className', () => {
    render(
      <AuthProvider>
        <GoogleOAuthButton className="custom-class" />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    expect(button).toHaveClass('custom-class');
  });

  it('initiates Google OAuth flow when clicked', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(mockAuthService.getGoogleOAuthUrl).toHaveBeenCalledTimes(1);
    });
  });

  it('stores OAuth state in sessionStorage and redirects', async () => {
    const user = userEvent.setup();
    // Reset window state
    window.location.href = '';
    window.sessionStorage.setItem = jest.fn();

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'google_oauth_state',
        'test-state-123'
      );
      expect(window.location.href).toBe(
        'https://accounts.google.com/oauth/authorize?...'
      );
    });
  });

  it('displays error when OAuth URL generation fails', async () => {
    const user = userEvent.setup();
    mockAuthService.getGoogleOAuthUrl.mockResolvedValueOnce({
      success: false,
      error: 'OAuth configuration error',
    });

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/oauth configuration error/i)
      ).toBeInTheDocument();
    });
  });

  it('displays generic error when URL is missing', async () => {
    const user = userEvent.setup();
    mockAuthService.getGoogleOAuthUrl.mockResolvedValueOnce({
      success: true,
      url: null,
    });

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to initialize google login/i)
      ).toBeInTheDocument();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();
    mockAuthService.getGoogleOAuthUrl.mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  it('disables button during OAuth initialization', async () => {
    const user = userEvent.setup();
    mockAuthService.getGoogleOAuthUrl.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                success: true,
                url: 'https://accounts.google.com/oauth/authorize?...',
                state: 'test-state-123',
              }),
            100
          )
        )
    );

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.location.href).toBe(
        'https://accounts.google.com/oauth/authorize?...'
      );
    });
  });

  it('renders Google logo SVG', () => {
    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-5', 'h-5', 'mr-2');
  });

  it('handles sessionStorage gracefully when unavailable', async () => {
    const user = userEvent.setup();
    // Reset window state first
    window.location.href = '';

    // Mock sessionStorage to be undefined temporarily
    const originalSessionStorage = window.sessionStorage;
    delete (window as any).sessionStorage;

    render(
      <AuthProvider>
        <GoogleOAuthButton />
      </AuthProvider>
    );

    const button = screen.getByRole('button', {
      name: /continue with google/i,
    });
    await user.click(button);

    // Restore sessionStorage
    window.sessionStorage = originalSessionStorage;

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
      expect(window.location.href).toBe('');
    });
  });
});
