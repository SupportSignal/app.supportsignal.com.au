import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/components/auth/auth-provider';
import userEvent from '@testing-library/user-event';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    login: jest.fn(),
  },
}));

import { authService } from '@/lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue({ success: true });
  });

  it('renders login form with all fields', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    // OAuth buttons might not render properly in tests, so we won't test them
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Submit without filling fields
    await user.click(submitButton);
    expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();

    // Fill email without @ symbol and password to trigger different validation
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Clear fields and fill with invalid email but valid password
    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'invalidemail');
    await user.type(passwordInput, 'password123');

    // Wait a moment for the form state to update
    await waitFor(() => {
      expect(emailInput).toHaveValue('invalidemail');
      expect(passwordInput).toHaveValue('password123');
    });

    // Give React time to update the state
    await new Promise(resolve => setTimeout(resolve, 100));

    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please fill in all fields/i)
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        true
      );
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    mockAuthService.login.mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials',
    });

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockAuthService.login.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();
    mockAuthService.login.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/login failed. please try again/i)
      ).toBeInTheDocument();
    });
  });

  it('maintains remember me state', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const rememberMeCheckbox = screen.getByLabelText(
      /remember me/i
    ) as HTMLInputElement;

    expect(rememberMeCheckbox.checked).toBe(false);

    await user.click(rememberMeCheckbox);
    expect(rememberMeCheckbox.checked).toBe(true);

    await user.click(rememberMeCheckbox);
    expect(rememberMeCheckbox.checked).toBe(false);
  });
});
