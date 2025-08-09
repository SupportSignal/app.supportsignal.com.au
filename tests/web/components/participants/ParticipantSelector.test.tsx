// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantSelector } from '@/components/participants/ParticipantSelector';
import { Participant } from '@/types/participants';
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

// Mock Convex hooks
const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  useQuery: (...args: any) => mockUseQuery(...args),
}));

// Mock Convex API
jest.mock('@/convex/_generated/api', () => ({
  api: {
    participants: {
      list: {
        listParticipants: 'participants/list/listParticipants',
      },
      getById: {
        getParticipantById: 'participants/getById/getParticipantById',
      },
    },
  },
}));

// Mock UI components
jest.mock('@starter/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
}));

jest.mock('@starter/ui/input', () => ({
  Input: ({ className, value, onChange, onFocus, placeholder, disabled, ...props }: any) => (
    <input 
      className={`input ${className}`}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  ),
}));

jest.mock('@starter/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className}`} {...props}>
      {children}
    </label>
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
      label: 'High',
      description: 'Requires intensive support and frequent monitoring',
      color: 'red',
      priority: 3,
    },
    medium: {
      value: 'medium',
      label: 'Medium',
      description: 'Requires regular support with some independence',
      color: 'orange',
      priority: 2,
    },
    low: {
      value: 'low',
      label: 'Low',
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ParticipantSelector - NDIS Compliance', () => {
  const mockOnSelect = jest.fn();

  // Create test participants with realistic NDIS data
  const testParticipants = [
    {
      ...mockParticipantData.participant_001,
      _id: 'participant_001',
      company_id: 'company_001',
      created_at: Date.now(),
      created_by: 'user_001',
      updated_at: Date.now(),
      updated_by: 'user_001',
      status: 'active',
      support_level: 'medium',
    } as Participant,
    {
      ...mockParticipantData.participant_002,
      _id: 'participant_002',
      company_id: 'company_001',
      created_at: Date.now(),
      created_by: 'user_001',
      updated_at: Date.now(),
      updated_by: 'user_001',
      status: 'active',
      support_level: 'high',
    } as Participant,
    {
      ...mockParticipantData.participant_003,
      _id: 'participant_003',
      company_id: 'company_001',
      created_at: Date.now(),
      created_by: 'user_001',
      updated_at: Date.now(),
      updated_by: 'user_001',
      status: 'active',
      support_level: 'low',
    } as Participant,
  ];

  const mockParticipantsResponse = {
    participants: testParticipants,
    totalCount: testParticipants.length,
    correlationId: 'test-correlation-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-session-token');
    
    // Default mock for participant list query
    mockUseQuery.mockImplementation((queryFn, args) => {
      if (queryFn === 'participants/list/listParticipants') {
        if (args === 'skip') return undefined;
        return mockParticipantsResponse;
      }
      if (queryFn === 'participants/getById/getParticipantById') {
        if (args === 'skip') return undefined;
        return { participant: testParticipants.find(p => p._id === args.participantId) };
      }
      return undefined;
    });
  });

  describe('NDIS Participant Selection & Data Security', () => {
    it('renders participant selector with proper NDIS labeling', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          placeholder="Select NDIS participant..."
        />
      );

      expect(screen.getByText('NDIS Participant')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select NDIS participant...')).toBeInTheDocument();
      expect(screen.getByText('Start typing to search for participants by name or NDIS number')).toBeInTheDocument();
    });

    it('displays required indicator for mandatory NDIS selection', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('opens dropdown and shows active NDIS participants only', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Should query for active participants only
      expect(mockUseQuery).toHaveBeenCalledWith(
        'participants/list/listParticipants',
        expect.objectContaining({
          sessionToken: 'test-session-token',
          status: 'active',
          limit: 100,
        })
      );

      // Should display participants
      expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      expect(screen.getByText('Jamie Park')).toBeInTheDocument();
      expect(screen.getByText('Taylor Johnson')).toBeInTheDocument();
    });

    it('does not expose sensitive participant IDs in DOM', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Should not expose internal database IDs in DOM
      const dropdown = screen.getByText('Alex Williams').closest('div');
      expect(dropdown?.innerHTML).not.toMatch(/participant_001/);
      expect(dropdown?.innerHTML).not.toMatch(/company_001/);
      expect(dropdown?.innerHTML).not.toMatch(/user_001/);
    });
  });

  describe('NDIS Search Functionality & Privacy', () => {
    it('handles search query for participant lookup', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.type(searchInput, 'Alex');

      // Should call query with search parameter
      expect(mockUseQuery).toHaveBeenCalledWith(
        'participants/list/listParticipants',
        expect.objectContaining({
          search: 'Alex',
          status: 'active',
        })
      );
    });

    it('searches by NDIS number for compliance tracking', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.type(searchInput, 'NDIS123');

      // Should search by NDIS number
      expect(mockUseQuery).toHaveBeenCalledWith(
        'participants/list/listParticipants',
        expect.objectContaining({
          search: 'NDIS123',
        })
      );
    });

    it('displays participant information securely in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Should show participant details without exposing sensitive structure
      expect(screen.getByText('NDIS: NDIS123456789 • Medium Support')).toBeInTheDocument();
      expect(screen.getByText('NDIS: NDIS987654321 • High Support')).toBeInTheDocument();
      expect(screen.getByText('Phone: +61 3 8555 9876')).toBeInTheDocument();
    });
  });

  describe('NDIS Participant Selection Workflow', () => {
    it('handles participant selection for incident workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Select first participant
      const participantOption = screen.getByText('Alex Williams');
      await user.click(participantOption);

      expect(mockOnSelect).toHaveBeenCalledWith(testParticipants[0]);
    });

    it('displays selected participant with support level context', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="participant_002"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jamie Park')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('NDIS: NDIS987654321')).toBeInTheDocument();
      });
    });

    it('handles participant clearing for workflow correction', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="participant_001"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      });

      // Clear selection
      const clearButton = screen.getByTitle('Clear selection');
      await user.click(clearButton);

      expect(mockOnSelect).toHaveBeenCalledWith(null);
    });

    it('prevents selection when disabled for workflow control', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('NDIS Support Level Compliance & Visual Indicators', () => {
    it('displays high support level with urgent visual cues', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // High support should have red color coding in dropdown
      const highSupportBadge = screen.getAllByText('High')[0];
      expect(highSupportBadge).toHaveClass('border-red-300');
      expect(highSupportBadge).toHaveClass('text-red-700');
    });

    it('displays medium support level with standard indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Medium support should have orange color coding
      const mediumSupportBadge = screen.getAllByText('Medium')[0];
      expect(mediumSupportBadge).toHaveClass('border-orange-300');
      expect(mediumSupportBadge).toHaveClass('text-orange-700');
    });

    it('displays low support level with independence indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Low support should have green color coding
      const lowSupportBadge = screen.getAllByText('Low')[0];
      expect(lowSupportBadge).toHaveClass('border-green-300');
      expect(lowSupportBadge).toHaveClass('text-green-700');
    });

    it('displays selected participant with proper support level styling', async () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="participant_002" // High support participant
        />
      );

      await waitFor(() => {
        const selectedBadge = screen.getByText('High');
        expect(selectedBadge).toHaveClass('border-red-300');
        expect(selectedBadge).toHaveClass('text-red-700');
      });
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets NDIS accessibility standards', async () => {
      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          required={true}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantSelector');
    });

    it('provides proper form accessibility for healthcare workers', async () => {
      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          required={true}
          errorMessage="Please select a participant"
        />
      );

      await testFormAccessibility(container);
    });

    it('supports keyboard navigation for disability service workers', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      // Focus should be manageable with keyboard
      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      searchInput.focus();
      
      expect(document.activeElement).toBe(searchInput);

      // Opening dropdown should maintain focus management
      await user.type(searchInput, 'Alex');
      
      await waitFor(() => {
        expect(screen.getByText('Alex Williams')).toBeInTheDocument();
      });

      // Arrow keys should navigate dropdown options
      await user.keyboard('{ArrowDown}');
      
      // First option should be focusable
      const firstOption = screen.getByText('Alex Williams').closest('button');
      expect(firstOption).toBeInTheDocument();
    });

    it('provides accessible labels for screen readers', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          required={true}
          errorMessage="This field is required"
        />
      );

      // Should have proper label structure
      expect(screen.getByText('NDIS Participant')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      
      // Error should be accessible
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toHaveClass('text-red-500');
    });

    it('announces selection changes to screen readers', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);
      
      // Select participant
      const participantOption = screen.getByText('Alex Williams');
      await user.click(participantOption);

      // Should show selected participant accessibly
      await waitFor(() => {
        const screenReaderContent = healthcareA11yUtils.simulateScreenReader(container);
        expect(screenReaderContent.combinedContent).toContain('Alex Williams');
        expect(screenReaderContent.combinedContent).toContain('Medium');
      });
    });
  });

  describe('NDIS Authentication & Session Management', () => {
    it('requires authentication for participant access', () => {
      mockLocalStorage.getItem.mockReturnValue(null); // No session
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      // Should skip query without session token
      expect(mockUseQuery).toHaveBeenCalledWith(
        'participants/list/listParticipants',
        'skip'
      );
    });

    it('shows authentication prompt when not signed in', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockUseQuery.mockReturnValue(undefined); // No data due to skip
      
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      expect(screen.getByText('Please sign in to select participants')).toBeInTheDocument();
    });

    it('handles session token for secure participant queries', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      // Should pass session token to queries
      expect(mockUseQuery).toHaveBeenCalledWith(
        'participants/list/listParticipants',
        expect.objectContaining({
          sessionToken: 'test-session-token',
        })
      );
    });
  });

  describe('NDIS Loading & Error States', () => {
    it('shows loading state while fetching participants', async () => {
      mockUseQuery.mockReturnValue(undefined); // Loading state
      
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      expect(screen.getByText('Loading participants...')).toBeInTheDocument();
    });

    it('shows no results state appropriately', async () => {
      mockUseQuery.mockReturnValue({
        participants: [],
        totalCount: 0,
        correlationId: 'empty-test',
      });
      
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      expect(screen.getByText('No active participants found')).toBeInTheDocument();
    });

    it('shows search-specific no results message', async () => {
      mockUseQuery.mockReturnValue({
        participants: [],
        totalCount: 0,
        correlationId: 'no-results-test',
      });
      
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText('No participants found matching "NonExistent"')).toBeInTheDocument();
      });
    });

    it('displays error message when provided', () => {
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          errorMessage="Participant selection is required for incident reporting"
        />
      );

      expect(screen.getByText('Participant selection is required for incident reporting')).toBeInTheDocument();
      expect(screen.queryByText('Start typing to search for participants')).not.toBeInTheDocument();
    });
  });

  describe('NDIS Care Notes & Medical Context', () => {
    it('displays truncated care notes in selected view', async () => {
      const participantWithLongNotes = {
        ...testParticipants[0],
        care_notes: 'This is a very long care note that should be truncated when displayed in the selector to prevent the interface from becoming too cluttered and overwhelming for healthcare workers who need to quickly identify participants.',
      };

      mockUseQuery.mockImplementation((queryFn, args) => {
        if (queryFn === 'participants/getById/getParticipantById') {
          return { participant: participantWithLongNotes };
        }
        return mockParticipantsResponse;
      });

      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="participant_001"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Care Notes:/)).toBeInTheDocument();
        expect(screen.getByText(/This is a very long care note that should be truncated when displayed in the selector/)).toBeInTheDocument();
        expect(screen.getByText(/\.\.\./)).toBeInTheDocument(); // Truncation indicator
      });
    });

    it('handles participants without care notes', async () => {
      const participantWithoutNotes = {
        ...testParticipants[0],
        care_notes: undefined,
      };

      mockUseQuery.mockImplementation((queryFn, args) => {
        if (queryFn === 'participants/getById/getParticipantById') {
          return { participant: participantWithoutNotes };
        }
        return mockParticipantsResponse;
      });

      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="participant_001"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Alex Williams')).toBeInTheDocument();
        expect(screen.queryByText('Care Notes:')).not.toBeInTheDocument();
      });
    });
  });

  describe('NDIS Mobile Responsiveness', () => {
    it('renders mobile-friendly interface for field workers', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          required={true}
        />
      );

      // Should render all essential elements on mobile
      expect(screen.getByText('NDIS Participant')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select NDIS participant...')).toBeInTheDocument();
    });

    it('maintains accessibility on mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantSelector mobile');
    });
  });

  describe('NDIS Click Outside & Focus Management', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <ParticipantSelector onSelect={mockOnSelect} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open dropdown
      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      expect(screen.getByText('Alex Williams')).toBeInTheDocument();

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);

      // Dropdown should close
      expect(screen.queryByText('Alex Williams')).not.toBeInTheDocument();
    });

    it('maintains focus appropriately during selection workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      
      // Focus should be on input initially
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Open dropdown
      await user.click(searchInput);
      
      // Focus should remain manageable
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('NDIS Error Handling & Edge Cases', () => {
    it('handles invalid participant ID gracefully', () => {
      mockUseQuery.mockImplementation((queryFn, args) => {
        if (queryFn === 'participants/getById/getParticipantById') {
          return { participant: null }; // Invalid ID
        }
        return mockParticipantsResponse;
      });

      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          selectedParticipantId="invalid_id"
        />
      );

      // Should show search input instead of selected participant
      expect(screen.getByPlaceholderText('Select NDIS participant...')).toBeInTheDocument();
    });

    it('handles network errors during participant fetch', async () => {
      mockUseQuery.mockReturnValue({
        error: 'Network error',
        participants: [],
        totalCount: 0,
      });

      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Should show no participants when there's an error
      expect(screen.getByText('No active participants found')).toBeInTheDocument();
    });

    it('maintains accessibility with error states', async () => {
      const { container } = render(
        <ParticipantSelector
          onSelect={mockOnSelect}
          errorMessage="Network error occurred"
          required={true}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantSelector with errors');
    });

    it('handles extremely long participant names gracefully', async () => {
      const participantWithLongName = {
        ...testParticipants[0],
        first_name: 'VeryLongFirstNameThatCouldCauseLayoutIssues',
        last_name: 'AndAnEvenLongerLastNameThatMightBreakTheInterface',
      };

      mockUseQuery.mockImplementation((queryFn, args) => {
        if (queryFn === 'participants/list/listParticipants') {
          return {
            participants: [participantWithLongName],
            totalCount: 1,
            correlationId: 'long-name-test',
          };
        }
        return undefined;
      });

      const user = userEvent.setup();
      
      render(
        <ParticipantSelector
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Select NDIS participant...');
      await user.click(searchInput);

      // Should display long names without breaking layout
      expect(screen.getByText(/VeryLongFirstNameThatCouldCauseLayoutIssues/)).toBeInTheDocument();
      expect(screen.getByText(/AndAnEvenLongerLastNameThatMightBreakTheInterface/)).toBeInTheDocument();
    });
  });
});