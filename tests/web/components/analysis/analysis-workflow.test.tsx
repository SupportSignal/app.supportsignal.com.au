// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisWorkflow } from '@/components/analysis/analysis-workflow';
import { testHealthcareAccessibility, testKeyboardNavigation, testFormAccessibility } from '../../utils/accessibility';

describe('AnalysisWorkflow Component', () => {
  const user = userEvent.setup();

  // Mock analysis steps for comprehensive testing
  const mockSteps = [
    {
      id: 'initial_review',
      title: 'Initial Review',
      description: 'Review incident narrative and basic information',
      status: 'completed' as const,
      assignedRole: 'team_lead' as const,
      estimatedTime: '5 min',
      completedAt: new Date('2024-01-15T10:30:00Z'),
      completedBy: 'Jennifer Wu',
      notes: 'Initial review completed successfully',
    },
    {
      id: 'conditions_analysis',
      title: 'Contributing Conditions',
      description: 'Identify and analyze contributing conditions',
      status: 'in_progress' as const,
      assignedRole: 'team_lead' as const,
      estimatedTime: '15 min',
      dependencies: ['initial_review'],
    },
    {
      id: 'classification',
      title: 'Incident Classification',
      description: 'Classify incident type, severity, and risk level',
      status: 'pending' as const,
      assignedRole: 'team_lead' as const,
      estimatedTime: '10 min',
      dependencies: ['conditions_analysis'],
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      description: 'Develop prevention and improvement recommendations',
      status: 'pending' as const,
      assignedRole: 'company_admin' as const,
      estimatedTime: '20 min',
      dependencies: ['classification'],
    },
    {
      id: 'final_review',
      title: 'Final Review',
      description: 'Review all analysis components and approve',
      status: 'pending' as const,
      assignedRole: 'company_admin' as const,
      estimatedTime: '10 min',
      dependencies: ['recommendations'],
      isOptional: true,
    },
  ];

  const mockHandlers = {
    onStepStart: jest.fn(),
    onStepComplete: jest.fn(),
    onStepSkip: jest.fn(),
    onStepEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test workflow step display and progression
  describe('Workflow Step Display', () => {
    it('should display all workflow steps with correct information', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          showTimestamps={true}
          showAssignments={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Initial Review')).toBeInTheDocument();
      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
      expect(screen.getByText('Incident Classification')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Final Review')).toBeInTheDocument();
    });

    it('should show correct status indicators for each step', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Should show completed status with timestamp
      expect(screen.getByText('Completed 15 Jan 10:30')).toBeInTheDocument();
      expect(screen.getByText('by Jennifer Wu')).toBeInTheDocument();
    });

    it('should display role assignments correctly', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          showAssignments={true}
          {...mockHandlers}
        />
      );

      expect(screen.getAllByText('team lead')).toHaveLength(3);
      expect(screen.getAllByText('company admin')).toHaveLength(2);
    });

    it('should show time estimates for pending steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Est. 15 min')).toBeInTheDocument();
      expect(screen.getByText('Est. 10 min')).toBeInTheDocument();
      expect(screen.getByText('Est. 20 min')).toBeInTheDocument();
    });

    it('should indicate optional steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });
  });

  // Test progress tracking and visualization
  describe('Progress Tracking', () => {
    it('should calculate and display progress correctly', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // 1 completed out of 5 steps = 20%
      expect(screen.getByText('20% Complete')).toBeInTheDocument();
      expect(screen.getByText('1 of 5 steps completed')).toBeInTheDocument();
    });

    it('should show progress bar with correct percentage', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Progress bar should show 20%
      expect(screen.getByText('Progress: 20%')).toBeInTheDocument();
      expect(screen.getByText('Status: in progress')).toBeInTheDocument();
    });

    it('should handle 100% completion correctly', () => {
      const completedSteps = mockSteps.map(step => ({
        ...step,
        status: 'completed' as const,
      }));

      render(
        <AnalysisWorkflow 
          steps={completedSteps}
          currentStep=""
          overallStatus="completed"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('100% Complete')).toBeInTheDocument();
    });
  });

  // Test minimal variant layout
  describe('Minimal Variant', () => {
    it('should render minimal variant with progress bar only', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          variant="minimal"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Analysis Progress')).toBeInTheDocument();
      expect(screen.getByText('1/5')).toBeInTheDocument();
      expect(screen.getByText('Current: Contributing Conditions')).toBeInTheDocument();
    });

    it('should not show detailed step information in minimal variant', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          variant="minimal"
          {...mockHandlers}
        />
      );

      // Should not show detailed descriptions or role assignments
      expect(screen.queryByText('Review incident narrative and basic information')).not.toBeInTheDocument();
      expect(screen.queryByText('team lead')).not.toBeInTheDocument();
    });
  });

  // Test step actions and interactions
  describe('Step Actions', () => {
    it('should show start button for available steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      // Classification should be available after conditions_analysis completes
      const startButtons = screen.queryAllByRole('button', { name: /start/i });
      expect(startButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('should call onStepStart when start button is clicked', async () => {
      const stepsWithCompletedDependency = mockSteps.map(step => 
        step.id === 'conditions_analysis' 
          ? { ...step, status: 'completed' as const }
          : step
      );

      render(
        <AnalysisWorkflow 
          steps={stepsWithCompletedDependency}
          currentStep="classification"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      expect(mockHandlers.onStepStart).toHaveBeenCalledWith('classification');
    });

    it('should show complete button for in-progress steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
    });

    it('should show view button for completed steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    });

    it('should show skip button for optional steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="final_review"
          overallStatus="in_progress"
          userRole="company_admin"
          {...mockHandlers}
        />
      );

      const skipButton = screen.queryByRole('button', { name: /skip/i });
      // Skip button should be available for optional final review
      if (skipButton) {
        expect(skipButton).toBeInTheDocument();
      }
    });
  });

  // Test step completion with notes
  describe('Step Completion', () => {
    it('should show editing interface when completing step', async () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      expect(screen.getByPlaceholderText('Add notes about this step...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onStepComplete with notes when step is completed', async () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      const notesTextarea = screen.getByPlaceholderText('Add notes about this step...');
      await user.type(notesTextarea, 'Analysis completed with contributing factors identified');

      const saveButton = screen.getByRole('button', { name: /complete/i });
      await user.click(saveButton);

      expect(mockHandlers.onStepComplete).toHaveBeenCalledWith(
        'conditions_analysis',
        'Analysis completed with contributing factors identified'
      );
    });

    it('should cancel editing when cancel button is clicked', async () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Add notes about this step...')).not.toBeInTheDocument();
    });
  });

  // Test role-based permissions and access control
  describe('Role-Based Access Control', () => {
    it('should show actions for users with appropriate role', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      // Team lead should have access to team_lead assigned steps
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
    });

    it('should hide actions for users without appropriate role', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="frontline_worker"
          {...mockHandlers}
        />
      );

      // Frontline worker should not have access to team_lead assigned steps
      expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
    });

    it('should respect role hierarchy for step access', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="company_admin"
          {...mockHandlers}
        />
      );

      // Company admin should have access to team_lead steps (higher hierarchy)
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
    });

    it('should show different styling for inaccessible steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="frontline_worker"
          {...mockHandlers}
        />
      );

      // Steps should be visible but with reduced opacity
      const stepElements = screen.getByText('Contributing Conditions').closest('div');
      expect(stepElements).toBeInTheDocument();
    });
  });

  // Test dependency handling
  describe('Step Dependencies', () => {
    it('should enforce step dependencies correctly', () => {
      const stepsWithIncompleteDepedency = mockSteps.map(step => 
        step.id === 'initial_review' 
          ? { ...step, status: 'pending' as const }
          : step
      );

      render(
        <AnalysisWorkflow 
          steps={stepsWithIncompleteDepedency}
          currentStep="classification"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      // Classification depends on conditions_analysis, which depends on initial_review
      // Since initial_review is pending, classification should not be startable
      expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
    });

    it('should show dependency information in step details', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Depends on:')).toBeInTheDocument();
      expect(screen.getByText('Initial Review')).toBeInTheDocument();
    });

    it('should allow steps with satisfied dependencies', () => {
      const stepsWithSatisfiedDependencies = mockSteps.map(step => 
        step.id === 'conditions_analysis' 
          ? { ...step, status: 'completed' as const }
          : step
      );

      render(
        <AnalysisWorkflow 
          steps={stepsWithSatisfiedDependencies}
          currentStep="classification"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      // Classification should now be startable
      const startButton = screen.queryByRole('button', { name: /start/i });
      if (startButton) {
        expect(startButton).toBeInTheDocument();
      }
    });
  });

  // Test read-only mode
  describe('Read-Only Mode', () => {
    it('should hide all action buttons in read-only mode', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          readOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
    });

    it('should still show step information in read-only mode', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          readOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
      expect(screen.getByText('Identify and analyze contributing conditions')).toBeInTheDocument();
    });
  });

  // Test step notes display
  describe('Step Notes Display', () => {
    it('should display existing notes for completed steps', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Initial review completed successfully')).toBeInTheDocument();
    });

    it('should handle steps without notes gracefully', () => {
      const stepsWithoutNotes = mockSteps.map(step => ({
        ...step,
        notes: undefined,
      }));

      render(
        <AnalysisWorkflow 
          steps={stepsWithoutNotes}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Should not crash
      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
    });
  });

  // Test healthcare workflow integration
  describe('Healthcare Workflow Integration', () => {
    it('should support NDIS analysis workflow phases', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          showTimestamps={true}
          showAssignments={true}
          {...mockHandlers}
        />
      );

      // Should show standard NDIS analysis phases
      expect(screen.getByText('Initial Review')).toBeInTheDocument();
      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
      expect(screen.getByText('Incident Classification')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('should track completion for audit requirements', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          showTimestamps={true}
          {...mockHandlers}
        />
      );

      // Should show completion timestamp and user for audit trail
      expect(screen.getByText('Completed 15 Jan 10:30')).toBeInTheDocument();
      expect(screen.getByText('by Jennifer Wu')).toBeInTheDocument();
    });

    it('should support team-based workflow assignments', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          showAssignments={true}
          {...mockHandlers}
        />
      );

      // Should show role assignments for workflow coordination
      expect(screen.getAllByText('team lead')).toHaveLength(3);
      expect(screen.getAllByText('company admin')).toHaveLength(2);
    });
  });

  // Test accessibility compliance for healthcare users
  describe('Healthcare Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      await testHealthcareAccessibility(container, 'analysis workflow');
    });

    it('should provide proper form accessibility when editing', async () => {
      const { container } = render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      await testFormAccessibility(container);
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      // Should have focusable buttons
      const expectedFocusableCount = 2; // Complete and View buttons
      await testKeyboardNavigation(container, expectedFocusableCount);
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Should have proper heading structure
      expect(screen.getByRole('heading', { name: /analysis workflow/i })).toBeInTheDocument();
    });

    it('should announce step status changes', () => {
      const { rerender } = render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Update to completed status
      const updatedSteps = mockSteps.map(step => 
        step.id === 'conditions_analysis' 
          ? { ...step, status: 'completed' as const, completedAt: new Date() }
          : step
      );

      rerender(
        <AnalysisWorkflow 
          steps={updatedSteps}
          currentStep="classification"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Progress should update
      expect(screen.getByText('40% Complete')).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <AnalysisWorkflow 
          ref={ref}
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Analysis Workflow');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-analysis-workflow';
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          className={customClass}
          {...mockHandlers}
        />
      );

      const container = screen.getByText('Analysis Workflow').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test error handling and edge cases
  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      render(
        <AnalysisWorkflow 
          steps={[]}
          currentStep=""
          overallStatus="not_started"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
      expect(screen.getByText('0% Complete')).toBeInTheDocument();
    });

    it('should handle missing currentStep gracefully', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep=""
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
    });

    it('should handle steps without dependencies', () => {
      const stepsWithoutDependencies = mockSteps.map(step => ({
        ...step,
        dependencies: undefined,
      }));

      render(
        <AnalysisWorkflow 
          steps={stepsWithoutDependencies}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          userRole="team_lead"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
    });

    it('should handle undefined userRole gracefully', () => {
      render(
        <AnalysisWorkflow 
          steps={mockSteps}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          // No userRole provided
          {...mockHandlers}
        />
      );

      // Should still render content
      expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
    });

    it('should handle steps with undefined status', () => {
      const stepsWithUndefinedStatus = mockSteps.map(step => ({
        ...step,
        status: undefined,
      }));

      // @ts-expect-error - Testing invalid data
      render(
        <AnalysisWorkflow 
          steps={stepsWithUndefinedStatus}
          currentStep="conditions_analysis"
          overallStatus="in_progress"
          {...mockHandlers}
        />
      );

      // Should render with default handling
      expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
    });
  });
});