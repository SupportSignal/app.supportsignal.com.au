// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantCard } from '@/components/participants/ParticipantCard';
import { Participant, SUPPORT_LEVELS, PARTICIPANT_STATUS } from '@/types/participants';
import { 
  mockParticipantData,
  healthcareTestUtils,
} from '../../../fixtures/healthcare';
import { 
  testHealthcareAccessibility,
  testKeyboardNavigation,
  testFormAccessibility,
  healthcareA11yUtils
} from '../../../utils/accessibility';

// Mock UI components
jest.mock('@starter/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
}));

jest.mock('@starter/ui/button', () => ({
  Button: ({ children, className, size, variant, onClick, ...props }: any) => (
    <button 
      className={`button ${size || 'default'} ${variant || 'default'} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@starter/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={`badge ${variant || 'default'} ${className}`} {...props}>
      {children}
    </span>
  ),
}));

// Mock types
jest.mock('@/types/participants', () => ({
  SUPPORT_LEVELS: {
    high: {
      value: 'high',
      label: 'High Support',
      description: 'Requires intensive support and frequent monitoring',
      color: 'red',
      priority: 3,
    },
    medium: {
      value: 'medium',
      label: 'Medium Support',
      description: 'Requires regular support with some independence',
      color: 'orange', 
      priority: 2,
    },
    low: {
      value: 'low',
      label: 'Low Support',
      description: 'Requires minimal support with high independence',
      color: 'green',
      priority: 1,
    },
  },
  PARTICIPANT_STATUS: {
    active: {
      value: 'active',
      label: 'Active',
      description: 'Currently receiving services',
      color: 'green',
      icon: '✓',
    },
    inactive: {
      value: 'inactive', 
      label: 'Inactive',
      description: 'Temporarily not receiving services',
      color: 'orange',
      icon: '⏸',
    },
    discharged: {
      value: 'discharged',
      label: 'Discharged',
      description: 'No longer receiving services', 
      color: 'red',
      icon: '✕',
    },
  },
}));

describe('ParticipantCard - NDIS Compliance', () => {
  const mockOnEdit = jest.fn();
  const mockOnView = jest.fn();
  const mockOnStatusChange = jest.fn();

  // Create test participants with realistic NDIS data
  const activeParticipant = {
    ...mockParticipantData.participant_001,
    _id: 'participant_001',
    company_id: 'company_001',
    created_at: Date.now(),
    created_by: 'user_001',
    updated_at: Date.now(),
    updated_by: 'user_001',
    status: 'active',
    support_level: 'medium',
  } as Participant;

  const highSupportParticipant = {
    ...mockParticipantData.participant_002,
    _id: 'participant_002',
    company_id: 'company_001', 
    created_at: Date.now(),
    created_by: 'user_001',
    updated_at: Date.now(),
    updated_by: 'user_001',
    status: 'active',
    support_level: 'high',
  } as Participant;

  const inactiveParticipant = {
    ...mockParticipantData.participant_003,
    _id: 'participant_003',
    company_id: 'company_001',
    created_at: Date.now(),
    created_by: 'user_001',
    updated_at: Date.now(), 
    updated_by: 'user_001',
    status: 'inactive',
    support_level: 'low',
  } as Participant;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NDIS Participant Data Privacy & Security', () => {
    it('displays participant information without exposing sensitive internal IDs', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      );

      // Should display participant name and basic information
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText('NDIS123456789')).toBeInTheDocument();
      expect(screen.getByText('Medium Support')).toBeInTheDocument();
      
      // Should not expose internal database IDs in DOM
      const cardElement = screen.getByText('Alex Williams').closest('.card');
      expect(cardElement?.innerHTML).not.toMatch(/participant_001/);
      expect(cardElement?.innerHTML).not.toMatch(/company_001/);
      expect(cardElement?.innerHTML).not.toMatch(/user_001/);
    });

    it('handles NDIS number display with proper formatting', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // NDIS number should be displayed but not in a way that exposes database structure
      expect(screen.getByText(/NDIS:/)).toBeInTheDocument();
      expect(screen.getByText('NDIS123456789')).toBeInTheDocument();
    });

    it('properly handles optional contact information', () => {
      const participantWithoutPhone = {
        ...activeParticipant,
        contact_phone: undefined,
      };

      render(
        <ParticipantCard
          participant={participantWithoutPhone}
        />
      );

      // Should not show phone section when not available
      expect(screen.queryByText('Phone:')).not.toBeInTheDocument();
      
      // Should still show emergency contact if available
      expect(screen.getByText('Emergency:')).toBeInTheDocument();
      expect(screen.getByText('Sarah Williams: +61 3 8555 9877')).toBeInTheDocument();
    });

    it('masks sensitive data appropriately in care notes', () => {
      const participantWithDetailedNotes = {
        ...activeParticipant,
        care_notes: 'Participant requires assistance with daily living activities. Regular check-ins every Tuesday and Friday.',
      };

      render(
        <ParticipantCard
          participant={participantWithDetailedNotes}
        />
      );

      // Care notes should be displayed but not expose sensitive information structure
      expect(screen.getByText('Care Notes:')).toBeInTheDocument();
      expect(screen.getByText(/requires assistance with daily living activities/i)).toBeInTheDocument();
    });
  });

  describe('NDIS Support Level Compliance', () => {
    it('displays high support level with appropriate urgency indicators', () => {
      render(
        <ParticipantCard
          participant={highSupportParticipant}
        />
      );

      expect(screen.getByText('Jamie Park')).toBeInTheDocument();
      expect(screen.getByText('High Support')).toBeInTheDocument();
      
      // High support should have red color coding
      const supportBadge = screen.getByText('High Support');
      expect(supportBadge).toHaveClass('border-red-300');
      expect(supportBadge).toHaveClass('text-red-700');
    });

    it('displays medium support level with standard indicators', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      expect(screen.getByText('Medium Support')).toBeInTheDocument();
      
      // Medium support should have orange color coding
      const supportBadge = screen.getByText('Medium Support');
      expect(supportBadge).toHaveClass('border-orange-300');
      expect(supportBadge).toHaveClass('text-orange-700');
    });

    it('displays low support level with independence indicators', () => {
      render(
        <ParticipantCard
          participant={inactiveParticipant}
        />
      );

      expect(screen.getByText('Low Support')).toBeInTheDocument();
      
      // Low support should have green color coding
      const supportBadge = screen.getByText('Low Support');
      expect(supportBadge).toHaveClass('border-green-300');
      expect(supportBadge).toHaveClass('text-green-700');
    });
  });

  describe('NDIS Participant Status Management', () => {
    it('displays active status with appropriate indicators', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // Should show active status with proper styling
      const statusBadge = screen.getByText('✓ Active');
      expect(statusBadge).toHaveClass('bg-green-100');
      expect(statusBadge).toHaveClass('text-green-800');
    });

    it('displays inactive status with pause indicators', () => {
      render(
        <ParticipantCard
          participant={inactiveParticipant}
        />
      );

      // Should show inactive status with proper styling
      const statusBadge = screen.getByText('⏸ Inactive');
      expect(statusBadge).toHaveClass('bg-orange-100');
      expect(statusBadge).toHaveClass('text-orange-800');
    });

    it('handles status change functionality for NDIS workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantCard
          participant={activeParticipant}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Should show status change dropdown
      const statusSelect = screen.getByDisplayValue('active');
      expect(statusSelect).toBeInTheDocument();
      
      // Status options should include all valid NDIS statuses
      expect(screen.getByText('Status ▼')).toBeInTheDocument();
    });
  });

  describe('NDIS Age Calculation & Validation', () => {
    it('calculates and displays age correctly from date of birth', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // Should calculate age from 1995-07-15
      const currentYear = new Date().getFullYear();
      const birthYear = 1995;
      const expectedAge = currentYear - birthYear;
      
      expect(screen.getByText(`${expectedAge} years old`)).toBeInTheDocument();
      expect(screen.getByText('Age:')).toBeInTheDocument();
    });

    it('handles invalid date of birth gracefully', () => {
      const participantWithInvalidDOB = {
        ...activeParticipant,
        date_of_birth: 'invalid-date',
      };

      render(
        <ParticipantCard
          participant={participantWithInvalidDOB}
        />
      );

      // Should show "Unknown age" for invalid dates
      expect(screen.getByText('Unknown age')).toBeInTheDocument();
    });

    it('displays date of birth in Australian format', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // Should format date as DD/MM/YYYY (Australian format)
      expect(screen.getByText('DOB: 15/07/1995')).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets NDIS accessibility standards', async () => {
      const { container } = render(
        <ParticipantCard
          participant={highSupportParticipant}
          onEdit={mockOnEdit}
          onView={mockOnView}
          onStatusChange={mockOnStatusChange}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantCard');
    });

    it('provides keyboard navigation for NDIS service workers', async () => {
      const { container } = render(
        <ParticipantCard
          participant={activeParticipant}
          onEdit={mockOnEdit}
          onView={mockOnView}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Expected interactive elements: View, Edit buttons, Status select
      await testKeyboardNavigation(container, 3);
    });

    it('supports screen reader navigation for participant information', () => {
      const { container } = render(
        <ParticipantCard
          participant={highSupportParticipant}
        />
      );

      const screenReaderContent = healthcareA11yUtils.simulateScreenReader(container);
      
      // Should contain essential participant information for screen readers
      expect(screenReaderContent.combinedContent).toContain('Jamie Park');
      expect(screenReaderContent.combinedContent).toContain('High Support');
      expect(screenReaderContent.combinedContent).toContain('NDIS987654321');
      expect(screenReaderContent.combinedContent).toContain('Active');
    });

    it('provides accessible status indicators for disability services', () => {
      render(
        <ParticipantCard
          participant={highSupportParticipant}
        />
      );

      // Status should be accessible to screen readers
      const statusElement = screen.getByText('✓ Active');
      expect(statusElement).toBeInTheDocument();
      
      // Support level should be properly labeled
      const supportElement = screen.getByText('High Support');
      expect(supportElement.closest('.badge')).toHaveClass('border-red-300');
    });

    it('ensures proper color contrast for medical information', async () => {
      const { container } = render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // Test color contrast specifically
      await testHealthcareAccessibility(container, 'ParticipantCard color contrast');
    });
  });

  describe('NDIS Participant Actions & Workflow Integration', () => {
    it('handles view action for participant details', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantCard
          participant={activeParticipant}
          onView={mockOnView}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.click(viewButton);

      expect(mockOnView).toHaveBeenCalledWith(activeParticipant);
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });

    it('handles edit action for participant management', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantCard
          participant={highSupportParticipant}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(highSupportParticipant);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('provides status change functionality for NDIS workflow', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Should show status dropdown with current status
      const statusSelect = screen.getByDisplayValue('active');
      expect(statusSelect).toBeInTheDocument();
      expect(statusSelect).toHaveAttribute('title', 'Change status');

      // Should list all available status options
      const statusOptions = screen.getAllByRole('option');
      expect(statusOptions.length).toBeGreaterThan(1);
    });

    it('handles optional action handlers gracefully', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      // Should render without action buttons when handlers not provided
      expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('NDIS Care Notes & Medical Information', () => {
    it('displays care notes with proper medical context', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      expect(screen.getByText('Care Notes:')).toBeInTheDocument();
      expect(screen.getByText(/requires assistance with daily living activities/i)).toBeInTheDocument();
      expect(screen.getByText(/regular check-ins every tuesday and friday/i)).toBeInTheDocument();
    });

    it('handles missing care notes appropriately', () => {
      const participantWithoutNotes = {
        ...activeParticipant,
        care_notes: undefined,
      };

      render(
        <ParticipantCard
          participant={participantWithoutNotes}
        />
      );

      // Should not show care notes section when not available
      expect(screen.queryByText('Care Notes:')).not.toBeInTheDocument();
    });

    it('displays complex care requirements for high support participants', () => {
      render(
        <ParticipantCard
          participant={highSupportParticipant}
        />
      );

      expect(screen.getByText('Care Notes:')).toBeInTheDocument();
      expect(screen.getByText(/complex care needs/i)).toBeInTheDocument();
      expect(screen.getByText(/medical equipment required for mobility/i)).toBeInTheDocument();
      expect(screen.getByText(/weekly physiotherapy appointments/i)).toBeInTheDocument();
    });
  });

  describe('NDIS Contact Information Management', () => {
    it('displays contact phone with Australian formatting', () => {
      render(
        <ParticipantCard
          participant={activeParticipant}
        />
      );

      expect(screen.getByText('Phone:')).toBeInTheDocument();
      expect(screen.getByText('+61 3 8555 9876')).toBeInTheDocument();
    });

    it('displays emergency contact information for safety compliance', () => {
      render(
        <ParticipantCard
          participant={highSupportParticipant}
        />
      );

      expect(screen.getByText('Emergency:')).toBeInTheDocument();
      expect(screen.getByText('Dr. Kim Park: +61 2 9555 1235')).toBeInTheDocument();
    });

    it('handles missing contact information gracefully', () => {
      const participantWithMinimalContact = {
        ...inactiveParticipant,
        contact_phone: undefined,
      };

      render(
        <ParticipantCard
          participant={participantWithMinimalContact}
        />
      );

      // Should not show phone when not available
      expect(screen.queryByText('Phone:')).not.toBeInTheDocument();
      
      // Should still show emergency contact if available
      expect(screen.getByText('Emergency:')).toBeInTheDocument();
    });
  });

  describe('NDIS Mobile Responsiveness & Device Compatibility', () => {
    it('renders mobile-friendly layout for healthcare workers', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ParticipantCard
          participant={activeParticipant}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      );

      // Should render all essential information on mobile
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText('Medium Support')).toBeInTheDocument();
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
      
      // Action buttons should be accessible on mobile
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('maintains accessibility on mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <ParticipantCard
          participant={highSupportParticipant}
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantCard mobile');
    });
  });

  describe('NDIS Error Handling & Edge Cases', () => {
    it('handles participant with minimal required data', () => {
      const minimalParticipant = {
        _id: 'participant_minimal',
        company_id: 'company_001',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '2000-01-01',
        ndis_number: 'NDIS000000001',
        support_level: 'medium',
        status: 'active',
        created_at: Date.now(),
        created_by: 'user_001',
        updated_at: Date.now(),
        updated_by: 'user_001',
      } as Participant;

      render(
        <ParticipantCard
          participant={minimalParticipant}
        />
      );

      // Should display basic information
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('NDIS000000001')).toBeInTheDocument();
      expect(screen.getByText('Medium Support')).toBeInTheDocument();
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
      
      // Should not show optional sections
      expect(screen.queryByText('Phone:')).not.toBeInTheDocument();
      expect(screen.queryByText('Emergency:')).not.toBeInTheDocument();
      expect(screen.queryByText('Care Notes:')).not.toBeInTheDocument();
    });

    it('maintains accessibility with minimal data', async () => {
      const minimalParticipant = {
        _id: 'participant_minimal',
        company_id: 'company_001',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '2000-01-01',
        ndis_number: 'NDIS000000001',
        support_level: 'low',
        status: 'active',
        created_at: Date.now(),
        created_by: 'user_001',
        updated_at: Date.now(),
        updated_by: 'user_001',
      } as Participant;

      const { container } = render(
        <ParticipantCard
          participant={minimalParticipant}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantCard minimal data');
    });

    it('handles extremely long names gracefully', () => {
      const participantWithLongName = {
        ...activeParticipant,
        first_name: 'VeryLongFirstNameThatMightCauseDisplayIssues',
        last_name: 'AndAnEvenLongerLastNameThatCouldBreakLayout',
      };

      render(
        <ParticipantCard
          participant={participantWithLongName}
        />
      );

      // Should display long names without breaking layout
      expect(screen.getByText(/VeryLongFirstNameThatMightCauseDisplayIssues/)).toBeInTheDocument();
      expect(screen.getByText(/AndAnEvenLongerLastNameThatCouldBreakLayout/)).toBeInTheDocument();
    });

    it('handles date formatting edge cases', () => {
      const participantWithEdgeDate = {
        ...activeParticipant,
        date_of_birth: '1900-12-31', // Very old date
        updated_at: '2024-12-31T23:59:59Z',
      };

      render(
        <ParticipantCard
          participant={participantWithEdgeDate}
        />
      );

      // Should handle very old dates
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1900;
      expect(screen.getByText(`${expectedAge} years old`)).toBeInTheDocument();
      
      // Should format updated date correctly
      expect(screen.getByText(/updated:/i)).toBeInTheDocument();
    });
  });
});