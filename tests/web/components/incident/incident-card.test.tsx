// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentCard } from '@/components/incident/incident-card';
import { mockIncidentData, healthcareComponentTestUtils } from '../../fixtures/healthcare';
import { testHealthcareAccessibility, testKeyboardNavigation } from '../../utils/accessibility';

/**
 * IncidentCard Component Test Suite
 * 
 * Tests the core incident card component used in NDIS incident management workflows.
 * Covers role-based visibility, accessibility compliance, and healthcare-specific behaviors.
 */

describe('IncidentCard', () => {
  const user = userEvent.setup();
  const mockCallbacks = {
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render incident card with basic information', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      // Check participant name is displayed
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      
      // Check reporter information
      expect(screen.getByText(/Reported by Jennifer Wu/)).toBeInTheDocument();
      
      // Check event date is formatted correctly
      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
      
      // Check location is displayed
      expect(screen.getByText('Community Center - Activity Room')).toBeInTheDocument();
      
      // Check status badge is present
      expect(screen.getByText('Capture Pending')).toBeInTheDocument();
    });

    it('should render with compact layout when variant is compact', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          variant="compact"
          showActions={false}
        />
      );

      // Compact layout should not show reporter information
      expect(screen.queryByText(/Reported by/)).not.toBeInTheDocument();
      
      // Should still show participant name and core info
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText('Capture Pending')).toBeInTheDocument();
    });

    it('should render with detailed layout showing AI enhancement indicators', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          variant="detailed"
          showActions={false}
        />
      );

      // Should show enhancement indicators
      expect(screen.getByText('Enhanced')).toBeInTheDocument();
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      
      // Should show analysis status section
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should display correct status colors and labels', () => {
      const statusVariations = healthcareComponentTestUtils.createStatusVariations();
      
      statusVariations.forEach((statusCombo, index) => {
        const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
          _id: `status_test_${index}`,
          ...statusCombo,
        });

        const { unmount } = render(
          <IncidentCard 
            incident={incident}
            showActions={false}
          />
        );

        // Check that appropriate status is displayed
        if (incident.overall_status === 'capture_pending') {
          expect(screen.getByText('Capture Pending')).toBeInTheDocument();
        } else if (incident.overall_status === 'analysis_pending') {
          expect(screen.getByText('Analysis Pending')).toBeInTheDocument();
        } else if (incident.overall_status === 'completed') {
          expect(screen.getByText('Completed')).toBeInTheDocument();
        }

        // Check capture status display
        if (incident.capture_status === 'draft') {
          expect(screen.getByText('Draft')).toBeInTheDocument();
        } else if (incident.capture_status === 'in_progress') {
          expect(screen.getByText('In Progress')).toBeInTheDocument();
        } else if (incident.capture_status === 'completed') {
          expect(screen.getByText('Captured')).toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should show AI enhancement indicators correctly', () => {
      const enhancementVariations = healthcareComponentTestUtils.createAIEnhancementVariations();
      
      enhancementVariations.forEach((enhancement, index) => {
        const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
          _id: `enhancement_test_${index}`,
          variant: 'detailed',
          ...enhancement,
        });

        const { unmount } = render(
          <IncidentCard 
            incident={incident}
            variant="detailed"
            showActions={false}
          />
        );

        // All enhancement indicators should be present
        expect(screen.getByText('Enhanced')).toBeInTheDocument();
        expect(screen.getByText('Questions')).toBeInTheDocument();
        expect(screen.getByText('Analysis')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format relative time correctly', () => {
      const timeBasedIncidents = healthcareComponentTestUtils.createTimeBasedIncidents();
      
      Object.entries(timeBasedIncidents).forEach(([key, incident]) => {
        const { unmount } = render(
          <IncidentCard 
            incident={incident}
            showActions={false}
          />
        );

        if (key === 'recent_incident') {
          expect(screen.getByText(/Updated Today/)).toBeInTheDocument();
        } else if (key === 'yesterday_incident') {
          expect(screen.getByText(/Updated Yesterday/)).toBeInTheDocument();
        } else if (key === 'week_old_incident') {
          expect(screen.getByText(/Updated \d+ days ago/)).toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should format event date and time in Australian format', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        event_date_time: '2024-03-15T14:30:00Z',
      });
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      // Should format as DD/MM/YYYY, HH:MM
      expect(screen.getByText(/15\/03\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/14:30|2:30/)).toBeInTheDocument(); // Account for timezone variations
    });
  });

  describe('User Interactions', () => {
    it('should handle view action when card is clicked', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          showActions={false}
        />
      );

      await user.click(screen.getByRole('article'));
      expect(mockCallbacks.onView).toHaveBeenCalledWith('incident_001');
    });

    it('should show action buttons on hover', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
          canEdit={true}
        />
      );

      // Action buttons should be hidden initially
      const viewButton = screen.getByText('View');
      const editButton = screen.getByText('Edit');
      
      // Hover over the card to show actions
      await user.hover(screen.getByRole('article'));
      
      // Buttons should become visible (tested via CSS classes in integration)
      expect(viewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
    });

    it('should handle edit action when edit button clicked', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
          canEdit={true}
        />
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);
      
      expect(mockCallbacks.onEdit).toHaveBeenCalledWith('incident_001');
    });

    it('should prevent card click propagation when action buttons are clicked', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
          canEdit={true}
        />
      );

      await user.click(screen.getByText('Edit'));
      
      // Only edit callback should fire, not view
      expect(mockCallbacks.onEdit).toHaveBeenCalledWith('incident_001');
      expect(mockCallbacks.onView).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Permissions', () => {
    it('should show delete button only for system_admin and company_admin', () => {
      const incident = mockIncidentData.basic_incident;
      const roles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'] as const;
      
      roles.forEach(role => {
        const { unmount } = render(
          <IncidentCard 
            incident={incident}
            userRole={role}
            onDelete={mockCallbacks.onDelete}
            showActions={true}
            canDelete={true}
          />
        );

        const deleteButton = screen.queryByText('Delete');
        
        if (role === 'system_admin' || role === 'company_admin') {
          expect(deleteButton).toBeInTheDocument();
        } else {
          expect(deleteButton).not.toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should handle delete action only for authorized roles', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          userRole="system_admin"
          onDelete={mockCallbacks.onDelete}
          showActions={true}
          canDelete={true}
        />
      );

      await user.click(screen.getByText('Delete'));
      expect(mockCallbacks.onDelete).toHaveBeenCalledWith('incident_001');
    });

    it('should disable edit action when canEdit is false', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
          canEdit={false}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Location Display', () => {
    it('should handle long location names with truncation', () => {
      const incident = mockIncidentData.long_location_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      const locationElement = screen.getByText(/Metropolitan Healthcare Systems/);
      expect(locationElement).toHaveClass('truncate');
      expect(locationElement.title).toBe(incident.location);
    });

    it('should display short locations without truncation', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      expect(screen.getByText('Community Center - Activity Room')).toBeInTheDocument();
    });
  });

  describe('Completed Incident Styling', () => {
    it('should apply opacity styling for completed incidents', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      const cardElement = screen.getByRole('article');
      expect(cardElement).toHaveClass('opacity-75');
    });

    it('should not apply opacity styling for non-completed incidents', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      const cardElement = screen.getByRole('article');
      expect(cardElement).not.toHaveClass('opacity-75');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          showActions={true}
          canEdit={true}
        />
      );

      await testHealthcareAccessibility(container, 'IncidentCard');
    });

    it('should have proper ARIA labels and roles', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          showActions={true}
        />
      );

      // Card should have article role and accessible name
      const cardElement = screen.getByRole('article');
      expect(cardElement).toHaveAttribute('aria-label', 'Incident involving Alex Williams');
      
      // Action buttons should be focusable
      const viewButton = screen.getByText('View');
      const editButton = screen.getByText('Edit');
      
      expect(viewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
          canEdit={true}
        />
      );

      // Should have focusable elements (card + buttons)
      await testKeyboardNavigation(container, 3); // Card + View + Edit buttons
    });

    it('should handle keyboard events for card interaction', async () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
        />
      );

      const cardElement = screen.getByRole('article');
      
      // Focus the card
      cardElement.focus();
      
      // Press Enter key
      await user.keyboard('{Enter}');
      
      expect(mockCallbacks.onView).toHaveBeenCalledWith('incident_001');
    });
  });

  describe('Healthcare Compliance', () => {
    it('should display participant information appropriately for healthcare context', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      // Should display participant name prominently
      const participantName = screen.getByText('Alex Williams');
      expect(participantName).toHaveClass('font-semibold');
      
      // Should display reporter information
      expect(screen.getByText(/Reported by Jennifer Wu/)).toBeInTheDocument();
      
      // Should not expose sensitive data in basic card view
      expect(screen.queryByText(/NDIS/)).not.toBeInTheDocument();
    });

    it('should use healthcare-appropriate color scheme', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      const cardElement = screen.getByRole('article');
      expect(cardElement).toHaveClass('bg-healthcare-surface');
      
      // Status badge should use healthcare workflow colors
      const statusBadge = screen.getByText('Capture Pending');
      expect(statusBadge.parentElement).toHaveClass('bg-workflow-progress');
    });

    it('should maintain audit trail with incident ID reference', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <IncidentCard 
          incident={incident}
          onView={mockCallbacks.onView}
          onEdit={mockCallbacks.onEdit}
          showActions={true}
        />
      );

      // All actions should reference the specific incident ID
      const viewButton = screen.getByText('View');
      const editButton = screen.getByText('Edit');
      
      expect(viewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      
      // Callbacks should be called with proper incident ID for audit trail
      fireEvent.click(viewButton);
      expect(mockCallbacks.onView).toHaveBeenCalledWith('incident_001');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        event_date_time: 'invalid-date',
      });
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      // Should fall back to displaying the original string
      expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });

    it('should handle missing callback functions gracefully', () => {
      const incident = mockIncidentData.basic_incident;
      
      // Should not crash when callbacks are undefined
      expect(() => {
        render(
          <IncidentCard 
            incident={incident}
            showActions={true}
          />
        );
      }).not.toThrow();
    });

    it('should handle edge case of missing narrative hash', () => {
      const incident = mockIncidentData.urgent_incident; // This one has undefined narrative_hash
      
      render(
        <IncidentCard 
          incident={incident}
          variant="detailed"
          showActions={false}
        />
      );

      // Should render without issues
      expect(screen.getByText('Morgan Smith')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should maintain readability on smaller screens', () => {
      const incident = mockIncidentData.long_location_incident;
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(
        <IncidentCard 
          incident={incident}
          showActions={false}
        />
      );

      // Long location should be truncated with title attribute for accessibility
      const locationElement = screen.getByTitle(incident.location);
      expect(locationElement).toHaveClass('truncate');
    });
  });
});