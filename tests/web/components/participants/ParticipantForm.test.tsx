// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantForm } from '@/components/participants/ParticipantForm';
import { mockParticipants, validParticipantData, invalidParticipantData } from '../../../convex/participants/fixtures';

// Mock Convex hooks
const mockCreateParticipant = jest.fn();
const mockUpdateParticipant = jest.fn();

jest.mock('convex/react', () => ({
  useMutation: jest.fn((mutationFn) => {
    if (mutationFn.toString().includes('create')) {
      return mockCreateParticipant;
    }
    return mockUpdateParticipant;
  }),
}));

// Mock the API
jest.mock('@/convex/_generated/api', () => ({
  api: {
    participants: {
      create: {
        createParticipant: 'participants/create/createParticipant',
      },
      update: {
        updateParticipant: 'participants/update/updateParticipant',
      },
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

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('ParticipantForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-session-token');
    mockCreateParticipant.mockResolvedValue({
      success: true,
      participantId: 'participant_new_123',
    });
    mockUpdateParticipant.mockResolvedValue({
      success: true,
      participantId: 'participant_updated_123',
    });
  });

  describe('Rendering and Initial State', () => {
    it('renders create form with all required fields', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Create New Participant')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ndis number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/emergency contact/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/care notes/i)).toBeInTheDocument();
      
      // Support level radio buttons
      expect(screen.getByText('High Support')).toBeInTheDocument();
      expect(screen.getByText('Medium Support')).toBeInTheDocument();
      expect(screen.getByText('Low Support')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders edit form with participant data pre-filled', () => {
      const participant = mockParticipants.johnDoe;
      
      render(
        <ParticipantForm 
          mode="edit" 
          participant={participant}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Participant')).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.first_name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.last_name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.date_of_birth)).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.ndis_number)).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.contact_phone || '')).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.emergency_contact || '')).toBeInTheDocument();
      expect(screen.getByDisplayValue(participant.care_notes || '')).toBeInTheDocument();
      
      // Check selected support level
      const supportLevelRadio = screen.getByRole('radio', { name: new RegExp(participant.support_level, 'i') });
      expect(supportLevelRadio).toBeChecked();

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows cancel button only when onCancel prop is provided', () => {
      const { rerender } = render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

      rerender(<ParticipantForm mode="create" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('defaults to medium support level for new participants', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);
      
      const mediumSupportRadio = screen.getByRole('radio', { name: /medium support/i });
      expect(mediumSupportRadio).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
        expect(screen.getByText('NDIS number is required')).toBeInTheDocument();
      });
    });

    it('validates first name constraints', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const firstNameInput = screen.getByLabelText(/first name/i);

      // Test too short
      await user.type(firstNameInput, 'X');
      await user.tab();
      
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      });

      // Test too long
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'A'.repeat(51));
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name must not exceed 50 characters')).toBeInTheDocument();
      });

      // Test invalid characters
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'John123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/can only contain letters, spaces, hyphens, and apostrophes/)).toBeInTheDocument();
      });
    });

    it('validates last name constraints', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const lastNameInput = screen.getByLabelText(/last name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Test too short
      await user.type(lastNameInput, 'Y');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('validates NDIS number format', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const ndisNumberInput = screen.getByLabelText(/ndis number/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Test too short
      await user.type(ndisNumberInput, '12345678');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('NDIS number must be exactly 9 digits')).toBeInTheDocument();
      });

      // Test non-numeric
      await user.clear(ndisNumberInput);
      await user.type(ndisNumberInput, '12345678A');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('NDIS number must be exactly 9 digits')).toBeInTheDocument();
      });
    });

    it('validates date of birth constraints', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const dobInput = screen.getByLabelText(/date of birth/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Test future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await user.type(dobInput, futureDateString);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Date of birth cannot be in the future')).toBeInTheDocument();
      });

      // Test too old
      await user.clear(dobInput);
      await user.type(dobInput, '1899-12-31');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Date of birth must be after 1900')).toBeInTheDocument();
      });
    });

    it('validates optional phone number format', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Fill required fields first
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.type(screen.getByLabelText(/ndis number/i), '123456789');

      // Test invalid phone format
      await user.type(phoneInput, 'abc-def-ghij');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
      });
    });

    it('validates care notes length limit', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const careNotesInput = screen.getByLabelText(/care notes/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.type(screen.getByLabelText(/ndis number/i), '123456789');

      // Test too long care notes
      await user.type(careNotesInput, 'A'.repeat(501));
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Care notes must not exceed 500 characters')).toBeInTheDocument();
      });
    });

    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      // Start typing - error should clear
      await user.type(firstNameInput, 'J');
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });

    it('shows character count for care notes', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('0/500 characters')).toBeInTheDocument();
    });
  });

  describe('Support Level Selection', () => {
    it('allows changing support level', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const highSupportRadio = screen.getByRole('radio', { name: /high support/i });
      const mediumSupportRadio = screen.getByRole('radio', { name: /medium support/i });

      expect(mediumSupportRadio).toBeChecked();
      expect(highSupportRadio).not.toBeChecked();

      await user.click(highSupportRadio);

      expect(highSupportRadio).toBeChecked();
      expect(mediumSupportRadio).not.toBeChecked();
    });

    it('shows support level descriptions', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Requires intensive support and frequent monitoring/)).toBeInTheDocument();
      expect(screen.getByText(/Requires regular support with some independence/)).toBeInTheDocument();
      expect(screen.getByText(/Requires minimal support with high independence/)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits create form with valid data', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Fill in all fields
      await user.type(screen.getByLabelText(/first name/i), validParticipantData.complete.first_name);
      await user.type(screen.getByLabelText(/last name/i), validParticipantData.complete.last_name);
      await user.type(screen.getByLabelText(/date of birth/i), validParticipantData.complete.date_of_birth);
      await user.type(screen.getByLabelText(/ndis number/i), validParticipantData.complete.ndis_number);
      await user.type(screen.getByLabelText(/phone number/i), validParticipantData.complete.contact_phone);
      await user.type(screen.getByLabelText(/emergency contact/i), validParticipantData.complete.emergency_contact);
      await user.type(screen.getByLabelText(/care notes/i), validParticipantData.complete.care_notes);
      
      await user.click(screen.getByRole('radio', { name: /high support/i }));

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateParticipant).toHaveBeenCalledWith({
          sessionToken: 'test-session-token',
          first_name: validParticipantData.complete.first_name,
          last_name: validParticipantData.complete.last_name,
          date_of_birth: validParticipantData.complete.date_of_birth,
          ndis_number: validParticipantData.complete.ndis_number,
          contact_phone: validParticipantData.complete.contact_phone,
          emergency_contact: validParticipantData.complete.emergency_contact,
          support_level: 'high',
          care_notes: validParticipantData.complete.care_notes,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('participant_new_123');
    });

    it('submits update form with changes', async () => {
      const user = userEvent.setup();
      const participant = mockParticipants.johnDoe;
      
      render(
        <ParticipantForm 
          mode="edit" 
          participant={participant}
          onSuccess={mockOnSuccess}
        />
      );

      // Change first name
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated John');

      const submitButton = screen.getByRole('button', { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateParticipant).toHaveBeenCalledWith(expect.objectContaining({
          sessionToken: 'test-session-token',
          participantId: participant._id,
          first_name: 'Updated John',
          last_name: participant.last_name,
        }));
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('participant_updated_123');
    });

    it('handles submission without session token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Fill minimal valid data
      await user.type(screen.getByLabelText(/first name/i), validParticipantData.minimal.first_name);
      await user.type(screen.getByLabelText(/last name/i), validParticipantData.minimal.last_name);
      await user.type(screen.getByLabelText(/date of birth/i), validParticipantData.minimal.date_of_birth);
      await user.type(screen.getByLabelText(/ndis number/i), validParticipantData.minimal.ndis_number);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Authentication required')).toBeInTheDocument();
      });

      expect(mockCreateParticipant).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows submission loading state', async () => {
      const user = userEvent.setup();
      mockCreateParticipant.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, participantId: 'test' }), 100))
      );

      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Fill minimal valid data
      await user.type(screen.getByLabelText(/first name/i), validParticipantData.minimal.first_name);
      await user.type(screen.getByLabelText(/last name/i), validParticipantData.minimal.last_name);
      await user.type(screen.getByLabelText(/date of birth/i), validParticipantData.minimal.date_of_birth);
      await user.type(screen.getByLabelText(/ndis number/i), validParticipantData.minimal.ndis_number);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      mockCreateParticipant.mockRejectedValue(new Error('Network error'));

      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Fill minimal valid data
      await user.type(screen.getByLabelText(/first name/i), validParticipantData.minimal.first_name);
      await user.type(screen.getByLabelText(/last name/i), validParticipantData.minimal.last_name);
      await user.type(screen.getByLabelText(/date of birth/i), validParticipantData.minimal.date_of_birth);
      await user.type(screen.getByLabelText(/ndis number/i), validParticipantData.minimal.ndis_number);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('trims whitespace from text inputs', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Add whitespace to inputs
      await user.type(screen.getByLabelText(/first name/i), '  John  ');
      await user.type(screen.getByLabelText(/last name/i), '  Doe  ');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.type(screen.getByLabelText(/ndis number/i), ' 123 456 789 ');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateParticipant).toHaveBeenCalledWith(expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          ndis_number: '123456789', // Spaces removed
        }));
      });
    });

    it('converts empty optional fields to undefined', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      // Fill only required fields
      await user.type(screen.getByLabelText(/first name/i), validParticipantData.minimal.first_name);
      await user.type(screen.getByLabelText(/last name/i), validParticipantData.minimal.last_name);
      await user.type(screen.getByLabelText(/date of birth/i), validParticipantData.minimal.date_of_birth);
      await user.type(screen.getByLabelText(/ndis number/i), validParticipantData.minimal.ndis_number);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateParticipant).toHaveBeenCalledWith(expect.objectContaining({
          contact_phone: undefined,
          emergency_contact: undefined,
          care_notes: undefined,
        }));
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ParticipantForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables cancel button during submission', async () => {
      const user = userEvent.setup();
      mockCreateParticipant.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, participantId: 'test' }), 100))
      );

      render(
        <ParticipantForm 
          mode="create" 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel}
        />
      );

      // Fill and submit
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.type(screen.getByLabelText(/ndis number/i), '123456789');

      const submitButton = screen.getByRole('button', { name: /create/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      await user.click(submitButton);

      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });
  });

  describe('Auto-save Functionality', () => {
    it('shows auto-save status in edit mode', async () => {
      jest.useFakeTimers();
      
      render(
        <ParticipantForm 
          mode="edit" 
          participant={mockParticipants.johnDoe}
          onSuccess={mockOnSuccess}
        />
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, ' Updated');

      // Fast-forward past auto-save delay
      jest.advanceTimersByTime(2001);

      await waitFor(() => {
        expect(screen.getByText('Draft saved')).toBeInTheDocument();
      });

      // Auto-save status should disappear after timeout
      jest.advanceTimersByTime(2001);

      await waitFor(() => {
        expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('does not show auto-save in create mode', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('heading', { name: /create new participant/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('id', 'first_name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('id', 'last_name');
      expect(screen.getByLabelText(/date of birth/i)).toHaveAttribute('type', 'date');
      expect(screen.getByLabelText(/ndis number/i)).toHaveAttribute('maxlength', '9');
    });

    it('shows required field indicators', () => {
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/first name \*/)).toBeInTheDocument();
      expect(screen.getByText(/last name \*/)).toBeInTheDocument();
      expect(screen.getByText(/date of birth \*/)).toBeInTheDocument();
      expect(screen.getByText(/ndis number \*/)).toBeInTheDocument();
      expect(screen.getByText(/support level \*/)).toBeInTheDocument();
    });

    it('provides error messages with proper styling', async () => {
      const user = userEvent.setup();
      render(<ParticipantForm mode="create" onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        expect(firstNameInput).toHaveClass('border-red-500');
        
        const errorMessage = screen.getByText('First name is required');
        expect(errorMessage).toHaveClass('text-red-500');
      });
    });
  });
});