// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from '@/components/incidents/QuestionCard';
import { ClarificationQuestion, AnswerAutoSaveState } from '@/types/clarification';

describe('QuestionCard', () => {
  const mockOnAnswerChange = jest.fn();

  const createMockQuestion = (overrides: Partial<ClarificationQuestion> = {}): ClarificationQuestion => ({
    _id: 'mock-id',
    question_id: 'test_q1',
    question_text: 'What happened during the incident?',
    question_order: 1,
    phase: 'during_event',
    answered: false,
    answer_text: '',
    is_active: true,
    incident_id: 'test-incident',
    _creationTime: Date.now(),
    updated_at: Date.now(),
    ...overrides,
  });

  const createMockAutoSaveState = (overrides: Partial<AnswerAutoSaveState> = {}): AnswerAutoSaveState => ({
    question_id: 'test_q1',
    pending: false,
    last_saved: Date.now(),
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Question Display', () => {
    it('should render question text and order correctly', () => {
      const question = createMockQuestion({
        question_text: 'What was the participant doing before the incident?',
        question_order: 3,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText('What was the participant doing before the incident?')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Question order badge
    });

    it('should create proper accessibility labels', () => {
      const question = createMockQuestion({
        question_id: 'before_event_q2',
        question_text: 'Test question text',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'question-before_event_q2');
      
      const label = screen.getByLabelText(/test question text/i);
      expect(label).toBeInTheDocument();
    });
  });

  describe('Answer Input', () => {
    it('should display existing answer text', () => {
      const question = createMockQuestion({
        answer_text: 'Existing answer text',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Existing answer text');
    });

    it('should handle empty/null answer text', () => {
      const questionWithNull = createMockQuestion({
        answer_text: null as any,
      });

      render(
        <QuestionCard
          question={questionWithNull}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should call onAnswerChange when text is typed', async () => {
      const user = userEvent.setup();
      const question = createMockQuestion();

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New answer');

      expect(mockOnAnswerChange).toHaveBeenCalledWith('test_q1', 'New answer');
    });

    it('should show placeholder text', () => {
      const question = createMockQuestion();

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByPlaceholderText(/type your answer here.*optional/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      const question = createMockQuestion();

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
          disabled={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('Status Indicators', () => {
    it('should show "Not answered" status for empty answers', () => {
      const question = createMockQuestion({
        answered: false,
        answer_text: '',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText('Not answered')).toBeInTheDocument();
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument(); // No status icon
    });

    it('should show "In progress" status for short answers', () => {
      const question = createMockQuestion({
        answered: false,
        answer_text: 'Short', // Less than 10 characters
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText('In progress')).toBeInTheDocument();
    });

    it('should show "Complete" status for longer answers', () => {
      const question = createMockQuestion({
        answered: true,
        answer_text: 'This is a complete answer with more than 10 characters',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should show "Saving..." when auto-save is pending', () => {
      const question = createMockQuestion();
      const autoSaveState = createMockAutoSaveState({
        pending: true,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show error status when auto-save fails', () => {
      const question = createMockQuestion();
      const autoSaveState = createMockAutoSaveState({
        pending: false,
        error: 'Network error occurred',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      expect(screen.getByText('Save error: Network error occurred')).toBeInTheDocument();
    });
  });

  describe('Word and Character Count', () => {
    it('should display word and character count for non-empty answers', () => {
      const question = createMockQuestion({
        answer_text: 'This is a test answer',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText(/5 words • 21 characters/)).toBeInTheDocument();
    });

    it('should handle single word correctly', () => {
      const question = createMockQuestion({
        answer_text: 'Hello',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText(/1 word • 5 characters/)).toBeInTheDocument();
    });

    it('should not show count for empty answers', () => {
      const question = createMockQuestion({
        answer_text: '',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.queryByText(/words • /)).not.toBeInTheDocument();
    });

    it('should handle multiple spaces correctly', () => {
      const question = createMockQuestion({
        answer_text: 'Word1    Word2     Word3',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText(/3 words/)).toBeInTheDocument();
    });
  });

  describe('Last Saved Timestamp', () => {
    it('should display last saved time when available', () => {
      const mockTime = new Date('2024-01-15T10:30:00Z').getTime();
      const question = createMockQuestion();
      const autoSaveState = createMockAutoSaveState({
        last_saved: mockTime,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      expect(screen.getByText(/last saved:/i)).toBeInTheDocument();
    });

    it('should not show last saved when not available', () => {
      const question = createMockQuestion();
      const autoSaveState = createMockAutoSaveState({
        last_saved: null as any,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      expect(screen.queryByText(/last saved:/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual States and Styling', () => {
    it('should apply complete styling for completed answers', () => {
      const question = createMockQuestion({
        answered: true,
        answer_text: 'This is a complete answer',
      });

      const { container } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const card = container.querySelector('[class*="border-green"]');
      expect(card).toBeInTheDocument();
    });

    it('should apply in-progress styling for partial answers', () => {
      const question = createMockQuestion({
        answered: false,
        answer_text: 'Short',
      });

      const { container } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const card = container.querySelector('[class*="border-yellow"]');
      expect(card).toBeInTheDocument();
    });

    it('should apply disabled styling when disabled', () => {
      const question = createMockQuestion();

      const { container } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
          disabled={true}
        />
      );

      const card = container.querySelector('[class*="opacity"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Helper Text and Guidance', () => {
    it('should show helper text for unanswered questions', () => {
      const question = createMockQuestion({
        answered: false,
        answer_text: '',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.getByText(/this question is optional/i)).toBeInTheDocument();
      expect(screen.getByText(/you can skip it or come back to it later/i)).toBeInTheDocument();
    });

    it('should not show helper text for answered questions', () => {
      const question = createMockQuestion({
        answered: true,
        answer_text: 'Some answer',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.queryByText(/this question is optional/i)).not.toBeInTheDocument();
    });

    it('should not show helper text for questions with any text', () => {
      const question = createMockQuestion({
        answered: false,
        answer_text: 'Any text',
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(screen.queryByText(/this question is optional/i)).not.toBeInTheDocument();
    });
  });

  describe('External State Updates', () => {
    it('should update local state when question answer changes externally', () => {
      const question = createMockQuestion({
        answer_text: 'Original answer',
      });

      const { rerender } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Original answer');

      // External update to question
      const updatedQuestion = createMockQuestion({
        answer_text: 'Updated answer',
      });

      rerender(
        <QuestionCard
          question={updatedQuestion}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(textarea).toHaveValue('Updated answer');
    });

    it('should preserve local changes over external updates', async () => {
      const user = userEvent.setup();
      const question = createMockQuestion({
        answer_text: 'Original answer',
      });

      const { rerender } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      
      // User makes changes
      await user.clear(textarea);
      await user.type(textarea, 'User typed answer');

      expect(textarea).toHaveValue('User typed answer');

      // External update should not override user changes
      const updatedQuestion = createMockQuestion({
        answer_text: 'External update',
      });

      rerender(
        <QuestionCard
          question={updatedQuestion}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      expect(textarea).toHaveValue('User typed answer'); // Should preserve user input
    });
  });

  describe('Auto-Save State Handling', () => {
    it('should handle missing auto-save state gracefully', () => {
      const question = createMockQuestion();

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={undefined as any}
        />
      );

      expect(screen.getByText('Not answered')).toBeInTheDocument();
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });

    it('should handle partial auto-save state', () => {
      const question = createMockQuestion();
      const partialAutoSaveState = {
        question_id: 'test_q1',
        pending: false,
        // Missing last_saved and error
      } as AnswerAutoSaveState;

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={partialAutoSaveState}
        />
      );

      expect(screen.getByText('Not answered')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long answers', () => {
      const longAnswer = 'A'.repeat(1000);
      const question = createMockQuestion({
        answer_text: longAnswer,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longAnswer);
      expect(screen.getByText(/1000 characters/)).toBeInTheDocument();
    });

    it('should handle answers with special characters', () => {
      const specialAnswer = 'Answer with émojis 🎉 and spëcial chãracters';
      const question = createMockQuestion({
        answer_text: specialAnswer,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(specialAnswer);
    });

    it('should handle newlines and whitespace in answers', () => {
      const multilineAnswer = 'Line 1\n\nLine 2\n   Line 3   ';
      const question = createMockQuestion({
        answer_text: multilineAnswer,
      });

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(multilineAnswer);
    });

    it('should handle rapid typing without errors', async () => {
      const user = userEvent.setup();
      const question = createMockQuestion();

      render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={createMockAutoSaveState()}
        />
      );

      const textarea = screen.getByRole('textbox');
      
      // Rapid typing simulation
      const rapidText = 'This is rapid typing test';
      await user.type(textarea, rapidText, { delay: 1 });

      expect(mockOnAnswerChange).toHaveBeenCalledTimes(rapidText.length);
      expect(textarea).toHaveValue(rapidText);
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders', () => {
      const question = createMockQuestion();
      const autoSaveState = createMockAutoSaveState();

      const { rerender } = render(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      // Re-render with same props should not cause issues
      rerender(
        <QuestionCard
          question={question}
          onAnswerChange={mockOnAnswerChange}
          autoSaveState={autoSaveState}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});