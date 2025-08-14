// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EnhancedReviewStep } from '@/components/incidents/EnhancedReviewStep';

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
jest.mock('@/components/incidents/EnhancedNarrativeDisplay', () => ({
  EnhancedNarrativeDisplay: ({ enhancedNarrative }: any) => (
    <div data-testid="enhanced-narrative-display">
      Enhanced Narrative: {enhancedNarrative.enhanced_content}
    </div>
  ),
}));

jest.mock('@/components/incidents/CompletionChecklist', () => ({
  CompletionChecklist: ({ validation }: any) => (
    <div data-testid="completion-checklist">
      Completion Status: {validation.all_complete ? 'Complete' : 'Incomplete'}
    </div>
  ),
}));

jest.mock('@/components/incidents/ExportPreview', () => ({
  ExportPreview: ({ incident_id }: any) => (
    <div data-testid="export-preview">Export Preview for {incident_id}</div>
  ),
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('EnhancedReviewStep', () => {
  const mockProps = {
    incident_id: 'test-incident-123' as any,
    onComplete: jest.fn(),
    onPrevious: jest.fn(),
  };

  const mockUser = {
    sessionToken: 'test-session-token',
    name: 'Test User',
  };

  const mockEnhancedNarrative = {
    _id: 'enhanced-123' as any,
    original_content: 'Original narrative content',
    clarification_responses: 'Some clarification responses',
    enhanced_content: 'AI-enhanced narrative with improvements',
    enhancement_version: 1,
    ai_model: 'gpt-4',
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
    all_complete: true,
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
    all_complete: false,
    missing_requirements: ['clarifications_complete', 'enhancement_complete'],
  };

  beforeEach(() => {
    // Mock useAuth
    const { useAuth } = require('@/components/auth/auth-provider');
    useAuth.mockReturnValue({ user: mockUser });

    // Mock useQuery and useMutation
    const { useQuery, useMutation } = require('convex/react');
    useQuery.mockImplementation((queryName: string) => {
      if (queryName.includes('getEnhancedNarrative')) {
        return mockEnhancedNarrative;
      }
      if (queryName.includes('validateWorkflowCompletion')) {
        return mockWorkflowValidation;
      }
      return null;
    });

    useMutation.mockReturnValue(jest.fn().mockResolvedValue({ success: true }));

    // Clear previous call history
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the enhanced review step with complete workflow', () => {
      render(<EnhancedReviewStep {...mockProps} />);

      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
      expect(screen.getByText(/Review the AI-enhanced narrative/)).toBeInTheDocument();
      expect(screen.getByTestId('completion-checklist')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-narrative-display')).toBeInTheDocument();
    });

    it('should show ready to submit badge when workflow is complete', () => {
      render(<EnhancedReviewStep {...mockProps} />);

      expect(screen.getByText('Ready to Submit')).toBeInTheDocument();
    });

    it('should show incomplete badge when workflow is not complete', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockIncompleteValidation;
        }
        return mockEnhancedNarrative;
      });

      render(<EnhancedReviewStep {...mockProps} />);

      expect(screen.getByText('Incomplete')).toBeInTheDocument();
    });
  });

  describe('AI Enhancement Generation', () => {
    it('should auto-generate enhancement when none exists', async () => {
      const mockGenerateEnhancement = jest.fn().mockResolvedValue({
        success: true,
        enhanced_narrative_id: 'new-enhanced-123',
      });

      const { useQuery, useMutation } = require('convex/react');
      
      // Mock no existing enhancement
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('getEnhancedNarrative')) {
          return null; // No existing enhancement
        }
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockWorkflowValidation;
        }
        return null;
      });

      useMutation.mockReturnValue(mockGenerateEnhancement);

      render(<EnhancedReviewStep {...mockProps} />);

      await waitFor(() => {
        expect(mockGenerateEnhancement).toHaveBeenCalledWith({
          sessionToken: mockUser.sessionToken,
          incident_id: mockProps.incident_id,
        });
      });
    });

    it('should show loading state while generating enhancement', () => {
      const { useQuery } = require('convex/react');
      
      // Mock no workflow validation to trigger loading state
      useQuery.mockReturnValue(null);

      render(<EnhancedReviewStep {...mockProps} />);

      expect(screen.getByText('Loading workflow status...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should handle enhancement generation failure', async () => {
      const mockGenerateEnhancement = jest.fn().mockResolvedValue({
        success: false,
        error: 'AI service temporarily unavailable',
      });

      const { toast } = require('sonner');
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockGenerateEnhancement);

      render(<EnhancedReviewStep {...mockProps} />);

      // Find and click manual generate button
      const generateButton = screen.getByText('Generate Enhancement');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Enhancement failed: AI service temporarily unavailable'
        );
      });
    });
  });

  describe('Workflow Submission', () => {
    it('should submit complete incident successfully', async () => {
      const mockSubmitForAnalysis = jest.fn().mockResolvedValue({
        success: true,
        handoff_id: 'handoff-123',
      });

      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<EnhancedReviewStep {...mockProps} />);

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
        handoff_id: 'handoff-123',
      });
    });

    it('should prevent submission when workflow is incomplete', () => {
      const { useQuery } = require('convex/react');
      useQuery.mockImplementation((queryName: string) => {
        if (queryName.includes('validateWorkflowCompletion')) {
          return mockIncompleteValidation;
        }
        return mockEnhancedNarrative;
      });

      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).toBeDisabled();
    });

    it('should show submission error message', async () => {
      const mockSubmitForAnalysis = jest.fn().mockResolvedValue({
        success: false,
      });

      const { toast } = require('sonner');
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit incident');
      });

      expect(mockProps.onComplete).toHaveBeenCalledWith({
        success: false,
      });
    });
  });

  describe('Export Preview', () => {
    it('should toggle export preview visibility', () => {
      render(<EnhancedReviewStep {...mockProps} />);

      const showPreviewButton = screen.getByText('Show Export Preview');
      fireEvent.click(showPreviewButton);

      expect(screen.getByTestId('export-preview')).toBeInTheDocument();
      expect(screen.getByText('Hide Export Preview')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle previous step navigation', () => {
      render(<EnhancedReviewStep {...mockProps} />);

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

      render(<EnhancedReviewStep {...mockProps} />);

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

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const { useAuth } = require('@/components/auth/auth-provider');
      useAuth.mockReturnValue({ user: null });

      const mockSubmitForAnalysis = jest.fn();
      const { toast } = require('sonner');
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      expect(submitButton).toBeDisabled(); // Should be disabled without auth
    });

    it('should handle network errors gracefully', async () => {
      const mockSubmitForAnalysis = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      const { toast } = require('sonner');
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockSubmitForAnalysis);

      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to submit incident. Please try again.'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /submit for analysis/i });
      const previousButton = screen.getByRole('button', { name: /previous step/i });

      expect(submitButton).toBeInTheDocument();
      expect(previousButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<EnhancedReviewStep {...mockProps} />);

      const submitButton = screen.getByText('Submit for Analysis');
      submitButton.focus();

      expect(document.activeElement).toBe(submitButton);
    });
  });
});