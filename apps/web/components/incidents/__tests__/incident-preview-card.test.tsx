import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentPreviewCard, type IncidentPreview } from '@/components/incidents/IncidentPreviewCard';

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
}));

const mockIncident: IncidentPreview = {
  _id: 'test-incident-1',
  participant_name: 'John Doe',
  created_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  updated_at: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
  current_step: 3,
  step_description: 'During Event',
  content_preview: 'This is a preview of the incident content that should be displayed in the preview area.',
  overall_status: 'capture_pending',
  capture_status: 'in_progress',
};

describe('IncidentPreviewCard', () => {
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders incident information correctly', () => {
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );

    // Check participant name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check step information
    expect(screen.getByText('Step 3 of 7 - During Event')).toBeInTheDocument();
    
    // Check progress percentage (3/7 * 100 = 43%)
    expect(screen.getByText('43%')).toBeInTheDocument();
    
    // Check status badge
    expect(screen.getByText('in_progress')).toBeInTheDocument();
    
    // Check content preview
    expect(screen.getByText(/This is a preview of the incident content/)).toBeInTheDocument();
  });

  it('renders without content preview when not provided', () => {
    const incidentWithoutPreview = { ...mockIncident, content_preview: undefined };
    
    render(
      <IncidentPreviewCard
        incident={incidentWithoutPreview}
        onContinue={mockOnContinue}
      />
    );

    // Should not show content preview section
    expect(screen.queryByTestId('file-text-icon')).not.toBeInTheDocument();
  });

  it('handles incident with no current step', () => {
    const incidentWithoutStep = { 
      ...mockIncident, 
      current_step: undefined,
      step_description: undefined 
    };
    
    render(
      <IncidentPreviewCard
        incident={incidentWithoutStep}
        onContinue={mockOnContinue}
      />
    );

    // Should show Step 1 as default
    expect(screen.getByText('Step 1 of 7 - Getting Started')).toBeInTheDocument();
    
    // Should show 0% progress
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onContinue with correct parameters when button is clicked', () => {
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByText('Continue Work');
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledWith('test-incident-1', 3);
  });

  it('shows correct time formatting for created and modified dates', () => {
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );

    // Should show formatted time strings (they appear in different contexts)
    expect(screen.getByText('Started 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('Last modified 2 hours ago')).toBeInTheDocument();
  });

  it('displays draft status badge correctly', () => {
    const draftIncident = { ...mockIncident, capture_status: 'draft' as const };
    
    render(
      <IncidentPreviewCard
        incident={draftIncident}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('shows correct progress percentages for different steps', () => {
    const testCases = [
      { step: 1, expectedPercentage: '14%' },
      { step: 2, expectedPercentage: '29%' },
      { step: 4, expectedPercentage: '57%' },
      { step: 7, expectedPercentage: '100%' },
    ];

    testCases.forEach(({ step, expectedPercentage }) => {
      const { rerender } = render(
        <IncidentPreviewCard
          incident={{ ...mockIncident, current_step: step }}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText(expectedPercentage)).toBeInTheDocument();
      
      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it('has proper test id for continue button', () => {
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByTestId('continue-incident-test-incident-1');
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).toHaveTextContent('Continue Work');
  });

  it('applies hover styles with transition class', () => {
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );

    const card = screen.getByRole('button').closest('.hover\\:shadow-md');
    expect(card).toBeInTheDocument();
  });

  it('handles different overall status values', () => {
    const statusOptions: Array<IncidentPreview['overall_status']> = [
      'capture_pending',
      'analysis_pending', 
      'completed'
    ];

    statusOptions.forEach((status) => {
      const { rerender, unmount } = render(
        <IncidentPreviewCard
          incident={{ ...mockIncident, overall_status: status }}
          onContinue={mockOnContinue}
        />
      );

      // Should render without errors for each status
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Clean up for next iteration
      unmount();
    });
  });

  it('truncates long participant names properly', () => {
    const longNameIncident = {
      ...mockIncident,
      participant_name: 'This is a very long participant name that should be truncated'
    };

    render(
      <IncidentPreviewCard
        incident={longNameIncident}
        onContinue={mockOnContinue}
      />
    );

    // Should still render the name (truncation is handled by CSS)
    expect(screen.getByText(longNameIncident.participant_name)).toBeInTheDocument();
  });

  it('shows step description when provided, falls back to generated when not', () => {
    // Test with provided step description
    render(
      <IncidentPreviewCard
        incident={mockIncident}
        onContinue={mockOnContinue}
      />
    );
    expect(screen.getByText('Step 3 of 7 - During Event')).toBeInTheDocument();

    // Test with fallback to generated description
    const incidentWithoutDescription = {
      ...mockIncident,
      step_description: undefined,
      current_step: 5
    };
    
    const { rerender } = render(
      <IncidentPreviewCard
        incident={incidentWithoutDescription}
        onContinue={mockOnContinue}
      />
    );
    
    rerender(
      <IncidentPreviewCard
        incident={incidentWithoutDescription}
        onContinue={mockOnContinue}
      />
    );
    
    expect(screen.getByText('Step 5 of 7 - Q&A Session')).toBeInTheDocument();
  });
});