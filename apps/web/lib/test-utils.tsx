import React, { ReactElement, createContext, useContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';

interface TestProviderProps {
  children: React.ReactNode;
  authState?: {
    isAuthenticated?: boolean;
    isLoading?: boolean;
    user?: any;
    sessionToken?: string | null;
    login?: jest.Mock;
    logout?: jest.Mock;
    register?: jest.Mock;
    refreshUser?: jest.Mock;
    changePassword?: jest.Mock;
    requestPasswordReset?: jest.Mock;
    resetPassword?: jest.Mock;
    getGitHubOAuthUrl?: jest.Mock;
    githubOAuthLogin?: jest.Mock;
    getGoogleOAuthUrl?: jest.Mock;
    googleOAuthLogin?: jest.Mock;
  };
}

// Create the same AuthContext interface as the real one
interface AuthContextType {
  user: any;
  sessionToken: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  getGitHubOAuthUrl: () => Promise<{
    success: boolean;
    url?: string;
    state?: string;
    error?: string;
  }>;
  githubOAuthLogin: (
    code: string,
    state?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getGoogleOAuthUrl: () => Promise<{
    success: boolean;
    url?: string;
    state?: string;
    error?: string;
  }>;
  googleOAuthLogin: (
    code: string,
    state?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const TestAuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Test auth hook that matches the real useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(TestAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// All the providers for testing
function TestProviders({ children, authState }: TestProviderProps) {
  // Create auth context value that matches the real AuthProvider interface
  const authValue: AuthContextType = {
    user: authState?.user || null,
    sessionToken: authState?.sessionToken || null,
    isLoading: authState?.isLoading || false,
    login: authState?.login || jest.fn().mockResolvedValue({ success: true }),
    logout: authState?.logout || jest.fn().mockResolvedValue(undefined),
    register:
      authState?.register || jest.fn().mockResolvedValue({ success: true }),
    refreshUser:
      authState?.refreshUser || jest.fn().mockResolvedValue(undefined),
    changePassword:
      authState?.changePassword ||
      jest.fn().mockResolvedValue({ success: true }),
    requestPasswordReset:
      authState?.requestPasswordReset ||
      jest.fn().mockResolvedValue({ success: true }),
    resetPassword:
      authState?.resetPassword ||
      jest.fn().mockResolvedValue({ success: true }),
    getGitHubOAuthUrl:
      authState?.getGitHubOAuthUrl ||
      jest
        .fn()
        .mockResolvedValue({ success: true, url: 'https://github.com/oauth' }),
    githubOAuthLogin:
      authState?.githubOAuthLogin ||
      jest.fn().mockResolvedValue({ success: true }),
    getGoogleOAuthUrl:
      authState?.getGoogleOAuthUrl ||
      jest
        .fn()
        .mockResolvedValue({ success: true, url: 'https://google.com/oauth' }),
    googleOAuthLogin:
      authState?.googleOAuthLogin ||
      jest.fn().mockResolvedValue({ success: true }),
  };

  return (
    <TestAuthContext.Provider value={authValue}>
      {children}
    </TestAuthContext.Provider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authState?: TestProviderProps['authState'];
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { authState, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders authState={authState}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  profileImageUrl: null,
  role: 'user',
  ...overrides,
});

export const createMockSession = (overrides?: Partial<any>) => ({
  id: 'test-session-id',
  userId: 'test-user-id',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

// Common test utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};
