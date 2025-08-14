// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsolidatedReportStep } from '@/components/incidents/ConsolidatedReportStep';

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock auth provider
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));

// Mock child components
jest.mock('@/components/incidents/IncidentSummaryDisplay', () => ({
  IncidentSummaryDisplay: ({ incident, enhancedNarrative }: any) => (
    <div data-testid="incident-summary-display">
      Incident Summary: {incident?.participant_name} - {enhancedNarrative?.enhanced_content?.substring(0, 50)}...
    </div>
  ),
}));

jest.mock('@/components/incidents/CompletionChecklist', () => ({
  CompletionChecklist: ({ validation }: any) => (
    <div data-testid="completion-checklist">
      Completion Status: {validation?.allComplete ? 'Complete' : 'Incomplete'}
    </div>
  ),
}));

jest.mock('@/components/incidents/ExportPreview', () => ({
  ExportPreview: ({ incident_id }: any) => (
    <div data-testid="export-preview">Export Preview for {incident_id}</div>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago'),
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@starter/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="tabs" data-value={value} {...props}>{children}</div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>{children}</div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>{children}</button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>{children}</div>
  ),
}));

describe('ConsolidatedReportStep', () => {
  const mockProps = {
    incident_id: 'test-incident-123' as any,
    onComplete: jest.fn(),
    onPrevious: jest.fn(),
  };

  const mockUser = {
    sessionToken: 'test-session-token',
    name: 'Test User',
    _id: 'user_123',
  };

  const mockIncident = {
    _id: 'test-incident-123',
    participant_name: 'John Doe',
    reporter_name: 'Jane Smith',
    location: 'Community Center',
    event_date_time: 'March 15, 2025 at 2:30 PM',
    capture_status: 'completed',
    enhanced_narrative_id: 'enhanced_123',
    created_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  };

  const mockEnhancedNarrative = {
    _id: 'enhanced_123',
    incident_id: 'test-incident-123',
    enhanced_content: 'This is the AI-enhanced narrative content combining original narratives with clarification responses.',
    enhancement_version: 1,
    ai_model: 'claude-3-sonnet',
    processing_time_ms: 1500,
    quality_score: 0.92,
    user_edited: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockWorkflowValidation = {
    checklist: {
      metadata_complete: true,
      narratives_complete: true,
      clarifications_complete: true,
      enhancement_complete: true,
      validation_passed: true,
    },
    allComplete: true,
    missing_requirements: [],
  };

  const mockIncompleteValidation = {
    checklist: {
      metadata_complete: true,
      narratives_complete: true,
      clarifications_complete: false,
      enhancement_complete: false,
      validation_passed: false,
    },
    allComplete: false,
    missing_requirements: ['clarifications_complete', 'enhancement_complete'],
  };

  beforeEach(() => {
    // Mock useAuth
    const { useAuth } = require('@/components/auth/auth-provider');
    useAuth.mockReturnValue({ user: mockUser });

    // Mock useQuery and useMutation
    const { useQuery, useMutation } = require('convex/react');
    useQuery.mockImplementation((queryName: string) => {
      if (queryName.includes('incidents.getById')) {
        return mockIncident;
      }
      if (queryName.includes('getEnhancedNarrative')) {
        return mockEnhancedNarrative;
      }
      if (queryName.includes('validateWorkflowCompletion')) {
        return mockWorkflowValidation;
      }
      return null;
    });

    useMutation.mockReturnValue(jest.fn().mockResolvedValue({ success: true, handoff_id: 'handoff_123' }));

    // Clear previous call history
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the consolidated report step with complete data', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Final Review & Submit')).toBeInTheDocument();
      expect(screen.getByText(/Complete incident overview ready for analysis/)).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-summary')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-checklist')).toBeInTheDocument();
    });

    it('should display incident metadata correctly', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Community Center')).toBeInTheDocument();
      expect(screen.getByText('March 15, 2025 at 2:30 PM')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument(); // Formatted time
    });

    it('should show completion badge when workflow is complete', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Complete & Ready')).toBeInTheDocument();
    });

    it('should show incomplete badge when workflow is not complete', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockIncompleteValidation;
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Incomplete')).toBeInTheDocument();
    });

    it('should display AI enhancement information', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument();
      expect(screen.getByText(/Quality Score: 92%/)).toBeInTheDocument();
      expect(screen.getByText(/Processing Time: 1.5s/)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tab triggers', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByTestId('tab-trigger-summary')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-checklist')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-export')).toBeInTheDocument();
    });

    it('should show summary tab by default', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'summary');
      expect(screen.getByTestId('incident-summary-display')).toBeInTheDocument();
    });

    it('should switch to checklist tab when clicked', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      const checklistTab = screen.getByTestId('tab-trigger-checklist');
      fireEvent.click(checklistTab);

      expect(screen.getByTestId('completion-checklist')).toBeInTheDocument();
    });

    it('should switch to export tab when clicked', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      const exportTab = screen.getByTestId('tab-trigger-export');
      fireEvent.click(exportTab);

      expect(screen.getByTestId('export-preview')).toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('should show loading state when data is not available', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockReturnValue(null);

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Loading incident data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should handle missing enhanced narrative gracefully', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('getEnhancedNarrative')) {
          return null; // No enhanced narrative
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Enhancement not available')).toBeInTheDocument();
    });

    it('should handle missing incident gracefully', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('incidents.getById')) {
          return null; // No incident
        }
        return mockEnhancedNarrative;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Incident not found')).toBeInTheDocument();
    });
  });

  describe('Submission Process', () => {
    it('should submit complete incident successfully', async () => {
      const mockSubmitForAnalysis = jest.fn().mockResolvedValue({
        success: true,
        handoff_id: 'handoff_123',
      });

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitForAnalysis).toHaveBeenCalledWith({
          sessionToken: mockUser.sessionToken,
          incident_id: mockProps.incident_id,
          enhanced_narrative_id: mockEnhancedNarrative._id,
        });
      });

      expect(mockProps.onComplete).toHaveBeenCalledWith({
        success: true,
        handoff_id: 'handoff_123',
      });

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith('Incident submitted for analysis workflow');
    });

    it('should prevent submission when workflow is incomplete', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockIncompleteValidation;
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission error', async () => {
      const mockSubmitForAnalysis = jest.fn().mockResolvedValue({
        success: false,
        error: 'Submission failed',
      });

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const { toast } = require('sonner');
        expect(toast.error).toHaveBeenCalledWith('Failed to submit incident');
      });

      expect(mockProps.onComplete).toHaveBeenCalledWith({
        success: false,
      });
    });

    it('should handle network errors during submission', async () => {
      const mockSubmitForAnalysis = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const { toast } = require('sonner');
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to submit incident. Please try again.'
        );
      });
    });

    it('should disable submit button during submission', async () => {
      const mockSubmitForAnalysis = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      // Should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should prevent submission without authentication', async () => {
      const { useAuth } = require('@/components/auth/auth-provider');
      useAuth.mockReturnValue({ user: null });

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Cannot submit - missing authentication or enhancement');
    });

    it('should prevent submission without enhanced narrative', async () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('getEnhancedNarrative')) {
          return null; // No enhanced narrative
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Cannot submit - missing authentication or enhancement');
    });
  });

  describe('Navigation', () => {
    it('should handle previous step navigation', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      const previousButton = screen.getByText('Previous Step');
      fireEvent.click(previousButton);

      expect(mockProps.onPrevious).toHaveBeenCalled();
    });

    it('should disable navigation during submission', async () => {
      const mockSubmitForAnalysis = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      // Check that previous button is disabled during submission
      const previousButton = screen.getByText('Previous Step');
      expect(previousButton).toBeDisabled();

      await waitFor(() => {
        expect(previousButton).not.toBeDisabled();
      });
    });
  });

  describe('Enhanced Narrative Display', () => {
    it('should show user edit indicator when narrative was edited', () => {
      const editedNarrative = {
        ...mockEnhancedNarrative,
        user_edited: true,
        enhancement_version: 2,
      };

      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('getEnhancedNarrative')) {
          return editedNarrative;
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('User Edited')).toBeInTheDocument();
      expect(screen.getByText(/Version: 2/)).toBeInTheDocument();
    });

    it('should show AI generated indicator when not user edited', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText(/Version: 1/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /submit for analysis/i });
      const previousButton = screen.getByRole('button', { name: /previous step/i });

      expect(submitButton).toBeInTheDocument();
      expect(previousButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      submitButton.focus();

      expect(document.activeElement).toBe(submitButton);
    });

    it('should have proper tab navigation structure', () => {
      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing quality score gracefully', () => {
      const narrativeWithoutScore = {
        ...mockEnhancedNarrative,
        quality_score: undefined,
      };

      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('getEnhancedNarrative')) {
          return narrativeWithoutScore;
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Quality Score: N/A')).toBeInTheDocument();
    });

    it('should handle very long enhanced content', () => {
      const longNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: 'A'.repeat(5000),
      };

      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('getEnhancedNarrative')) {
          return longNarrative;
        }
        if (queryName.includes('incidents.getById')) {
          return mockIncident;
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByTestId('incident-summary-display')).toBeInTheDocument();
    });

    it('should handle incomplete incident data', () => {
      const incompleteIncident = {
        ...mockIncident,
        participant_name: undefined,
        location: '',
      };

      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('incidents.getById')) {
          return incompleteIncident;
        }
        if (queryName.includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      render(<ConsolidatedReportStep {...mockProps} />);

      expect(screen.getByText('Not specified')).toBeInTheDocument(); // For missing participant name
    });
  });
});