// @ts-nocheck
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionsList } from '@/components/incidents/QuestionsList';
import { ClarificationQuestion, AnswerAutoSaveState } from '@/types/clarification';

// Mock the QuestionCard component to isolate testing
jest.mock('@/components/incidents/QuestionCard', () => ({
  QuestionCard: ({ question, onAnswerChange, autoSaveState, disabled }: any) => (
    <div data-testid={`question-card-${question.question_id}`}>
      <span data-testid={`question-text-${question.question_id}`}>{question.question_text}</span>
      <input
        data-testid={`question-input-${question.question_id}`}
        value={question.answer_text || ''}
        onChange={(e) => onAnswerChange(question.question_id, e.target.value)}
        disabled={disabled}
      />
      {autoSaveState?.pending && (
        <span data-testid={`saving-${question.question_id}`}>Saving...</span>
      )}
      {autoSaveState?.error && (
        <span data-testid={`error-${question.question_id}`}>{autoSaveState.error}</span>
      )}
      <span data-testid={`answered-${question.question_id}`}>
        {question.answered ? 'answered' : 'not-answered'}
      </span>
    </div>
  ),
}));

describe('QuestionsList', () => {
  const mockOnAnswerChange = jest.fn();

  const createMockQuestion = (overrides: Partial<ClarificationQuestion> = {}): ClarificationQuestion => ({
    _id: 'mock-id',
    question_id: 'test_q1',
    question_text: 'What happened?',
    question_order: 1,
    phase: 'before_event',
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

  describe('Empty State', () => {
    it('should show loading state when no questions exist', () => {
      render(
        <QuestionsList
          questions={[]}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByText(/generating clarification questions/i)).toBeInTheDocument();
      expect(screen.getByText(/this usually takes a few seconds/i)).toBeInTheDocument();
    });
  });

  describe('Questions Display', () => {
    it('should render questions correctly', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          question_text: 'What happened before?',
          question_order: 1,
        }),
        createMockQuestion({
          question_id: 'q2',
          question_text: 'What happened during?',
          question_order: 2,
        }),
      ];

      const autoSaveStates = {
        q1: createMockAutoSaveState({ question_id: 'q1' }),
        q2: createMockAutoSaveState({ question_id: 'q2' }),
      };

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={autoSaveStates}
        />
      );

      expect(screen.getByTestId('question-card-q1')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-q2')).toBeInTheDocument();
      expect(screen.getByTestId('question-text-q1')).toHaveTextContent('What happened before?');
      expect(screen.getByTestId('question-text-q2')).toHaveTextContent('What happened during?');
    });

    it('should pass correct props to QuestionCard components', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answer_text: 'Some answer',
          answered: true,
        }),
      ];

      const autoSaveStates = {
        q1: createMockAutoSaveState({
          question_id: 'q1',
          pending: true,
        }),
      };

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={autoSaveStates}
          disabled={true}
        />
      );

      const input = screen.getByTestId('question-input-q1');
      expect(input).toHaveValue('Some answer');
      expect(input).toBeDisabled();
      expect(screen.getByTestId('saving-q1')).toBeInTheDocument();
      expect(screen.getByTestId('answered-q1')).toHaveTextContent('answered');
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate and display progress correctly', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answered: true,
          answer_text: 'Answer 1',
        }),
        createMockQuestion({
          question_id: 'q2',
          answered: false,
          answer_text: 'Partial answer', // Has text but not marked as answered
        }),
        createMockQuestion({
          question_id: 'q3',
          answered: false,
          answer_text: '',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      // Should show progress based on questions with answers (either answered=true or has answer_text)
      expect(screen.getByText(/progress: 2 of 3 questions answered/i)).toBeInTheDocument();
      expect(screen.getByText(/67%/)).toBeInTheDocument(); // 2/3 = 67% rounded
    });

    it('should distinguish between completed and in-progress answers', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answer_text: 'This is a complete answer with more than 10 characters',
          answered: true,
        }),
        createMockQuestion({
          question_id: 'q2',
          answer_text: 'Short', // Less than 10 characters - in progress
          answered: false,
        }),
        createMockQuestion({
          question_id: 'q3',
          answer_text: '',
          answered: false,
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      // Should show: 1 complete, 1 in progress, 1 not started
      expect(screen.getByText(/1 complete • 1 in progress • 1 not started/i)).toBeInTheDocument();
    });

    it('should show 100% completion when all questions are answered', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answered: true,
          answer_text: 'Answer 1',
        }),
        createMockQuestion({
          question_id: 'q2',
          answered: true,
          answer_text: 'Answer 2',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
      expect(screen.getByText(/all questions answered!/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call onAnswerChange when input value changes', async () => {
      const user = userEvent.setup();
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answer_text: '',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      const input = screen.getByTestId('question-input-q1');
      await user.type(input, 'New answer');

      expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', expect.stringContaining('New answer'));
    });

    it('should disable inputs when disabled prop is true', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
          disabled={true}
        />
      );

      const input = screen.getByTestId('question-input-q1');
      expect(input).toBeDisabled();
    });
  });

  describe('Auto-Save States', () => {
    it('should display saving indicators correctly', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
        }),
      ];

      const autoSaveStates = {
        q1: createMockAutoSaveState({
          question_id: 'q1',
          pending: true,
        }),
      };

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={autoSaveStates}
        />
      );

      expect(screen.getByTestId('saving-q1')).toBeInTheDocument();
    });

    it('should display error indicators correctly', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
        }),
      ];

      const autoSaveStates = {
        q1: createMockAutoSaveState({
          question_id: 'q1',
          pending: false,
          error: 'Network error',
        }),
      };

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={autoSaveStates}
        />
      );

      expect(screen.getByTestId('error-q1')).toHaveTextContent('Network error');
    });
  });

  describe('Accessibility and User Guidance', () => {
    it('should show optional questions reminder', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByText(/all questions are optional/i)).toBeInTheDocument();
      expect(screen.getByText(/answer what you can and skip questions/i)).toBeInTheDocument();
    });

    it('should show appropriate completion message', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answered: true,
          answer_text: 'Complete answer',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByText(/all questions answered!/i)).toBeInTheDocument();
      expect(screen.getByText(/you can proceed to the next step/i)).toBeInTheDocument();
    });

    it('should show partial completion message', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answered: true,
          answer_text: 'Answer 1',
        }),
        createMockQuestion({
          question_id: 'q2',
          answered: false,
          answer_text: '',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByText(/1 questions answered so far/i)).toBeInTheDocument();
      expect(screen.getByText(/you can proceed to the next step anytime/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle questions without auto-save states', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}} // Empty auto-save states
        />
      );

      expect(screen.getByTestId('question-card-q1')).toBeInTheDocument();
      expect(screen.queryByTestId('saving-q1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-q1')).not.toBeInTheDocument();
    });

    it('should handle questions with null/undefined answer_text', () => {
      const questions = [
        createMockQuestion({
          question_id: 'q1',
          answer_text: null as any,
        }),
        createMockQuestion({
          question_id: 'q2',
          answer_text: undefined as any,
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      expect(screen.getByTestId('question-input-q1')).toHaveValue('');
      expect(screen.getByTestId('question-input-q2')).toHaveValue('');
    });

    it('should handle custom className prop', () => {
      const questions = [createMockQuestion()];

      const { container } = render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of questions efficiently', () => {
      const questions = Array.from({ length: 20 }, (_, index) =>
        createMockQuestion({
          question_id: `q${index + 1}`,
          question_text: `Question ${index + 1}`,
          question_order: index + 1,
        })
      );

      const autoSaveStates = questions.reduce((acc, q) => {
        acc[q.question_id] = createMockAutoSaveState({
          question_id: q.question_id,
        });
        return acc;
      }, {} as Record<string, AnswerAutoSaveState>);

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={autoSaveStates}
        />
      );

      // Should render all questions
      expect(screen.getAllByTestId(/^question-card-/).length).toBe(20);
      expect(screen.getByText(/progress: 0 of 20 questions answered/i)).toBeInTheDocument();
    });

    it('should handle rapid state updates gracefully', async () => {
      const user = userEvent.setup();
      const questions = [
        createMockQuestion({
          question_id: 'q1',
        }),
      ];

      render(
        <QuestionsList
          questions={questions}
          onAnswerChange={mockOnAnswerChange}
          autoSaveStates={{}}
        />
      );

      const input = screen.getByTestId('question-input-q1');

      // Rapid typing simulation
      await user.type(input, 'Fast typing test');

      expect(mockOnAnswerChange).toHaveBeenCalledTimes('Fast typing test'.length);
    });
  });
});