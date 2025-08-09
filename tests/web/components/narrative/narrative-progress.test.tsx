// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeProgress } from '@/components/narrative/narrative-progress';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

describe('NarrativeProgress Component', () => {
  
  // Mock narrative sections for testing
  const mockSections = [
    {
      id: 'before-event',
      title: 'Before the Event',
      isRequired: true,
      isComplete: true,
      wordCount: 124,
      minWords: 50,
      maxWords: 300,
      quality: 'good' as const,
      lastUpdated: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: 'during-event',
      title: 'During the Event',
      isRequired: true,
      isComplete: true,
      wordCount: 256,
      minWords: 100,
      maxWords: 500,
      quality: 'excellent' as const,
      lastUpdated: new Date('2024-01-15T11:00:00Z'),
    },
    {
      id: 'end-event',
      title: 'End of Event',
      isRequired: true,
      isComplete: false,
      wordCount: 43,
      minWords: 50,
      maxWords: 200,
      quality: 'needs_improvement' as const,
      lastUpdated: new Date('2024-01-15T11:15:00Z'),
    },
    {
      id: 'post-event',
      title: 'Post-Event Actions',
      isRequired: true,
      isComplete: false,
      wordCount: 0,
      minWords: 30,
      maxWords: 200,
      quality: 'incomplete' as const,
    },
  ];

  // Test progress calculation and display
  describe('Progress Calculation', () => {
    it('should calculate overall progress correctly', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          overallProgress={50}
          showDetails={true}
        />
      );

      // Should show provided overall progress
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should calculate progress from completed sections when not provided', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          // No overallProgress provided - should calculate from sections
          showDetails={true}
        />
      );

      // 2 completed out of 4 sections = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display completed sections count', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Should show completion status
      expect(screen.getByText('2/4 Sections Complete')).toBeInTheDocument();
    });

    it('should calculate total word count correctly', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={true}
          showDetails={true}
        />
      );

      // 124 + 256 + 43 + 0 = 423 words
      expect(screen.getByText('423')).toBeInTheDocument();
      expect(screen.getByText('Total Words')).toBeInTheDocument();
    });

    it('should use provided total word count over calculated', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          totalWordCount={500}
          showWordCounts={true}
          showDetails={true}
        />
      );

      // Should use provided count
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Total Words')).toBeInTheDocument();
    });
  });

  // Test quality scoring and display
  describe('Quality Scoring', () => {
    it('should display quality score when provided', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          qualityScore={85}
          showQuality={true}
          showDetails={true}
        />
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
    });

    it('should show quality assessment labels correctly', () => {
      const qualityScores = [
        { score: 90, expectedLabel: 'Excellent' },
        { score: 75, expectedLabel: 'Good' },
        { score: 60, expectedLabel: 'Fair' },
        { score: 40, expectedLabel: 'Needs Improvement' },
      ];

      qualityScores.forEach(({ score, expectedLabel }) => {
        const { unmount } = render(
          <NarrativeProgress 
            sections={mockSections}
            qualityScore={score}
            showQuality={true}
          />
        );

        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        unmount();
      });
    });

    it('should display individual section quality indicators', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
          showQuality={true}
        />
      );

      expect(screen.getByText('Good')).toBeInTheDocument(); // before-event
      expect(screen.getByText('Excellent')).toBeInTheDocument(); // during-event
      expect(screen.getByText('Needs Work')).toBeInTheDocument(); // end-event
      expect(screen.getByText('Incomplete')).toBeInTheDocument(); // post-event
    });

    it('should hide quality indicators when showQuality is false', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showQuality={false}
          showDetails={true}
        />
      );

      expect(screen.queryByText('Quality Score')).not.toBeInTheDocument();
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    });
  });

  // Test word count tracking for healthcare documentation
  describe('Word Count Tracking', () => {
    it('should display word counts for each section', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={true}
          showDetails={true}
        />
      );

      expect(screen.getByText('124 words')).toBeInTheDocument();
      expect(screen.getByText('256 words')).toBeInTheDocument();
      expect(screen.getByText('43 words')).toBeInTheDocument();
      expect(screen.getByText('0 words')).toBeInTheDocument();
    });

    it('should show minimum word requirements', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={true}
          showDetails={true}
        />
      );

      // Should show minimum requirements for incomplete sections
      expect(screen.getByText('(min: 50)')).toBeInTheDocument();
      expect(screen.getByText('(min: 30)')).toBeInTheDocument();
    });

    it('should highlight sections below minimum word count', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={true}
          showDetails={true}
        />
      );

      // End of Event has 43 words but needs min 50 - should be highlighted
      const wordCountElements = screen.getAllByText(/43 words/);
      expect(wordCountElements.length).toBeGreaterThan(0);
    });

    it('should display target word count', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          targetWordCount={500}
          showWordCounts={true}
        />
      );

      expect(screen.getByText('423/500 words')).toBeInTheDocument();
    });

    it('should hide word counts when showWordCounts is false', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={false}
          showDetails={true}
        />
      );

      expect(screen.queryByText('words')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Words')).not.toBeInTheDocument();
    });
  });

  // Test section status indicators
  describe('Section Status Indicators', () => {
    it('should show completed sections with check icons', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      expect(screen.getByText('Before the Event')).toBeInTheDocument();
      expect(screen.getByText('During the Event')).toBeInTheDocument();
    });

    it('should show incomplete sections with pending icons', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      expect(screen.getByText('End of Event')).toBeInTheDocument();
      expect(screen.getByText('Post-Event Actions')).toBeInTheDocument();
    });

    it('should display required field indicators', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // All sections are required in mock data
      const requiredBadges = screen.getAllByText('Required');
      expect(requiredBadges.length).toBe(4);
    });

    it('should show last updated timestamps', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Should show time in Australian format
      expect(screen.getByText('10:30')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
      expect(screen.getByText('11:15')).toBeInTheDocument();
    });
  });

  // Test different variants for UI flexibility
  describe('Variant Layouts', () => {
    it('should render minimal variant with circular progress', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          variant="minimal"
          showWordCounts={true}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('2/4 Sections Complete')).toBeInTheDocument();
      expect(screen.getByText('423/400 words')).toBeInTheDocument();
    });

    it('should render compact variant without detailed breakdown', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          variant="compact"
          showWordCounts={true}
          showQuality={true}
        />
      );

      expect(screen.getByText('Narrative Progress')).toBeInTheDocument();
      expect(screen.getByText('2 of 4 sections complete')).toBeInTheDocument();
      expect(screen.getByText('423 words')).toBeInTheDocument();
    });

    it('should render default variant with full details', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          variant="default"
          showDetails={true}
          showWordCounts={true}
          showQuality={true}
        />
      );

      expect(screen.getByText('Narrative Progress')).toBeInTheDocument();
      expect(screen.getByText('Section Progress')).toBeInTheDocument();
      expect(screen.getAllByText('Required')).toHaveLength(4);
    });
  });

  // Test time estimation and progress tracking
  describe('Time Estimation', () => {
    it('should show estimated time remaining', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          estimatedTimeRemaining={12}
        />
      );

      expect(screen.getByText('Estimated time remaining')).toBeInTheDocument();
      expect(screen.getByText('12 minutes')).toBeInTheDocument();
    });

    it('should hide time estimation when zero or not provided', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          estimatedTimeRemaining={0}
        />
      );

      expect(screen.queryByText('Estimated time remaining')).not.toBeInTheDocument();
    });

    it('should handle undefined time estimation gracefully', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          // No estimatedTimeRemaining provided
        />
      );

      // Should show default from component
      expect(screen.getByText('8 minutes')).toBeInTheDocument();
    });
  });

  // Test healthcare documentation requirements
  describe('Healthcare Documentation Integration', () => {
    it('should support 4-phase incident narrative structure', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Standard NDIS incident phases
      expect(screen.getByText('Before the Event')).toBeInTheDocument();
      expect(screen.getByText('During the Event')).toBeInTheDocument();
      expect(screen.getByText('End of Event')).toBeInTheDocument();
      expect(screen.getByText('Post-Event Actions')).toBeInTheDocument();
    });

    it('should track completion for compliance requirements', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Should show which sections are complete for audit
      expect(screen.getByText('2')).toBeInTheDocument(); // Completed count
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should indicate sections requiring attention', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
          showWordCounts={true}
        />
      );

      // End of Event section is below minimum - should be highlighted
      const belowMinSection = screen.getByText('End of Event').closest('div');
      expect(belowMinSection).toBeInTheDocument();
    });

    it('should support audit trail with timestamps', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Should show when sections were last updated for audit purposes
      expect(screen.getByText('10:30')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
      expect(screen.getByText('11:15')).toBeInTheDocument();
    });
  });

  // Test accessibility compliance for healthcare users
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
          showWordCounts={true}
          showQuality={true}
        />
      );

      await testHealthcareAccessibility(container, 'narrative progress');
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { name: /narrative progress/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /section progress/i })).toBeInTheDocument();
    });

    it('should have appropriate ARIA attributes', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Progress indicators should be accessible
      const progressElements = screen.getByText('50%').closest('div');
      expect(progressElements).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <NarrativeProgress 
          sections={mockSections}
          showDetails={true}
        />
      );

      // Component is informational - no interactive elements expected
      await testKeyboardNavigation(container, 0);
    });

    it('should announce progress changes to assistive technology', () => {
      const { rerender } = render(
        <NarrativeProgress 
          sections={mockSections}
          overallProgress={50}
        />
      );

      // Progress update
      rerender(
        <NarrativeProgress 
          sections={mockSections}
          overallProgress={75}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  // Test overview statistics
  describe('Progress Overview Statistics', () => {
    it('should display progress overview cards', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={true}
          showQuality={true}
        />
      );

      // Should show three overview cards
      expect(screen.getByText('2')).toBeInTheDocument(); // Completed
      expect(screen.getByText('423')).toBeInTheDocument(); // Total Words  
      expect(screen.getByText('75%')).toBeInTheDocument(); // Quality Score
    });

    it('should adapt overview based on show flags', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          showWordCounts={false}
          showQuality={false}
        />
      );

      // Should only show completed count
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText('Total Words')).not.toBeInTheDocument();
      expect(screen.queryByText('Quality Score')).not.toBeInTheDocument();
    });
  });

  // Test circular progress indicators
  describe('Circular Progress Indicators', () => {
    it('should render circular progress in minimal variant', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          variant="minimal"
        />
      );

      // Should have SVG circular progress
      const progressCircle = document.querySelector('svg circle');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should render circular progress in compact variant', () => {
      render(
        <NarrativeProgress 
          sections={mockSections}
          variant="compact"
        />
      );

      // Should have smaller circular progress
      const progressCircle = document.querySelector('svg circle');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <NarrativeProgress 
          ref={ref}
          sections={mockSections}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Narrative Progress');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-narrative-progress';
      render(
        <NarrativeProgress 
          sections={mockSections}
          className={customClass}
        />
      );

      const container = screen.getByText('Narrative Progress').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test error handling and edge cases
  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      render(
        <NarrativeProgress 
          sections={[]}
          showDetails={true}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.queryByText('Section Progress')).toBeInTheDocument();
    });

    it('should handle sections without timestamps', () => {
      const sectionsWithoutTimestamps = mockSections.map(section => ({
        ...section,
        lastUpdated: undefined,
      }));

      render(
        <NarrativeProgress 
          sections={sectionsWithoutTimestamps}
          showDetails={true}
        />
      );

      expect(screen.getByText('Before the Event')).toBeInTheDocument();
      // Should not show timestamps
      expect(screen.queryByText('10:30')).not.toBeInTheDocument();
    });

    it('should handle undefined quality gracefully', () => {
      const sectionsWithoutQuality = mockSections.map(section => ({
        ...section,
        quality: undefined,
      }));

      render(
        <NarrativeProgress 
          sections={sectionsWithoutQuality}
          showDetails={true}
          showQuality={true}
        />
      );

      // Should not crash
      expect(screen.getByText('Before the Event')).toBeInTheDocument();
    });

    it('should use default sections when none provided', () => {
      render(<NarrativeProgress />);

      // Should use component defaults
      expect(screen.getByText('Narrative Progress')).toBeInTheDocument();
    });
  });
});