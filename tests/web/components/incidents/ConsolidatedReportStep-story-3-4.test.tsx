// @ts-nocheck
/**
 * Story 3.4: ConsolidatedReportStep Auto-Completion Tests
 * 
 * Test Coverage:
 * - Auto-completion trigger when workflow is complete
 * - UI updates for auto-completed status
 * - Button state changes for different statuses
 * - Error handling for auto-completion failures
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ConsolidatedReportStep } from '../../../../apps/web/components/incidents/ConsolidatedReportStep';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '../../../../apps/web/components/auth/auth-provider';

// Mock dependencies
jest.mock('convex/react');
jest.mock('../../../../apps/web/components/auth/auth-provider');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock components
jest.mock('../../../../apps/web/components/incidents/IncidentSummaryDisplay', () => ({
  IncidentSummaryDisplay: () => <div data-testid="incident-summary">Summary</div>
}));

jest.mock('../../../../apps/web/components/incidents/CompletionChecklist', () => ({
  CompletionChecklist: () => <div data-testid="completion-checklist">Checklist</div>
}));

jest.mock('../../../../apps/web/components/incidents/ExportPreview', () => ({
  ExportPreview: () => <div data-testid="export-preview">Preview</div>
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Story 3.4: ConsolidatedReportStep Auto-Completion', () => {
  
  const mockProps = {
    incident_id: 'incident-123',
    onComplete: jest.fn(),
    onPrevious: jest.fn(),
    onNavigateToStep: jest.fn(),
  };

  const mockUser = {
    sessionToken: 'test-session-token',
    email: 'test@example.com',
  };

  const mockIncident = {
    _id: 'incident-123',
    reporter_name: 'Test Reporter',
    participant_name: 'Test Participant',
    event_date_time: 'Today at 2:00 PM',
    location: 'Test Location',
    overall_status: 'analysis_pending',
    handoff_status: undefined,
    created_at: Date.now() - 3600000,
    workflow_completed_at: undefined,
  };

  const mockEnhancedNarrative = {
    _id: 'narrative-123',
    enhanced_content: 'Test enhanced narrative',
    user_edited: false,
    enhancement_version: 1,
  };

  const mockWorkflowValidation = {
    all_complete: true,
    missing_requirements: [],
  };

  let mockAutoCompleteWorkflow: jest.Mock;
  let mockSubmitForAnalysis: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAutoCompleteWorkflow = jest.fn();
    mockSubmitForAnalysis = jest.fn();

    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseMutation.mockImplementation((api) => {
      if (api.toString().includes('autoCompleteWorkflow')) {
        return mockAutoCompleteWorkflow;
      }
      if (api.toString().includes('submitIncidentForAnalysis')) {
        return mockSubmitForAnalysis;
      }
      return jest.fn();
    });

    // Default query mocks
    mockUseQuery.mockImplementation((api, args) => {
      if (args === "skip") return undefined;
      
      if (api.toString().includes('getById')) {
        return mockIncident;
      }
      if (api.toString().includes('getEnhancedNarrative')) {
        return mockEnhancedNarrative;
      }
      if (api.toString().includes('validateWorkflowCompletion')) {
        return mockWorkflowValidation;
      }
      return undefined;
    });
  });

  describe('Auto-Completion Trigger', () => {
    
    test('should trigger auto-completion when workflow is complete and status is analysis_pending', async () => {
      mockAutoCompleteWorkflow.mockResolvedValue({
        success: true,
        status: 'ready_for_analysis',
        workflow_completed_at: Date.now()
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      await waitFor(() => {
        expect(mockAutoCompleteWorkflow).toHaveBeenCalledWith({
          sessionToken: 'test-session-token',
          incident_id: 'incident-123',
          correlation_id: expect.stringContaining('auto-complete-step8-incident-123-')
        });
      });
    });

    test('should not trigger auto-completion if workflow is not complete', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('validateWorkflowCompletion')) {
          return { all_complete: false, missing_requirements: ['narrative'] };
        }
        if (api.toString().includes('getById')) {
          return mockIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      await waitFor(() => {
        expect(mockAutoCompleteWorkflow).not.toHaveBeenCalled();
      });
    });

    test('should not trigger auto-completion if already ready_for_analysis', async () => {
      const completedIncident = {
        ...mockIncident,
        overall_status: 'ready_for_analysis',
        workflow_completed_at: Date.now()
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return completedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      await waitFor(() => {
        expect(mockAutoCompleteWorkflow).not.toHaveBeenCalled();
      });
    });

    test('should not trigger auto-completion if no enhanced narrative', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return mockIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return null; // No enhanced narrative
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      await waitFor(() => {
        expect(mockAutoCompleteWorkflow).not.toHaveBeenCalled();
      });
    });

  });

  describe('UI Updates for Auto-Completed Status', () => {

    test('should show "Workflow Completed" when overall_status is ready_for_analysis', () => {
      const autoCompletedIncident = {
        ...mockIncident,
        overall_status: 'ready_for_analysis',
        workflow_completed_at: Date.now()
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return autoCompletedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Workflow Completed')).toBeInTheDocument();
      expect(screen.getByText(/automatically completed and is ready for analysis/)).toBeInTheDocument();
    });

    test('should show "Already Submitted" when handoff_status is ready_for_analysis', () => {
      const submittedIncident = {
        ...mockIncident,
        handoff_status: 'ready_for_analysis',
        submitted_at: Date.now()
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return submittedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Already Submitted')).toBeInTheDocument();
      expect(screen.getByText(/submitted and is waiting for team leader review/)).toBeInTheDocument();
    });

  });

  describe('Button State Management', () => {

    test('should disable submit button when incident is auto-completed', () => {
      const autoCompletedIncident = {
        ...mockIncident,
        overall_status: 'ready_for_analysis',
        workflow_completed_at: Date.now()
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return autoCompletedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /Workflow Complete/ });
      expect(submitButton).toBeDisabled();
    });

    test('should hide review completion button when incident is auto-completed', () => {
      const autoCompletedIncident = {
        ...mockIncident,
        overall_status: 'ready_for_analysis',
        workflow_completed_at: Date.now()
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return autoCompletedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.queryByText('Review Completion')).not.toBeInTheDocument();
    });

    test('should show review completion button for incomplete workflows', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Review Completion')).toBeInTheDocument();
    });

  });

  describe('Error Handling', () => {

    test('should handle auto-completion errors gracefully without showing user error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAutoCompleteWorkflow.mockRejectedValue(new Error('Auto-completion failed'));

      render(<ConsolidatedReportStep {...mockProps} />);

      await waitFor(() => {
        expect(mockAutoCompleteWorkflow).toHaveBeenCalled();
      });

      // Wait for error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ AUTO-COMPLETION FAILED', expect.any(Error));
      });

      // Should not show any user-visible error
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

  });

  describe('Status Badge Display', () => {

    test('should show correct workflow status badge', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      // Should show Complete badge when workflow validation is complete
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    test('should show correct overall status badge', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('analysis_pending')).toBeInTheDocument();
    });

    test('should show ready_for_analysis status when auto-completed', () => {
      const autoCompletedIncident = {
        ...mockIncident,
        overall_status: 'ready_for_analysis',
      };

      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        
        if (api.toString().includes('getById')) {
          return autoCompletedIncident;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return undefined;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('ready_for_analysis')).toBeInTheDocument();
    });

  });

});