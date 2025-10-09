import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContinueWorkflowModal } from '@/components/incidents/ContinueWorkflowModal';
import type { IncidentPreview } from '@/components/incidents/IncidentPreviewCard';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

const mockIncompleteIncidents: IncidentPreview[] = [
  {
    _id: 'incident-1',
    participant_name: 'John Doe',
    created_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    updated_at: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    current_step: 3,
    step_description: 'During Event',
    content_preview: 'This is a preview of the incident content that should be truncated...',
    overall_status: 'capture_pending',
    capture_status: 'in_progress',
  },
  {
    _id: 'incident-2',
    participant_name: 'Jane Smith',
    created_at: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
    updated_at: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    current_step: 1,
    step_description: 'Basic Information',
    content_preview: 'Another incident preview content...',
    overall_status: 'capture_pending',
    capture_status: 'draft',
  },
];

describe('ContinueWorkflowModal', () => {
  const mockOnClose = jest.fn();
  const mockOnContinue = jest.fn();
  const mockOnStartNew = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Continue Existing Work or Start New?')).toBeInTheDocument();
    expect(screen.getByText(/You have 2 incomplete incidents/)).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <ContinueWorkflowModal
        isOpen={false}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('displays incomplete incidents correctly', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    // Check first incident
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 7 - During Event')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument(); // 3/7 * 100 rounded

    // Check second incident
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 7 - Basic Information')).toBeInTheDocument();
    expect(screen.getByText('14%')).toBeInTheDocument(); // 1/7 * 100 rounded
  });

  it('calls onContinue when continue button is clicked', async () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    const continueButtons = screen.getAllByText('Continue Work');
    fireEvent.click(continueButtons[0]);

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalledWith('incident-1', 3);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onStartNew when start new incident button is clicked', async () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    const startNewButton = screen.getByText('Start New Incident');
    fireEvent.click(startNewButton);

    await waitFor(() => {
      expect(mockOnStartNew).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when maybe later button is clicked', async () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    const maybeLaterButton = screen.getByText('Maybe Later');
    fireEvent.click(maybeLaterButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows correct plural/singular text for incident count', () => {
    // Test with single incident
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={[mockIncompleteIncidents[0]]}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    expect(screen.getByText(/You have 1 incomplete incident\./)).toBeInTheDocument();
  });

  it('handles empty incidents list gracefully', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={[]}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    expect(screen.getByText(/You have 0 incomplete incidents/)).toBeInTheDocument();
    expect(screen.getByText('Start New Incident')).toBeInTheDocument();
  });

  it('limits display to 4 incidents and shows count for additional', () => {
    const manyIncidents = Array.from({ length: 6 }, (_, i) => ({
      ...mockIncompleteIncidents[0],
      _id: `incident-${i}`,
      participant_name: `Participant ${i}`,
    }));

    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={manyIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    // Should show 4 incident cards
    expect(screen.getAllByText('Continue Work')).toHaveLength(4);
    
    // Should show additional count message
    expect(screen.getByText('And 2 more incomplete incidents...')).toBeInTheDocument();
  });

  it('displays correct badge colors for different statuses', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    // Should have appropriate badges for different statuses
    expect(screen.getByText('in_progress')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    const dialog = screen.getByRole('alertdialog');
    
    // Simulate Escape key press
    fireEvent.keyDown(dialog, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows progress percentages correctly', () => {
    render(
      <ContinueWorkflowModal
        isOpen={true}
        onClose={mockOnClose}
        incompleteIncidents={mockIncompleteIncidents}
        onContinue={mockOnContinue}
        onStartNew={mockOnStartNew}
      />
    );

    // Check progress percentages
    expect(screen.getByText('43%')).toBeInTheDocument(); // Step 3 of 7
    expect(screen.getByText('14%')).toBeInTheDocument(); // Step 1 of 7
  });
});