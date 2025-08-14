// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation, useAction } from 'convex/react';
import { ClarificationStep } from '@/components/incidents/ClarificationStep';
import { useAuth } from '@/components/auth/auth-provider';
import { api } from '@convex/_generated/api';

// Mock the hooks
jest.mock('convex/react');
jest.mock('@/components/auth/auth-provider');

// Mock the child components to isolate testing
jest.mock('@/components/incidents/QuestionsList', () => ({
  QuestionsList: ({ questions, onAnswerChange, autoSaveStates, disabled }: any) => (
    <div data-testid="questions-list">
      <div data-testid="questions-count">{questions.length}</div>
      {questions.map((q: any) => (
        <div key={q.question_id} data-testid={`question-${q.question_id}`}>
          <span>{q.question_text}</span>
          <input
            data-testid={`answer-${q.question_id}`}
            value={q.answer_text || ''}
            onChange={(e) => onAnswerChange(q.question_id, e.target.value)}
            disabled={disabled}
          />
          {autoSaveStates[q.question_id]?.pending && (
            <span data-testid={`saving-${q.question_id}`}>Saving...</span>
          )}
        </div>
      ))}
    </div>
  ),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseAction = useAction as jest.MockedFunction<typeof useAction>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ClarificationStep', () => {
  const mockSubmitAnswer = jest.fn();
  const mockGenerateQuestions = jest.fn();
  const mockGenerateMockAnswers = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnPrevious = jest.fn();

  const defaultProps = {
    incident_id: 'test-incident-id' as any,
    phase: 'before_event' as const,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    canProceed: true,
    isLoading: false,
  };

  const mockUser = {
    _id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'frontline_worker',
  };

  const mockIncident = {
    _id: 'test-incident-id',
    participant_name: 'Test Participant',
    narrative: {
      before_event: 'Test before event narrative',
      during_event: 'Test during event narrative',
      end_event: 'Test end event narrative',
      post_event: 'Test post event narrative',
    },
  };

  const mockQuestions = [
    {
      _id: 'q1',
      question_id: 'before_event_q1',
      question_text: 'What happened before the event?',
      question_order: 1,
      phase: 'before_event',
      answered: false,
      answer_text: '',
      updated_at: Date.now(),
    },
    {
      _id: 'q2',
      question_id: 'before_event_q2',
      question_text: 'Were there any warning signs?',
      question_order: 2,
      phase: 'before_event',
      answered: true,
      answer_text: 'Yes, there were some warning signs',
      updated_at: Date.now(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      sessionToken: 'test-session-token',
      user: mockUser,
      isAuthenticated: true,
    });

    mockUseMutation.mockImplementation((api) => {
      if (api === api.aiClarification?.submitClarificationAnswer) {
        return mockSubmitAnswer;
      }
      return jest.fn();
    });

    mockUseAction.mockImplementation((api) => {
      if (api === api.aiClarification?.generateClarificationQuestions) {
        return mockGenerateQuestions;
      }
      if (api === api.aiClarification?.generateMockAnswers) {
        return mockGenerateMockAnswers;
      }
      return jest.fn();
    });

    // Default to returning the incident and questions
    mockUseQuery.mockImplementation((api, args) => {
      if (api === api.incidents?.getDraftIncident) {
        return mockIncident;
      }
      if (api === api.aiClarification?.getClarificationQuestions) {
        return mockQuestions;
      }
      return null;
    });
  });

  describe('Authentication', () => {
    it('should show login prompt when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        sessionToken: null,
        user: null,
        isAuthenticated: false,
      });

      render(<ClarificationStep {...defaultProps} />);

      expect(screen.getByText(/please log in to continue/i)).toBeInTheDocument();
    });

    it('should require authentication for answer submission', async () => {
      mockUseAuth.mockReturnValue({
        sessionToken: 'invalid-token',
        user: mockUser,
        isAuthenticated: true,
      });

      mockSubmitAnswer.mockRejectedValue(new Error('Authentication required'));

      render(<ClarificationStep {...defaultProps} />);

      const answerInput = screen.getByTestId('answer-before_event_q1');
      await userEvent.type(answerInput, 'Test answer');

      // Wait for auto-save to trigger
      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalled();
      });

      // Should handle authentication error gracefully
      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Question Loading and Generation', () => {
    it('should display existing questions when loaded', () => {
      render(<ClarificationStep {...defaultProps} />);

      expect(screen.getByTestId('questions-list')).toBeInTheDocument();
      expect(screen.getByTestId('questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('question-before_event_q1')).toBeInTheDocument();
      expect(screen.getByTestId('question-before_event_q2')).toBeInTheDocument();
    });

    it('should show loading state when no questions exist', () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (api === api.incidents?.getDraftIncident) {
          return mockIncident;
        }
        if (api === api.aiClarification?.getClarificationQuestions) {
          return []; // No questions
        }
        return null;
      });

      render(<ClarificationStep {...defaultProps} />);

      expect(screen.getByText(/generating.*questions/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate manually/i })).toBeInTheDocument();
    });

    it('should handle manual question generation', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (api === api.incidents?.getDraftIncident) {
          return mockIncident;
        }
        if (api === api.aiClarification?.getClarificationQuestions) {
          return []; // No questions initially
        }
        return null;
      });

      mockGenerateQuestions.mockResolvedValue({
        success: true,
        questions: mockQuestions,
        cached: false,
      });

      render(<ClarificationStep {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate manually/i });
      await userEvent.click(generateButton);

      expect(mockGenerateQuestions).toHaveBeenCalledWith({
        sessionToken: 'test-session-token',
        incident_id: 'test-incident-id',
        phase: 'before_event',
        narrative_content: 'Test before event narrative',
      });
    });

    it('should handle question generation errors', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (api === api.incidents?.getDraftIncident) {
          return mockIncident;
        }
        if (api === api.aiClarification?.getClarificationQuestions) {
          return [];
        }
        return null;
      });

      mockGenerateQuestions.mockRejectedValue(new Error('No active prompt template found'));

      render(<ClarificationStep {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate manually/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate questions/i)).toBeInTheDocument();
        expect(screen.getByText(/no active prompt template found/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry question generation after error', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (api === api.incidents?.getDraftIncident) {
          return mockIncident;
        }
        if (api === api.aiClarification?.getClarificationQuestions) {
          return [];
        }
        return null;
      });

      mockGenerateQuestions
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          success: true,
          questions: mockQuestions,
          cached: false,
        });

      render(<ClarificationStep {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate manually/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate questions/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await userEvent.click(retryButton);

      expect(mockGenerateQuestions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Answer Auto-Save', () => {
    it('should auto-save answers with debouncing', async () => {
      jest.useFakeTimers();

      mockSubmitAnswer.mockResolvedValue({
        success: true,
        metrics: { character_count: 11, word_count: 2, is_complete: true },
      });

      render(<ClarificationStep {...defaultProps} />);

      const answerInput = screen.getByTestId('answer-before_event_q1');
      await userEvent.type(answerInput, 'Test answer');

      // Should not save immediately
      expect(mockSubmitAnswer).not.toHaveBeenCalled();

      // Fast-forward past auto-save delay
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalledWith({
          sessionToken: 'test-session-token',
          incident_id: 'test-incident-id',
          question_id: 'before_event_q1',
          answer_text: 'Test answer',
          phase: 'before_event',
        });
      });

      jest.useRealTimers();
    });

    it('should show saving state during auto-save', async () => {
      jest.useFakeTimers();

      // Mock a delayed response to simulate saving state
      mockSubmitAnswer.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          metrics: { character_count: 11, word_count: 2, is_complete: true },
        }), 1000))
      );

      render(<ClarificationStep {...defaultProps} />);

      const answerInput = screen.getByTestId('answer-before_event_q1');
      await userEvent.type(answerInput, 'Test answer');

      jest.advanceTimersByTime(2000);

      // Should show saving state
      await waitFor(() => {
        expect(screen.getByTestId('saving-before_event_q1')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle auto-save errors gracefully', async () => {
      jest.useFakeTimers();

      mockSubmitAnswer.mockRejectedValue(new Error('Network error'));

      render(<ClarificationStep {...defaultProps} />);

      const answerInput = screen.getByTestId('answer-before_event_q1');
      await userEvent.type(answerInput, 'Test answer');

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalled();
      });

      // Should display error state but not crash
      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Mock Answers Generation', () => {
    it('should allow system admins to generate mock answers', async () => {
      mockUseAuth.mockReturnValue({
        sessionToken: 'test-session-token',
        user: { ...mockUser, role: 'system_admin' },
        isAuthenticated: true,
      });

      mockGenerateMockAnswers.mockResolvedValue({
        success: true,
        answers_generated: 2,
      });

      render(<ClarificationStep {...defaultProps} />);

      const mockAnswersButton = screen.getByRole('button', { name: /mock answers/i });
      expect(mockAnswersButton).toBeInTheDocument();

      await userEvent.click(mockAnswersButton);

      expect(mockGenerateMockAnswers).toHaveBeenCalledWith({
        sessionToken: 'test-session-token',
        incident_id: 'test-incident-id',
        phase: 'before_event',
      });
    });

    it('should not show mock answers button to non-admin users', () => {
      render(<ClarificationStep {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /mock answers/i })).not.toBeInTheDocument();
    });

    it('should handle mock answers generation errors', async () => {
      mockUseAuth.mockReturnValue({
        sessionToken: 'test-session-token',
        user: { ...mockUser, role: 'system_admin' },
        isAuthenticated: true,
      });

      mockGenerateMockAnswers.mockRejectedValue(new Error('Mock generation failed'));

      render(<ClarificationStep {...defaultProps} />);

      const mockAnswersButton = screen.getByRole('button', { name: /mock answers/i });
      await userEvent.click(mockAnswersButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate mock answers/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should display progress correctly', () => {
      render(<ClarificationStep {...defaultProps} />);

      expect(screen.getByText(/progress: 1 of 2 answered/i)).toBeInTheDocument();
    });

    it('should calculate completion percentage', () => {
      render(<ClarificationStep {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should show completion indicators', () => {
      render(<ClarificationStep {...defaultProps} />);

      expect(screen.getByText(/1 questions answered/i)).toBeInTheDocument();
      expect(screen.getByText(/all questions are optional/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle navigation correctly', async () => {
      render(<ClarificationStep {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      const prevButton = screen.getByRole('button', { name: /previous step/i });

      await userEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();

      await userEvent.click(prevButton);
      expect(mockOnPrevious).toHaveBeenCalled();
    });

    it('should disable navigation when loading', () => {
      render(<ClarificationStep {...defaultProps} isLoading={true} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      const prevButton = screen.getByRole('button', { name: /previous step/i });

      expect(nextButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
    });

    it('should disable next when canProceed is false', () => {
      render(<ClarificationStep {...defaultProps} canProceed={false} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Phase-Specific Behavior', () => {
    it('should display correct phase information', () => {
      render(<ClarificationStep {...defaultProps} phase="during_event" />);

      expect(screen.getByText(/step 4.*during event.*clarification/i)).toBeInTheDocument();
    });

    it('should use correct narrative content for each phase', async () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (api === api.incidents?.getDraftIncident) {
          return mockIncident;
        }
        if (api === api.aiClarification?.getClarificationQuestions) {
          return [];
        }
        return null;
      });

      render(<ClarificationStep {...defaultProps} phase="during_event" />);

      const generateButton = screen.getByRole('button', { name: /generate manually/i });
      await userEvent.click(generateButton);

      expect(mockGenerateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'during_event',
          narrative_content: 'Test during event narrative',
        })
      );
    });
  });

  describe('State Management', () => {
    it('should reset state when incident ID changes', () => {
      const { rerender } = render(<ClarificationStep {...defaultProps} />);

      // Initially has questions
      expect(screen.getByTestId('questions-count')).toHaveTextContent('2');

      // Change incident ID
      rerender(<ClarificationStep {...defaultProps} incident_id="new-incident-id" as any />);

      // Should trigger state reset - questions would be reloaded
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          incident_id: 'new-incident-id',
        })
      );
    });

    it('should handle undefined query results gracefully', () => {
      mockUseQuery.mockReturnValue(undefined);

      render(<ClarificationStep {...defaultProps} />);

      // Should not crash and should show appropriate state
      expect(screen.getByText(/please log in to continue/i)).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseQuery.mockImplementation(() => {
        throw new Error('Component error');
      });

      expect(() => render(<ClarificationStep {...defaultProps} />)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});