/**
 * Critical Authentication Flow Tests for Impersonation System
 * 
 * Tests the security-critical authentication token restoration functionality
 * that was recently fixed. This ensures that after impersonation ends,
 * the admin's original session is properly restored.
 * 
 * Test Categories:
 * - Token restoration after impersonation exit
 * - SessionStorage persistence and retrieval 
 * - URL parameter processing for impersonation tokens
 * - Race conditions during authentication refresh
 * - Security validation during token transitions
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the auth service
jest.mock('../../../../apps/web/lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    getGitHubOAuthUrl: jest.fn(),
    githubOAuthLogin: jest.fn(),
    getGoogleOAuthUrl: jest.fn(),
    googleOAuthLogin: jest.fn(),
  },
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock URLSearchParams
const mockURLSearchParams = {
  get: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    search: '',
    href: 'http://localhost:3000/',
    replace: jest.fn(),
  },
  writable: true,
});

// Mock URL constructor
global.URLSearchParams = jest.fn(() => mockURLSearchParams);

import { authService } from '../../../../apps/web/lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Import the actual components
import { AuthProvider, useAuth } from '../../../../apps/web/components/auth/auth-provider';

// Test component to access auth context
function ImpersonationTestComponent() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'No user'}</div>
      <div data-testid="loading">{auth.isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="session-token">{auth.sessionToken || 'No token'}</div>
      <div data-testid="impersonation-status">
        {auth.user?.isImpersonating ? 'Impersonating' : 'Not impersonating'}
      </div>
      <button 
        data-testid="clear-impersonation"
        onClick={() => auth.clearImpersonation()}
      >
        Clear Impersonation
      </button>
      <button 
        data-testid="refresh-user"
        onClick={() => auth.refreshUser()}
      >
        Refresh User
      </button>
    </div>
  );
}

describe('Impersonation Authentication Flow Tests', () => {
  const mockAdminUser = {
    _id: 'admin-123',
    name: 'System Admin',
    email: 'admin@test.com',
    role: 'system_admin',
    _creationTime: Date.now(),
    isImpersonating: false,
  };

  const mockImpersonatedUser = {
    _id: 'user-456',
    name: 'Test User',
    email: 'user@test.com',
    role: 'frontline_worker',
    _creationTime: Date.now(),
    isImpersonating: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockURLSearchParams.get.mockReturnValue(null);
    mockURLSearchParams.has.mockReturnValue(false);
    
    // Default mock implementations
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue({ success: true, user: null });
    mockAuthService.logout.mockResolvedValue({ success: true });
    
    // Reset location
    window.location.search = '';
    window.location.href = 'http://localhost:3000/';
  });

  describe('Token Restoration After Impersonation Exit', () => {
    it('should restore original admin token after impersonation ends', async () => {
      // Setup: Admin has original session token
      const originalAdminToken = 'admin-session-token-123';
      const impersonationToken = 'imp_1234567890_abcdefgh';
      const originalTokenFromStorage = 'admin-original-token-stored';
      
      // Mock sessionStorage to return the stored original token
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return impersonationToken;
        if (key === 'original_session_token') return originalTokenFromStorage;
        return null;
      });
      
      // Mock authService to return impersonation token initially
      mockAuthService.getSessionToken
        .mockReturnValueOnce(impersonationToken) // First call during initialization
        .mockReturnValueOnce(originalTokenFromStorage); // Second call after restoration
      
      // Mock getCurrentUser for impersonated state, then admin state
      mockAuthService.getCurrentUser
        .mockResolvedValueOnce(mockImpersonatedUser)
        .mockResolvedValueOnce(mockAdminUser);

      const { rerender } = render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Wait for initial load with impersonated user
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Impersonating');
        expect(screen.getByTestId('session-token')).toHaveTextContent(impersonationToken);
      });

      // Simulate impersonation ending (admin clicks "Exit Impersonation")
      // This should trigger clearing impersonation and restoring original token
      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-impersonation'));
      });

      // Verify sessionStorage was cleared
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('impersonation_token');

      // Simulate refresh after impersonation clear
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-user'));
      });

      // Wait for admin user to be restored
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('System Admin');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Not impersonating');
      });

      // Verify the token restoration flow was called correctly
      expect(mockAuthService.getSessionToken).toHaveBeenCalledTimes(3); // Initial + after clear + after refresh
    });

    it('should handle missing original token gracefully', async () => {
      const impersonationToken = 'imp_1234567890_abcdefgh';
      
      // Mock sessionStorage with impersonation token but no original token
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return impersonationToken;
        return null; // No original token stored
      });
      
      mockAuthService.getSessionToken.mockReturnValue(null);
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-impersonation'));
      });

      // Should not crash and should handle the missing original token
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('impersonation_token');
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('session-token')).toHaveTextContent('No token');
      });
    });

    it('should properly handle localStorage fallback when sessionStorage fails', async () => {
      const originalAdminToken = 'admin-token-from-localstorage';
      
      // Mock sessionStorage to throw error
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('SessionStorage unavailable');
      });
      
      // Mock localStorage as fallback
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(originalAdminToken),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      
      mockAuthService.getSessionToken.mockReturnValue(originalAdminToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockAdminUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('System Admin');
        expect(screen.getByTestId('session-token')).toHaveTextContent(originalAdminToken);
      });

      // Clear impersonation should not crash
      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-impersonation'));
      });
      
      // Should gracefully handle the sessionStorage error
      expect(screen.getByTestId('user')).toHaveTextContent('System Admin');
    });
  });

  describe('URL Parameter Processing for Impersonation Tokens', () => {
    it('should process impersonation token from URL parameter', async () => {
      const impersonationToken = 'imp_1234567890_urlparam';
      
      // Mock URL to have impersonation token parameter
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return impersonationToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${impersonationToken}`;
      
      mockAuthService.getSessionToken.mockReturnValue(null);
      mockAuthService.getCurrentUser.mockResolvedValue(mockImpersonatedUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should store the impersonation token in sessionStorage
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'impersonation_token',
          impersonationToken
        );
      });

      // Should display impersonated user
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Impersonating');
      });
    });

    it('should prefer URL parameter over sessionStorage token', async () => {
      const urlToken = 'imp_url_token_123';
      const storedToken = 'imp_stored_token_456';
      
      // Mock both URL parameter and sessionStorage
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return urlToken;
        return null;
      });
      
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return storedToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${urlToken}`;
      
      mockAuthService.getSessionToken.mockReturnValue(urlToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockImpersonatedUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should use URL token and update sessionStorage
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'impersonation_token',
          urlToken
        );
        expect(screen.getByTestId('session-token')).toHaveTextContent(urlToken);
      });
    });

    it('should handle invalid impersonation tokens from URL', async () => {
      const invalidToken = 'invalid-token-format';
      
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return invalidToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${invalidToken}`;
      
      // Mock authService to reject invalid token
      mockAuthService.getSessionToken.mockReturnValue(invalidToken);
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid impersonation token'));

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should handle error gracefully and clear invalid token
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('impersonation_token');
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });
  });

  describe('SessionStorage Persistence and Retrieval', () => {
    it('should persist impersonation state across page refreshes', async () => {
      const impersonationToken = 'imp_persistent_token';
      const originalToken = 'admin_original_token';
      
      // Mock sessionStorage to simulate persisted state
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return impersonationToken;
        if (key === 'original_session_token') return originalToken;
        return null;
      });
      
      mockAuthService.getSessionToken.mockReturnValue(impersonationToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockImpersonatedUser);

      // First render (simulating page load)
      const { unmount } = render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Impersonating');
      });

      unmount();

      // Second render (simulating page refresh)
      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should restore impersonated state from sessionStorage
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Impersonating');
        expect(screen.getByTestId('session-token')).toHaveTextContent(impersonationToken);
      });
    });

    it('should handle sessionStorage quota exceeded errors', async () => {
      const impersonationToken = 'imp_quota_test_token';
      
      // Mock sessionStorage.setItem to throw quota exceeded error
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });
      
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return impersonationToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${impersonationToken}`;
      
      mockAuthService.getSessionToken.mockReturnValue(impersonationToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockImpersonatedUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should handle the error gracefully and continue working
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('impersonation-status')).toHaveTextContent('Impersonating');
      });
      
      // Should have attempted to store but failed gracefully
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'impersonation_token',
        impersonationToken
      );
    });
  });

  describe('Race Conditions During Authentication Refresh', () => {
    it('should prevent concurrent refresh operations', async () => {
      const impersonationToken = 'imp_race_test_token';
      
      mockAuthService.getSessionToken.mockReturnValue(impersonationToken);
      
      // Mock getCurrentUser to have a delay
      let resolveCurrentUser: (user: any) => void;
      const currentUserPromise = new Promise(resolve => {
        resolveCurrentUser = resolve;
      });
      mockAuthService.getCurrentUser.mockReturnValue(currentUserPromise);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Trigger multiple rapid refresh operations
      const refreshButton = screen.getByTestId('refresh-user');
      
      await act(async () => {
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
      });

      // Should show loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // Resolve the getCurrentUser promise
      await act(async () => {
        resolveCurrentUser!(mockImpersonatedUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      });

      // Should have called getCurrentUser only once despite multiple clicks
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication refresh during impersonation token processing', async () => {
      const impersonationToken = 'imp_concurrent_token';
      const originalToken = 'admin_concurrent_token';
      
      // Setup complex race condition scenario
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return impersonationToken;
        return null;
      });
      
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'original_session_token') return originalToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${impersonationToken}`;
      
      // Mock authService with different responses for concurrent calls
      mockAuthService.getSessionToken
        .mockReturnValueOnce(originalToken) // Initial call
        .mockReturnValueOnce(impersonationToken); // After URL processing
      
      mockAuthService.getCurrentUser
        .mockResolvedValueOnce(mockImpersonatedUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should handle the race condition and end up in correct state
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('session-token')).toHaveTextContent(impersonationToken);
      });
      
      // Should have stored the impersonation token and original token
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'impersonation_token',
        impersonationToken
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'original_session_token',
        originalToken
      );
    });
  });

  describe('Security Validation During Token Transitions', () => {
    it('should validate impersonation tokens before storing them', async () => {
      const suspiciousToken = '<script>alert("xss")</script>';
      
      mockURLSearchParams.get.mockImplementation((param) => {
        if (param === 'impersonate_token') return suspiciousToken;
        return null;
      });
      
      window.location.search = `?impersonate_token=${encodeURIComponent(suspiciousToken)}`;
      
      mockAuthService.getSessionToken.mockReturnValue(null);
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should not store obviously malicious tokens
      await waitFor(() => {
        expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
          'impersonation_token',
          suspiciousToken
        );
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });

    it('should clear all impersonation data on authentication failure', async () => {
      const impersonationToken = 'imp_auth_fail_token';
      const originalToken = 'admin_auth_fail_token';
      
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return impersonationToken;
        if (key === 'original_session_token') return originalToken;
        return null;
      });
      
      // Mock authentication failure
      mockAuthService.getSessionToken.mockReturnValue(impersonationToken);
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Authentication failed'));

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      // Should clear all impersonation-related data on auth failure
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('impersonation_token');
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });

    it('should not allow token manipulation through browser devtools', async () => {
      const legitimateToken = 'imp_legit_token_123';
      const manipulatedToken = 'imp_manipulated_token_456';
      
      // Start with legitimate impersonation
      mockSessionStorage.getItem.mockReturnValueOnce(legitimateToken);
      mockAuthService.getSessionToken.mockReturnValue(legitimateToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockImpersonatedUser);

      render(
        <AuthProvider>
          <ImpersonationTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      // Simulate token manipulation in sessionStorage
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'impersonation_token') return manipulatedToken;
        return null;
      });
      
      // Mock the manipulated token causing authentication failure
      mockAuthService.getSessionToken.mockReturnValue(manipulatedToken);
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid session token'));

      // Trigger a refresh to validate the token
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-user'));
      });

      // Should detect the invalid token and clear impersonation
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('impersonation_token');
    });
  });
});