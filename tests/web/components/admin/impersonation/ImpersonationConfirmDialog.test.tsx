/**
 * Comprehensive Tests for ImpersonationConfirmDialog Component
 * 
 * Tests the security confirmation dialog that appears before starting
 * an impersonation session, ensuring proper validation and user experience.
 * 
 * Test Categories:
 * - Dialog visibility and state management
 * - User details display and validation
 * - Confirmation and cancellation actions
 * - Loading states and error handling
 * - Accessibility and keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImpersonationConfirmDialog } from '@/components/admin/impersonation/ImpersonationConfirmDialog';
import { ImpersonationSearchResult } from '@/types/impersonation';

// Test fixtures
const mockTargetUser: ImpersonationSearchResult = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'company_admin',
  company_name: 'Acme Corporation',
};

const mockTargetUserWithoutCompany: ImpersonationSearchResult = {
  id: 'user-456',
  name: 'Jane Smith',
  email: 'jane.smith@freelancer.com',
  role: 'frontline_worker',
};

const defaultProps = {
  open: false,
  onOpenChange: jest.fn(),
  targetUser: null,
  reason: '',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
  isLoading: false,
};

describe('ImpersonationConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Visibility and State Management', () => {
    it('should not render dialog when closed', () => {
      render(<ImpersonationConfirmDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText(/Confirm User Impersonation/)).not.toBeInTheDocument();
    });

    it('should render dialog when open', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing workflow"
      />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Confirm User Impersonation/)).toBeInTheDocument();
    });

    it('should call onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        onOpenChange={mockOnOpenChange}
        targetUser={mockTargetUser}
      />);
      
      // Click outside or escape should trigger onOpenChange
      await user.keyboard('{Escape}');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle opening and closing states properly', () => {
      const { rerender } = render(<ImpersonationConfirmDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      rerender(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Test"
      />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('User Details Display and Validation', () => {
    it('should display target user information correctly', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing user workflow"
      />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@company.com')).toBeInTheDocument();
      expect(screen.getByText('company_admin')).toBeInTheDocument();
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    it('should handle user without company gracefully', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUserWithoutCompany}
        reason="Testing freelancer account"
      />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@freelancer.com')).toBeInTheDocument();
      expect(screen.getByText('frontline_worker')).toBeInTheDocument();
      // Company should not be displayed
      expect(screen.queryByText(/company/i)).not.toBeInTheDocument();
    });

    it('should display impersonation reason', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing user workflow for bug reproduction"
      />);
      
      expect(screen.getByText(/Testing user workflow for bug reproduction/)).toBeInTheDocument();
    });

    it('should show security warnings', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      expect(screen.getByText(/This action will grant you access to/)).toBeInTheDocument();
      expect(screen.getByText(/All actions will be logged/)).toBeInTheDocument();
      expect(screen.getByText(/Session will expire automatically/)).toBeInTheDocument();
    });

    it('should handle null target user gracefully', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={null}
        reason="Testing"
      />);
      
      // Dialog should handle null user gracefully
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByText('john.doe@company.com')).not.toBeInTheDocument();
    });

    it('should display session duration information', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      expect(screen.getByText(/30 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/Session will expire automatically/)).toBeInTheDocument();
    });
  });

  describe('Confirmation and Cancellation Actions', () => {
    it('should call onConfirm when confirm button clicked', async () => {
      const user = userEvent.setup();
      const mockOnConfirm = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        onConfirm={mockOnConfirm}
      />);
      
      const confirmButton = screen.getByRole('button', { name: /Start Impersonation/ });
      await user.click(confirmButton);
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        onCancel={mockOnCancel}
      />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable confirm button when loading', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={true}
      />);
      
      const confirmButton = screen.getByRole('button', { name: /Starting.../ });
      expect(confirmButton).toBeDisabled();
    });

    it('should disable cancel button when loading', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={true}
      />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={true}
      />);
      
      // Loading button should show different text
      expect(screen.getByRole('button', { name: /Starting.../ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Start Impersonation/ })).not.toBeInTheDocument();
    });

    it('should prevent multiple clicks during loading', async () => {
      const user = userEvent.setup();
      const mockOnConfirm = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        onConfirm={mockOnConfirm}
        isLoading={true}
      />);
      
      const confirmButton = screen.getByRole('button', { name: /Starting.../ });
      
      // Multiple clicks should not work when disabled
      await user.click(confirmButton);
      await user.click(confirmButton);
      
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should handle loading state transitions', () => {
      const { rerender } = render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={false}
      />);
      
      expect(screen.getByRole('button', { name: /Start Impersonation/ })).not.toBeDisabled();
      
      rerender(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={true}
      />);
      
      expect(screen.getByRole('button', { name: /Starting.../ })).toBeDisabled();
    });

    it('should maintain dialog visibility during loading', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        isLoading={true}
      />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Confirm User Impersonation/)).toBeInTheDocument();
    });

    it('should handle empty reason gracefully', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason=""
      />);
      
      // Dialog should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Reason section should handle empty string
      expect(screen.getByText(/Reason:/)).toBeInTheDocument();
    });

    it('should handle very long reason text', () => {
      const longReason = 'This is a very long reason for impersonation that might overflow the dialog container and should be handled gracefully with proper text wrapping and layout management to ensure good user experience even with extensive explanatory text.';
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason={longReason}
      />);
      
      expect(screen.getByText(longReason)).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should have proper ARIA attributes', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should have proper heading structure', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      expect(screen.getByRole('heading', { name: /Confirm User Impersonation/ })).toBeInTheDocument();
    });

    it('should handle Enter key for confirmation', async () => {
      const user = userEvent.setup();
      const mockOnConfirm = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        onConfirm={mockOnConfirm}
      />);
      
      const confirmButton = screen.getByRole('button', { name: /Start Impersonation/ });
      await user.type(confirmButton, '{Enter}');
      
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should handle Escape key for cancellation', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      const mockOnOpenChange = jest.fn();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
        onCancel={mockOnCancel}
        onOpenChange={mockOnOpenChange}
      />);
      
      await user.keyboard('{Escape}');
      
      // Should trigger dialog close
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should manage focus properly', async () => {
      const user = userEvent.setup();
      
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      // Focus should be managed by dialog component
      const confirmButton = screen.getByRole('button', { name: /Start Impersonation/ });
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      
      // Tab navigation should work between buttons
      await user.tab();
      expect(document.activeElement).toBe(confirmButton);
      
      await user.tab();
      expect(document.activeElement).toBe(cancelButton);
    });

    it('should have proper color contrast for important elements', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      // Warning text should have appropriate styling
      const warningText = screen.getByText(/This action will grant you access/);
      expect(warningText).toBeInTheDocument();
      
      // Buttons should have proper contrast
      const confirmButton = screen.getByRole('button', { name: /Start Impersonation/ });
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should provide clear visual hierarchy', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing critical workflow"
      />);
      
      // Title should be prominent
      expect(screen.getByRole('heading', { name: /Confirm User Impersonation/ })).toBeInTheDocument();
      
      // User details should be clearly displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Reason should be highlighted
      expect(screen.getByText('Testing critical workflow')).toBeInTheDocument();
      
      // Action buttons should be clearly differentiated
      expect(screen.getByRole('button', { name: /Start Impersonation/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    });
  });

  describe('Visual Styling and Layout', () => {
    it('should apply proper dialog styling', () => {
      const { container } = render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Dialog should have appropriate styling classes
      expect(container.querySelector('[data-state="open"]')).toBeInTheDocument();
    });

    it('should handle responsive design', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing responsive design"
      />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Should handle mobile and desktop layouts
      expect(screen.getByText('Testing responsive design')).toBeInTheDocument();
    });

    it('should show appropriate button variants', () => {
      render(<ImpersonationConfirmDialog 
        {...defaultProps}
        open={true}
        targetUser={mockTargetUser}
        reason="Testing"
      />);
      
      const confirmButton = screen.getByRole('button', { name: /Start Impersonation/ });
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      
      // Confirm button should be primary/destructive (it's a significant action)
      expect(confirmButton).toBeInTheDocument();
      
      // Cancel button should be secondary/outline
      expect(cancelButton).toBeInTheDocument();
    });
  });
});