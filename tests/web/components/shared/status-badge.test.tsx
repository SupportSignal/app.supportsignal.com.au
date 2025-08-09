// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  StatusBadge, 
  IncidentStatusBadge, 
  CaptureStatusBadge, 
  AnalysisStatusBadge,
  STATUS_CONFIG 
} from '@/components/shared/status-badge';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

/**
 * StatusBadge Component Test Suite
 * 
 * Tests the status badge component and its convenience variants used throughout
 * the NDIS incident management workflow to communicate status and progress.
 */

describe('StatusBadge', () => {
  const user = userEvent.setup();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render status badge with correct label and icon', () => {
      render(
        <StatusBadge 
          status="capture_pending" 
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Capture Pending');
      
      // Should have an icon (SVG element)
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render all workflow status types correctly', () => {
      const workflowStatuses = ['capture_pending', 'analysis_pending', 'completed'] as const;
      
      workflowStatuses.forEach(status => {
        const { unmount } = render(
          <StatusBadge status={status} />
        );

        const config = STATUS_CONFIG[status];
        expect(screen.getByText(config.label)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render all generic status types correctly', () => {
      const genericStatuses = ['draft', 'in_progress', 'not_started'] as const;
      
      genericStatuses.forEach(status => {
        const { unmount } = render(
          <StatusBadge status={status} />
        );

        const config = STATUS_CONFIG[status];
        expect(screen.getByText(config.label)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render all alert status types correctly', () => {
      const alertStatuses = ['error', 'warning', 'info', 'success'] as const;
      
      alertStatuses.forEach(status => {
        const { unmount } = render(
          <StatusBadge status={status} />
        );

        const config = STATUS_CONFIG[status];
        expect(screen.getByText(config.label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Size Variants', () => {
    it('should render small size badge', () => {
      render(
        <StatusBadge 
          status="completed" 
          size="sm"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5', 'h-5');
    });

    it('should render medium size badge (default)', () => {
      render(
        <StatusBadge 
          status="completed" 
          size="md"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-sm', 'px-3', 'py-1', 'h-6');
    });

    it('should render large size badge', () => {
      render(
        <StatusBadge 
          status="completed" 
          size="lg"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-base', 'px-4', 'py-1.5', 'h-8');
    });
  });

  describe('Visual Variants', () => {
    it('should render default variant with filled background', () => {
      render(
        <StatusBadge 
          status="capture_pending"
          variant="default"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-workflow-progress', 'text-white');
    });

    it('should render outline variant with border', () => {
      render(
        <StatusBadge 
          status="capture_pending"
          variant="outline"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('border-workflow-progress', 'text-workflow-progress', 'bg-workflow-progress/10', 'border');
    });

    it('should render pill variant with rounded shape', () => {
      render(
        <StatusBadge 
          status="completed"
          variant="pill"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should render dot variant as small indicator', () => {
      render(
        <StatusBadge 
          status="error"
          variant="dot"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('p-0', 'w-2', 'h-2', 'rounded-full');
      
      // Dot variant should have screen reader text
      expect(badge.querySelector('.sr-only')).toHaveTextContent('Error');
    });

    it('should render minimal variant without background', () => {
      render(
        <StatusBadge 
          status="info"
          variant="minimal"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-transparent', 'border-0', 'px-0');
    });
  });

  describe('Icon and Label Display', () => {
    it('should show both icon and label by default', () => {
      render(
        <StatusBadge 
          status="analysis_pending"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Analysis Pending');
      
      // Should have icon
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(
        <StatusBadge 
          status="analysis_pending"
          showIcon={false}
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Analysis Pending');
      
      // Should not have icon
      const icon = badge.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(
        <StatusBadge 
          status="analysis_pending"
          showLabel={false}
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).not.toHaveTextContent('Analysis Pending');
      
      // Should still have icon
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      render(
        <StatusBadge 
          status="in_progress"
          customLabel="Processing Now"
        />
      );

      expect(screen.getByText('Processing Now')).toBeInTheDocument();
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('should handle dot variant icon display', () => {
      render(
        <StatusBadge 
          status="success"
          variant="dot"
          showIcon={true}
        />
      );

      const badge = screen.getByRole('status');
      // Dot variant should not show icons visually
      const visibleIcon = badge.querySelector('svg:not(.sr-only svg)');
      expect(visibleIcon).not.toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should be clickable when onClick is provided', async () => {
      render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
        />
      );

      const badge = screen.getByRole('button'); // Should be button role when clickable
      await user.click(badge);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should change role to button when clickable', () => {
      render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
        />
      );

      const badge = screen.getByRole('button');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('should support keyboard interaction when clickable', async () => {
      render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
        />
      );

      const badge = screen.getByRole('button');
      badge.focus();
      
      // Press Enter
      fireEvent.keyDown(badge, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      
      // Press Space
      fireEvent.keyDown(badge, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('should not be interactive when no onClick provided', () => {
      render(
        <StatusBadge 
          status="completed"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).not.toHaveAttribute('tabIndex');
      expect(badge).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility Features', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <StatusBadge 
          status="analysis_pending"
          onClick={mockOnClick}
        />
      );

      await testHealthcareAccessibility(container, 'StatusBadge');
    });

    it('should have proper ARIA attributes', () => {
      render(
        <StatusBadge 
          status="capture_pending"
          ariaLabel="Custom aria label"
          tooltip="Custom tooltip"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Custom aria label');
      expect(badge).toHaveAttribute('title', 'Custom tooltip');
    });

    it('should have default aria-label with description', () => {
      render(
        <StatusBadge 
          status="error"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Status: Error. An error has occurred');
    });

    it('should support keyboard navigation when clickable', async () => {
      const { container } = render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
        />
      );

      await testKeyboardNavigation(container, 1);
    });

    it('should have proper focus indicators', () => {
      render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
        />
      );

      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should provide screen reader content for dot variant', () => {
      render(
        <StatusBadge 
          status="warning"
          variant="dot"
        />
      );

      const badge = screen.getByRole('status');
      const screenReaderText = badge.querySelector('.sr-only');
      expect(screenReaderText).toHaveTextContent('Warning');
    });
  });

  describe('Healthcare Workflow Colors', () => {
    it('should use correct colors for workflow statuses', () => {
      const workflowTests = [
        {
          status: 'capture_pending',
          expectedBgClass: 'bg-workflow-progress',
          expectedTextClass: 'text-white',
        },
        {
          status: 'analysis_pending',
          expectedBgClass: 'bg-ss-cta-blue',
          expectedTextClass: 'text-white',
        },
        {
          status: 'completed',
          expectedBgClass: 'bg-workflow-completed',
          expectedTextClass: 'text-white',
        },
      ];

      workflowTests.forEach(({ status, expectedBgClass, expectedTextClass }) => {
        const { unmount } = render(
          <StatusBadge status={status as any} />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass(expectedBgClass, expectedTextClass);
        unmount();
      });
    });

    it('should use correct colors for generic statuses', () => {
      const genericTests = [
        {
          status: 'draft',
          expectedBgClass: 'bg-workflow-draft',
        },
        {
          status: 'in_progress',
          expectedBgClass: 'bg-workflow-progress',
        },
        {
          status: 'not_started',
          expectedBgClass: 'bg-gray-500',
        },
      ];

      genericTests.forEach(({ status, expectedBgClass }) => {
        const { unmount } = render(
          <StatusBadge status={status as any} />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass(expectedBgClass);
        unmount();
      });
    });

    it('should use correct colors for alert statuses', () => {
      const alertTests = [
        {
          status: 'error',
          expectedBgClass: 'bg-destructive',
        },
        {
          status: 'warning',
          expectedBgClass: 'bg-workflow-alert',
        },
        {
          status: 'success',
          expectedBgClass: 'bg-ss-success',
        },
        {
          status: 'info',
          expectedBgClass: 'bg-blue-500',
        },
      ];

      alertTests.forEach(({ status, expectedBgClass }) => {
        const { unmount } = render(
          <StatusBadge status={status as any} />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass(expectedBgClass);
        unmount();
      });
    });
  });

  describe('Convenience Components', () => {
    describe('IncidentStatusBadge', () => {
      it('should render incident status correctly', () => {
        const overallStatuses = ['capture_pending', 'analysis_pending', 'completed'] as const;
        
        overallStatuses.forEach(status => {
          const { unmount } = render(
            <IncidentStatusBadge overallStatus={status} />
          );

          const config = STATUS_CONFIG[status];
          expect(screen.getByText(config.label)).toBeInTheDocument();
          unmount();
        });
      });

      it('should pass through props to StatusBadge', () => {
        render(
          <IncidentStatusBadge 
            overallStatus="completed"
            size="lg"
            variant="outline"
          />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('text-base', 'border');
      });
    });

    describe('CaptureStatusBadge', () => {
      it('should render capture status with custom labels', () => {
        const captureTests = [
          { status: 'draft', expectedLabel: 'Draft' },
          { status: 'in_progress', expectedLabel: 'Capturing' },
          { status: 'completed', expectedLabel: 'Captured' },
        ] as const;

        captureTests.forEach(({ status, expectedLabel }) => {
          const { unmount } = render(
            <CaptureStatusBadge captureStatus={status} />
          );

          expect(screen.getByText(expectedLabel)).toBeInTheDocument();
          unmount();
        });
      });

      it('should pass through props to StatusBadge', () => {
        render(
          <CaptureStatusBadge 
            captureStatus="completed"
            variant="pill"
            showIcon={false}
          />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('rounded-full');
        expect(badge.querySelector('svg')).not.toBeInTheDocument();
      });
    });

    describe('AnalysisStatusBadge', () => {
      it('should render analysis status with custom labels', () => {
        const analysisTests = [
          { status: 'not_started', expectedLabel: 'Pending Analysis' },
          { status: 'in_progress', expectedLabel: 'Analyzing' },
          { status: 'completed', expectedLabel: 'Analyzed' },
        ] as const;

        analysisTests.forEach(({ status, expectedLabel }) => {
          const { unmount } = render(
            <AnalysisStatusBadge analysisStatus={status} />
          );

          expect(screen.getByText(expectedLabel)).toBeInTheDocument();
          unmount();
        });
      });

      it('should map status correctly to underlying StatusBadge', () => {
        render(
          <AnalysisStatusBadge analysisStatus="not_started" />
        );

        const badge = screen.getByRole('status');
        // Should use not_started styling
        expect(badge).toHaveClass('bg-gray-500');
      });
    });
  });

  describe('Healthcare Context Integration', () => {
    it('should communicate workflow progress clearly', () => {
      const workflowProgression = [
        'capture_pending',
        'analysis_pending', 
        'completed'
      ] as const;

      workflowProgression.forEach((status, index) => {
        const { unmount } = render(
          <StatusBadge status={status} />
        );

        const badge = screen.getByRole('status');
        const config = STATUS_CONFIG[status];
        
        expect(badge).toHaveTextContent(config.label);
        expect(badge).toHaveAttribute('title', config.description);
        unmount();
      });
    });

    it('should support urgent status indicators', () => {
      render(
        <StatusBadge 
          status="error"
          size="lg"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-destructive', 'text-white');
      expect(badge).toHaveTextContent('Error');
    });

    it('should maintain visual consistency across NDIS workflows', () => {
      // Test that all status types maintain consistent visual patterns
      const allStatuses = Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>;
      
      allStatuses.forEach(status => {
        const { unmount } = render(
          <StatusBadge status={status} />
        );

        const badge = screen.getByRole('status');
        
        // All badges should have consistent base classes
        expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium');
        
        // All should have appropriate size classes
        expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5', 'h-5'); // default sm size
        
        unmount();
      });
    });

    it('should support compliance audit requirements', () => {
      render(
        <StatusBadge 
          status="completed"
          onClick={mockOnClick}
          data-testid="audit-status-badge"
        />
      );

      const badge = screen.getByRole('button');
      
      // Should maintain audit trail capability through interactions
      expect(badge).toHaveAttribute('data-testid', 'audit-status-badge');
      expect(badge).toHaveAttribute('aria-label');
      expect(badge).toHaveAttribute('title');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid status gracefully', () => {
      // Mock console.error to prevent test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <StatusBadge status={'invalid_status' as any} />
        );
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing configuration gracefully', () => {
      // Test with a status that might not have full configuration
      expect(() => {
        render(
          <StatusBadge 
            status="info"
            variant="dot"
            showIcon={true}
            showLabel={false}
          />
        );
      }).not.toThrow();
    });

    it('should handle edge case prop combinations', () => {
      expect(() => {
        render(
          <StatusBadge 
            status="completed"
            showIcon={false}
            showLabel={false}
            variant="minimal"
          />
        );
      }).not.toThrow();
      
      // Badge should still render even with minimal content
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily with same props', () => {
      let renderCount = 0;
      const TestStatusBadge = React.memo((props: any) => {
        renderCount++;
        return <StatusBadge {...props} />;
      });

      const { rerender } = render(
        <TestStatusBadge status="completed" />
      );

      expect(renderCount).toBe(1);

      // Re-render with same props
      rerender(
        <TestStatusBadge status="completed" />
      );

      // Should not cause additional renders due to memoization
      expect(renderCount).toBe(1);
    });

    it('should handle rapid status changes efficiently', () => {
      const { rerender } = render(
        <StatusBadge status="draft" />
      );

      expect(screen.getByText('Draft')).toBeInTheDocument();

      rerender(<StatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();

      rerender(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();

      // Should handle transitions without errors
      expect(screen.queryByText('Draft')).not.toBeInTheDocument();
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });
  });
});