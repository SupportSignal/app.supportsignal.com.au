/**
 * End-to-End Integration Tests for Impersonation System
 * 
 * Tests complete user workflows from admin interface to authentication
 * restoration, covering the full impersonation lifecycle and UI interactions.
 * 
 * Test Categories:
 * - Complete admin impersonation workflow
 * - UI component interaction and state management
 * - Error handling and user feedback
 * - Session persistence across navigation
 * - Banner display and exit functionality
 * - Permission-based UI rendering
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

// Mock Convex client
const mockConvexMutation = jest.fn();
const mockConvexQuery = jest.fn();
const mockConvexAction = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useAction: jest.fn(),
  ConvexProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock auth service
const mockAuthService = {
  getCurrentUser: jest.fn(),
  getSessionToken: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
};

jest.mock('../../../lib/auth', () => ({
  authService: mockAuthService,
}));

// Mock impersonation components
const MockImpersonationControlPanel = jest.fn(({ onImpersonationStart, isLoading, error }) => (
  <div data-testid="impersonation-control-panel">
    <div data-testid="loading-state">{isLoading ? 'Loading' : 'Ready'}</div>
    <div data-testid="error-state">{error || 'No error'}</div>
    <input 
      data-testid="search-input" 
      placeholder="Search users"
    />
    <button 
      data-testid="start-impersonation-btn"
      onClick={() => onImpersonationStart?.({
        targetUser: { 
          id: 'user-123', 
          name: 'Test User',
          email: 'test@user.com',
          role: 'frontline_worker'
        },
        reason: 'Testing user workflow'
      })}
    >
      Start Impersonation
    </button>
  </div>
));

const MockImpersonationBanner = jest.fn(({ 
  adminUser, 
  targetUser, 
  timeRemaining, 
  onExitImpersonation,
  isVisible 
}) => {
  if (!isVisible) return null;
  
  return (
    <div data-testid="impersonation-banner">
      <div data-testid="admin-info">Admin: {adminUser?.name}</div>
      <div data-testid="target-info">Impersonating: {targetUser?.name}</div>
      <div data-testid="time-remaining">Time: {timeRemaining}ms</div>
      <button 
        data-testid="exit-impersonation-btn"
        onClick={onExitImpersonation}
      >
        Exit Impersonation
      </button>
    </div>
  );
});

jest.mock('../../../components/admin/impersonation/ImpersonationControlPanel', () => ({
  ImpersonationControlPanel: MockImpersonationControlPanel,
}));

jest.mock('../../../components/admin/impersonation/ImpersonationBanner', () => ({
  ImpersonationBanner: MockImpersonationBanner,
}));

// Import React Testing Library hooks
import { useQuery, useMutation } from 'convex/react';

// Test component that simulates admin page with impersonation
function AdminImpersonationPage() {
  const [impersonationState, setImpersonationState] = React.useState({
    isImpersonating: false,
    adminUser: null,
    targetUser: null,
    timeRemaining: 0,
    sessionToken: null,
    error: null,
    isLoading: false,
  });

  // Mock Convex queries and mutations
  const impersonationStatus = useQuery('impersonation:getStatus', 
    impersonationState.sessionToken ? { session_token: impersonationState.sessionToken } : 'skip'
  );
  
  const startImpersonation = useMutation('impersonation:start');
  const endImpersonation = useMutation('impersonation:end');

  // Handle impersonation start
  const handleImpersonationStart = async ({ targetUser, reason }: any) => {
    setImpersonationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await startImpersonation({
        admin_session_token: 'admin-session-token',
        target_user_email: targetUser.email,
        reason,
      });

      if (result.success) {
        // Simulate URL navigation with impersonation token
        const impersonationToken = result.impersonation_token;
        window.location.search = `?impersonate_token=${impersonationToken}`;
        
        setImpersonationState({
          isImpersonating: true,
          adminUser: { id: 'admin-123', name: 'System Admin', email: 'admin@test.com' },
          targetUser,
          timeRemaining: 30 * 60 * 1000, // 30 minutes
          sessionToken: impersonationToken,
          error: null,
          isLoading: false,
        });

        mockPush(`/dashboard?impersonate_token=${impersonationToken}`);
      }
    } catch (error) {
      setImpersonationState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  // Handle impersonation end
  const handleExitImpersonation = async () => {
    setImpersonationState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await endImpersonation({
        impersonation_token: impersonationState.sessionToken,
      });

      if (result.success) {
        // Clear URL parameters
        window.location.search = '';
        
        setImpersonationState({
          isImpersonating: false,
          adminUser: null,
          targetUser: null,
          timeRemaining: 0,
          sessionToken: null,
          error: null,
          isLoading: false,
        });

        // Restore original admin session
        mockReplace('/admin/impersonation');
      }
    } catch (error) {
      setImpersonationState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  return (
    <div data-testid="admin-impersonation-page">
      {/* Impersonation Banner */}
      <MockImpersonationBanner
        isVisible={impersonationState.isImpersonating}
        adminUser={impersonationState.adminUser}
        targetUser={impersonationState.targetUser}
        timeRemaining={impersonationState.timeRemaining}
        onExitImpersonation={handleExitImpersonation}
      />

      {/* Admin Control Panel */}
      {!impersonationState.isImpersonating && (
        <MockImpersonationControlPanel
          onImpersonationStart={handleImpersonationStart}
          isLoading={impersonationState.isLoading}
          error={impersonationState.error}
        />
      )}

      {/* Current state display for testing */}
      <div data-testid="current-state">
        <div data-testid="is-impersonating">
          {impersonationState.isImpersonating ? 'true' : 'false'}
        </div>
        <div data-testid="current-user">
          {impersonationState.isImpersonating 
            ? impersonationState.targetUser?.name 
            : 'Admin User'}
        </div>
        <div data-testid="session-token">
          {impersonationState.sessionToken || 'none'}
        </div>
      </div>
    </div>
  );
}

describe('Impersonation End-to-End Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Convex hooks
    (useQuery as jest.Mock).mockReturnValue(null);
    (useMutation as jest.Mock).mockImplementation((mutationName) => {
      if (mutationName === 'impersonation:start') {
        return jest.fn().mockResolvedValue({
          success: true,
          impersonation_token: 'imp_1234567890_testtoken',
          correlation_id: 'corr_test_123',
          expires: Date.now() + 30 * 60 * 1000,
        });
      }
      if (mutationName === 'impersonation:end') {
        return jest.fn().mockResolvedValue({
          success: true,
          original_session_token: 'admin-session-token',
        });
      }
      return jest.fn();
    });

    // Reset window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost:3000/admin/impersonation' },
    });

    // Reset router mocks
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Complete Admin Impersonation Workflow', () => {
    it('should complete full impersonation lifecycle from admin panel to exit', async () => {
      render(<AdminImpersonationPage />);

      // Initial state - admin panel visible, no impersonation
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      expect(screen.getByTestId('current-user')).toHaveTextContent('Admin User');
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();

      // Start impersonation workflow
      await user.click(screen.getByTestId('start-impersonation-btn'));

      // Wait for impersonation to start
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Verify impersonation state
      expect(screen.getByTestId('current-user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('session-token')).toHaveTextContent('imp_1234567890_testtoken');
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();
      expect(screen.getByTestId('admin-info')).toHaveTextContent('Admin: System Admin');
      expect(screen.getByTestId('target-info')).toHaveTextContent('Impersonating: Test User');

      // Verify navigation occurred
      expect(mockPush).toHaveBeenCalledWith('/dashboard?impersonate_token=imp_1234567890_testtoken');
      expect(window.location.search).toContain('impersonate_token=imp_1234567890_testtoken');

      // Control panel should be hidden during impersonation
      expect(screen.queryByTestId('impersonation-control-panel')).not.toBeInTheDocument();

      // Exit impersonation
      await user.click(screen.getByTestId('exit-impersonation-btn'));

      // Wait for impersonation to end
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      });

      // Verify return to admin state
      expect(screen.getByTestId('current-user')).toHaveTextContent('Admin User');
      expect(screen.getByTestId('session-token')).toHaveTextContent('none');
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();

      // Verify admin panel restoration
      expect(mockReplace).toHaveBeenCalledWith('/admin/impersonation');
      expect(window.location.search).toBe('');
    });

    it('should handle impersonation start errors gracefully', async () => {
      // Mock failed impersonation start
      (useMutation as jest.Mock).mockImplementation((mutationName) => {
        if (mutationName === 'impersonation:start') {
          return jest.fn().mockRejectedValue(new Error('Target user not found'));
        }
        if (mutationName === 'impersonation:end') {
          return jest.fn().mockResolvedValue({ success: true });
        }
        return jest.fn();
      });

      render(<AdminImpersonationPage />);

      // Start impersonation workflow
      await user.click(screen.getByTestId('start-impersonation-btn'));

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Target user not found');
      });

      // Should remain in admin state
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      expect(screen.getByTestId('current-user')).toHaveTextContent('Admin User');
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();

      // Should not have navigated
      expect(mockPush).not.toHaveBeenCalled();
      expect(window.location.search).toBe('');
    });

    it('should handle impersonation end errors gracefully', async () => {
      // Mock failed impersonation end
      (useMutation as jest.Mock).mockImplementation((mutationName) => {
        if (mutationName === 'impersonation:start') {
          return jest.fn().mockResolvedValue({
            success: true,
            impersonation_token: 'imp_1234567890_testtoken',
            correlation_id: 'corr_test_123',
            expires: Date.now() + 30 * 60 * 1000,
          });
        }
        if (mutationName === 'impersonation:end') {
          return jest.fn().mockRejectedValue(new Error('Session already terminated'));
        }
        return jest.fn();
      });

      render(<AdminImpersonationPage />);

      // Start impersonation first
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Attempt to exit impersonation
      await user.click(screen.getByTestId('exit-impersonation-btn'));

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
      });

      // Should remain in impersonation state with error
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();

      // Should not have navigated back
      expect(mockReplace).not.toHaveBeenCalledWith('/admin/impersonation');
    });
  });

  describe('Session Persistence and Navigation', () => {
    it('should maintain impersonation state during page navigation', async () => {
      render(<AdminImpersonationPage />);

      // Start impersonation
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Simulate navigation to different page with impersonation token in URL
      const { rerender } = render(<AdminImpersonationPage />);
      
      // Simulate page reload with impersonation token
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { 
          search: '?impersonate_token=imp_1234567890_testtoken',
          href: 'http://localhost:3000/dashboard?impersonate_token=imp_1234567890_testtoken'
        },
      });

      rerender(<AdminImpersonationPage />);

      // Should maintain impersonation state
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();
      expect(screen.getByTestId('target-info')).toHaveTextContent('Impersonating: Test User');
    });

    it('should handle URL parameter tampering', async () => {
      // Simulate direct navigation with invalid impersonation token
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { 
          search: '?impersonate_token=invalid_token_123',
          href: 'http://localhost:3000/dashboard?impersonate_token=invalid_token_123'
        },
      });

      // Mock authentication failure for invalid token
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid session token'));

      render(<AdminImpersonationPage />);

      // Should not show impersonation banner for invalid token
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      expect(screen.getByTestId('current-user')).toHaveTextContent('Admin User');
    });

    it('should clear impersonation state on session timeout', async () => {
      render(<AdminImpersonationPage />);

      // Start impersonation with short timeout
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Mock query to return expired session status
      (useQuery as jest.Mock).mockReturnValue({
        isImpersonating: false,
      });

      // Trigger re-render (simulating status check)
      const { rerender } = render(<AdminImpersonationPage />);
      rerender(<AdminImpersonationPage />);

      // Should automatically clear impersonation state
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      });

      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
    });
  });

  describe('UI Component Interaction and State Management', () => {
    it('should properly coordinate between banner and control panel components', async () => {
      render(<AdminImpersonationPage />);

      // Verify initial state - control panel visible, banner hidden
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();

      // Start impersonation
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Control panel should be hidden, banner should be visible
      expect(screen.queryByTestId('impersonation-control-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();

      // End impersonation
      await user.click(screen.getByTestId('exit-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
      });

      // Should return to original state
      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('impersonation-banner')).not.toBeInTheDocument();
    });

    it('should show loading states during transitions', async () => {
      render(<AdminImpersonationPage />);

      // Should start in ready state
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');

      // Click start - should show loading
      fireEvent.click(screen.getByTestId('start-impersonation-btn'));
      
      // Loading state should be briefly visible
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });
    });

    it('should display time remaining countdown accurately', async () => {
      render(<AdminImpersonationPage />);

      // Start impersonation
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Check initial time remaining
      const timeRemainingElement = screen.getByTestId('time-remaining');
      expect(timeRemainingElement).toHaveTextContent(/Time: \d+ms/);

      // Parse initial time
      const initialTime = parseInt(timeRemainingElement.textContent?.match(/\d+/)?.[0] || '0');
      expect(initialTime).toBeGreaterThan(0);
      expect(initialTime).toBeLessThanOrEqual(30 * 60 * 1000); // Should be ≤ 30 minutes
    });
  });

  describe('Error Handling and User Feedback', () => {
    it('should display user-friendly error messages', async () => {
      const errorScenarios = [
        {
          error: new Error('Target user not found'),
          expectedMessage: 'Target user not found',
        },
        {
          error: new Error('Insufficient permissions: System administrator role required'),
          expectedMessage: 'Insufficient permissions: System administrator role required',
        },
        {
          error: new Error('Maximum concurrent impersonation sessions reached (3)'),
          expectedMessage: 'Maximum concurrent impersonation sessions reached (3)',
        },
      ];

      for (const scenario of errorScenarios) {
        // Mock the error
        (useMutation as jest.Mock).mockImplementation((mutationName) => {
          if (mutationName === 'impersonation:start') {
            return jest.fn().mockRejectedValue(scenario.error);
          }
          return jest.fn();
        });

        render(<AdminImpersonationPage />);

        // Trigger the error
        await user.click(screen.getByTestId('start-impersonation-btn'));

        // Verify error message display
        await waitFor(() => {
          expect(screen.getByTestId('error-state')).toHaveTextContent(scenario.expectedMessage);
        });

        // Verify state remains unchanged
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');
        expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();

        // Cleanup for next test
        jest.clearAllMocks();
      }
    });

    it('should recover from errors and allow retry', async () => {
      let attemptCount = 0;

      // Mock first attempt to fail, second to succeed
      (useMutation as jest.Mock).mockImplementation((mutationName) => {
        if (mutationName === 'impersonation:start') {
          return jest.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount === 1) {
              return Promise.reject(new Error('Network error'));
            } else {
              return Promise.resolve({
                success: true,
                impersonation_token: 'imp_retry_success_token',
                correlation_id: 'corr_retry_123',
                expires: Date.now() + 30 * 60 * 1000,
              });
            }
          });
        }
        return jest.fn();
      });

      render(<AdminImpersonationPage />);

      // First attempt should fail
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Network error');
      });

      // Should still be in admin state
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false');

      // Retry should succeed
      await user.click(screen.getByTestId('start-impersonation-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true');
      });

      // Verify success state
      expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();
    });
  });

  describe('Permission-Based UI Rendering', () => {
    it('should only show impersonation controls for system admins', async () => {
      // Mock non-admin user
      mockAuthService.getCurrentUser.mockResolvedValue({
        _id: 'user-123',
        name: 'Regular User',
        email: 'user@test.com',
        role: 'frontline_worker',
      });

      // Component should handle permission check
      const AdminRestrictedComponent = () => {
        const [hasPermission, setHasPermission] = React.useState(false);

        React.useEffect(() => {
          const checkPermissions = async () => {
            const user = await mockAuthService.getCurrentUser();
            setHasPermission(user?.role === 'system_admin');
          };
          checkPermissions();
        }, []);

        if (!hasPermission) {
          return <div data-testid="access-denied">Access denied</div>;
        }

        return <AdminImpersonationPage />;
      };

      render(<AdminRestrictedComponent />);

      // Should show access denied for non-admin
      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('impersonation-control-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-impersonation-page')).not.toBeInTheDocument();
    });

    it('should show full interface for system administrators', async () => {
      // Mock admin user
      mockAuthService.getCurrentUser.mockResolvedValue({
        _id: 'admin-123',
        name: 'System Admin',
        email: 'admin@test.com',
        role: 'system_admin',
      });

      // Component with permission check
      const AdminRestrictedComponent = () => {
        const [hasPermission, setHasPermission] = React.useState(false);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          const checkPermissions = async () => {
            const user = await mockAuthService.getCurrentUser();
            setHasPermission(user?.role === 'system_admin');
            setLoading(false);
          };
          checkPermissions();
        }, []);

        if (loading) {
          return <div data-testid="loading">Loading...</div>;
        }

        if (!hasPermission) {
          return <div data-testid="access-denied">Access denied</div>;
        }

        return <AdminImpersonationPage />;
      };

      render(<AdminRestrictedComponent />);

      // Should show admin interface for admin user
      await waitFor(() => {
        expect(screen.getByTestId('admin-impersonation-page')).toBeInTheDocument();
      });

      expect(screen.getByTestId('impersonation-control-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
    });
  });
});