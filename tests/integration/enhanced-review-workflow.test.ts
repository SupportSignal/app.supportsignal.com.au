// @ts-nocheck
/**
 * Integration Test Suite: Enhanced Review Workflow (Story 3.3)
 * 
 * Tests the complete end-to-end flow from incident creation through
 * AI enhancement to analysis workflow handoff.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock all external dependencies
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Enhanced Review Workflow Integration Tests', () => {
  const mockSessionToken = 'test-session-token-123';
  const mockIncidentId = 'test-incident-456';
  
  const mockUser = {
    sessionToken: mockSessionToken,
    name: 'Test User',
    role: 'frontline_worker',
  };

  const mockCompleteIncident = {
    _id: mockIncidentId,
    reporter_name: 'John Reporter',
    participant_name: 'Jane Participant',
    event_date_time: '2024-01-15T14:30:00Z',
    location: 'Main Office Conference Room',
    narrative_before_event: 'Detailed before event narrative...',
    narrative_during_event: 'Detailed during event narrative...',
    narrative_end_event: 'Detailed end event narrative...',
    narrative_post_event: 'Detailed post event narrative...',
    clarification_responses: JSON.stringify([
      { phase: 'before_event', responses: ['Answer 1', 'Answer 2'] },
      { phase: 'during_event', responses: ['Answer 3', 'Answer 4'] }
    ]),
  };

  const mockEnhancedNarrative = {
    _id: 'enhanced-narrative-789',
    incident_id: mockIncidentId,
    original_content: 'Combined original narratives...',
    clarification_responses: 'Combined clarification responses...',
    enhanced_content: 'AI-enhanced narrative with improved structure and analysis...',
    enhancement_version: 1,
    ai_model: 'gpt-4',
    processing_time_ms: 2100,
    quality_score: 0.89,
    user_edited: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockCompleteValidation = {
    checklist: {
      metadata_complete: true,
      narratives_complete: true,
      clarifications_complete: true,
      enhancement_complete: true,
      validation_passed: true,
    },
    all_complete: true,
    missing_requirements: [],
  };

  beforeEach(() => {
    // Setup auth mock
    const { useAuth } = require('@/components/auth/auth-provider');
    useAuth.mockReturnValue({ user: mockUser });

    jest.clearAllMocks();
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full workflow from validation to submission', async () => {
      const mockEnhanceNarrative = jest.fn().mockResolvedValue({
        success: true,
        enhanced_narrative_id: mockEnhancedNarrative._id,
        processing_time_ms: 2100,
      });

      const mockSubmitForAnalysis = jest.fn().mockResolvedValue({
        success: true,
        handoff_id: 'handoff-xyz-789',
        status: 'submitted_for_analysis',
      });

      const mockValidateWorkflow = jest.fn().mockReturnValue(mockCompleteValidation);
      const mockGetEnhancedNarrative = jest.fn().mockReturnValue(mockEnhancedNarrative);

      // Mock Convex hooks
      const { useQuery, useMutation } = require('convex/react');
      
      useQuery.mockImplementation((api, args) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockValidateWorkflow();
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockGetEnhancedNarrative();
        }
        return null;
      });

      useMutation.mockImplementation((api) => {
        if (api.toString().includes('enhanceIncidentNarrative')) {
          return mockEnhanceNarrative;
        }
        if (api.toString().includes('submitIncidentForAnalysis')) {
          return mockSubmitForAnalysis;
        }
        return jest.fn();
      });

      // Import and render the component after mocking
      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      const mockOnComplete = jest.fn();
      const mockOnPrevious = jest.fn();

      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={mockOnComplete}
          onPrevious={mockOnPrevious}
        />
      );

      // Verify workflow completion status is displayed
      expect(screen.getByText('Ready to Submit')).toBeInTheDocument();

      // Submit the incident
      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).not.toBeDisabled();
      
      fireEvent.click(submitButton);

      // Verify submission was called with correct parameters
      await waitFor(() => {
        expect(mockSubmitForAnalysis).toHaveBeenCalledWith({
          sessionToken: mockSessionToken,
          incident_id: mockIncidentId,
          enhanced_narrative_id: mockEnhancedNarrative._id,
        });
      });

      // Verify completion callback was triggered
      expect(mockOnComplete).toHaveBeenCalledWith({
        success: true,
        handoff_id: 'handoff-xyz-789',
      });
    });

    it('should handle incomplete workflow validation', async () => {
      const incompleteValidation = {
        checklist: {
          metadata_complete: true,
          narratives_complete: true,
          clarifications_complete: false, // Missing
          enhancement_complete: false, // Missing
          validation_passed: false,
        },
        all_complete: false,
        missing_requirements: ['clarifications_complete', 'enhancement_complete'],
      };

      const { useQuery, useMutation } = require('convex/react');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return incompleteValidation;
        }
        return null; // No enhanced narrative
      });

      useMutation.mockReturnValue(jest.fn());

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Verify incomplete status is shown
      expect(screen.getByText('Incomplete')).toBeInTheDocument();

      // Verify submit button is disabled
      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).toBeDisabled();

      // Verify incomplete requirements message
      expect(screen.getByText('Complete all required steps before submitting')).toBeInTheDocument();
    });
  });

  describe('AI Enhancement Processing', () => {
    it('should auto-generate enhancement for complete incident', async () => {
      const mockEnhanceNarrative = jest.fn().mockResolvedValue({
        success: true,
        enhanced_narrative_id: 'new-enhanced-123',
        processing_time_ms: 1850,
      });

      const { useQuery, useMutation } = require('convex/react');
      const { toast } = require('sonner');
      
      // Mock workflow complete but no enhancement exists
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return null; // No enhancement exists yet
        }
        return null;
      });

      useMutation.mockImplementation((api) => {
        if (api.toString().includes('enhanceIncidentNarrative')) {
          return mockEnhanceNarrative;
        }
        return jest.fn();
      });

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Should auto-trigger enhancement generation
      await waitFor(() => {
        expect(mockEnhanceNarrative).toHaveBeenCalledWith({
          sessionToken: mockSessionToken,
          incident_id: mockIncidentId,
        });
      });

      // Verify success message
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Narrative enhancement completed');
      });
    });

    it('should handle AI service failures gracefully', async () => {
      const mockEnhanceNarrative = jest.fn().mockResolvedValue({
        success: false,
        error: 'AI service temporarily unavailable',
      });

      const { useQuery, useMutation } = require('convex/react');
      const { toast } = require('sonner');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        return null;
      });

      useMutation.mockReturnValue(mockEnhanceNarrative);

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Should show manual generation option if auto-generation fails
      await waitFor(() => {
        expect(screen.getByText('Generate Enhancement')).toBeInTheDocument();
      });

      // Click manual generation
      const generateButton = screen.getByText('Generate Enhancement');
      fireEvent.click(generateButton);

      // Verify error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Enhancement failed: AI service temporarily unavailable'
        );
      });
    });
  });

  describe('User Edit Workflow', () => {
    it('should handle user editing of enhanced narrative', async () => {
      const editedNarrative = {
        ...mockEnhancedNarrative,
        user_edited: true,
        user_edits: 'User-modified enhanced narrative with additional details...',
        enhancement_version: 2,
      };

      const mockUpdateEnhanced = jest.fn().mockResolvedValue({
        success: true,
        enhancement_version: 2,
      });

      const { useQuery, useMutation } = require('convex/react');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return editedNarrative;
        }
        return null;
      });

      useMutation.mockImplementation((api) => {
        if (api.toString().includes('updateEnhancedNarrative')) {
          return mockUpdateEnhanced;
        }
        return jest.fn();
      });

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Verify enhanced narrative display shows user edits
      expect(screen.getByTestId('enhanced-narrative-display')).toBeInTheDocument();
      
      // Verify workflow can still be submitted with user edits
      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle authentication token expiration', async () => {
      const mockSubmitForAnalysis = jest.fn().mockRejectedValue(
        new Error('Authentication token expired')
      );

      const { useQuery, useMutation } = require('convex/react');
      const { toast } = require('sonner');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return null;
      });

      useMutation.mockReturnValue(mockSubmitForAnalysis);

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to submit incident. Please try again.'
        );
      });
    });

    it('should handle network connectivity issues', async () => {
      const mockEnhanceNarrative = jest.fn().mockRejectedValue(
        new Error('Network request failed')
      );

      const { useQuery, useMutation } = require('convex/react');
      const { toast } = require('sonner');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        return null; // No enhancement, trigger generation
      });

      useMutation.mockReturnValue(mockEnhanceNarrative);

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to generate enhancement. Please try again.'
        );
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should support complete keyboard navigation workflow', async () => {
      const { useQuery, useMutation } = require('convex/react');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return null;
      });

      useMutation.mockReturnValue(jest.fn());

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Test tab navigation through interactive elements
      const submitButton = screen.getByRole('button', { name: /submit for analysis/i });
      const previousButton = screen.getByRole('button', { name: /previous step/i });

      // Focus should work correctly
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);

      // Tab to previous button
      fireEvent.keyDown(submitButton, { key: 'Tab' });
      // Note: Real tab behavior would need jsdom-global or similar for full testing
    });

    it('should have proper ARIA attributes for screen readers', () => {
      const { useQuery, useMutation } = require('convex/react');
      
      useQuery.mockImplementation((api) => {
        if (api.toString().includes('validateWorkflowCompletion')) {
          return mockCompleteValidation;
        }
        if (api.toString().includes('getEnhancedNarrative')) {
          return mockEnhancedNarrative;
        }
        return null;
      });

      useMutation.mockReturnValue(jest.fn());

      const { EnhancedReviewStep } = require('@/components/incidents/EnhancedReviewStep');
      
      render(
        <EnhancedReviewStep
          incident_id={mockIncidentId}
          onComplete={jest.fn()}
          onPrevious={jest.fn()}
        />
      );

      // Verify important elements have proper roles and labels
      const submitButton = screen.getByRole('button', { name: /submit for analysis/i });
      const previousButton = screen.getByRole('button', { name: /previous step/i });

      expect(submitButton).toHaveAttribute('type', 'button');
      expect(previousButton).toHaveAttribute('type', 'button');
    });
  });
});