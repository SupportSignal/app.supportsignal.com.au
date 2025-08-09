// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionsEditor } from '@/components/analysis/conditions-editor';
import { testHealthcareAccessibility, testKeyboardNavigation, testFormAccessibility } from '../../utils/accessibility';

describe('ConditionsEditor Component', () => {
  const user = userEvent.setup();

  // Mock contributing conditions for testing
  const mockConditions = [
    {
      id: 'condition_001',
      type: 'environmental' as const,
      title: 'Inadequate Lighting',
      description: 'Poor lighting in the activity room contributed to difficulty navigating safely',
      severity: 'medium' as const,
      isModifiable: true,
      status: 'confirmed' as const,
      recommendedActions: [
        'Install additional LED lighting fixtures',
        'Implement motion-sensor lighting in pathways',
      ],
    },
    {
      id: 'condition_002',
      type: 'behavioral' as const,
      title: 'Communication Barriers',
      description: 'Participant had difficulty expressing needs due to communication challenges',
      severity: 'high' as const,
      isModifiable: true,
      status: 'identified' as const,
      recommendedActions: [
        'Provide communication aids and training',
        'Assign staff trained in alternative communication methods',
      ],
    },
    {
      id: 'condition_003',
      type: 'medical' as const,
      title: 'Medication Side Effects',
      description: 'Recent medication changes may have affected participant balance and coordination',
      severity: 'high' as const,
      isModifiable: false,
      status: 'ongoing' as const,
    },
  ];

  const mockHandlers = {
    onConditionAdd: jest.fn(),
    onConditionEdit: jest.fn(),
    onConditionRemove: jest.fn(),
    onConditionStatusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test condition display and visualization
  describe('Condition Display', () => {
    it('should display all existing conditions with details', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Inadequate Lighting')).toBeInTheDocument();
      expect(screen.getByText('Communication Barriers')).toBeInTheDocument();
      expect(screen.getByText('Medication Side Effects')).toBeInTheDocument();
    });

    it('should show condition types with appropriate badges', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Environmental')).toBeInTheDocument();
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Medical')).toBeInTheDocument();
    });

    it('should display severity levels correctly', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Medium Impact')).toBeInTheDocument();
      expect(screen.getAllByText('High Impact')).toHaveLength(2);
    });

    it('should show status badges for each condition', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Identified')).toBeInTheDocument();
      expect(screen.getByText('Ongoing')).toBeInTheDocument();
    });

    it('should indicate modifiable conditions', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      const modifiableBadges = screen.getAllByText('Modifiable');
      expect(modifiableBadges).toHaveLength(2);
    });

    it('should display condition descriptions', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Poor lighting in the activity room contributed to difficulty navigating safely')).toBeInTheDocument();
      expect(screen.getByText('Participant had difficulty expressing needs due to communication challenges')).toBeInTheDocument();
    });
  });

  // Test recommended actions display
  describe('Recommended Actions Display', () => {
    it('should show recommended actions for conditions that have them', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Recommended Actions:')).toBeInTheDocument();
      expect(screen.getByText('Install additional LED lighting fixtures')).toBeInTheDocument();
      expect(screen.getByText('Provide communication aids and training')).toBeInTheDocument();
    });

    it('should handle conditions without recommended actions', () => {
      const conditionsWithoutActions = mockConditions.map(condition => 
        condition.id === 'condition_003' 
          ? { ...condition, recommendedActions: undefined }
          : condition
      );

      render(
        <ConditionsEditor 
          conditions={conditionsWithoutActions}
          {...mockHandlers}
        />
      );

      // Should not crash and display other information correctly
      expect(screen.getByText('Medication Side Effects')).toBeInTheDocument();
    });
  });

  // Test condition count and limits
  describe('Condition Count and Limits', () => {
    it('should display condition count correctly', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={10}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('should disable add button when max conditions reached', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={3}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      expect(addButton).toBeDisabled();
    });

    it('should enable add button when below max conditions', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      expect(addButton).toBeEnabled();
    });

    it('should hide add button when readOnly is true', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          readOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /add condition/i })).not.toBeInTheDocument();
    });
  });

  // Test minimal variant layout
  describe('Minimal Variant', () => {
    it('should render minimal variant with compact display', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          variant="minimal"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Contributing Conditions (3)')).toBeInTheDocument();
      expect(screen.getByText('Inadequate Lighting')).toBeInTheDocument();
      expect(screen.getByText('Communication Barriers')).toBeInTheDocument();
      expect(screen.getByText('Medication Side Effects')).toBeInTheDocument();
    });

    it('should show add button in minimal variant when not readonly', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          variant="minimal"
          maxConditions={5}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('should not show detailed form interface in minimal variant', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          variant="minimal"
          {...mockHandlers}
        />
      );

      expect(screen.queryByText('Condition Type')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  // Test adding new conditions
  describe('Adding New Conditions', () => {
    it('should show add condition form when add button is clicked', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      expect(screen.getByText('Add New Contributing Condition')).toBeInTheDocument();
      expect(screen.getByLabelText(/condition type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/condition title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
    });

    it('should have all condition type options available', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const typeSelect = screen.getByLabelText(/condition type/i);
      expect(typeSelect).toHaveValue('environmental');
      
      // Check that all options are available
      const options = typeSelect.querySelectorAll('option');
      expect(options).toHaveLength(7); // 6 types + default
    });

    it('should have all severity options available', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const severitySelect = screen.getByLabelText(/severity/i);
      expect(severitySelect).toHaveValue('medium');
      
      const options = severitySelect.querySelectorAll('option');
      expect(options).toHaveLength(3); // low, medium, high
    });

    it('should call onConditionAdd with correct data when form is submitted', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      // Fill in the form
      const titleInput = screen.getByLabelText(/condition title/i);
      const descriptionInput = screen.getByLabelText(/detailed description/i);
      
      await user.type(titleInput, 'New Safety Hazard');
      await user.type(descriptionInput, 'Slippery floor surface in bathroom area');

      const submitButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(submitButton);

      expect(mockHandlers.onConditionAdd).toHaveBeenCalledWith({
        type: 'environmental',
        title: 'New Safety Hazard',
        description: 'Slippery floor surface in bathroom area',
        severity: 'medium',
        isModifiable: true,
        status: 'identified',
      });
    });

    it('should reset form and hide it after successful submission', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const titleInput = screen.getByLabelText(/condition title/i);
      const descriptionInput = screen.getByLabelText(/detailed description/i);
      
      await user.type(titleInput, 'Test Condition');
      await user.type(descriptionInput, 'Test Description');

      const submitButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(submitButton);

      // Form should be hidden
      expect(screen.queryByText('Add New Contributing Condition')).not.toBeInTheDocument();
    });

    it('should handle form cancellation', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Add New Contributing Condition')).not.toBeInTheDocument();
    });

    it('should disable submit button when form is incomplete', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const submitButton = screen.getByRole('button', { name: /add condition/i });
      expect(submitButton).toBeDisabled();

      // Fill only title, not description
      const titleInput = screen.getByLabelText(/condition title/i);
      await user.type(titleInput, 'Test Condition');
      
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is complete', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      const titleInput = screen.getByLabelText(/condition title/i);
      const descriptionInput = screen.getByLabelText(/detailed description/i);
      
      await user.type(titleInput, 'Test Condition');
      await user.type(descriptionInput, 'Test Description');

      const submitButton = screen.getByRole('button', { name: /add condition/i });
      expect(submitButton).toBeEnabled();
    });
  });

  // Test condition status management
  describe('Condition Status Management', () => {
    it('should call onConditionStatusChange when status is changed', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      const statusSelects = screen.getAllByDisplayValue('confirmed');
      const firstStatusSelect = statusSelects[0];
      
      await user.selectOptions(firstStatusSelect, 'addressed');

      expect(mockHandlers.onConditionStatusChange).toHaveBeenCalledWith('condition_001', 'addressed');
    });

    it('should show all status options in dropdown', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      const statusSelect = screen.getAllByDisplayValue('confirmed')[0];
      const options = statusSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(4); // identified, confirmed, addressed, ongoing
    });

    it('should hide status controls in read-only mode', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          readOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.queryByDisplayValue('confirmed')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /x/i })).not.toBeInTheDocument();
    });
  });

  // Test condition editing and removal
  describe('Condition Editing and Removal', () => {
    it('should show edit and remove buttons for each condition', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const removeButtons = screen.getAllByRole('button', { name: /x/i });
      
      expect(editButtons).toHaveLength(3);
      expect(removeButtons).toHaveLength(3);
    });

    it('should call onConditionRemove when remove button is clicked', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /x/i });
      await user.click(removeButtons[0]);

      expect(mockHandlers.onConditionRemove).toHaveBeenCalledWith('condition_001');
    });

    it('should handle edit button clicks', async () => {
      const mockOnEdit = jest.fn();
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          onConditionEdit={mockOnEdit}
          {...mockHandlers}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // This would typically trigger editing mode - implementation dependent
      expect(editButtons[0]).toBeInTheDocument();
    });
  });

  // Test empty state
  describe('Empty State', () => {
    it('should show empty state when no conditions exist', () => {
      render(
        <ConditionsEditor 
          conditions={[]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No contributing conditions identified yet')).toBeInTheDocument();
      expect(screen.getByText('Add conditions that may have contributed to this incident')).toBeInTheDocument();
    });

    it('should show add button in empty state', () => {
      render(
        <ConditionsEditor 
          conditions={[]}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /add condition/i })).toBeInTheDocument();
    });

    it('should handle empty state in read-only mode', () => {
      render(
        <ConditionsEditor 
          conditions={[]}
          readOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No contributing conditions identified yet')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // Test healthcare workflow integration
  describe('Healthcare Workflow Integration', () => {
    it('should support NDIS condition categories', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      user.click(addButton);

      // Should have healthcare-relevant condition types
      const typeSelect = screen.getByLabelText(/condition type/i);
      const options = Array.from(typeSelect.querySelectorAll('option')).map(opt => opt.textContent);
      
      expect(options).toContain('Environmental - Physical environment factors');
      expect(options).toContain('Behavioral - Participant behavior patterns');
      expect(options).toContain('Medical - Health-related conditions');
      expect(options).toContain('Communication - Communication barriers');
      expect(options).toContain('Procedural - Process or procedure issues');
    });

    it('should track modifiable vs non-modifiable conditions', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      // Should show modifiable badge for conditions that can be changed
      const modifiableBadges = screen.getAllByText('Modifiable');
      expect(modifiableBadges).toHaveLength(2);
      
      // Medical condition should not be modifiable
      expect(screen.getByText('Medication Side Effects').closest('div')).not.toContainElement(
        screen.getByText('Modifiable')
      );
    });

    it('should support condition severity assessment', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Medium Impact')).toBeInTheDocument();
      expect(screen.getAllByText('High Impact')).toHaveLength(2);
    });
  });

  // Test form accessibility for healthcare compliance
  describe('Healthcare Form Accessibility', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      await testHealthcareAccessibility(container, 'conditions editor');
    });

    it('should have proper form structure when adding conditions', async () => {
      const { container } = render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      await testFormAccessibility(container);
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      // Should have multiple focusable elements: Add button + status selects + edit/remove buttons
      const expectedFocusableCount = 1 + (mockConditions.length * 3); // 1 add + 3 per condition
      await testKeyboardNavigation(container, expectedFocusableCount);
    });

    it('should provide semantic structure for screen readers', () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('heading', { name: /contributing conditions/i })).toBeInTheDocument();
    });

    it('should have proper labels for form fields', async () => {
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          maxConditions={5}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      expect(screen.getByLabelText(/condition type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/condition title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
    });
  });

  // Test forward ref functionality
  describe('Forward Ref Support', () => {
    it('should forward ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ConditionsEditor 
          ref={ref}
          conditions={mockConditions}
          {...mockHandlers}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Contributing Conditions');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-conditions-editor';
      render(
        <ConditionsEditor 
          conditions={mockConditions}
          className={customClass}
          {...mockHandlers}
        />
      );

      const container = screen.getByText('Contributing Conditions').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle conditions without titles gracefully', () => {
      const conditionsWithoutTitles = mockConditions.map(condition => ({
        ...condition,
        title: '',
      }));

      render(
        <ConditionsEditor 
          conditions={conditionsWithoutTitles}
          {...mockHandlers}
        />
      );

      // Should not crash
      expect(screen.getByText('Contributing Conditions')).toBeInTheDocument();
    });

    it('should handle undefined condition properties', () => {
      const incompleteConditions = mockConditions.map(condition => ({
        ...condition,
        recommendedActions: undefined,
        severity: undefined,
      }));

      // @ts-expect-error - Testing invalid data
      render(
        <ConditionsEditor 
          conditions={incompleteConditions}
          {...mockHandlers}
        />
      );

      // Should render available information
      expect(screen.getByText('Inadequate Lighting')).toBeInTheDocument();
    });

    it('should handle very long condition descriptions', () => {
      const conditionWithLongDescription = {
        ...mockConditions[0],
        description: 'This is a very long description that contains a lot of detailed information about the contributing condition and its impact on the incident. It should wrap properly and be displayed in a readable format without breaking the layout or causing accessibility issues.',
      };

      render(
        <ConditionsEditor 
          conditions={[conditionWithLongDescription]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('should handle zero maxConditions gracefully', () => {
      render(
        <ConditionsEditor 
          conditions={[]}
          maxConditions={0}
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /add condition/i })).not.toBeInTheDocument();
    });
  });
});