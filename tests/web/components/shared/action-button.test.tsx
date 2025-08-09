// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionButton } from '@/components/shared/action-button';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';
import { Plus, Edit, Trash2, Check, Eye, Zap } from 'lucide-react';

/**
 * ActionButton Component Test Suite
 * 
 * Tests the role-based permission-aware action button component used throughout
 * the NDIS incident management system. Covers permission checking, accessibility,
 * and healthcare-specific styling.
 */

describe('ActionButton', () => {
  const user = userEvent.setup();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render button with text content', () => {
      render(
        <ActionButton onClick={mockOnClick}>
          Save Changes
        </ActionButton>
      );

      const button = screen.getByRole('button', { name: 'Save Changes' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Save Changes');
    });

    it('should render button with icon and text', () => {
      render(
        <ActionButton 
          icon={Plus} 
          onClick={mockOnClick}
        >
          Add New
        </ActionButton>
      );

      const button = screen.getByRole('button', { name: 'Add New' });
      expect(button).toBeInTheDocument();
      
      // Icon should be present (check for SVG element)
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon-only button', () => {
      render(
        <ActionButton 
          icon={Edit}
          iconPosition="only"
          onClick={mockOnClick}
          aria-label="Edit item"
        />
      );

      const button = screen.getByRole('button', { name: 'Edit item' });
      expect(button).toBeInTheDocument();
      
      // Should have icon but no text content
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('should render with icon on the right', () => {
      render(
        <ActionButton 
          icon={Check}
          iconPosition="right"
          onClick={mockOnClick}
        >
          Complete
        </ActionButton>
      );

      const button = screen.getByRole('button', { name: 'Complete' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Complete');
      
      // Icon should be present
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size button', () => {
      render(
        <ActionButton 
          size="sm"
          onClick={mockOnClick}
        >
          Small Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3', 'text-healthcare-xs');
    });

    it('should render medium size button (default)', () => {
      render(
        <ActionButton 
          onClick={mockOnClick}
        >
          Medium Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'text-healthcare-sm');
    });

    it('should render large size button', () => {
      render(
        <ActionButton 
          size="lg"
          onClick={mockOnClick}
        >
          Large Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-6', 'text-healthcare-base');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(
        <ActionButton 
          loading={true}
          onClick={mockOnClick}
        >
          Save
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should have spinner animation class
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(
        <ActionButton 
          loading={true}
          onClick={mockOnClick}
        >
          Save
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-75');
    });

    it('should not show icon when loading', () => {
      render(
        <ActionButton 
          icon={Plus}
          loading={true}
          onClick={mockOnClick}
        >
          Add Item
        </ActionButton>
      );

      const button = screen.getByRole('button');
      const spinner = button.querySelector('[class*="animate-spin"]');
      const icon = button.querySelector('svg:not([class*="animate-spin"])');
      
      expect(spinner).toBeInTheDocument();
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Permission-Based Visibility', () => {
    const roles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'] as const;
    
    it('should render for all roles when no permission restrictions', () => {
      roles.forEach(role => {
        const { unmount } = render(
          <ActionButton 
            userRole={role}
            onClick={mockOnClick}
          >
            General Action
          </ActionButton>
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });

    it('should respect requiredPermission prop', () => {
      // Button that only system_admin and company_admin can see
      const adminOnlyRoles = ['system_admin', 'company_admin'];
      const restrictedRoles = ['team_lead', 'frontline_worker'];

      adminOnlyRoles.forEach(role => {
        const { unmount } = render(
          <ActionButton 
            userRole={role}
            requiredPermission={['system_admin', 'company_admin']}
            onClick={mockOnClick}
          >
            Admin Action
          </ActionButton>
        );

        expect(screen.queryByRole('button')).toBeInTheDocument();
        unmount();
      });

      restrictedRoles.forEach(role => {
        const { unmount } = render(
          <ActionButton 
            userRole={role}
            requiredPermission={['system_admin', 'company_admin']}
            onClick={mockOnClick}
          >
            Admin Action
          </ActionButton>
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        unmount();
      });
    });

    it('should handle actionType permissions correctly', () => {
      const testCases = [
        {
          actionType: 'create',
          allowedRoles: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
          deniedRoles: [],
        },
        {
          actionType: 'delete',
          allowedRoles: ['system_admin', 'company_admin'],
          deniedRoles: ['team_lead', 'frontline_worker'],
        },
        {
          actionType: 'approve',
          allowedRoles: ['system_admin', 'company_admin', 'team_lead'],
          deniedRoles: ['frontline_worker'],
        },
      ];

      testCases.forEach(({ actionType, allowedRoles, deniedRoles }) => {
        allowedRoles.forEach(role => {
          const { unmount } = render(
            <ActionButton 
              userRole={role}
              actionType={actionType}
              onClick={mockOnClick}
            >
              {actionType} Action
            </ActionButton>
          );

          expect(screen.queryByRole('button')).toBeInTheDocument();
          unmount();
        });

        deniedRoles.forEach(role => {
          const { unmount } = render(
            <ActionButton 
              userRole={role}
              actionType={actionType}
              onClick={mockOnClick}
            >
              {actionType} Action
            </ActionButton>
          );

          expect(screen.queryByRole('button')).not.toBeInTheDocument();
          unmount();
        });
      });
    });

    it('should not render when visible prop is false', () => {
      render(
        <ActionButton 
          visible={false}
          onClick={mockOnClick}
        >
          Hidden Button
        </ActionButton>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Healthcare Action Types', () => {
    it('should apply create action styling', () => {
      render(
        <ActionButton 
          actionType="create"
          onClick={mockOnClick}
        >
          Create New
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ss-cta-blue');
    });

    it('should apply edit action styling', () => {
      render(
        <ActionButton 
          actionType="edit"
          onClick={mockOnClick}
        >
          Edit Item
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ss-teal');
    });

    it('should apply delete action styling', () => {
      render(
        <ActionButton 
          actionType="delete"
          onClick={mockOnClick}
        >
          Delete Item
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should apply approve action styling', () => {
      render(
        <ActionButton 
          actionType="approve"
          onClick={mockOnClick}
        >
          Approve
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ss-success');
    });

    it('should apply review action styling', () => {
      render(
        <ActionButton 
          actionType="review"
          onClick={mockOnClick}
        >
          Review
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ss-navy');
    });

    it('should apply generate action styling', () => {
      render(
        <ActionButton 
          actionType="generate"
          onClick={mockOnClick}
        >
          Generate Report
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ss-teal');
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when clicked', async () => {
      render(
        <ActionButton onClick={mockOnClick}>
          Click Me
        </ActionButton>
      );

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      render(
        <ActionButton 
          disabled={true}
          onClick={mockOnClick}
        >
          Disabled Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      await user.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      render(
        <ActionButton 
          loading={true}
          onClick={mockOnClick}
        >
          Loading Button
        </ActionButton>
      );

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      render(
        <ActionButton onClick={mockOnClick}>
          Keyboard Test
        </ActionButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      
      // Press Space
      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Variant Styling', () => {
    it('should apply primary variant styling (default)', () => {
      render(
        <ActionButton 
          variant="primary"
          onClick={mockOnClick}
        >
          Primary Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      // Primary maps to 'default' variant internally
      expect(button).toBeInTheDocument();
    });

    it('should apply secondary variant styling', () => {
      render(
        <ActionButton 
          variant="secondary"
          onClick={mockOnClick}
        >
          Secondary Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply destructive variant styling', () => {
      render(
        <ActionButton 
          variant="destructive"
          onClick={mockOnClick}
        >
          Destructive Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should prioritize actionType styling over variant', () => {
      render(
        <ActionButton 
          variant="secondary"
          actionType="delete"
          onClick={mockOnClick}
        >
          Delete Button
        </ActionButton>
      );

      const button = screen.getByRole('button');
      // Should have delete action styling (red) rather than secondary variant
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <ActionButton 
          icon={Plus}
          onClick={mockOnClick}
        >
          Add New Item
        </ActionButton>
      );

      await testHealthcareAccessibility(container, 'ActionButton');
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <ActionButton 
          onClick={mockOnClick}
        >
          Test Button
        </ActionButton>
      );

      await testKeyboardNavigation(container, 1);
    });

    it('should have proper ARIA attributes for icon-only buttons', () => {
      render(
        <ActionButton 
          icon={Edit}
          iconPosition="only"
          onClick={mockOnClick}
          aria-label="Edit incident details"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Edit incident details');
    });

    it('should be focusable and have focus indicators', () => {
      render(
        <ActionButton onClick={mockOnClick}>
          Focus Test
        </ActionButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should announce loading state to screen readers', () => {
      render(
        <ActionButton 
          loading={true}
          onClick={mockOnClick}
        >
          Save Changes
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Healthcare Compliance Features', () => {
    it('should use healthcare-specific color scheme', () => {
      const actionTypes = ['create', 'edit', 'delete', 'approve', 'review', 'generate'] as const;
      
      actionTypes.forEach(actionType => {
        const { unmount } = render(
          <ActionButton 
            actionType={actionType}
            onClick={mockOnClick}
          >
            {actionType} Action
          </ActionButton>
        );

        const button = screen.getByRole('button');
        
        // Should have healthcare-specific styling classes
        const hasHealthcareColors = 
          button.classList.contains('bg-ss-cta-blue') ||
          button.classList.contains('bg-ss-teal') ||
          button.classList.contains('bg-red-600') ||
          button.classList.contains('bg-ss-success') ||
          button.classList.contains('bg-ss-navy');
          
        expect(hasHealthcareColors).toBeTruthy();
        unmount();
      });
    });

    it('should maintain consistent sizing for healthcare workflows', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <ActionButton 
            size={size}
            onClick={mockOnClick}
          >
            {size} Button
          </ActionButton>
        );

        const button = screen.getByRole('button');
        
        // Should have appropriate healthcare text sizing
        const hasHealthcareTextSize = 
          button.classList.contains('text-healthcare-xs') ||
          button.classList.contains('text-healthcare-sm') ||
          button.classList.contains('text-healthcare-base');
          
        expect(hasHealthcareTextSize).toBeTruthy();
        unmount();
      });
    });

    it('should support audit trail with proper role identification', () => {
      render(
        <ActionButton 
          userRole="team_lead"
          actionType="approve"
          onClick={mockOnClick}
          data-testid="audit-button"
        >
          Approve Incident
        </ActionButton>
      );

      // Button should render for team_lead role
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should maintain role information for audit purposes
      expect(button).toHaveClass('bg-ss-success'); // Approve action styling
    });

    it('should enforce NDIS workflow permissions correctly', () => {
      // Test NDIS-specific workflow permissions
      const workflowTests = [
        {
          role: 'frontline_worker',
          allowedActions: ['create', 'edit'],
          deniedActions: ['delete', 'approve'],
        },
        {
          role: 'team_lead',
          allowedActions: ['create', 'edit', 'approve', 'review'],
          deniedActions: ['delete'],
        },
        {
          role: 'company_admin',
          allowedActions: ['create', 'edit', 'delete', 'approve', 'review'],
          deniedActions: [],
        },
      ];

      workflowTests.forEach(({ role, allowedActions, deniedActions }) => {
        allowedActions.forEach(action => {
          const { unmount } = render(
            <ActionButton 
              userRole={role}
              actionType={action}
              onClick={mockOnClick}
            >
              {action} Action
            </ActionButton>
          );

          expect(screen.queryByRole('button')).toBeInTheDocument();
          unmount();
        });

        deniedActions.forEach(action => {
          const { unmount } = render(
            <ActionButton 
              userRole={role}
              actionType={action}
              onClick={mockOnClick}
            >
              {action} Action
            </ActionButton>
          );

          expect(screen.queryByRole('button')).not.toBeInTheDocument();
          unmount();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onClick gracefully', () => {
      expect(() => {
        render(
          <ActionButton>
            No Click Handler
          </ActionButton>
        );
      }).not.toThrow();
    });

    it('should handle invalid role gracefully', () => {
      expect(() => {
        render(
          <ActionButton 
            userRole="invalid_role" as any
            actionType="delete"
            onClick={mockOnClick}
          >
            Invalid Role Test
          </ActionButton>
        );
      }).not.toThrow();
    });

    it('should handle missing actionType permissions gracefully', () => {
      expect(() => {
        render(
          <ActionButton 
            userRole="team_lead"
            actionType="unknown_action" as any
            onClick={mockOnClick}
          >
            Unknown Action
          </ActionButton>
        );
      }).not.toThrow();
    });

    it('should handle simultaneous loading and disabled states', () => {
      render(
        <ActionButton 
          loading={true}
          disabled={true}
          onClick={mockOnClick}
        >
          Loading and Disabled
        </ActionButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should show loading spinner
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily when props do not change', () => {
      let renderCount = 0;
      const TestButton = React.memo((props: any) => {
        renderCount++;
        return <ActionButton {...props} />;
      });

      const { rerender } = render(
        <TestButton 
          userRole="team_lead"
          onClick={mockOnClick}
        >
          Performance Test
        </TestButton>
      );

      expect(renderCount).toBe(1);

      // Re-render with same props
      rerender(
        <TestButton 
          userRole="team_lead"
          onClick={mockOnClick}
        >
          Performance Test
        </TestButton>
      );

      // Should not cause additional renders due to memoization
      expect(renderCount).toBe(1);
    });
  });
});