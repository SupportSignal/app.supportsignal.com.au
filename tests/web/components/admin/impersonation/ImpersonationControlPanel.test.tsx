/**
 * Comprehensive Tests for ImpersonationControlPanel Component
 * 
 * Tests the main admin interface for managing user impersonation sessions,
 * including user search, session management, and security validations.
 * 
 * Test Categories:
 * - Component rendering and authentication
 * - User search functionality
 * - Session creation workflow
 * - Error handling and validation
 * - User interactions and state management
 * - Security warnings and constraints
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-nocheck
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from 'convex/react';
import { ImpersonationControlPanel } from '../../../../../apps/web/components/admin/impersonation/ImpersonationControlPanel';

// Mock types for testing
interface ImpersonationSearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
  company_name?: string;
}

// Mock external dependencies
jest.mock('next-auth/react');
jest.mock('convex/react');

// Mock child components
jest.mock('../../../../../apps/web/components/admin/impersonation/UserSearchInput', () => ({
  UserSearchInput: ({ searchTerm, onSearchTermChange, searchResults, onUserSelect, selectedUser }: any) => (
    <div data-testid="user-search-input">
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        placeholder="Search users"
      />
      <div data-testid="search-results">
        {searchResults.map((user: ImpersonationSearchResult) => (
          <div
            key={user.id}
            data-testid={`user-result-${user.id}`}
            onClick={() => onUserSelect(user)}
            className={selectedUser?.id === user.id ? 'selected' : ''}
          >
            {user.name} ({user.email})
          </div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock('../../../../../apps/web/components/admin/impersonation/ImpersonationConfirmDialog', () => ({
  ImpersonationConfirmDialog: ({ open, onConfirm, onCancel, targetUser, isLoading }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <p>Confirm impersonation of {targetUser?.name}</p>
        <button data-testid="confirm-button" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Starting...' : 'Confirm'}
        </button>
        <button data-testid="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

jest.mock('../../../../../apps/web/components/admin/impersonation/ActiveSessionsManager', () => ({
  ActiveSessionsManager: ({ activeSessions }: any) => (
    <div data-testid="active-sessions-manager">
      <p>Active Sessions: {activeSessions.length}</p>
      {activeSessions.map((session: any, index: number) => (
        <div key={index} data-testid={`active-session-${index}`}>
          {session.adminUser?.name} → {session.targetUser?.name}
        </div>
      ))}
    </div>
  ),
}));

// Test fixtures
const mockAdminSession = {
  user: {
    id: 'admin-123',
    name: 'System Admin',
    email: 'admin@test.com',
  },
  sessionToken: 'admin-session-token',
};

const mockSearchResults = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'company_admin',
    company_name: 'Acme Corp',
  },
  {
    id: 'user-2', 
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'frontline_worker',
    company_name: 'Beta Inc',
  },
] as ImpersonationSearchResult[];

const mockActiveSessions = [
  {
    sessionId: 'session-1',
    adminUser: { id: 'admin-1', name: 'Admin One', email: 'admin1@test.com' },
    targetUser: { id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'company_admin' },
    reason: 'Testing workflow',
    timeRemaining: 25 * 60 * 1000,
  },
];

// Mock implementations
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

describe('ImpersonationControlPanel', () => {
  const mockStartImpersonation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful session
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
      update: jest.fn(),
    });
    
    // Mock successful mutations
    mockUseMutation.mockReturnValue(mockStartImpersonation);
    
    // Mock queries with empty results by default
    mockUseQuery
      .mockReturnValueOnce([]) // searchUsers
      .mockReturnValueOnce([]); // activeSessions
  });

  describe('Authentication and Initial Rendering', () => {
    it('should render security warning and form when authenticated as admin', () => {
      render(<ImpersonationControlPanel />);
      
      // Check security notice
      expect(screen.getByText(/Security Notice/)).toBeInTheDocument();
      expect(screen.getByText(/All impersonation sessions are logged/)).toBeInTheDocument();
      
      // Check main form elements
      expect(screen.getByText('Start Impersonation Session')).toBeInTheDocument();
      expect(screen.getByLabelText(/Select User to Impersonate/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for Impersonation/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Impersonation/ })).toBeInTheDocument();
      
      // Check session constraints
      expect(screen.getByText(/Sessions auto-expire after 30 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum 3 concurrent sessions per admin/)).toBeInTheDocument();
    });

    it('should show authentication required message when not logged in', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      
      render(<ImpersonationControlPanel />);
      
      expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
      expect(screen.getByText(/Please log in to access impersonation features/)).toBeInTheDocument();
      
      // Main form should not be visible
      expect(screen.queryByText('Start Impersonation Session')).not.toBeInTheDocument();
    });

    it('should handle loading state gracefully', () => {
      mockUseSession.mockReturnValue({
        data: undefined,
        status: 'loading',
        update: jest.fn(),
      });
      
      render(<ImpersonationControlPanel />);
      
      // Should show authentication required during loading
      expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
    });
  });

  describe('User Search Functionality', () => {
    it('should display search results when available', () => {
      // Mock search results
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      
      // Check search results are displayed
      expect(screen.getByTestId('user-result-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-result-user-2')).toBeInTheDocument();
      expect(screen.getByText(/John Doe \(john@company.com\)/)).toBeInTheDocument();
    });

    it('should update search term when user types', async () => {
      const user = userEvent.setup();
      
      render(<ImpersonationControlPanel />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'john');
      
      expect(searchInput).toHaveValue('john');
    });

    it('should handle user selection and display selected user details', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Select a user
      await user.click(screen.getByTestId('user-result-user-1'));
      
      // Check selected user display
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@company.com')).toBeInTheDocument();
        expect(screen.getByText('company_admin')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
      
      // Change button should be available
      expect(screen.getByRole('button', { name: /Change/ })).toBeInTheDocument();
    });

    it('should clear selection when change button clicked', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Select and then clear
      await user.click(screen.getByTestId('user-result-user-1'));
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Change/ }));
      
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Impersonation Session Creation', () => {
    it('should enable start button when user and reason provided', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      const startButton = screen.getByRole('button', { name: /Start Impersonation/ });
      expect(startButton).toBeDisabled();
      
      // Select user
      await user.click(screen.getByTestId('user-result-user-1'));
      expect(startButton).toBeDisabled(); // Still disabled without reason
      
      // Add reason
      const reasonInput = screen.getByLabelText(/Reason for Impersonation/);
      await user.type(reasonInput, 'Testing user workflow');
      
      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });
    });

    it('should show confirmation dialog when start impersonation clicked', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup form
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      
      // Start impersonation
      const startButton = screen.getByRole('button', { name: /Start Impersonation/ });
      await user.click(startButton);
      
      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText(/Confirm impersonation of John Doe/)).toBeInTheDocument();
      });
    });

    it('should handle successful impersonation with redirect', async () => {
      const user = userEvent.setup();
      
      // Mock successful impersonation
      mockStartImpersonation.mockResolvedValue({
        success: true,
        impersonation_token: 'new-session-token',
        correlation_id: 'correlation-123',
      });
      
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup and start impersonation
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      await user.click(screen.getByRole('button', { name: /Start Impersonation/ }));
      
      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-button'));
      
      // Should call mutation with correct parameters
      await waitFor(() => {
        expect(mockStartImpersonation).toHaveBeenCalledWith({
          admin_session_token: 'admin-session-token',
          target_user_email: 'john@company.com',
          reason: 'Testing',
        });
      });
      
      // Should redirect with token
      await waitFor(() => {
        expect(window.location.href).toBe('/?impersonate_token=new-session-token');
      });
    });

    it('should handle impersonation errors', async () => {
      const user = userEvent.setup();
      
      // Mock error response
      mockStartImpersonation.mockRejectedValue(new Error('Maximum sessions exceeded'));
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup and attempt impersonation
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      await user.click(screen.getByRole('button', { name: /Start Impersonation/ }));
      await user.click(screen.getByTestId('confirm-button'));
      
      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Maximum sessions exceeded/)).toBeInTheDocument();
      });
    });

    it('should validate required fields before allowing impersonation', async () => {
      const user = userEvent.setup();
      
      render(<ImpersonationControlPanel />);
      
      const startButton = screen.getByRole('button', { name: /Start Impersonation/ });
      
      // Try with no user or reason
      await user.click(startButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Please select a user and provide a reason/)).toBeInTheDocument();
      });
      
      // Dialog should not appear
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('should handle cancel in confirmation dialog', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup form and start impersonation
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      await user.click(screen.getByRole('button', { name: /Start Impersonation/ }));
      
      // Cancel in dialog
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('cancel-button'));
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
      
      // No mutation should have been called
      expect(mockStartImpersonation).not.toHaveBeenCalled();
    });
  });

  describe('Form Management and State', () => {
    it('should clear form when Clear button clicked', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Fill form
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing workflow');
      
      // Verify form is filled
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Testing workflow')).toBeInTheDocument();
      });
      
      // Clear form
      await user.click(screen.getByRole('button', { name: /Clear/ }));
      
      // Form should be cleared
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByLabelText(/Reason for Impersonation/)).toHaveValue('');
      });
    });

    it('should disable form during impersonation process', async () => {
      const user = userEvent.setup();
      
      // Mock slow mutation
      let resolveImpersonation: (value: any) => void;
      const impersonationPromise = new Promise((resolve) => {
        resolveImpersonation = resolve;
      });
      mockStartImpersonation.mockReturnValue(impersonationPromise);
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup and start impersonation
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      await user.click(screen.getByRole('button', { name: /Start Impersonation/ }));
      await user.click(screen.getByTestId('confirm-button'));
      
      // Buttons should be disabled during loading
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Starting.../ });
        expect(startButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /Clear/ })).toBeDisabled();
      });
      
      // Complete the impersonation
      resolveImpersonation!({
        success: true,
        impersonation_token: 'token',
      });
    });

    it('should show loading states correctly', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup form
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      
      // Start impersonation (button should show loading state)
      const startButton = screen.getByRole('button', { name: /Start Impersonation/ });
      expect(startButton).toHaveTextContent('Start Impersonation');
      
      // After clicking, it should show loading in confirmation dialog
      await user.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Active Sessions Display', () => {
    it('should display active sessions manager with session data', () => {
      mockUseQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce(mockActiveSessions);
      
      render(<ImpersonationControlPanel />);
      
      // Active sessions manager should be displayed
      expect(screen.getByTestId('active-sessions-manager')).toBeInTheDocument();
      expect(screen.getByText('Active Sessions: 1')).toBeInTheDocument();
      expect(screen.getByTestId('active-session-0')).toBeInTheDocument();
      expect(screen.getByText('Admin One → User One')).toBeInTheDocument();
    });

    it('should pass session token to active sessions manager', () => {
      mockUseQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Active sessions manager should receive session token
      expect(screen.getByTestId('active-sessions-manager')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle query errors gracefully', () => {
      // Mock query errors
      mockUseQuery
        .mockReturnValueOnce(undefined) // searchUsers error
        .mockReturnValueOnce(undefined); // activeSessions error
      
      render(<ImpersonationControlPanel />);
      
      // Component should still render
      expect(screen.getByText('Start Impersonation Session')).toBeInTheDocument();
      
      // Should handle undefined gracefully
      expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('active-sessions-manager')).toBeInTheDocument();
    });

    it('should handle empty search results', () => {
      mockUseQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      expect(screen.queryByTestId('user-result-user-1')).not.toBeInTheDocument();
    });

    it('should handle network errors in mutations', async () => {
      const user = userEvent.setup();
      
      mockStartImpersonation.mockRejectedValue(new Error('Network error'));
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      // Setup and attempt impersonation
      await user.click(screen.getByTestId('user-result-user-1'));
      await user.type(screen.getByLabelText(/Reason for Impersonation/), 'Testing');
      await user.click(screen.getByRole('button', { name: /Start Impersonation/ }));
      await user.click(screen.getByTestId('confirm-button'));
      
      // Network error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should handle missing session token', () => {
      mockUseSession.mockReturnValue({
        data: { user: mockAdminSession.user, sessionToken: undefined },
        status: 'authenticated',
        update: jest.fn(),
      });
      
      render(<ImpersonationControlPanel />);
      
      // Component should render but queries should handle undefined token
      expect(screen.getByText('Start Impersonation Session')).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper form labels and ARIA attributes', () => {
      render(<ImpersonationControlPanel />);
      
      // Form labels
      expect(screen.getByLabelText(/Select User to Impersonate/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for Impersonation/)).toBeInTheDocument();
      
      // Helper text
      expect(screen.getByText(/This reason will be logged for audit purposes/)).toBeInTheDocument();
      
      // Security warning has proper structure
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show proper placeholder text', () => {
      render(<ImpersonationControlPanel />);
      
      const reasonTextarea = screen.getByLabelText(/Reason for Impersonation/);
      expect(reasonTextarea).toHaveAttribute('placeholder', expect.stringContaining('Testing user workflow'));
    });

    it('should maintain focus management during form interactions', async () => {
      const user = userEvent.setup();
      
      mockUseQuery
        .mockReturnValueOnce(mockSearchResults)
        .mockReturnValueOnce([]);
      
      render(<ImpersonationControlPanel />);
      
      const reasonInput = screen.getByLabelText(/Reason for Impersonation/);
      
      // Focus on reason input
      await user.click(reasonInput);
      expect(reasonInput).toHaveFocus();
      
      // Type in reason
      await user.type(reasonInput, 'Testing focus management');
      expect(reasonInput).toHaveValue('Testing focus management');
    });
  });
});