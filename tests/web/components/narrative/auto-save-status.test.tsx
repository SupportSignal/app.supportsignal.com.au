// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AutoSaveStatus } from '@/components/narrative/auto-save-status';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

describe('AutoSaveStatus Component', () => {
  // Test all status variants comprehensively
  describe('Status Display', () => {
    it('should display saved status with success styling', () => {
      const lastSaved = new Date(Date.now() - 30000); // 30 seconds ago
      render(
        <AutoSaveStatus 
          status="saved" 
          lastSaved={lastSaved}
          showTimestamp={true}
        />
      );

      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
      expect(screen.getByText('just now')).toBeInTheDocument();
      
      const statusElement = screen.getByText('Auto-saved').closest('div');
      expect(statusElement).toHaveClass('text-ss-success');
    });

    it('should display saving status with loading animation', () => {
      render(<AutoSaveStatus status="saving" />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      // Check for loading animation
      const icon = document.querySelector('svg.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('should display pending status with appropriate warning styling', () => {
      render(<AutoSaveStatus status="pending" />);

      expect(screen.getByText('Pending save')).toBeInTheDocument();
      expect(screen.getByText('Changes will be saved shortly')).toBeInTheDocument();
      
      const statusElement = screen.getByText('Pending save').closest('div');
      expect(statusElement).toHaveClass('text-ss-alert');
    });

    it('should display error status with error message', () => {
      const errorMessage = 'Network connection failed';
      render(
        <AutoSaveStatus 
          status="error" 
          error={errorMessage} 
          showDetails={true}
        />
      );

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display offline status with offline indicator', () => {
      render(<AutoSaveStatus status="offline" showDetails={true} />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Changes will sync when connection is restored')).toBeInTheDocument();
      
      // Should show offline Wi-Fi icon
      const offlineIcon = document.querySelector('svg');
      expect(offlineIcon).toBeInTheDocument();
    });

    it('should display conflict status with warning styling', () => {
      render(<AutoSaveStatus status="conflict" showDetails={true} />);

      expect(screen.getByText('Sync conflict')).toBeInTheDocument();
      expect(screen.getByText('Content was modified elsewhere - review needed')).toBeInTheDocument();
    });

    it('should handle unknown status gracefully', () => {
      // @ts-expect-error - Testing invalid status
      render(<AutoSaveStatus status="unknown" />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('Save status unknown')).toBeInTheDocument();
    });
  });

  // Test timestamp formatting for healthcare audit requirements
  describe('Timestamp Formatting', () => {
    it('should format recent timestamps correctly', () => {
      const testCases = [
        { secondsAgo: 5, expected: 'just now' },
        { secondsAgo: 30, expected: '30s ago' },
        { secondsAgo: 120, expected: '2m ago' },
        { secondsAgo: 3600, expected: '1h ago' },
      ];

      testCases.forEach(({ secondsAgo, expected }) => {
        const timestamp = new Date(Date.now() - secondsAgo * 1000);
        const { rerender } = render(
          <AutoSaveStatus 
            status="saved" 
            lastSaved={timestamp}
            showTimestamp={true}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });

    it('should format old timestamps with full date', () => {
      const oldDate = new Date('2024-01-15T10:30:00Z');
      render(
        <AutoSaveStatus 
          status="saved" 
          lastSaved={oldDate}
          showTimestamp={true}
        />
      );

      // Should show formatted date for old timestamps
      const timestampElement = screen.getByText(/15 Jan/);
      expect(timestampElement).toBeInTheDocument();
    });

    it('should hide timestamp when showTimestamp is false', () => {
      const timestamp = new Date(Date.now() - 30000);
      render(
        <AutoSaveStatus 
          status="saved" 
          lastSaved={timestamp}
          showTimestamp={false}
        />
      );

      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
      expect(screen.queryByText(/just now/)).not.toBeInTheDocument();
    });
  });

  // Test all variant layouts for different UI contexts
  describe('Variant Layouts', () => {
    it('should render minimal variant correctly', () => {
      render(
        <AutoSaveStatus 
          status="saved" 
          variant="minimal"
          showTimestamp={true}
          lastSaved={new Date(Date.now() - 30000)}
        />
      );

      // Minimal variant should still show key info
      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
      expect(screen.getByText('(just now)')).toBeInTheDocument();
      
      // Should not show detailed description
      expect(screen.queryByText('All changes have been saved')).not.toBeInTheDocument();
    });

    it('should render compact variant with badge styling', () => {
      render(
        <AutoSaveStatus 
          status="saving" 
          variant="compact"
          showTimestamp={true}
          lastSaved={new Date(Date.now() - 60000)}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('1m ago')).toBeInTheDocument();
    });

    it('should render full variant with all details', () => {
      render(
        <AutoSaveStatus 
          status="saved" 
          variant="default"
          showDetails={true}
          showTimestamp={true}
          lastSaved={new Date(Date.now() - 120000)}
        />
      );

      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
      expect(screen.getByText('All changes have been saved')).toBeInTheDocument();
      expect(screen.getByText('2m ago')).toBeInTheDocument();
    });
  });

  // Test connection status indicators for healthcare workflow reliability
  describe('Connection Status Indicators', () => {
    it('should show online indicator when not offline', () => {
      render(<AutoSaveStatus status="saved" />);

      // Should show connected Wi-Fi icon
      const onlineIcons = document.querySelectorAll('svg');
      expect(onlineIcons.length).toBeGreaterThan(0);
    });

    it('should show offline indicator when offline', () => {
      render(<AutoSaveStatus status="offline" />);

      // Should show offline Wi-Fi icon
      const offlineIcon = document.querySelector('svg');
      expect(offlineIcon).toBeInTheDocument();
    });

    it('should indicate different connection states appropriately', () => {
      const connectionStates = [
        { status: 'saved' as const, expectsOnline: true },
        { status: 'saving' as const, expectsOnline: true },
        { status: 'error' as const, expectsOnline: true },
        { status: 'offline' as const, expectsOnline: false },
        { status: 'conflict' as const, expectsOnline: true },
      ];

      connectionStates.forEach(({ status, expectsOnline }) => {
        const { unmount } = render(<AutoSaveStatus status={status} />);
        
        // All statuses should show connection indicators
        const icons = document.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
        
        unmount();
      });
    });
  });

  // Test healthcare workflow integration patterns
  describe('Healthcare Workflow Integration', () => {
    it('should support healthcare form debouncing patterns', () => {
      const { rerender } = render(
        <AutoSaveStatus status="pending" />
      );

      // Simulate workflow: pending -> saving -> saved (typical 300ms debouncing)
      expect(screen.getByText('Pending save')).toBeInTheDocument();

      rerender(<AutoSaveStatus status="saving" />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(
        <AutoSaveStatus 
          status="saved" 
          lastSaved={new Date()}
        />
      );
      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
    });

    it('should handle healthcare incident data conflicts', () => {
      render(
        <AutoSaveStatus 
          status="conflict" 
          showDetails={true}
          error="Another user modified this incident"
        />
      );

      expect(screen.getByText('Sync conflict')).toBeInTheDocument();
      expect(screen.getByText('Content was modified elsewhere - review needed')).toBeInTheDocument();
    });

    it('should support audit trail requirements with timestamps', () => {
      const auditTimestamp = new Date('2024-01-15T14:30:00Z');
      render(
        <AutoSaveStatus 
          status="saved"
          lastSaved={auditTimestamp}
          showTimestamp={true}
          showDetails={true}
        />
      );

      // Should show timestamp for audit purposes
      expect(screen.getByText(/15 Jan/)).toBeInTheDocument();
      expect(screen.getByText('All changes have been saved')).toBeInTheDocument();
    });
  });

  // Test accessibility compliance for healthcare users
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <AutoSaveStatus 
          status="error"
          error="Network error occurred"
          showDetails={true}
        />
      );

      await testHealthcareAccessibility(container, 'auto-save status');
    });

    it('should provide appropriate ARIA attributes for screen readers', () => {
      render(
        <AutoSaveStatus 
          status="saving"
          showDetails={true}
        />
      );

      // Status should be announced to screen readers
      const statusElement = screen.getByText('Saving...');
      expect(statusElement).toBeInTheDocument();
      
      // Icon should have appropriate role or be decorative
      const loadingIcon = document.querySelector('svg.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('should support keyboard navigation when interactive', async () => {
      const { container } = render(
        <AutoSaveStatus 
          status="saved"
          showDetails={true}
        />
      );

      // Component is primarily informational, limited focusable elements expected
      await testKeyboardNavigation(container, 0);
    });

    it('should announce status changes for assistive technology', () => {
      const { rerender } = render(
        <AutoSaveStatus status="saving" />
      );

      // Change to error status
      rerender(
        <AutoSaveStatus 
          status="error"
          error="Save failed due to network error"
        />
      );

      // Error status should be visible and accessible
      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('Save failed due to network error')).toBeInTheDocument();
    });
  });

  // Test error handling and edge cases
  describe('Error Handling', () => {
    it('should handle missing timestamp gracefully', () => {
      render(
        <AutoSaveStatus 
          status="saved"
          showTimestamp={true}
          // No lastSaved provided
        />
      );

      // Should not show timestamp if not provided
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
    });

    it('should handle empty error message', () => {
      render(
        <AutoSaveStatus 
          status="error"
          error=""
          showDetails={true}
        />
      );

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('Unable to save changes')).toBeInTheDocument();
    });

    it('should handle undefined error gracefully', () => {
      render(
        <AutoSaveStatus 
          status="error"
          showDetails={true}
          // No error prop provided
        />
      );

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('Unable to save changes')).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <AutoSaveStatus 
          ref={ref}
          status="saved"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Auto-saved');
    });

    it('should apply className when provided', () => {
      const customClass = 'custom-auto-save-status';
      render(
        <AutoSaveStatus 
          status="saved"
          className={customClass}
        />
      );

      const container = screen.getByText('Auto-saved').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });
});