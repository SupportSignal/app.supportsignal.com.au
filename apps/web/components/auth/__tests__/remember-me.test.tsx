import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/components/auth/auth-provider';

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

describe('Remember Me Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
    });
  });

  it('renders remember me checkbox', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('allows toggling remember me checkbox', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });

    // Initially unchecked
    expect(rememberMeCheckbox).not.toBeChecked();

    // Click to check
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();

    // Click to uncheck
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('passes rememberMe parameter to login function when checked', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form with remember me checked
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        true
      );
    });
  });

  it('passes rememberMe as false when checkbox is unchecked', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form without checking remember me
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        false
      );
    });
  });

  it('displays remember me duration text', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByText(/remember me for 30 days/i)).toBeInTheDocument();
  });

  it('disables remember me checkbox when form is submitting', async () => {
    // Mock login to be pending
    mockAuthService.login.mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(rememberMeCheckbox).toBeDisabled();
    });
  });
});
