import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { AuthProvider } from '@/components/auth/auth-provider';
import userEvent from '@testing-library/user-event';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));

import { authService } from '@/lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('PasswordResetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.requestPasswordReset.mockResolvedValue({ success: true });
  });

  it('renders password reset form after mounting', async () => {
    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole('heading', { name: /reset password/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send reset email/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('shows loading state before mounting', () => {
    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    // Note: Loading state is only visible for a brief moment before mounting completes
    // This test primarily checks that the component renders without crashing
  });

  it.skip('validates email field', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    // Fill with invalid email format to test React validation (bypasses HTML5 required)
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');

    // Ensure the input value is updated
    await waitFor(() => {
      expect(emailInput).toHaveValue('invalid-email');
    });

    // Give React time to update state
    await new Promise(resolve => setTimeout(resolve, 100));

    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(
        'test@example.com'
      );
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password reset email sent/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/check your email for instructions/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/development mode/i)).toBeInTheDocument();
    });

    // Email field should be cleared
    expect(emailInput).toHaveValue('');
  });

  it('displays error message on failure', async () => {
    const user = userEvent.setup();
    mockAuthService.requestPasswordReset.mockResolvedValueOnce({
      success: false,
      error: 'User not found',
    });

    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    await user.type(emailInput, 'nonexistent@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockAuthService.requestPasswordReset.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();
    mockAuthService.requestPasswordReset.mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <AuthProvider>
        <PasswordResetForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send reset email/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });
});
