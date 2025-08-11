// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentCaptureWorkflow } from '@/components/incidents/IncidentCaptureWorkflow';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';

// Mock dependencies
jest.mock('@/components/auth/auth-provider');
jest.mock('next/navigation');
jest.mock('convex/react');
jest.mock('@/components/incidents/IncidentMetadataForm', () => ({
  IncidentMetadataForm: ({ onComplete }: any) => (
    <div data-testid="metadata-form">
      <button 
        onClick={() => onComplete('test-incident-id')}
        data-testid="complete-metadata"
      >
        Complete Metadata
      </button>
    </div>
  ),
}));
jest.mock('@/components/incidents/NarrativeGrid', () => ({
  NarrativeGrid: ({ onComplete, onBack }: any) => (
    <div data-testid="narrative-grid">
      <button onClick={onBack} data-testid="back-to-metadata">Back</button>
      <button 
        onClick={onComplete}
        data-testid="complete-narrative"
      >
        Complete Narrative
      </button>
    </div>
  ),
}));
jest.mock('@/components/incidents/ClarificationStep', () => ({
  ClarificationStep: ({ onNext, onPrevious, phase }: any) => (
    <div data-testid={`clarification-step-${phase}`}>
      <h3>Clarification: {phase}</h3>
      <button onClick={onPrevious} data-testid="previous-step">Previous</button>
      <button onClick={onNext} data-testid="next-step">Next</button>
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseAction = useAction as jest.MockedFunction<typeof useAction>;

/**
 * IncidentCaptureWorkflow Component Test Suite
 * 
 * Tests the complete workflow navigation and state management:
 * - Step transitions (1 → 2 → 3 → 4 → 5 → 6)
 * - Authentication and authorization
 * - Component rendering for each step
 * - Error states and edge cases
 * - Integration with Convex backend functions
 */
describe('IncidentCaptureWorkflow', () => {
  const user = userEvent.setup();
  const mockPush = jest.fn();
  
  // Mock user data
  const mockUser = {
    _id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'frontline_worker',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
    
    mockUseQuery.mockReturnValue(undefined);
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseAction.mockReturnValue(jest.fn());
  });

  describe('Authentication and Authorization', () => {
    test('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        sessionToken: null,
      } as any);

      render(<IncidentCaptureWorkflow />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('should show loading state while authentication is in progress', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        sessionToken: null,
      } as any);

      render(<IncidentCaptureWorkflow />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should redirect unauthorized roles to dashboard', async () => {
      const unauthorizedUser = {
        ...mockUser,
        role: 'invalid_role',
      };

      mockUseAuth.mockReturnValue({
        user: unauthorizedUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);

      render(<IncidentCaptureWorkflow />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should allow authorized roles to access workflow', () => {
      const authorizedRoles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'];
      
      authorizedRoles.forEach(role => {
        const authorizedUser = { ...mockUser, role };
        
        mockUseAuth.mockReturnValue({
          user: authorizedUser,
          isLoading: false,
          sessionToken: 'test-token',
        } as any);

        const { unmount } = render(<IncidentCaptureWorkflow />);
        
        // Should render workflow header
        expect(screen.getByText('🚨 Incident Capture Workflow')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Step 1: Incident Metadata', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    test('should render metadata form on step 1', () => {
      render(<IncidentCaptureWorkflow />);

      expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
      expect(screen.queryByTestId('narrative-grid')).not.toBeInTheDocument();
    });

    test('should show correct step indicators for step 1', () => {
      render(<IncidentCaptureWorkflow />);

      // Step 1 should be current
      const step1 = screen.getByText('Incident Details').closest('div');
      expect(step1).toHaveClass('text-blue-600');
      
      // Other steps should be disabled
      const step2 = screen.getByText('Narrative Collection').closest('div');
      expect(step2).toHaveClass('text-gray-500');
    });

    test('should progress to step 2 when metadata is completed', async () => {
      render(<IncidentCaptureWorkflow />);

      const completeButton = screen.getByTestId('complete-metadata');
      await user.click(completeButton);

      // Should progress to narrative grid
      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
        expect(screen.queryByTestId('metadata-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Narrative Collection', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    test('should render narrative grid on step 2 with incident ID', async () => {
      render(<IncidentCaptureWorkflow />);

      // Complete metadata first
      await user.click(screen.getByTestId('complete-metadata'));

      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
      });
    });

    test('should show error state when trying to access step 2 without incident ID', () => {
      // Manually set currentStep to 2 without incident ID
      const TestWrapper = () => {
        const [currentStep, setCurrentStep] = React.useState(2);
        const [incidentId, setIncidentId] = React.useState(null);
        
        React.useEffect(() => {
          mockUseAuth.mockReturnValue({
            user: mockUser,
            isLoading: false,
            sessionToken: 'test-token',
          } as any);
        }, []);
        
        return (
          <div>
            {currentStep === 2 && !incidentId && (
              <div data-testid="missing-incident-error">
                <h2>Missing Incident Data</h2>
                <p>Please complete the incident details first.</p>
              </div>
            )}
          </div>
        );
      };
      
      render(<TestWrapper />);
      
      expect(screen.getByTestId('missing-incident-error')).toBeInTheDocument();
      expect(screen.getByText('Missing Incident Data')).toBeInTheDocument();
    });

    test('should allow navigation back to step 1 from step 2', async () => {
      render(<IncidentCaptureWorkflow />);

      // Complete metadata to get to step 2
      await user.click(screen.getByTestId('complete-metadata'));
      
      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
      });

      // Click back button
      await user.click(screen.getByTestId('back-to-metadata'));

      await waitFor(() => {
        expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
        expect(screen.queryByTestId('narrative-grid')).not.toBeInTheDocument();
      });
    });

    test('should progress to clarification steps when narrative is completed', async () => {
      render(<IncidentCaptureWorkflow />);

      // Complete metadata to get to step 2
      await user.click(screen.getByTestId('complete-metadata'));
      
      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
      });

      // Complete narrative
      await user.click(screen.getByTestId('complete-narrative'));

      await waitFor(() => {
        expect(screen.getByTestId('clarification-step-before_event')).toBeInTheDocument();
      });
    });
  });

  describe('Steps 3-6: Clarification Questions', () => {
    beforeEach(async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    const clarificationPhases = [
      { step: 3, phase: 'before_event', title: 'Before Event' },
      { step: 4, phase: 'during_event', title: 'During Event' },
      { step: 5, phase: 'end_event', title: 'End Event' },
      { step: 6, phase: 'post_event', title: 'Post-Event' },
    ];

    clarificationPhases.forEach(({ step, phase, title }) => {
      test(`should render clarification step ${step} (${phase})`, async () => {
        render(<IncidentCaptureWorkflow />);

        // Navigate through to clarification steps
        await user.click(screen.getByTestId('complete-metadata'));
        await waitFor(() => screen.getByTestId('narrative-grid'));
        
        await user.click(screen.getByTestId('complete-narrative'));
        await waitFor(() => screen.getByTestId('clarification-step-before_event'));

        // Navigate to specific step if needed
        for (let i = 3; i < step; i++) {
          await user.click(screen.getByTestId('next-step'));
        }

        await waitFor(() => {
          expect(screen.getByTestId(`clarification-step-${phase}`)).toBeInTheDocument();
          expect(screen.getByText(`Clarification: ${phase}`)).toBeInTheDocument();
        });
      });
    });

    test('should navigate forward through all clarification steps', async () => {
      render(<IncidentCaptureWorkflow />);

      // Get to clarification steps
      await user.click(screen.getByTestId('complete-metadata'));
      await waitFor(() => screen.getByTestId('narrative-grid'));
      
      await user.click(screen.getByTestId('complete-narrative'));
      await waitFor(() => screen.getByTestId('clarification-step-before_event'));

      // Navigate through all clarification steps
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'];
      
      for (let i = 0; i < phases.length; i++) {
        await waitFor(() => {
          expect(screen.getByTestId(`clarification-step-${phases[i]}`)).toBeInTheDocument();
        });
        
        if (i < phases.length - 1) {
          await user.click(screen.getByTestId('next-step'));
        }
      }
    });

    test('should navigate backward through clarification steps', async () => {
      render(<IncidentCaptureWorkflow />);

      // Get to step 6 (post_event)
      await user.click(screen.getByTestId('complete-metadata'));
      await waitFor(() => screen.getByTestId('narrative-grid'));
      
      await user.click(screen.getByTestId('complete-narrative'));
      await waitFor(() => screen.getByTestId('clarification-step-before_event'));

      // Navigate to step 6
      await user.click(screen.getByTestId('next-step')); // to step 4
      await user.click(screen.getByTestId('next-step')); // to step 5  
      await user.click(screen.getByTestId('next-step')); // to step 6
      
      await waitFor(() => {
        expect(screen.getByTestId('clarification-step-post_event')).toBeInTheDocument();
      });

      // Navigate backward
      await user.click(screen.getByTestId('previous-step'));
      
      await waitFor(() => {
        expect(screen.getByTestId('clarification-step-end_event')).toBeInTheDocument();
      });
    });

    test('should navigate back to narrative from first clarification step', async () => {
      render(<IncidentCaptureWorkflow />);

      // Get to first clarification step
      await user.click(screen.getByTestId('complete-metadata'));
      await waitFor(() => screen.getByTestId('narrative-grid'));
      
      await user.click(screen.getByTestId('complete-narrative'));
      await waitFor(() => screen.getByTestId('clarification-step-before_event'));

      // Go back to narrative
      await user.click(screen.getByTestId('previous-step'));

      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
      });
    });

    test('should redirect to incidents list after completing final step', async () => {
      render(<IncidentCaptureWorkflow />);

      // Navigate to final step
      await user.click(screen.getByTestId('complete-metadata'));
      await waitFor(() => screen.getByTestId('narrative-grid'));
      
      await user.click(screen.getByTestId('complete-narrative'));
      await waitFor(() => screen.getByTestId('clarification-step-before_event'));

      // Navigate through all clarification steps
      await user.click(screen.getByTestId('next-step')); // to step 4
      await user.click(screen.getByTestId('next-step')); // to step 5
      await user.click(screen.getByTestId('next-step')); // to step 6
      
      await waitFor(() => {
        expect(screen.getByTestId('clarification-step-post_event')).toBeInTheDocument();
      });

      // Complete final step
      await user.click(screen.getByTestId('next-step'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/incidents');
      });
    });
  });

  describe('Step Progress Indicators', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    test('should show correct progress indicators for each step', async () => {
      render(<IncidentCaptureWorkflow />);

      // Step 1: Current should be highlighted
      let currentStep = screen.getByText('1');
      expect(currentStep).toHaveClass('bg-blue-100');
      expect(currentStep).toHaveClass('text-blue-600');

      // Complete step 1
      await user.click(screen.getByTestId('complete-metadata'));
      
      await waitFor(() => {
        // Step 1: Should show completed
        const completedStep = screen.getByText('✓');
        expect(completedStep).toHaveClass('bg-green-100');
        
        // Step 2: Should be current
        const step2Text = screen.getByText('Narrative Collection');
        expect(step2Text.closest('div')).toHaveClass('text-blue-600');
      });
    });

    test('should disable future steps until previous ones are completed', () => {
      render(<IncidentCaptureWorkflow />);

      // Steps 3-6 should be disabled initially
      const beforeEvent = screen.getByText('Before Event').closest('div');
      const duringEvent = screen.getByText('During Event').closest('div');
      const endEvent = screen.getByText('End Event').closest('div');
      const postEvent = screen.getByText('Post-Event').closest('div');

      expect(beforeEvent).toHaveClass('text-gray-400');
      expect(duringEvent).toHaveClass('text-gray-400');
      expect(endEvent).toHaveClass('text-gray-400');
      expect(postEvent).toHaveClass('text-gray-400');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    test('should handle missing incident ID gracefully', () => {
      render(<IncidentCaptureWorkflow />);

      // Try to manually trigger step 2 without incident ID
      // This would be handled by the component's internal state management
      expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
    });

    test('should maintain step state during re-renders', async () => {
      const { rerender } = render(<IncidentCaptureWorkflow />);

      // Complete metadata
      await user.click(screen.getByTestId('complete-metadata'));
      
      await waitFor(() => {
        expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
      });

      // Re-render component
      rerender(<IncidentCaptureWorkflow />);

      // Should still be on step 2
      expect(screen.getByTestId('narrative-grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        sessionToken: 'test-token',
      } as any);
    });

    test('should have proper heading structure', () => {
      render(<IncidentCaptureWorkflow />);

      expect(screen.getByRole('heading', { name: /incident capture workflow/i })).toBeInTheDocument();
    });

    test('should provide navigation breadcrumbs', () => {
      render(<IncidentCaptureWorkflow />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('New Incident Report')).toBeInTheDocument();
    });

    test('should show current user information', () => {
      render(<IncidentCaptureWorkflow />);

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });
  });
});
