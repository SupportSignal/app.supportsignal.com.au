import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mock the auth module with factory function to avoid hoisting issues
jest.mock('../../../lib/auth', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    getGitHubOAuthUrl: jest.fn(),
    githubOAuthLogin: jest.fn(),
    getGoogleOAuthUrl: jest.fn(),
    googleOAuthLogin: jest.fn(),
  },
}));

// Import after mocking
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { createMockUser } from '@/lib/test-utils';
import { authService } from '@/lib/auth';

// Get access to the mocked auth service
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component that uses all auth methods
function TestAuthComponent() {
  const auth = useAuth();
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAction = async (action: () => Promise<any>) => {
    try {
      setError(null);
      const res = await action();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'No user'}</div>
      <div data-testid="loading">
        {auth.isLoading ? 'Loading' : 'Not loading'}
      </div>
      <div data-testid="session-token">{auth.sessionToken || 'No token'}</div>
      <div data-testid="result">
        {result ? JSON.stringify(result) : 'No result'}
      </div>
      <div data-testid="error">{error || 'No error'}</div>

      <button
        onClick={() =>
          handleAction(() => auth.login('test@example.com', 'password'))
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          handleAction(() => auth.login('test@example.com', 'password', true))
        }
      >
        Login Remember
      </button>
      <button
        onClick={() =>
          handleAction(() =>
            auth.register('Test User', 'test@example.com', 'password')
          )
        }
      >
        Register
      </button>
      <button onClick={() => handleAction(() => auth.logout())}>Logout</button>
      <button onClick={() => handleAction(() => auth.refreshUser())}>
        Refresh
      </button>
      <button
        onClick={() => handleAction(() => auth.changePassword('old', 'new'))}
      >
        Change Password
      </button>
      <button
        onClick={() =>
          handleAction(() => auth.requestPasswordReset('test@example.com'))
        }
      >
        Request Reset
      </button>
      <button
        onClick={() =>
          handleAction(() => auth.resetPassword('token', 'newpass'))
        }
      >
        Reset Password
      </button>
      <button onClick={() => handleAction(() => auth.getGitHubOAuthUrl())}>
        GitHub URL
      </button>
      <button
        onClick={() =>
          handleAction(() => auth.githubOAuthLogin('code', 'state'))
        }
      >
        GitHub Login
      </button>
      <button onClick={() => handleAction(() => auth.getGoogleOAuthUrl())}>
        Google URL
      </button>
      <button
        onClick={() =>
          handleAction(() => auth.googleOAuthLogin('code', 'state'))
        }
      >
        Google Login
      </button>
    </div>
  );
}

describe('AuthProvider Methods Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default successful responses
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
  });

  it('should handle successful login', async () => {
    const mockUser = createMockUser({ name: 'Test User' });
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      sessionToken: 'test-token',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password',
      undefined
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle login with remember me', async () => {
    const mockUser = createMockUser({ name: 'Test User' });
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      sessionToken: 'test-token',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Remember'));
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password',
      true
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle failed login', async () => {
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password',
      undefined
    );
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":false,"error":"Invalid credentials"}'
    );
  });

  it('should handle successful registration with auto-login', async () => {
    const mockUser = createMockUser({ name: 'New User' });
    mockAuthService.register.mockResolvedValue({ success: true, user: null });
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      sessionToken: 'new-token',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'Test User',
      'test@example.com',
      'password'
    );
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle registration success but login failure', async () => {
    mockAuthService.register.mockResolvedValue({ success: true, user: null });
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: 'Login failed after registration',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'Test User',
      'test@example.com',
      'password'
    );
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle failed registration', async () => {
    mockAuthService.register.mockResolvedValue({
      success: false,
      error: 'Email already exists',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'Test User',
      'test@example.com',
      'password'
    );
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":false,"error":"Email already exists"}'
    );
  });

  it('should handle logout', async () => {
    mockAuthService.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should handle refreshUser success', async () => {
    const mockUser = createMockUser({ name: 'Refreshed User' });
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.getSessionToken.mockReturnValue('refresh-token');

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(mockAuthService.getSessionToken).toHaveBeenCalled();
  });

  it('should handle refreshUser error', async () => {
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth error'));

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('should handle changePassword', async () => {
    mockAuthService.changePassword.mockResolvedValue({
      success: true,
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Change Password'));
    });

    expect(mockAuthService.changePassword).toHaveBeenCalledWith('old', 'new');
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle requestPasswordReset', async () => {
    mockAuthService.requestPasswordReset.mockResolvedValue({
      success: true,
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Request Reset'));
    });

    expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(
      'test@example.com'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle resetPassword', async () => {
    mockAuthService.resetPassword.mockResolvedValue({
      success: true,
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Reset Password'));
    });

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      'token',
      'newpass'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle getGitHubOAuthUrl', async () => {
    mockAuthService.getGitHubOAuthUrl.mockResolvedValue({
      success: true,
      url: 'https://github.com/oauth',
      state: 'github-state',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('GitHub URL'));
    });

    expect(mockAuthService.getGitHubOAuthUrl).toHaveBeenCalled();
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":true,"url":"https://github.com/oauth","state":"github-state"}'
    );
  });

  it('should handle successful githubOAuthLogin', async () => {
    const mockUser = createMockUser({ name: 'GitHub User' });
    mockAuthService.githubOAuthLogin.mockResolvedValue({
      success: true,
      user: mockUser,
      sessionToken: 'github-token',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('GitHub Login'));
    });

    expect(mockAuthService.githubOAuthLogin).toHaveBeenCalledWith(
      'code',
      'state'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle failed githubOAuthLogin', async () => {
    mockAuthService.githubOAuthLogin.mockResolvedValue({
      success: false,
      error: 'GitHub OAuth failed',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('GitHub Login'));
    });

    expect(mockAuthService.githubOAuthLogin).toHaveBeenCalledWith(
      'code',
      'state'
    );
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":false,"error":"GitHub OAuth failed"}'
    );
  });

  it('should handle getGoogleOAuthUrl', async () => {
    mockAuthService.getGoogleOAuthUrl.mockResolvedValue({
      success: true,
      url: 'https://accounts.google.com/oauth',
      state: 'google-state',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Google URL'));
    });

    expect(mockAuthService.getGoogleOAuthUrl).toHaveBeenCalled();
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":true,"url":"https://accounts.google.com/oauth","state":"google-state"}'
    );
  });

  it('should handle successful googleOAuthLogin', async () => {
    const mockUser = createMockUser({ name: 'Google User' });
    mockAuthService.googleOAuthLogin.mockResolvedValue({
      success: true,
      user: mockUser,
      sessionToken: 'google-token',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Google Login'));
    });

    expect(mockAuthService.googleOAuthLogin).toHaveBeenCalledWith(
      'code',
      'state'
    );
    expect(screen.getByTestId('result')).toHaveTextContent('{"success":true}');
  });

  it('should handle failed googleOAuthLogin', async () => {
    mockAuthService.googleOAuthLogin.mockResolvedValue({
      success: false,
      error: 'Google OAuth failed',
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Google Login'));
    });

    expect(mockAuthService.googleOAuthLogin).toHaveBeenCalledWith(
      'code',
      'state'
    );
    expect(screen.getByTestId('result')).toHaveTextContent(
      '{"success":false,"error":"Google OAuth failed"}'
    );
  });

  it('should handle useAuth hook outside provider', () => {
    const TestHookComponent = () => {
      try {
        useAuth();
        return <div>Should not render</div>;
      } catch (error) {
        return (
          <div data-testid="hook-error">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        );
      }
    };

    // Mock console.error to prevent test noise
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<TestHookComponent />);

    expect(screen.getByTestId('hook-error')).toHaveTextContent(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });
});
