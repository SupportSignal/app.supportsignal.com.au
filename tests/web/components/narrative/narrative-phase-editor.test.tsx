// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativePhaseEditor } from '@/components/narrative/narrative-phase-editor';
import { testHealthcareAccessibility, testKeyboardNavigation, testFormAccessibility } from '../../utils/accessibility';

describe('NarrativePhaseEditor Component', () => {
  const user = userEvent.setup();

  // Mock phases for comprehensive testing
  const mockPhases = [
    {
      id: 'incident-reported',
      title: 'Incident Reported',
      description: 'Basic incident details captured',
      status: 'completed' as const,
      estimatedTime: 'Completed',
      content: 'Initial incident report submitted',
    },
    {
      id: 'narrative-collection',
      title: 'Narrative Collection',
      description: 'Multi-phase incident narrative',
      status: 'active' as const,
      estimatedTime: '10-15 min',
      content: 'Collecting detailed narrative information...',
    },
    {
      id: 'ai-questions',
      title: 'AI Questions',
      description: 'Clarification questions generated',
      status: 'pending' as const,
      estimatedTime: '2-3 min',
    },
    {
      id: 'ai-enhancement',
      title: 'AI Enhancement',
      description: 'Narrative enhanced with AI',
      status: 'pending' as const,
      estimatedTime: '1 min',
      isEnhanced: true,
    },
    {
      id: 'analysis-phase',
      title: 'Analysis Phase',
      description: 'Team lead analysis begins',
      status: 'pending' as const,
      estimatedTime: '5-10 min',
      isGenerated: true,
    },
  ];

  const mockHandlers = {
    onPhaseUpdate: jest.fn(),
    onPhaseComplete: jest.fn(),
    onPhaseSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test phase status display and progression
  describe('Phase Status Display', () => {
    it('should display completed phases with success indicators', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Incident Reported')).toBeInTheDocument();
      expect(screen.getByText('Basic incident details captured')).toBeInTheDocument();
      
      // Should show completed badge
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display active phases with progress indicators', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Narrative Collection')).toBeInTheDocument();
      expect(screen.getByText('Multi-phase incident narrative')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Est. 10-15 min')).toBeInTheDocument();
    });

    it('should display pending phases correctly', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('AI Questions')).toBeInTheDocument();
      expect(screen.getByText('Clarification questions generated')).toBeInTheDocument();
      expect(screen.getAllByText('Pending')).toHaveLength(3); // 3 pending phases
    });

    it('should show different icons for different statuses', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should have various SVG icons for different statuses
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // Test progress calculation and display
  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          showProgress={true}
          {...mockHandlers}
        />
      );

      // 1 completed out of 5 phases = 20%
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should display progress summary stats', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should show summary statistics
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed
      expect(screen.getByText('1')).toBeInTheDocument(); // In Progress  
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending
    });

    it('should handle empty phases gracefully', () => {
      render(
        <NarrativePhaseEditor 
          phases={[]}
          currentPhase=""
          {...mockHandlers}
        />
      );

      // Should not crash with empty phases
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
    });

    it('should use default phases when none provided', () => {
      render(
        <NarrativePhaseEditor 
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should render default phases
      expect(screen.getByText('Incident Reported')).toBeInTheDocument();
      expect(screen.getByText('Narrative Collection')).toBeInTheDocument();
    });
  });

  // Test phase editing functionality  
  describe('Phase Editing', () => {
    it('should display textarea for active phase when variant is full', async () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const textarea = screen.getByPlaceholderText(/enter details for narrative collection/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Collecting detailed narrative information...');
    });

    it('should call onPhaseUpdate when content changes', async () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const textarea = screen.getByPlaceholderText(/enter details for narrative collection/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated narrative content');

      expect(mockHandlers.onPhaseUpdate).toHaveBeenCalledWith(
        'narrative-collection',
        'Updated narrative content'
      );
    });

    it('should enable Complete Phase button only when content exists', () => {
      const phasesWithoutContent = mockPhases.map(phase => 
        phase.id === 'narrative-collection' 
          ? { ...phase, content: '' }
          : phase
      );

      render(
        <NarrativePhaseEditor 
          phases={phasesWithoutContent}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete phase/i });
      expect(completeButton).toBeDisabled();
    });

    it('should call onPhaseComplete when Complete Phase is clicked', async () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete phase/i });
      await user.click(completeButton);

      expect(mockHandlers.onPhaseComplete).toHaveBeenCalledWith('narrative-collection');
    });

    it('should show Save Draft button for work-in-progress', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      expect(saveDraftButton).toBeInTheDocument();
    });
  });

  // Test enhancement and generation indicators
  describe('AI Enhancement Indicators', () => {
    it('should display AI enhanced indicator when phase is enhanced', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="ai-enhancement"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('AI Enhanced Content')).toBeInTheDocument();
    });

    it('should display AI generated indicator when phase is generated', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="analysis-phase"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('AI Generated Analysis')).toBeInTheDocument();
    });

    it('should show both indicators when applicable', () => {
      const enhancedPhases = mockPhases.map(phase => 
        phase.id === 'ai-enhancement' 
          ? { ...phase, isEnhanced: true, isGenerated: true }
          : phase
      );

      render(
        <NarrativePhaseEditor 
          phases={enhancedPhases}
          currentPhase="ai-enhancement"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('AI Enhanced Content')).toBeInTheDocument();
      expect(screen.getByText('AI Generated Analysis')).toBeInTheDocument();
    });
  });

  // Test time estimation display
  describe('Time Estimation', () => {
    it('should show estimated time when showEstimates is true', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          showEstimates={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Est. 10-15 min')).toBeInTheDocument();
      expect(screen.getByText('Est. 2-3 min')).toBeInTheDocument();
    });

    it('should hide time estimates when showEstimates is false', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          showEstimates={false}
          {...mockHandlers}
        />
      );

      expect(screen.queryByText(/Est\./)).not.toBeInTheDocument();
    });

    it('should display current phase time in header', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should show current phase and time estimate
      expect(screen.getByText('Narrative Collection')).toBeInTheDocument();
      expect(screen.getByText('Est. 10-15 min')).toBeInTheDocument();
    });
  });

  // Test different variants for UI flexibility
  describe('Variant Layouts', () => {
    it('should render minimal variant with simplified progress', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="minimal"
          showProgress={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      
      // Should show phase titles in simplified format
      expect(screen.getByText('Incident')).toBeInTheDocument();
      expect(screen.getByText('Narrative')).toBeInTheDocument();
    });

    it('should render compact variant without editing interface', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="compact"
          {...mockHandlers}
        />
      );

      // Should not show textarea for editing
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /complete phase/i })).not.toBeInTheDocument();
    });

    it('should render full variant with all functionality', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      // Should show editing interface
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete phase/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });
  });

  // Test healthcare workflow patterns
  describe('Healthcare Workflow Integration', () => {
    it('should support 4-phase narrative structure', () => {
      const healthcarePhases = [
        { id: 'before-event', title: 'Before the Event', status: 'completed' as const, estimatedTime: 'Completed' },
        { id: 'during-event', title: 'During the Event', status: 'active' as const, estimatedTime: '10-15 min' },
        { id: 'end-event', title: 'End of Event', status: 'pending' as const, estimatedTime: '5-10 min' },
        { id: 'post-event', title: 'Post-Event Actions', status: 'pending' as const, estimatedTime: '5 min' },
      ];

      render(
        <NarrativePhaseEditor 
          phases={healthcarePhases}
          currentPhase="during-event"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Before the Event')).toBeInTheDocument();
      expect(screen.getByText('During the Event')).toBeInTheDocument();
      expect(screen.getByText('End of Event')).toBeInTheDocument();
      expect(screen.getByText('Post-Event Actions')).toBeInTheDocument();
    });

    it('should integrate with NDIS incident capture workflow', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          showProgress={true}
          showEstimates={true}
          {...mockHandlers}
        />
      );

      // Should show workflow progress for compliance
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
      expect(screen.getByText('Currently:')).toBeInTheDocument();
      expect(screen.getByText('Narrative Collection')).toBeInTheDocument();
    });

    it('should support team-based workflow assignments', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Phases should indicate workflow progression for team handoffs
      expect(screen.getByText('AI Questions')).toBeInTheDocument();
      expect(screen.getByText('Analysis Phase')).toBeInTheDocument();
    });
  });

  // Test form accessibility for healthcare compliance
  describe('Healthcare Form Accessibility', () => {
    it('should meet WCAG 2.1 AA standards for editing interface', async () => {
      const { container } = render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      await testHealthcareAccessibility(container, 'narrative phase editor');
    });

    it('should have proper form labels and structure', async () => {
      const { container } = render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder');

      // Test form accessibility
      await testFormAccessibility(container);
    });

    it('should support keyboard navigation through phases', async () => {
      const { container } = render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      // Should have focusable elements: textarea + 2 buttons
      await testKeyboardNavigation(container, 3);
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should have proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Workflow Progress');

      // Phase titles should be appropriately structured
      const phaseHeading = screen.getByRole('heading', { level: 3 });
      expect(phaseHeading).toHaveTextContent('Incident Reported');
    });
  });

  // Test progress visualization
  describe('Progress Visualization', () => {
    it('should show visual progress indicators', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="minimal"
          showProgress={true}
          {...mockHandlers}
        />
      );

      // Should show progress percentage prominently
      expect(screen.getByText('20%')).toBeInTheDocument();
      
      // Should show phase progression
      const progressElements = screen.getAllByRole('generic');
      expect(progressElements.length).toBeGreaterThan(0);
    });

    it('should display phase connections in minimal variant', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          variant="minimal"
          {...mockHandlers}
        />
      );

      // Should show arrows or connectors between phases
      const arrowElements = document.querySelectorAll('svg');
      expect(arrowElements.length).toBeGreaterThan(0);
    });

    it('should highlight current phase appropriately', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Current phase should have distinct styling
      const activePhase = screen.getByText('Narrative Collection').closest('div');
      expect(activePhase).toHaveClass('border-l-4', 'border-ss-teal');
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <NarrativePhaseEditor 
          ref={ref}
          phases={mockPhases}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Workflow Progress');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-phase-editor';
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="narrative-collection"
          className={customClass}
          {...mockHandlers}
        />
      );

      const container = screen.getByText('Workflow Progress').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test error handling and edge cases
  describe('Edge Cases', () => {
    it('should handle phase without content gracefully', () => {
      const phasesWithMissingContent = mockPhases.map(phase => ({
        ...phase,
        content: undefined,
      }));

      render(
        <NarrativePhaseEditor 
          phases={phasesWithMissingContent}
          currentPhase="narrative-collection"
          variant="full"
          {...mockHandlers}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle missing currentPhase gracefully', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase=""
          {...mockHandlers}
        />
      );

      // Should not crash
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
    });

    it('should handle invalid phase ID in currentPhase', () => {
      render(
        <NarrativePhaseEditor 
          phases={mockPhases}
          currentPhase="non-existent-phase"
          {...mockHandlers}
        />
      );

      // Should not crash and render phases
      expect(screen.getByText('Incident Reported')).toBeInTheDocument();
    });

    it('should handle phases without status gracefully', () => {
      const phasesWithoutStatus = mockPhases.map(phase => ({
        ...phase,
        status: undefined,
      }));

      // @ts-expect-error - Testing invalid data
      render(
        <NarrativePhaseEditor 
          phases={phasesWithoutStatus}
          currentPhase="narrative-collection"
          {...mockHandlers}
        />
      );

      // Should render with default handling
      expect(screen.getByText('Narrative Collection')).toBeInTheDocument();
    });
  });
});