// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EnhancedNarrativeDisplay } from '@/components/incidents/EnhancedNarrativeDisplay';

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useMutation: jest.fn(),
}));

// Mock auth provider
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));

// Mock child components
jest.mock('@/components/incidents/OriginalContentCollapse', () => ({
  OriginalContentCollapse: ({ originalContent, defaultCollapsed }: any) => (
    <div data-testid="original-content-collapse" data-collapsed={defaultCollapsed}>
      Original Content Collapse
    </div>
  ),
}));

jest.mock('@/components/incidents/QADisplayCollapse', () => ({
  QADisplayCollapse: ({ clarificationResponses, defaultCollapsed }: any) => (
    <div data-testid="qa-display-collapse" data-collapsed={defaultCollapsed}>
      Q&A Display Collapse: {clarificationResponses.length} items
    </div>
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
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>{children}</div>
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

jest.mock('@starter/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea 
      data-testid="textarea" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      {...props} 
    />
  ),
}));

describe('EnhancedNarrativeDisplay', () => {
  const mockUser = {
    sessionToken: 'test-session-token',
    name: 'Test User',
    _id: 'user_123',
  };

  const mockEnhancedNarrative = {
    _id: 'enhanced_123' as any,
    original_content: JSON.stringify({
      before_event: 'Client was calm before the incident.',
      during_event: 'Client became agitated during discussion.',
      end_event: 'Client left the room with staff.',
      post_event: 'Client received one-on-one support.',
    }),
    clarification_responses: JSON.stringify([
      {
        question_text: 'What triggered the agitation?',
        answer_text: 'Loud noise from construction.',
        phase: 'during_event',
      },
      {
        question_text: 'How long did support last?',
        answer_text: 'About 15 minutes.',
        phase: 'post_event',
      },
    ]),
    enhanced_content: '**BEFORE EVENT**: Client was calm before the incident.\n\n**DURING EVENT**: Client became agitated during discussion.\n\n**ADDITIONAL CLARIFICATIONS**\n\n**Q: What triggered the agitation?**\nA: Loud noise from construction.',
    enhancement_version: 1,
    ai_model: 'claude-3-sonnet',
    processing_time_ms: 1500,
    quality_score: 0.92,
    user_edited: false,
    created_at: Date.now() - 2 * 60 * 60 * 1000,
    updated_at: Date.now(),
  };

  const mockUserEditedNarrative = {
    ...mockEnhancedNarrative,
    user_edited: true,
    enhancement_version: 2,
    user_edits: 'User made some improvements to the enhanced content.',
    updated_at: Date.now() - 30 * 60 * 1000, // 30 minutes ago
  };

  const mockProps = {
    enhancedNarrative: mockEnhancedNarrative,
    incident_id: 'test-incident-123' as any,
  };

  beforeEach(() => {
    // Mock useAuth
    const { useAuth } = require('@/components/auth/auth-provider');
    useAuth.mockReturnValue({ user: mockUser });

    // Mock useMutation
    const { useMutation } = require('convex/react');
    useMutation.mockReturnValue(jest.fn().mockResolvedValue({ success: true }));

    // Clear previous call history
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render enhanced narrative with all tabs', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByText('Enhanced Narrative')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-original')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-metadata')).toBeInTheDocument();
    });

    it('should display AI generation badge for non-edited content', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });

    it('should display user edited badge for edited content', () => {
      const props = {
        ...mockProps,
        enhancedNarrative: mockUserEditedNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      expect(screen.getByText('User Edited')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    it('should show quality score and processing time', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByText('Quality: 92%')).toBeInTheDocument();
      expect(screen.getByText('Processed in 1.5s')).toBeInTheDocument();
    });

    it('should show AI model information', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument();
    });
  });

  describe('Enhanced Content Tab', () => {
    it('should display enhanced content in view mode by default', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByText(/\*\*BEFORE EVENT\*\*/)).toBeInTheDocument();
      expect(screen.getByText(/Client was calm before/)).toBeInTheDocument();
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Edit Content')).not.toBeInTheDocument();
    });

    it('should populate textarea with current enhanced content', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      const textarea = screen.getByTestId('textarea');
      expect(textarea.value).toBe(mockEnhancedNarrative.enhanced_content);
    });

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockUpdateNarrative = jest.fn().mockResolvedValue({ success: true });
      
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockUpdateNarrative);

      render(<EnhancedNarrativeDisplay {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      // Modify content
      const textarea = screen.getByTestId('textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated enhanced content');

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateNarrative).toHaveBeenCalledWith({
          sessionToken: mockUser.sessionToken,
          enhanced_narrative_id: mockEnhancedNarrative._id,
          user_edited_content: 'Updated enhanced content',
        });
      });

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith('Enhanced narrative updated successfully');
    });

    it('should cancel editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      // Modify content
      const textarea = screen.getByTestId('textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Some modified content');

      // Cancel changes
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should return to view mode with original content
      expect(screen.getByText(/\*\*BEFORE EVENT\*\*/)).toBeInTheDocument();
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const mockUpdateNarrative = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Failed to update' 
      });
      
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockUpdateNarrative);

      render(<EnhancedNarrativeDisplay {...mockProps} />);

      // Enter edit mode and save
      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        const { toast } = require('sonner');
        expect(toast.error).toHaveBeenCalledWith('Failed to update enhanced narrative');
      });
    });

    it('should handle network errors during save', async () => {
      const user = userEvent.setup();
      const mockUpdateNarrative = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const { useMutation } = require('convex/react');
      useMutation.mockReturnValue(mockUpdateNarrative);

      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        const { toast } = require('sonner');
        expect(toast.error).toHaveBeenCalledWith('Error updating narrative. Please try again.');
      });
    });

    it('should preserve whitespace formatting in enhanced content', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const enhancedContent = screen.getByText(/\*\*BEFORE EVENT\*\*/);
      expect(enhancedContent).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Original Content Tab', () => {
    it('should display original content collapse component', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const originalTab = screen.getByTestId('tab-trigger-original');
      fireEvent.click(originalTab);

      expect(screen.getByTestId('original-content-collapse')).toBeInTheDocument();
      expect(screen.getByTestId('original-content-collapse')).toHaveAttribute('data-collapsed', 'true');
    });

    it('should display QA collapse component', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const originalTab = screen.getByTestId('tab-trigger-original');
      fireEvent.click(originalTab);

      expect(screen.getByTestId('qa-display-collapse')).toBeInTheDocument();
      expect(screen.getByText('Q&A Display Collapse: 2 items')).toBeInTheDocument();
    });

    it('should handle malformed original content JSON gracefully', () => {
      const narrativeWithBadJSON = {
        ...mockEnhancedNarrative,
        original_content: 'invalid json',
        clarification_responses: 'also invalid',
      };

      const props = {
        ...mockProps,
        enhancedNarrative: narrativeWithBadJSON,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      const originalTab = screen.getByTestId('tab-trigger-original');
      fireEvent.click(originalTab);

      expect(screen.getByText('Error loading original content')).toBeInTheDocument();
    });
  });

  describe('Metadata Tab', () => {
    it('should display enhancement metadata', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const metadataTab = screen.getByTestId('tab-trigger-metadata');
      fireEvent.click(metadataTab);

      expect(screen.getByText('Enhancement Details')).toBeInTheDocument();
      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('1.5 seconds')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should show creation and update times', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const metadataTab = screen.getByTestId('tab-trigger-metadata');
      fireEvent.click(metadataTab);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument(); // Created
      expect(screen.getByText('2 hours ago')).toBeInTheDocument(); // Updated
    });

    it('should display user edit information when applicable', () => {
      const props = {
        ...mockProps,
        enhancedNarrative: mockUserEditedNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      const metadataTab = screen.getByTestId('tab-trigger-metadata');
      fireEvent.click(metadataTab);

      expect(screen.getByText('Yes')).toBeInTheDocument(); // User edited
      expect(screen.getByText('Version 2')).toBeInTheDocument();
    });

    it('should handle missing metadata gracefully', () => {
      const narrativeWithMissingData = {
        ...mockEnhancedNarrative,
        ai_model: undefined,
        quality_score: undefined,
        processing_time_ms: 0,
      };

      const props = {
        ...mockProps,
        enhancedNarrative: narrativeWithMissingData,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      const metadataTab = screen.getByTestId('tab-trigger-metadata');
      fireEvent.click(metadataTab);

      expect(screen.getByText('Unknown')).toBeInTheDocument(); // AI model
      expect(screen.getByText('Not available')).toBeInTheDocument(); // Quality score
      expect(screen.getByText('0.0 seconds')).toBeInTheDocument(); // Processing time
    });
  });

  describe('Tab Navigation', () => {
    it('should set enhanced tab as default', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByTestId('tabs')).toHaveAttribute('data-default-value', 'enhanced');
    });

    it('should disable edit mode when switching tabs', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      // Enter edit mode
      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      expect(screen.getByTestId('textarea')).toBeInTheDocument();

      // Switch to metadata tab
      const metadataTab = screen.getByTestId('tab-trigger-metadata');
      await user.click(metadataTab);

      // Switch back to enhanced tab
      const enhancedTab = screen.getByTestId('tab-trigger-enhanced');
      await user.click(enhancedTab);

      // Should be back in view mode
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Handling', () => {
    it('should disable edit functionality without authentication', () => {
      const { useAuth } = require('@/components/auth/auth-provider');
      useAuth.mockReturnValue({ user: null });

      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.queryByText('Edit Content')).not.toBeInTheDocument();
      expect(screen.getByText('Sign in to edit content')).toBeInTheDocument();
    });

    it('should prevent saving without authentication', async () => {
      const user = userEvent.setup();
      
      // Start with auth, then remove it during edit
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      // Remove auth
      const { useAuth } = require('@/components/auth/auth-provider');
      useAuth.mockReturnValue({ user: null });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Authentication required to save changes');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('should support keyboard navigation in edit mode', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      const textarea = screen.getByTestId('textarea');
      const saveButton = screen.getByText('Save Changes');
      const cancelButton = screen.getByText('Cancel');

      // Tab navigation should work
      textarea.focus();
      expect(document.activeElement).toBe(textarea);

      await user.tab();
      expect(document.activeElement).toBe(saveButton);

      await user.tab();
      expect(document.activeElement).toBe(cancelButton);
    });

    it('should have proper ARIA labels', () => {
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByRole('button', { name: /edit content/i });
      expect(editButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty enhanced content', () => {
      const emptyNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: '',
      };

      const props = {
        ...mockProps,
        enhancedNarrative: emptyNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      expect(screen.getByText('No enhanced content available')).toBeInTheDocument();
    });

    it('should handle very long enhanced content', () => {
      const longNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: 'A'.repeat(10000),
      };

      const props = {
        ...mockProps,
        enhancedNarrative: longNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      // Should render without issues
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialCharNarrative = {
        ...mockEnhancedNarrative,
        enhanced_content: 'Content with "quotes" and <tags> & symbols émojis 🎉',
      };

      const props = {
        ...mockProps,
        enhancedNarrative: specialCharNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      expect(screen.getByText(/Content with "quotes" and <tags> & symbols émojis 🎉/)).toBeInTheDocument();
    });

    it('should handle extremely high processing times', () => {
      const slowNarrative = {
        ...mockEnhancedNarrative,
        processing_time_ms: 300000, // 5 minutes
      };

      const props = {
        ...mockProps,
        enhancedNarrative: slowNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      expect(screen.getByText('Processed in 300.0s')).toBeInTheDocument();
    });

    it('should handle quality scores outside normal range', () => {
      const abnormalQualityNarrative = {
        ...mockEnhancedNarrative,
        quality_score: 1.5, // > 1.0
      };

      const props = {
        ...mockProps,
        enhancedNarrative: abnormalQualityNarrative,
      };

      render(<EnhancedNarrativeDisplay {...props} />);

      expect(screen.getByText('Quality: 150%')).toBeInTheDocument();
    });

    it('should prevent saving empty content', async () => {
      const user = userEvent.setup();
      render(<EnhancedNarrativeDisplay {...mockProps} />);

      const editButton = screen.getByText('Edit Content');
      await user.click(editButton);

      const textarea = screen.getByTestId('textarea');
      await user.clear(textarea);

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Enhanced content cannot be empty');
    });
  });
});