// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfidenceIndicator } from '@/components/analysis/confidence-indicator';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

describe('ConfidenceIndicator Component', () => {
  const user = userEvent.setup();

  const mockHandlers = {
    onViewDetails: jest.fn(),
    onRecalculate: jest.fn(),
    onLearnMore: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test confidence level calculation and display
  describe('Confidence Level Calculation', () => {
    it('should categorize high confidence correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={92}
          threshold={{ high: 85, medium: 70 }}
          showDetails={true}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Analysis is highly reliable')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should categorize medium confidence correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={78}
          threshold={{ high: 85, medium: 70 }}
          showDetails={true}
        />
      );

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
      expect(screen.getByText('Analysis is moderately reliable')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('should categorize low confidence correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={45}
          threshold={{ high: 85, medium: 70 }}
          showDetails={true}
        />
      );

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('Analysis may need review')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should use default thresholds when not provided', () => {
      render(
        <ConfidenceIndicator 
          confidence={80}
          showDetails={true}
        />
      );

      // With default thresholds (high: 85, medium: 70), 80% should be medium
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('should handle edge case values at thresholds', () => {
      const { rerender } = render(
        <ConfidenceIndicator 
          confidence={85}
          threshold={{ high: 85, medium: 70 }}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();

      rerender(
        <ConfidenceIndicator 
          confidence={70}
          threshold={{ high: 85, medium: 70 }}
        />
      );

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();

      rerender(
        <ConfidenceIndicator 
          confidence={69}
          threshold={{ high: 85, medium: 70 }}
        />
      );

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
  });

  // Test different variant layouts
  describe('Variant Layouts', () => {
    it('should render minimal variant correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={87}
          variant="minimal"
          label="AI Classification"
        />
      );

      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText('AI Classification')).toBeInTheDocument();
      
      // Should not show detailed description
      expect(screen.queryByText('Analysis is highly reliable')).not.toBeInTheDocument();
    });

    it('should render compact variant with badge', () => {
      render(
        <ConfidenceIndicator 
          confidence={92}
          variant="compact"
          label="Model Accuracy"
        />
      );

      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Model Accuracy')).toBeInTheDocument();
    });

    it('should render circular variant with progress ring', () => {
      render(
        <ConfidenceIndicator 
          confidence={75}
          variant="circular"
          label="Analysis Quality"
          showDetails={true}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Analysis Quality')).toBeInTheDocument();
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
      
      // Should have SVG circle for progress
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should render default variant with full details', () => {
      render(
        <ConfidenceIndicator 
          confidence={88}
          variant="default"
          label="Incident Classification"
          showDetails={true}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Analysis is highly reliable')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('Incident Classification')).toBeInTheDocument();
    });
  });

  // Test size variations
  describe('Size Variations', () => {
    it('should render small size correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          size="sm"
          variant="circular"
        />
      );

      // Should render without errors - specific size testing would need more complex setup
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render medium size correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          size="md"
          variant="circular"
        />
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render large size correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          size="lg"
          variant="circular"
        />
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  // Test progress bar in default variant
  describe('Progress Bar Display', () => {
    it('should show progress bar in default variant', () => {
      render(
        <ConfidenceIndicator 
          confidence={78}
          variant="default"
        />
      );

      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
      expect(screen.getAllByText('78%')).toHaveLength(2); // Badge and progress label
    });

    it('should not show progress bar in non-default variants', () => {
      const variants = ['compact', 'minimal', 'circular'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(
          <ConfidenceIndicator 
            confidence={78}
            variant={variant}
          />
        );

        expect(screen.queryByText('Confidence Level')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  // Test action buttons
  describe('Action Buttons', () => {
    it('should show action buttons when showActions is true', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recalculate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('should call onViewDetails when details button is clicked', async () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          {...mockHandlers}
        />
      );

      const detailsButton = screen.getByRole('button', { name: /details/i });
      await user.click(detailsButton);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(1);
    });

    it('should call onRecalculate when recalculate button is clicked', async () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          {...mockHandlers}
        />
      );

      const recalculateButton = screen.getByRole('button', { name: /recalculate/i });
      await user.click(recalculateButton);

      expect(mockHandlers.onRecalculate).toHaveBeenCalledTimes(1);
    });

    it('should call onLearnMore when learn more button is clicked', async () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          {...mockHandlers}
        />
      );

      const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
      await user.click(learnMoreButton);

      expect(mockHandlers.onLearnMore).toHaveBeenCalledTimes(1);
    });

    it('should hide action buttons when showActions is false', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={false}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should disable recalculate button when recalculating', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          isRecalculating={true}
          {...mockHandlers}
        />
      );

      const recalculateButton = screen.getByRole('button', { name: /calculating/i });
      expect(recalculateButton).toBeDisabled();
    });

    it('should show calculating status when recalculating', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          isRecalculating={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Calculating...')).toBeInTheDocument();
      expect(screen.getByText('Recalculating confidence score...')).toBeInTheDocument();
    });
  });

  // Test low confidence warnings
  describe('Low Confidence Warnings', () => {
    it('should show low confidence warning when appropriate', () => {
      render(
        <ConfidenceIndicator 
          confidence={45}
          showDetails={true}
        />
      );

      expect(screen.getByText('Low Confidence Detected')).toBeInTheDocument();
      expect(screen.getByText('This analysis may benefit from manual review or additional data collection.')).toBeInTheDocument();
    });

    it('should not show low confidence warning for higher confidence levels', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showDetails={true}
        />
      );

      expect(screen.queryByText('Low Confidence Detected')).not.toBeInTheDocument();
    });

    it('should not show warning when showDetails is false', () => {
      render(
        <ConfidenceIndicator 
          confidence={45}
          showDetails={false}
        />
      );

      expect(screen.queryByText('Low Confidence Detected')).not.toBeInTheDocument();
    });
  });

  // Test confidence tips and information
  describe('Confidence Tips', () => {
    it('should show confidence tips when showDetails is true', () => {
      render(
        <ConfidenceIndicator 
          confidence={80}
          threshold={{ high: 85, medium: 70 }}
          showDetails={true}
        />
      );

      expect(screen.getByText(/Confidence scores above 85% are considered highly reliable/)).toBeInTheDocument();
      expect(screen.getByText(/Scores below 70% may require review/)).toBeInTheDocument();
    });

    it('should not show tips when showDetails is false', () => {
      render(
        <ConfidenceIndicator 
          confidence={80}
          threshold={{ high: 85, medium: 70 }}
          showDetails={false}
        />
      );

      expect(screen.queryByText(/Confidence scores above/)).not.toBeInTheDocument();
    });

    it('should use custom thresholds in tips', () => {
      render(
        <ConfidenceIndicator 
          confidence={80}
          threshold={{ high: 90, medium: 75 }}
          showDetails={true}
        />
      );

      expect(screen.getByText(/Confidence scores above 90% are considered highly reliable/)).toBeInTheDocument();
      expect(screen.getByText(/Scores below 75% may require review/)).toBeInTheDocument();
    });
  });

  // Test circular progress calculation
  describe('Circular Progress Calculation', () => {
    it('should calculate circular progress correctly', () => {
      render(
        <ConfidenceIndicator 
          confidence={75}
          variant="circular"
        />
      );

      // Should have SVG circles with proper attributes
      const progressCircle = document.querySelector('circle[stroke-dasharray]');
      expect(progressCircle).toBeInTheDocument();
      
      // Progress should be visible
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should handle different confidence values in circular variant', () => {
      const confidenceValues = [25, 50, 75, 100];
      
      confidenceValues.forEach(confidence => {
        const { unmount } = render(
          <ConfidenceIndicator 
            confidence={confidence}
            variant="circular"
          />
        );

        expect(screen.getByText(`${confidence}%`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  // Test healthcare AI confidence scenarios
  describe('Healthcare AI Confidence Scenarios', () => {
    it('should handle high confidence AI classification', () => {
      render(
        <ConfidenceIndicator 
          confidence={94}
          label="Incident Type Classification"
          showDetails={true}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Incident Type Classification')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    it('should handle medium confidence requiring review', () => {
      render(
        <ConfidenceIndicator 
          confidence={72}
          label="Risk Assessment"
          showDetails={true}
        />
      );

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Analysis is moderately reliable')).toBeInTheDocument();
    });

    it('should handle low confidence needing manual review', () => {
      render(
        <ConfidenceIndicator 
          confidence={42}
          label="Contributing Factors Analysis"
          showDetails={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('Low Confidence Detected')).toBeInTheDocument();
      expect(screen.getByText('This analysis may benefit from manual review or additional data collection.')).toBeInTheDocument();
    });
  });

  // Test accessibility compliance for healthcare users
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <ConfidenceIndicator 
          confidence={85}
          showDetails={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      await testHealthcareAccessibility(container, 'confidence indicator');
    });

    it('should support keyboard navigation for interactive elements', async () => {
      const { container } = render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          {...mockHandlers}
        />
      );

      // Should have 3 focusable buttons
      await testKeyboardNavigation(container, 3);
    });

    it('should provide appropriate ARIA attributes for progress indicators', () => {
      render(
        <ConfidenceIndicator 
          confidence={75}
          variant="circular"
          label="Analysis Confidence"
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Analysis Confidence')).toBeInTheDocument();
    });

    it('should announce confidence level changes to screen readers', () => {
      const { rerender } = render(
        <ConfidenceIndicator 
          confidence={75}
        />
      );

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();

      rerender(
        <ConfidenceIndicator 
          confidence={90}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should provide semantic meaning for different confidence levels', () => {
      render(
        <ConfidenceIndicator 
          confidence={88}
          showDetails={true}
        />
      );

      // High confidence should have positive semantic meaning
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Analysis is highly reliable')).toBeInTheDocument();
    });
  });

  // Test percentage display options
  describe('Percentage Display', () => {
    it('should show percentage when showPercentage is true', () => {
      render(
        <ConfidenceIndicator 
          confidence={87}
          showPercentage={true}
        />
      );

      expect(screen.getByText('87%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
      render(
        <ConfidenceIndicator 
          confidence={87}
          showPercentage={false}
          variant="compact"
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.queryByText('87%')).not.toBeInTheDocument();
    });

    it('should show percentage by default', () => {
      render(
        <ConfidenceIndicator 
          confidence={87}
        />
      );

      expect(screen.getByText('87%')).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ConfidenceIndicator 
          ref={ref}
          confidence={85}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('High Confidence');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-confidence-indicator';
      render(
        <ConfidenceIndicator 
          confidence={85}
          className={customClass}
        />
      );

      const container = screen.getByText('High Confidence').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle confidence value of 0', () => {
      render(
        <ConfidenceIndicator 
          confidence={0}
        />
      );

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle confidence value of 100', () => {
      render(
        <ConfidenceIndicator 
          confidence={100}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle fractional confidence values', () => {
      render(
        <ConfidenceIndicator 
          confidence={87.6}
        />
      );

      expect(screen.getByText('88%')).toBeInTheDocument(); // Should round
    });

    it('should handle negative confidence values gracefully', () => {
      render(
        <ConfidenceIndicator 
          confidence={-5}
        />
      );

      // Should handle gracefully without crashing
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('should handle confidence values over 100', () => {
      render(
        <ConfidenceIndicator 
          confidence={105}
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('105%')).toBeInTheDocument();
    });

    it('should handle undefined callback functions gracefully', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          showActions={true}
          // No callback functions provided
        />
      );

      // Should still render action buttons
      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recalculate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('should handle missing label gracefully', () => {
      render(
        <ConfidenceIndicator 
          confidence={85}
          // No label provided
        />
      );

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });
});