import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LogoutButton } from '../logout-button';
import { AuthProvider } from '../auth-provider';
import userEvent from '@testing-library/user-event';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    getSessionToken: jest.fn(),
  },
}));

import { authService } from '../../../lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('LogoutButton', () => {
  const mockUser = {
    _id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    _creationTime: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.logout.mockResolvedValue({ success: true });
  });

  it('renders logout button when user is authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('valid-token');

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log out/i })
      ).toBeInTheDocument();
    });
  });

  it('does not render when user is not authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /log out/i })
      ).not.toBeInTheDocument();
    });
  });

  it('calls logout when clicked', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('valid-token');

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log out/i })
      ).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  it.skip('disables button during logout process', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('valid-token');
    mockAuthService.logout.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log out/i })
      ).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    expect(logoutButton).toBeDisabled();
    expect(screen.getByText(/logging out/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(logoutButton).not.toBeDisabled();
        expect(screen.getByText(/log out/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('handles logout errors gracefully', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('valid-token');

    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthService.logout.mockRejectedValueOnce(new Error('Logout failed'));

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log out/i })
      ).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Logout error:',
        expect.any(Error)
      );
      expect(logoutButton).not.toBeDisabled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('has correct styling classes', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('valid-token');

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log out/i })
      ).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    expect(logoutButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
  });
});
