// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassificationDisplay } from '@/components/analysis/classification-display';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

describe('ClassificationDisplay Component', () => {
  const user = userEvent.setup();

  // Mock classification data for comprehensive testing
  const mockClassification = {
    incidentType: 'behavioral' as const,
    severity: 'medium' as const,
    confidence: 87,
    supportingEvidence: [
      'Participant showed signs of distress prior to incident',
      'Similar behavioral patterns observed in previous incidents',
      'Environmental factors contributed to stress levels',
    ],
    riskLevel: 'moderate' as const,
    recommendedActions: [
      'Implement additional behavioral support strategies',
      'Review environmental modifications',
      'Schedule follow-up assessment with team lead',
    ],
    reviewRequired: true,
    aiGenerated: true,
    lastUpdated: new Date('2024-01-15T14:30:00Z'),
    reviewedBy: 'Dr. Jennifer Wu',
    reviewedAt: new Date('2024-01-15T15:00:00Z'),
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onReview: jest.fn(),
    onApprove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test incident type classification display
  describe('Incident Type Classification', () => {
    it('should display behavioral incident type correctly', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Related to participant behavior patterns')).toBeInTheDocument();
    });

    it('should display different incident types with correct styling', () => {
      const incidentTypes = [
        { type: 'behavioral', label: 'Behavioral', description: 'Related to participant behavior patterns' },
        { type: 'behavioural', label: 'Behavioural', description: 'Related to participant behavior patterns' },
        { type: 'environmental', label: 'Environmental', description: 'Related to physical environment factors' },
        { type: 'medical', label: 'Medical', description: 'Related to health and medical conditions' },
        { type: 'communication', label: 'Communication', description: 'Related to communication barriers or issues' },
        { type: 'other', label: 'Other', description: 'Does not fit standard categories' },
      ] as const;

      incidentTypes.forEach(({ type, label, description }) => {
        const testClassification = { ...mockClassification, incidentType: type };
        const { unmount } = render(
          <ClassificationDisplay 
            classification={testClassification}
            showDetails={true}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
        unmount();
      });
    });

    it('should show appropriate icons for different incident types', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Should have icon elements for incident type
      const iconElements = document.querySelectorAll('svg');
      expect(iconElements.length).toBeGreaterThan(0);
    });
  });

  // Test severity level display and styling
  describe('Severity Level Display', () => {
    it('should display severity levels with correct labels and styling', () => {
      const severityLevels = [
        { severity: 'low', label: 'Low Severity', description: 'Minor impact, routine follow-up' },
        { severity: 'medium', label: 'Medium Severity', description: 'Moderate impact, requires attention' },
        { severity: 'high', label: 'High Severity', description: 'Significant impact, immediate action required' },
      ] as const;

      severityLevels.forEach(({ severity, label, description }) => {
        const testClassification = { ...mockClassification, severity };
        const { unmount } = render(
          <ClassificationDisplay 
            classification={testClassification}
            showDetails={true}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
        unmount();
      });
    });

    it('should show severity with appropriate visual indicators', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Moderate impact, requires attention')).toBeInTheDocument();
    });
  });

  // Test confidence scoring display
  describe('Confidence Scoring', () => {
    it('should display confidence percentage correctly', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('AI-powered analysis with 87% confidence')).toBeInTheDocument();
      expect(screen.getByText('87% confidence')).toBeInTheDocument();
    });

    it('should handle different confidence levels appropriately', () => {
      const confidenceLevels = [95, 75, 45];
      
      confidenceLevels.forEach(confidence => {
        const testClassification = { ...mockClassification, confidence };
        const { unmount } = render(
          <ClassificationDisplay 
            classification={testClassification}
            showDetails={true}
          />
        );

        expect(screen.getByText(`${confidence}% confidence`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should show confidence in different variants', () => {
      const variants = ['default', 'compact', 'minimal'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(
          <ClassificationDisplay 
            classification={mockClassification}
            variant={variant}
          />
        );

        if (variant === 'minimal') {
          expect(screen.getByText('87% confidence')).toBeInTheDocument();
        } else {
          expect(screen.getByText(/87%/)).toBeInTheDocument();
        }
        unmount();
      });
    });
  });

  // Test risk level assessment display
  describe('Risk Level Assessment', () => {
    it('should display risk levels with correct styling', () => {
      const riskLevels = [
        { level: 'minimal', label: 'Minimal Risk' },
        { level: 'low', label: 'Low Risk' },
        { level: 'moderate', label: 'Moderate Risk' },
        { level: 'high', label: 'High Risk' },
        { level: 'extreme', label: 'Extreme Risk' },
      ] as const;

      riskLevels.forEach(({ level, label }) => {
        const testClassification = { ...mockClassification, riskLevel: level };
        const { unmount } = render(
          <ClassificationDisplay 
            classification={testClassification}
            showDetails={true}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });

    it('should highlight review requirements', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Review Required')).toBeInTheDocument();
    });

    it('should indicate AI generation', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });
  });

  // Test supporting evidence display
  describe('Supporting Evidence Display', () => {
    it('should display all supporting evidence when showDetails is true', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
      expect(screen.getByText('Participant showed signs of distress prior to incident')).toBeInTheDocument();
      expect(screen.getByText('Similar behavioral patterns observed in previous incidents')).toBeInTheDocument();
      expect(screen.getByText('Environmental factors contributed to stress levels')).toBeInTheDocument();
    });

    it('should hide supporting evidence when showDetails is false', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={false}
        />
      );

      expect(screen.queryByText('Supporting Evidence')).not.toBeInTheDocument();
      expect(screen.queryByText('Participant showed signs of distress')).not.toBeInTheDocument();
    });

    it('should handle empty supporting evidence gracefully', () => {
      const classificationWithoutEvidence = {
        ...mockClassification,
        supportingEvidence: [],
      };

      render(
        <ClassificationDisplay 
          classification={classificationWithoutEvidence}
          showDetails={true}
        />
      );

      expect(screen.queryByText('Supporting Evidence')).not.toBeInTheDocument();
    });
  });

  // Test recommended actions display
  describe('Recommended Actions Display', () => {
    it('should display all recommended actions when showDetails is true', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
      expect(screen.getByText('Implement additional behavioral support strategies')).toBeInTheDocument();
      expect(screen.getByText('Review environmental modifications')).toBeInTheDocument();
      expect(screen.getByText('Schedule follow-up assessment with team lead')).toBeInTheDocument();
    });

    it('should hide recommended actions when showDetails is false', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={false}
        />
      );

      expect(screen.queryByText('Recommended Actions')).not.toBeInTheDocument();
      expect(screen.queryByText('Implement additional behavioral support')).not.toBeInTheDocument();
    });

    it('should handle empty recommended actions gracefully', () => {
      const classificationWithoutActions = {
        ...mockClassification,
        recommendedActions: [],
      };

      render(
        <ClassificationDisplay 
          classification={classificationWithoutActions}
          showDetails={true}
        />
      );

      expect(screen.queryByText('Recommended Actions')).not.toBeInTheDocument();
    });
  });

  // Test different variant layouts
  describe('Variant Layouts', () => {
    it('should render minimal variant with essential information only', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          variant="minimal"
        />
      );

      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
      expect(screen.getByText('87% confidence')).toBeInTheDocument();
      
      // Should not show detailed sections
      expect(screen.queryByText('Supporting Evidence')).not.toBeInTheDocument();
    });

    it('should render compact variant with basic details', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          variant="compact"
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Behavioral Incident')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
      expect(screen.getByText('87% confidence')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('should render default variant with full details', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          variant="default"
          showDetails={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Incident Classification')).toBeInTheDocument();
      expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
      expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
    });
  });

  // Test action buttons functionality
  describe('Action Buttons', () => {
    it('should display action buttons when showActions is true', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should call onReview when review button is clicked', async () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={true}
          {...mockHandlers}
        />
      );

      const reviewButton = screen.getByRole('button', { name: /review/i });
      await user.click(reviewButton);

      expect(mockHandlers.onReview).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit button is clicked', async () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={true}
          {...mockHandlers}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    it('should hide action buttons when showActions is false', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={false}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /review/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('should hide action buttons in read-only mode', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          readOnly={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // Test review information display
  describe('Review Information Display', () => {
    it('should display review information when available', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Last updated: 15 Jan 14:30')).toBeInTheDocument();
      expect(screen.getByText('Reviewed by: Dr. Jennifer Wu')).toBeInTheDocument();
      expect(screen.getByText('Review date: 15 Jan 15:00')).toBeInTheDocument();
    });

    it('should handle missing review information gracefully', () => {
      const classificationWithoutReview = {
        ...mockClassification,
        reviewedBy: undefined,
        reviewedAt: undefined,
      };

      render(
        <ClassificationDisplay 
          classification={classificationWithoutReview}
          showDetails={true}
        />
      );

      expect(screen.getByText('Last updated: 15 Jan 14:30')).toBeInTheDocument();
      expect(screen.queryByText('Reviewed by:')).not.toBeInTheDocument();
    });

    it('should format timestamps in Australian locale', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Should format dates in Australian style
      expect(screen.getByText(/15 Jan.*14:30/)).toBeInTheDocument();
      expect(screen.getByText(/15 Jan.*15:00/)).toBeInTheDocument();
    });
  });

  // Test healthcare workflow integration
  describe('Healthcare Workflow Integration', () => {
    it('should support NDIS incident classification standards', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Should show behavioral incident classification
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
    });

    it('should indicate AI assistance in healthcare context', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('AI-powered analysis with 87% confidence')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('should support review workflow requirements', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Review Required')).toBeInTheDocument();
      expect(screen.getByText('Reviewed by: Dr. Jennifer Wu')).toBeInTheDocument();
    });

    it('should provide audit trail information', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Should show timestamps for audit compliance
      expect(screen.getByText('Last updated: 15 Jan 14:30')).toBeInTheDocument();
      expect(screen.getByText('Review date: 15 Jan 15:00')).toBeInTheDocument();
    });
  });

  // Test accessibility compliance for healthcare users
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      await testHealthcareAccessibility(container, 'classification display');
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      expect(screen.getByRole('heading', { name: /incident classification/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /supporting evidence/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /recommended actions/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation for interactive elements', async () => {
      const { container } = render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={true}
          {...mockHandlers}
        />
      );

      // Should have 2 focusable buttons (Review and Edit)
      await testKeyboardNavigation(container, 2);
    });

    it('should provide appropriate ARIA attributes', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
          showActions={true}
          {...mockHandlers}
        />
      );

      const reviewButton = screen.getByRole('button', { name: /review/i });
      const editButton = screen.getByRole('button', { name: /edit/i });

      expect(reviewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
    });
  });

  // Test classification overview cards
  describe('Classification Overview Cards', () => {
    it('should display classification overview with visual cards', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Should show three classification cards
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('87%')).toBeInTheDocument(); // Confidence card
    });

    it('should style classification cards appropriately', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showDetails={true}
        />
      );

      // Cards should have proper border styling
      const classificationCards = screen.getByText('Behavioral').closest('div');
      expect(classificationCards).toHaveClass('border-l-4');
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ClassificationDisplay 
          ref={ref}
          classification={mockClassification}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Incident Classification');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-classification-display';
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          className={customClass}
        />
      );

      const container = screen.getByText('Incident Classification').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test error handling and edge cases
  describe('Edge Cases', () => {
    it('should handle missing classification data gracefully', () => {
      const incompleteClassification = {
        incidentType: 'behavioral' as const,
        severity: 'medium' as const,
        confidence: 87,
        supportingEvidence: [],
        riskLevel: 'moderate' as const,
        recommendedActions: [],
        reviewRequired: false,
        aiGenerated: true,
        lastUpdated: new Date('2024-01-15T14:30:00Z'),
      };

      render(
        <ClassificationDisplay 
          classification={incompleteClassification}
          showDetails={true}
        />
      );

      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.queryByText('Supporting Evidence')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommended Actions')).not.toBeInTheDocument();
    });

    it('should handle zero confidence values', () => {
      const zeroConfidenceClassification = {
        ...mockClassification,
        confidence: 0,
      };

      render(
        <ClassificationDisplay 
          classification={zeroConfidenceClassification}
        />
      );

      expect(screen.getByText('0% confidence')).toBeInTheDocument();
    });

    it('should handle very high confidence values', () => {
      const highConfidenceClassification = {
        ...mockClassification,
        confidence: 100,
      };

      render(
        <ClassificationDisplay 
          classification={highConfidenceClassification}
        />
      );

      expect(screen.getByText('100% confidence')).toBeInTheDocument();
    });

    it('should handle undefined callback functions gracefully', () => {
      render(
        <ClassificationDisplay 
          classification={mockClassification}
          showActions={true}
          // No callback functions provided
        />
      );

      // Should still render buttons
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      
      // Buttons should be safely clickable (no errors)
      expect(() => {
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);
      }).not.toThrow();
    });
  });
});