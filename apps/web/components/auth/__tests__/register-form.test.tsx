import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RegisterForm } from '../register-form';
import { AuthProvider } from '../auth-provider';
import userEvent from '@testing-library/user-event';

// Mock the OAuth components
jest.mock('../github-oauth-button', () => ({
  GitHubOAuthButton: () => <button>Sign in with GitHub</button>,
}));

jest.mock('../google-oauth-button', () => ({
  GoogleOAuthButton: () => <button>Sign in with Google</button>,
}));

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    register: jest.fn(),
  },
}));

import { authService } from '../../../lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.register.mockResolvedValue({ success: true });
  });

  it('renders register form with all fields', () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it('validates all required fields', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Submit without filling fields
    await user.click(submitButton);
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();

    // Fill name but invalid email
    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'John Doe');
    await user.click(submitButton);
    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();

    // Fill valid email but no password
    const emailInput = screen.getByLabelText(/^email$/i);
    await user.type(emailInput, 'john@example.com');
    await user.click(submitButton);
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Fill short password
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, '12345');
    await user.click(submitButton);
    expect(
      screen.getByText(/password must be at least 6 characters long/i)
    ).toBeInTheDocument();

    // Fill valid password but mismatched confirmation
    await user.clear(passwordInput);
    await user.type(passwordInput, '123456');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    await user.type(confirmPasswordInput, '654321');
    await user.click(submitButton);
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'John Doe',
        'john@example.com',
        'password123'
      );
    });
  });

  it('trims whitespace from name', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, '  John Doe  ');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'John Doe',
        'john@example.com',
        'password123'
      );
    });
  });

  it('displays error message on registration failure', async () => {
    const user = userEvent.setup();
    mockAuthService.register.mockResolvedValueOnce({
      success: false,
      error: 'Email already exists',
    });

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockAuthService.register.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(nameInput).not.toBeDisabled();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();
    mockAuthService.register.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });
});
