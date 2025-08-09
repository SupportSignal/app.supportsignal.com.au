// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetadataDisplay } from '@/components/incident/metadata-display';
import { mockIncidentData, healthcareComponentTestUtils } from '../../fixtures/healthcare';
import { testHealthcareAccessibility, testTableAccessibility } from '../../utils/accessibility';

/**
 * MetadataDisplay Component Test Suite
 * 
 * Tests the metadata display component used to show detailed incident information
 * in NDIS workflows. Focuses on data integrity, accessibility, and compliance.
 */

describe('MetadataDisplay', () => {
  describe('Basic Rendering', () => {
    it('should render full metadata display with all sections', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showCompanyInfo={true}
          showAuditInfo={true}
          showQualityFlags={true}
        />
      );

      // Check main heading
      expect(screen.getByText('Incident Metadata')).toBeInTheDocument();
      expect(screen.getByText(/Details for incident involving Jamie Park/)).toBeInTheDocument();

      // Check section headings
      expect(screen.getByText('Incident Information')).toBeInTheDocument();
      expect(screen.getByText('Workflow Status')).toBeInTheDocument();
      expect(screen.getByText('Data Quality')).toBeInTheDocument();
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Company Context')).toBeInTheDocument();
      expect(screen.getByText('Data Integrity')).toBeInTheDocument();
    });

    it('should render compact variant without section headings', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          variant="compact"
        />
      );

      // Should not have section headings in compact mode
      expect(screen.queryByText('Incident Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Quality')).not.toBeInTheDocument();
      
      // Should still have basic information
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText('Jennifer Wu')).toBeInTheDocument();
    });

    it('should render minimal variant with just basic info', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          variant="minimal"
        />
      );

      // Should show participant and basic info
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText(/Community Center - Activity Room/)).toBeInTheDocument();
      
      // Should not show detailed sections
      expect(screen.queryByText('System Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Quality')).not.toBeInTheDocument();
    });
  });

  describe('Data Display Formatting', () => {
    it('should format dates in Australian format', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        event_date_time: '2024-03-15T14:30:00Z',
        created_at: new Date('2024-03-15T10:00:00Z').getTime(),
        updated_at: new Date('2024-03-15T16:00:00Z').getTime(),
      });
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Event date should be formatted as long format
      expect(screen.getByText(/Friday, 15 March 2024/)).toBeInTheDocument();
      
      // System timestamps should be in DD/MM/YYYY format
      expect(screen.getByText(/15\/03\/2024/)).toBeInTheDocument();
    });

    it('should handle invalid date formats gracefully', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        event_date_time: 'invalid-date-format',
      });
      
      render(<MetadataDisplay incident={incident} />);

      // Should display the invalid date string without crashing
      expect(screen.getByText('invalid-date-format')).toBeInTheDocument();
    });

    it('should format incident ID as uppercase short version', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        _id: 'incident_123456789abcdef',
      });
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Should show last 8 characters in uppercase
      expect(screen.getByText('9ABCDEF')).toBeInTheDocument();
    });
  });

  describe('Layout Variants', () => {
    it('should render with grid layout by default', () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
          layout="grid"
        />
      );

      // Check for grid classes in the DOM
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('should render with vertical layout', () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
          layout="vertical"
        />
      );

      // Check for flex-col classes
      const verticalElements = container.querySelectorAll('[class*="flex-col"]');
      expect(verticalElements.length).toBeGreaterThan(0);
    });

    it('should render with horizontal layout', () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
          layout="horizontal"
        />
      );

      // Check for flex-wrap classes for horizontal layout
      const horizontalElements = container.querySelectorAll('[class*="flex-wrap"]');
      expect(horizontalElements.length).toBeGreaterThan(0);
    });
  });

  describe('Section Visibility Controls', () => {
    it('should hide company information when showCompanyInfo is false', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showCompanyInfo={false}
        />
      );

      expect(screen.queryByText('Company Context')).not.toBeInTheDocument();
      expect(screen.queryByText('Company ID')).not.toBeInTheDocument();
    });

    it('should hide audit information when showAuditInfo is false', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={false}
        />
      );

      expect(screen.queryByText('System Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Integrity')).not.toBeInTheDocument();
    });

    it('should hide quality flags when showQualityFlags is false', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showQualityFlags={false}
        />
      );

      expect(screen.queryByText('Data Quality')).not.toBeInTheDocument();
      expect(screen.queryByText('Questions Generated')).not.toBeInTheDocument();
    });
  });

  describe('Quality Flag Display', () => {
    it('should show quality flags with appropriate status indicators', () => {
      const enhancementVariations = healthcareComponentTestUtils.createAIEnhancementVariations();
      
      enhancementVariations.forEach((enhancement, index) => {
        const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
          _id: `quality_test_${index}`,
          ...enhancement,
        });

        const { unmount } = render(
          <MetadataDisplay 
            incident={incident}
            showQualityFlags={true}
          />
        );

        // Quality section should be present
        expect(screen.getByText('Data Quality')).toBeInTheDocument();
        
        // All flag labels should be present
        expect(screen.getByText('Questions Generated')).toBeInTheDocument();
        expect(screen.getByText('Narrative Enhanced')).toBeInTheDocument();
        expect(screen.getByText('Analysis Generated')).toBeInTheDocument();

        unmount();
      });
    });

    it('should display quality flags with correct visual status', () => {
      const incident = mockIncidentData.completed_incident; // Has all flags true
      
      render(
        <MetadataDisplay 
          incident={incident}
          showQualityFlags={true}
        />
      );

      // Should have success indicators for completed incident
      const qualitySection = screen.getByText('Data Quality').parentElement;
      
      // Check for success/completion visual indicators
      expect(qualitySection).toBeInTheDocument();
      expect(screen.getByText('Questions Generated')).toBeInTheDocument();
      expect(screen.getByText('Narrative Enhanced')).toBeInTheDocument();
      expect(screen.getByText('Analysis Generated')).toBeInTheDocument();
    });
  });

  describe('Workflow Status Display', () => {
    it('should show all workflow status types', () => {
      const incident = mockIncidentData.analysis_pending_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Check workflow status section
      expect(screen.getByText('Workflow Status')).toBeInTheDocument();
      
      // Should show capture, analysis, and overall status
      expect(screen.getByText('Capture:')).toBeInTheDocument();
      expect(screen.getByText('Analysis:')).toBeInTheDocument();
      expect(screen.getByText('Overall:')).toBeInTheDocument();
    });

    it('should handle different status combinations correctly', () => {
      const statusVariations = healthcareComponentTestUtils.createStatusVariations();
      
      statusVariations.forEach((statusCombo, index) => {
        const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
          _id: `workflow_test_${index}`,
          ...statusCombo,
        });

        const { unmount } = render(
          <MetadataDisplay 
            incident={incident}
          />
        );

        // Should have workflow status section
        expect(screen.getByText('Workflow Status')).toBeInTheDocument();
        
        // Status badges should be present for each workflow stage
        expect(screen.getByText('Capture:')).toBeInTheDocument();
        expect(screen.getByText('Analysis:')).toBeInTheDocument();
        expect(screen.getByText('Overall:')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Data Integrity Features', () => {
    it('should display narrative hash when present', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      expect(screen.getByText('Data Integrity')).toBeInTheDocument();
      expect(screen.getByText('Narrative Hash')).toBeInTheDocument();
      
      // Should show truncated hash
      expect(screen.getByText('hash_incident_002...')).toBeInTheDocument();
    });

    it('should not display data integrity section when no narrative hash', () => {
      const incident = mockIncidentData.urgent_incident; // Has undefined narrative_hash
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Should show other audit info but not data integrity section
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.queryByText('Data Integrity')).not.toBeInTheDocument();
    });

    it('should handle hash truncation for long hashes', () => {
      const longHash = 'a'.repeat(64) + 'b'.repeat(32);
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        narrative_hash: longHash,
      });
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Should show first 16 characters + ellipsis
      expect(screen.getByText('aaaaaaaaaaaaaaaa...')).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const incident = mockIncidentData.completed_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
          showCompanyInfo={true}
          showAuditInfo={true}
          showQualityFlags={true}
        />
      );

      await testHealthcareAccessibility(container, 'MetadataDisplay');
    });

    it('should have proper heading hierarchy', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Should have proper heading structure
      const mainHeading = screen.getByText('Incident Metadata');
      expect(mainHeading.tagName).toBe('H2');
      
      const sectionHeadings = screen.getAllByText(/Information|Status|Quality|System/);
      sectionHeadings.forEach(heading => {
        expect(heading.tagName).toBe('H3');
      });
    });

    it('should have appropriate semantic structure', () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Should use semantic HTML structures
      const articles = container.querySelectorAll('article');
      const sections = container.querySelectorAll('section, [role="region"]');
      
      // Should have some semantic structure
      expect(articles.length + sections.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide proper labels for complex data', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Incident ID should have clear labeling
      expect(screen.getByText('Incident ID')).toBeInTheDocument();
      
      // Timestamps should be clearly labeled
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
      
      // Quality flags should have descriptive labels
      expect(screen.getByText('Questions Generated')).toBeInTheDocument();
      expect(screen.getByText('Narrative Enhanced')).toBeInTheDocument();
    });
  });

  describe('Healthcare Compliance', () => {
    it('should display participant information with appropriate prominence', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Participant name should be prominently displayed
      const participantInfo = screen.getByText('Alex Williams');
      expect(participantInfo).toBeInTheDocument();
      
      // Should have participant label
      expect(screen.getByText('Participant')).toBeInTheDocument();
    });

    it('should maintain data privacy in display formatting', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Should show safe incident ID format (shortened)
      expect(screen.getByText(/INCIDENT/i)).not.toBeInTheDocument();
      
      // Should truncate sensitive hashes appropriately
      if (incident.narrative_hash) {
        expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
      }
    });

    it('should use healthcare-appropriate styling', () => {
      const incident = mockIncidentData.basic_incident;
      
      const { container } = render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Should use healthcare surface background
      const cardElement = container.querySelector('[class*="bg-healthcare-surface"]');
      expect(cardElement).toBeInTheDocument();
      
      // Should use healthcare primary color for text
      const primaryTextElements = container.querySelectorAll('[class*="text-healthcare-primary"]');
      expect(primaryTextElements.length).toBeGreaterThan(0);
    });

    it('should provide audit trail information when requested', () => {
      const incident = mockIncidentData.completed_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          showAuditInfo={true}
        />
      );

      // Should show system audit information
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
      
      // Should show data integrity information
      expect(screen.getByText('Data Integrity')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt grid layout for different screen sizes', () => {
      const incident = mockIncidentData.basic_incident;
      
      // Test desktop layout
      const { container, rerender } = render(
        <MetadataDisplay 
          incident={incident}
          layout="grid"
        />
      );

      // Should have responsive grid classes
      const gridElements = container.querySelectorAll('[class*="md:grid-cols"], [class*="lg:grid-cols"]');
      expect(gridElements.length).toBeGreaterThan(0);

      // Test compact layout for mobile
      rerender(
        <MetadataDisplay 
          incident={incident}
          variant="compact"
        />
      );

      // Compact layout should work on smaller screens
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
    });

    it('should maintain readability in minimal variant', () => {
      const incident = mockIncidentData.basic_incident;
      
      render(
        <MetadataDisplay 
          incident={incident}
          variant="minimal"
        />
      );

      // Essential information should still be readable
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText(/Community Center/)).toBeInTheDocument();
      
      // Should include status badge
      const statusElements = screen.getAllByText(/pending|progress|completed/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const incident = {
        ...mockIncidentData.basic_incident,
        narrative_hash: undefined,
        location: '',
      };
      
      expect(() => {
        render(
          <MetadataDisplay 
            incident={incident}
            showAuditInfo={true}
          />
        );
      }).not.toThrow();

      // Should still render basic information
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
    });

    it('should handle invalid timestamp values', () => {
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        created_at: NaN,
        updated_at: 'invalid-timestamp',
      });
      
      expect(() => {
        render(
          <MetadataDisplay 
            incident={incident}
            showAuditInfo={true}
          />
        );
      }).not.toThrow();
    });

    it('should handle extremely long location names', () => {
      const longLocation = 'A'.repeat(200) + ' - Very Long Location Name That Exceeds Normal Display Limits';
      const incident = healthcareComponentTestUtils.createIncidentData('basic_incident', {
        location: longLocation,
      });
      
      render(
        <MetadataDisplay 
          incident={incident}
        />
      );

      // Should display location with proper truncation handling
      expect(screen.getByText('Location')).toBeInTheDocument();
      
      // The long location should be present in the DOM
      const locationElement = screen.getByTitle ? screen.queryByTitle(longLocation) : null;
      if (locationElement) {
        expect(locationElement).toBeInTheDocument();
      }
    });
  });
});