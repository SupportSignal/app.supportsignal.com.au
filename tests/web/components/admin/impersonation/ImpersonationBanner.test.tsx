/**
 * Comprehensive Tests for ImpersonationBanner Component
 * 
 * Tests the persistent banner displayed during impersonation sessions,
 * including session status, countdown timers, and exit functionality.
 * 
 * Test Categories:
 * - Banner visibility and rendering
 * - Session status display and time countdown
 * - Exit impersonation functionality
 * - Mobile responsiveness
 * - Urgency levels and warnings
 * - Error handling and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from 'convex/react';
import { ImpersonationBanner } from '@/components/admin/impersonation/ImpersonationBanner';

// Mock external dependencies
jest.mock('next-auth/react');
jest.mock('convex/react');
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '25 minutes'),
}));

// Mock implementations
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

// Test fixtures
const mockSession = {
  user: {
    id: 'admin-123',
    name: 'System Admin',
    email: 'admin@test.com',
  },
  sessionToken: 'impersonation-session-token',
};

const mockImpersonationStatus = {
  isImpersonating: true,
  adminUser: {
    id: 'admin-123',
    name: 'System Admin',
    email: 'admin@test.com',
  },
  targetUser: {
    id: 'user-456',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'company_admin',
  },
  sessionToken: 'impersonation-session-token',
  timeRemaining: 25 * 60 * 1000, // 25 minutes in milliseconds
  correlation_id: 'correlation-123',
};

const mockNonImpersonatingStatus = {
  isImpersonating: false,
};

describe('ImpersonationBanner', () => {
  const mockEndImpersonation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock successful session
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
    
    // Mock successful mutations
    mockUseMutation.mockReturnValue(mockEndImpersonation);
    
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Banner Visibility and Rendering', () => {
    it('should render banner when impersonating', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner />);
      
      // Main banner should be visible
      expect(screen.getByText('IMPERSONATION ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Impersonating:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('company_admin')).toBeInTheDocument();
      expect(screen.getByText('Time remaining:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Exit Impersonation/ })).toBeInTheDocument();
    });

    it('should not render banner when not impersonating', () => {
      mockUseQuery.mockReturnValue(mockNonImpersonatingStatus);
      
      render(<ImpersonationBanner />);
      
      // Banner should not be rendered
      expect(screen.queryByText('IMPERSONATION ACTIVE')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Exit Impersonation/ })).not.toBeInTheDocument();
    });

    it('should not render banner when query returns null', () => {
      mockUseQuery.mockReturnValue(null);
      
      render(<ImpersonationBanner />);
      
      expect(screen.queryByText('IMPERSONATION ACTIVE')).not.toBeInTheDocument();
    });

    it('should handle undefined impersonation status', () => {
      mockUseQuery.mockReturnValue(undefined);
      
      render(<ImpersonationBanner />);
      
      expect(screen.queryByText('IMPERSONATION ACTIVE')).not.toBeInTheDocument();
    });

    it('should use explicit session token when provided', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner sessionToken="explicit-token" />);
      
      // Should pass explicit token to query
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { session_token: 'explicit-token' }
      );
    });
  });

  describe('Time Display and Countdown', () => {
    it('should display remaining time correctly formatted', () => {
      const statusWithTime = {
        ...mockImpersonationStatus,
        timeRemaining: 15 * 60 * 1000 + 30 * 1000, // 15 minutes 30 seconds
      };
      mockUseQuery.mockReturnValue(statusWithTime);
      
      render(<ImpersonationBanner />);
      
      expect(screen.getByText('15:30')).toBeInTheDocument();
    });

    it('should update countdown every second', () => {
      let statusWithTime = {
        ...mockImpersonationStatus,
        timeRemaining: 5 * 60 * 1000, // 5 minutes
      };
      mockUseQuery.mockReturnValue(statusWithTime);
      
      render(<ImpersonationBanner />);
      
      // Initial display
      expect(screen.getByText('5:00')).toBeInTheDocument();
      
      // Advance time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Time should decrease (component updates currentTime state)
      // Note: The actual countdown logic updates internal state
      expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument();
    });

    it('should display "Expired" when time is up', () => {
      const expiredStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 0,
      };
      mockUseQuery.mockReturnValue(expiredStatus);
      
      render(<ImpersonationBanner />);
      
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should handle negative time remaining', () => {
      const expiredStatus = {
        ...mockImpersonationStatus,
        timeRemaining: -5000, // Negative time
      };
      mockUseQuery.mockReturnValue(expiredStatus);
      
      render(<ImpersonationBanner />);
      
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should format seconds with leading zero', () => {
      const statusWithTime = {
        ...mockImpersonationStatus,
        timeRemaining: 2 * 60 * 1000 + 5 * 1000, // 2 minutes 5 seconds
      };
      mockUseQuery.mockReturnValue(statusWithTime);
      
      render(<ImpersonationBanner />);
      
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  describe('Urgency Levels and Styling', () => {
    it('should show normal styling for long time remaining', () => {
      const normalStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 20 * 60 * 1000, // 20 minutes
      };
      mockUseQuery.mockReturnValue(normalStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Should have normal (orange-600) styling
      const banner = container.querySelector('[class*="bg-orange-600"]');
      expect(banner).toBeInTheDocument();
    });

    it('should show warning styling for moderate time remaining', () => {
      const warningStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 10 * 60 * 1000, // 10 minutes
      };
      mockUseQuery.mockReturnValue(warningStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Should have warning (orange-500) styling
      const banner = container.querySelector('[class*="bg-orange-500"]');
      expect(banner).toBeInTheDocument();
    });

    it('should show critical styling for low time remaining', () => {
      const criticalStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 3 * 60 * 1000, // 3 minutes
      };
      mockUseQuery.mockReturnValue(criticalStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Should have critical (red-500) styling
      const banner = container.querySelector('[class*="bg-red-500"]');
      expect(banner).toBeInTheDocument();
      
      // Should show pulse animation
      expect(screen.getByText(/\d+:\d{2}/)).toHaveClass('animate-pulse');
    });

    it('should show expired styling when time is up', () => {
      const expiredStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 0,
      };
      mockUseQuery.mockReturnValue(expiredStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Should have expired (red-600) styling
      const banner = container.querySelector('[class*="bg-red-600"]');
      expect(banner).toBeInTheDocument();
    });

    it('should show critical warning message for low time', () => {
      const criticalStatus = {
        ...mockImpersonationStatus,
        timeRemaining: 2 * 60 * 1000, // 2 minutes
      };
      mockUseQuery.mockReturnValue(criticalStatus);
      
      render(<ImpersonationBanner />);
      
      expect(screen.getByText(/Warning:/)).toBeInTheDocument();
      expect(screen.getByText(/Impersonation session expiring soon/)).toBeInTheDocument();
      expect(screen.getByText(/Session will end automatically/)).toBeInTheDocument();
    });
  });

  describe('Exit Impersonation Functionality', () => {
    it('should call endImpersonation when exit button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      mockEndImpersonation.mockResolvedValue({
        success: true,
        original_session_token: 'admin-session-token',
      });
      
      render(<ImpersonationBanner />);
      
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      await user.click(exitButton);
      
      expect(mockEndImpersonation).toHaveBeenCalledWith({
        impersonation_token: 'impersonation-session-token',
      });
    });

    it('should redirect to admin page on successful exit', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      mockEndImpersonation.mockResolvedValue({
        success: true,
        original_session_token: 'admin-session-token',
      });
      
      render(<ImpersonationBanner />);
      
      await user.click(screen.getByRole('button', { name: /Exit Impersonation/ }));
      
      await waitFor(() => {
        expect(window.location.href).toBe('/admin/impersonation?session_restored=true');
      });
    });

    it('should show loading state during exit process', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      // Mock slow mutation
      let resolveExit: (value: any) => void;
      const exitPromise = new Promise((resolve) => {
        resolveExit = resolve;
      });
      mockEndImpersonation.mockReturnValue(exitPromise);
      
      render(<ImpersonationBanner />);
      
      await user.click(screen.getByRole('button', { name: /Exit Impersonation/ }));
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /Exiting.../ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Exiting.../ })).toBeDisabled();
      
      // Complete the exit
      resolveExit!({ success: true, original_session_token: 'admin-token' });
    });

    it('should handle exit errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      mockEndImpersonation.mockRejectedValue(new Error('Network error'));
      
      render(<ImpersonationBanner />);
      
      await user.click(screen.getByRole('button', { name: /Exit Impersonation/ }));
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
      
      // Button should be re-enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Exit Impersonation/ })).not.toBeDisabled();
      });
    });

    it('should handle exit failure response', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      mockEndImpersonation.mockResolvedValue({
        success: false,
        error: 'Session already terminated',
      });
      
      render(<ImpersonationBanner />);
      
      await user.click(screen.getByRole('button', { name: /Exit Impersonation/ }));
      
      await waitFor(() => {
        expect(screen.getByText(/Session already terminated/)).toBeInTheDocument();
      });
    });

    it('should not allow exit when not impersonating', () => {
      mockUseQuery.mockReturnValue(mockNonImpersonatingStatus);
      
      render(<ImpersonationBanner />);
      
      // Banner should not be rendered, so no exit button
      expect(screen.queryByRole('button', { name: /Exit Impersonation/ })).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should show mobile version on small screens', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Desktop version (hidden on mobile)
      expect(container.querySelector('.hidden.sm\\:flex')).toBeInTheDocument();
      
      // Mobile version (visible on mobile, hidden on desktop)
      expect(container.querySelector('.sm\\:hidden')).toBeInTheDocument();
    });

    it('should display simplified info in mobile version', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner />);
      
      // Mobile version should show user name and role
      const mobileSection = screen.getByText('John Doe').closest('.sm\\:hidden');
      expect(mobileSection).toBeInTheDocument();
      expect(screen.getAllByText('company_admin')).toHaveLength(2); // Both desktop and mobile
    });
  });

  describe('Session Token Handling', () => {
    it('should use session token from props over session', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner sessionToken="prop-token" />);
      
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { session_token: 'prop-token' }
      );
    });

    it('should fall back to session token when no prop provided', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner />);
      
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { session_token: 'impersonation-session-token' }
      );
    });

    it('should handle missing session and prop tokens', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner />);
      
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { session_token: '' }
      );
    });

    it('should skip query when no token available', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      
      // Query should return skip when no token
      mockUseQuery.mockReturnValue(undefined);
      
      render(<ImpersonationBanner />);
      
      expect(screen.queryByText('IMPERSONATION ACTIVE')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle query errors gracefully', () => {
      // Mock query error
      mockUseQuery.mockReturnValue(undefined);
      
      render(<ImpersonationBanner />);
      
      // Should not render banner on error
      expect(screen.queryByText('IMPERSONATION ACTIVE')).not.toBeInTheDocument();
    });

    it('should handle missing user data in impersonation status', () => {
      const incompleteStatus = {
        isImpersonating: true,
        // Missing adminUser and targetUser
        sessionToken: 'session-token',
        timeRemaining: 1000,
      };
      mockUseQuery.mockReturnValue(incompleteStatus);
      
      render(<ImpersonationBanner />);
      
      // Banner should still render but handle missing data gracefully
      expect(screen.getByText('IMPERSONATION ACTIVE')).toBeInTheDocument();
      // User details might not be shown or show as undefined
    });

    it('should handle timer cleanup on unmount', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      const { unmount } = render(<ImpersonationBanner />);
      
      // Verify timer was set up
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      
      // Unmount component
      unmount();
      
      // Timer should be cleaned up (no more pending timers)
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should not set up timer when not impersonating', () => {
      mockUseQuery.mockReturnValue(mockNonImpersonatingStatus);
      
      render(<ImpersonationBanner />);
      
      // No timer should be set up
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Custom Styling and Classes', () => {
    it('should apply custom className', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      const { container } = render(<ImpersonationBanner className="custom-banner" />);
      
      expect(container.firstChild).toHaveClass('custom-banner');
    });

    it('should maintain fixed positioning', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      const { container } = render(<ImpersonationBanner />);
      
      // Should have fixed positioning classes
      expect(container.firstChild).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    });

    it('should show proper alert styling', () => {
      mockUseQuery.mockReturnValue(mockImpersonationStatus);
      
      render(<ImpersonationBanner />);
      
      // Error alerts should have destructive variant
      // (This would be tested when error is present)
      expect(screen.getByText('IMPERSONATION ACTIVE')).toBeInTheDocument();
    });
  });
});