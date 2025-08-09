// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancementIndicator } from '@/components/narrative/enhancement-indicator';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

describe('EnhancementIndicator Component', () => {
  const user = userEvent.setup();

  // Test all enhancement types for AI-assisted healthcare documentation
  describe('Enhancement Types', () => {
    it('should display AI enhanced content indicator', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={87}
          timestamp={new Date('2024-01-15T10:30:00Z')}
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.getByText('Content improved by AI analysis')).toBeInTheDocument();
      expect(screen.getByText('(87%)')).toBeInTheDocument();
    });

    it('should display AI generated content indicator', () => {
      render(
        <EnhancementIndicator 
          type="generated"
          confidence={92}
          content="Generated analysis based on incident patterns..."
        />
      );

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('Content created by AI analysis')).toBeInTheDocument();
      expect(screen.getByText('(92%)')).toBeInTheDocument();
    });

    it('should display processing status with animation', () => {
      render(<EnhancementIndicator type="processing" />);

      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('AI enhancement in progress')).toBeInTheDocument();
      
      // Should show processing animation
      const processingIndicator = screen.getByText('AI is analyzing and enhancing your content...');
      expect(processingIndicator).toBeInTheDocument();
    });

    it('should display pending enhancement status', () => {
      render(<EnhancementIndicator type="pending" />);

      expect(screen.getByText('Enhancement Pending')).toBeInTheDocument();
      expect(screen.getByText('Waiting for AI enhancement')).toBeInTheDocument();
    });

    it('should display error status with failure indication', () => {
      render(<EnhancementIndicator type="error" showActions={true} />);

      expect(screen.getByText('Enhancement Failed')).toBeInTheDocument();
      expect(screen.getByText('AI enhancement encountered an error')).toBeInTheDocument();
    });

    it('should handle unknown type gracefully', () => {
      // @ts-expect-error - Testing invalid type
      render(<EnhancementIndicator type="unknown" />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('Status unknown')).toBeInTheDocument();
    });
  });

  // Test confidence scoring for healthcare AI reliability
  describe('Confidence Scoring', () => {
    it('should display confidence percentage', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={85.7} // Should round to 86
        />
      );

      expect(screen.getByText('(86%)')).toBeInTheDocument();
    });

    it('should handle confidence in different variants', () => {
      const variants = ['default', 'compact', 'minimal'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(
          <EnhancementIndicator 
            type="generated"
            confidence={75.3}
            variant={variant}
          />
        );

        if (variant === 'minimal') {
          expect(screen.getByText('(75%)')).toBeInTheDocument();
        } else {
          expect(screen.getByText(/75% confidence/)).toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should handle missing confidence gracefully', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          variant="minimal"
          // No confidence provided
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.queryByText(/\(\d+%\)/)).not.toBeInTheDocument();
    });

    it('should support high confidence scenarios', () => {
      render(
        <EnhancementIndicator 
          type="generated"
          confidence={96.8}
          variant="compact"
        />
      );

      expect(screen.getByText('97% confidence')).toBeInTheDocument();
    });
  });

  // Test timestamp formatting for audit compliance
  describe('Timestamp Display', () => {
    it('should format timestamps in Australian locale', () => {
      const timestamp = new Date('2024-01-15T14:30:00Z');
      render(
        <EnhancementIndicator 
          type="enhanced"
          timestamp={timestamp}
        />
      );

      // Should format in Australian style
      expect(screen.getByText(/15 Jan/)).toBeInTheDocument();
      expect(screen.getByText(/14:30/)).toBeInTheDocument();
    });

    it('should handle missing timestamp gracefully', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          // No timestamp provided
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      // Should not crash or show undefined
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });
  });

  // Test different variant layouts for UI flexibility
  describe('Variant Layouts', () => {
    it('should render minimal variant correctly', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={85}
          variant="minimal"
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.getByText('(85%)')).toBeInTheDocument();
      
      // Minimal should not show detailed description
      expect(screen.queryByText('Content improved by AI analysis')).not.toBeInTheDocument();
    });

    it('should render compact variant with badge', () => {
      render(
        <EnhancementIndicator 
          type="generated"
          confidence={78}
          variant="compact"
        />
      );

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('78% confidence')).toBeInTheDocument();
    });

    it('should render full variant with all details', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={91}
          timestamp={timestamp}
          variant="default"
          showDetails={true}
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.getByText('Content improved by AI analysis')).toBeInTheDocument();
      expect(screen.getByText('91% confidence')).toBeInTheDocument();
      expect(screen.getByText(/15 Jan.*10:30/)).toBeInTheDocument();
    });
  });

  // Test action buttons for content management
  describe('Action Buttons', () => {
    it('should display view action when provided', async () => {
      const onView = jest.fn();
      render(
        <EnhancementIndicator 
          type="enhanced"
          showActions={true}
          onView={onView}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toBeInTheDocument();

      await user.click(viewButton);
      expect(onView).toHaveBeenCalledTimes(1);
    });

    it('should display revert action for enhanced content', async () => {
      const onRevert = jest.fn();
      render(
        <EnhancementIndicator 
          type="enhanced"
          showActions={true}
          onRevert={onRevert}
        />
      );

      const revertButton = screen.getByRole('button', { name: /revert/i });
      expect(revertButton).toBeInTheDocument();

      await user.click(revertButton);
      expect(onRevert).toHaveBeenCalledTimes(1);
    });

    it('should not show revert for pending or processing states', () => {
      const pendingTypes = ['pending', 'processing'] as const;
      
      pendingTypes.forEach(type => {
        const { unmount } = render(
          <EnhancementIndicator 
            type={type}
            showActions={true}
            onRevert={jest.fn()}
          />
        );

        expect(screen.queryByRole('button', { name: /revert/i })).not.toBeInTheDocument();
        unmount();
      });
    });

    it('should display retry action for error state', async () => {
      const onRetry = jest.fn();
      render(
        <EnhancementIndicator 
          type="error"
          showActions={true}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not display actions when showActions is false', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          showActions={false}
          onView={jest.fn()}
          onRevert={jest.fn()}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // Test content preview for healthcare context
  describe('Content Preview', () => {
    it('should display content preview when showDetails is true', () => {
      const content = 'Enhanced incident analysis: The participant experienced difficulty with mobility assistance during the scheduled therapy session...';
      
      render(
        <EnhancementIndicator 
          type="enhanced"
          content={content}
          showDetails={true}
        />
      );

      expect(screen.getByText('Enhanced Content Preview:')).toBeInTheDocument();
      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('should handle long content appropriately', () => {
      const longContent = 'This is a very long content preview that should be handled appropriately by the component to ensure proper display and accessibility for healthcare professionals reviewing AI-enhanced incident narratives and analysis results.';
      
      render(
        <EnhancementIndicator 
          type="generated"
          content={longContent}
          showDetails={true}
        />
      );

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should not show content preview when showDetails is false', () => {
      const content = 'Hidden content preview';
      
      render(
        <EnhancementIndicator 
          type="enhanced"
          content={content}
          showDetails={false}
        />
      );

      expect(screen.queryByText('Enhanced Content Preview:')).not.toBeInTheDocument();
      expect(screen.queryByText(content)).not.toBeInTheDocument();
    });
  });

  // Test processing state animations
  describe('Processing Animations', () => {
    it('should show processing animation for processing type', () => {
      render(<EnhancementIndicator type="processing" />);

      // Should show spinner animation
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Should show processing message
      expect(screen.getByText('AI is analyzing and enhancing your content...')).toBeInTheDocument();
    });

    it('should not show processing animation for other types', () => {
      const nonProcessingTypes = ['enhanced', 'generated', 'pending', 'error'] as const;
      
      nonProcessingTypes.forEach(type => {
        const { unmount } = render(<EnhancementIndicator type={type} />);
        
        expect(screen.queryByText('AI is analyzing and enhancing your content...')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  // Test healthcare accessibility compliance
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={85}
          showActions={true}
          onView={jest.fn()}
          onRevert={jest.fn()}
        />
      );

      await testHealthcareAccessibility(container, 'enhancement indicator');
    });

    it('should provide proper ARIA attributes for buttons', async () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          showActions={true}
          onView={jest.fn()}
          onRevert={jest.fn()}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view/i });
      const revertButton = screen.getByRole('button', { name: /revert/i });

      expect(viewButton).toBeInTheDocument();
      expect(revertButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <EnhancementIndicator 
          type="enhanced"
          showActions={true}
          onView={jest.fn()}
          onRevert={jest.fn()}
        />
      );

      // Should have 2 focusable buttons
      await testKeyboardNavigation(container, 2);
    });

    it('should announce status changes to screen readers', () => {
      const { rerender } = render(
        <EnhancementIndicator type="processing" />
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();

      // Status change to completed
      rerender(
        <EnhancementIndicator 
          type="enhanced"
          confidence={89}
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.getByText('(89%)')).toBeInTheDocument();
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={92}
          timestamp={new Date('2024-01-15T10:30:00Z')}
          showDetails={true}
        />
      );

      // Should have proper heading structure
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('AI Enhanced');
    });
  });

  // Test healthcare workflow integration
  describe('Healthcare Workflow Integration', () => {
    it('should support incident narrative enhancement workflow', () => {
      const { rerender } = render(
        <EnhancementIndicator type="pending" />
      );

      // Simulate workflow: pending -> processing -> enhanced
      expect(screen.getByText('Enhancement Pending')).toBeInTheDocument();

      rerender(<EnhancementIndicator type="processing" />);
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('AI is analyzing and enhancing your content...')).toBeInTheDocument();

      rerender(
        <EnhancementIndicator 
          type="enhanced"
          confidence={88}
          timestamp={new Date()}
        />
      );
      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      expect(screen.getByText('(88%)')).toBeInTheDocument();
    });

    it('should handle AI generation failure scenarios', () => {
      render(
        <EnhancementIndicator 
          type="error"
          showActions={true}
          onRetry={jest.fn()}
        />
      );

      expect(screen.getByText('Enhancement Failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should support audit requirements with timestamps', () => {
      const auditTimestamp = new Date('2024-01-15T14:30:00Z');
      render(
        <EnhancementIndicator 
          type="generated"
          confidence={94}
          timestamp={auditTimestamp}
        />
      );

      // Should show timestamp for audit trail
      expect(screen.getByText(/15 Jan.*14:30/)).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <EnhancementIndicator 
          ref={ref}
          type="enhanced"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('AI Enhanced');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-enhancement-indicator';
      render(
        <EnhancementIndicator 
          type="enhanced"
          className={customClass}
        />
      );

      const container = screen.getByText('AI Enhanced').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle zero confidence gracefully', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={0}
        />
      );

      expect(screen.getByText('(0%)')).toBeInTheDocument();
    });

    it('should handle very high confidence values', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          confidence={99.99}
        />
      );

      expect(screen.getByText('(100%)')).toBeInTheDocument();
    });

    it('should handle undefined content gracefully', () => {
      render(
        <EnhancementIndicator 
          type="enhanced"
          showDetails={true}
          // No content provided
        />
      );

      expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
      // Should not show content preview section
      expect(screen.queryByText('Enhanced Content Preview:')).not.toBeInTheDocument();
    });
  });
});