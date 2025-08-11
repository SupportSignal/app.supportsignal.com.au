import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  ClarificationQuestion, 
  ClarificationPhase, 
  QuestionGenerationResult,
  AnswerSubmissionResult
} from "@/types/clarification";

/**
 * Client-side AI clarification service wrapper
 * Provides convenient hooks and methods for AI-powered clarification questions
 */

// Hook to generate clarification questions
export function useGenerateClarificationQuestions() {
  const generateQuestions = useAction(api.aiClarification.generateClarificationQuestions);

  return async (
    sessionToken: string,
    incident_id: Id<"incidents">,
    phase: ClarificationPhase,
    narrative_content: string
  ): Promise<QuestionGenerationResult> => {
    try {
      const result = await generateQuestions({
        sessionToken,
        incident_id,
        phase,
        narrative_content,
      });

      return result as QuestionGenerationResult;
    } catch (error) {
      console.error("Failed to generate clarification questions:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to generate clarification questions"
      );
    }
  };
}

// Hook to get clarification questions
export function useClarificationQuestions(
  sessionToken: string | null,
  incident_id: Id<"incidents">,
  phase?: ClarificationPhase
) {
  return useQuery(
    api.aiClarification.getClarificationQuestions,
    sessionToken
      ? {
          sessionToken,
          incident_id,
          phase,
        }
      : "skip"
  );
}

// Hook to submit clarification answers
export function useSubmitClarificationAnswer() {
  const submitAnswer = useMutation(api.aiClarification.submitClarificationAnswer);

  return async (
    sessionToken: string,
    incident_id: Id<"incidents">,
    question_id: string,
    answer_text: string,
    phase: ClarificationPhase
  ): Promise<AnswerSubmissionResult> => {
    try {
      const result = await submitAnswer({
        sessionToken,
        incident_id,
        question_id,
        answer_text,
        phase,
      });

      return result as AnswerSubmissionResult;
    } catch (error) {
      console.error("Failed to submit clarification answer:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to save answer"
      );
    }
  };
}

// Hook to get clarification answers
export function useClarificationAnswers(
  sessionToken: string | null,
  incident_id: Id<"incidents">,
  phase?: ClarificationPhase
) {
  return useQuery(
    api.aiClarification.getClarificationAnswers,
    sessionToken
      ? {
          sessionToken,
          incident_id,
          phase,
        }
      : "skip"
  );
}

// Utility function to calculate completion progress
export function calculatePhaseProgress(questions: ClarificationQuestion[]) {
  if (!questions || questions.length === 0) {
    return {
      total_questions: 0,
      answered_questions: 0,
      completion_percentage: 0,
      has_unanswered: false,
    };
  }

  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(
    q => q.answered || (q.answer_text && q.answer_text.length > 0)
  ).length;
  
  return {
    total_questions: totalQuestions,
    answered_questions: answeredQuestions,
    completion_percentage: Math.round((answeredQuestions / totalQuestions) * 100),
    has_unanswered: answeredQuestions < totalQuestions,
  };
}

// Utility function to group questions by phase
export function groupQuestionsByPhase(questions: ClarificationQuestion[]) {
  const grouped: Record<ClarificationPhase, ClarificationQuestion[]> = {
    before_event: [],
    during_event: [],
    end_event: [],
    post_event: [],
  };

  questions.forEach(question => {
    if (grouped[question.phase]) {
      grouped[question.phase].push(question);
    }
  });

  // Sort questions within each phase by order
  Object.keys(grouped).forEach(phase => {
    grouped[phase as ClarificationPhase].sort((a, b) => a.question_order - b.question_order);
  });

  return grouped;
}

// Utility function to validate question answers
export function validateAnswer(answer: string): {
  isValid: boolean;
  isComplete: boolean;
  characterCount: number;
  wordCount: number;
  errors: string[];
} {
  const trimmedAnswer = answer.trim();
  const characterCount = trimmedAnswer.length;
  const wordCount = trimmedAnswer.split(/\s+/).filter(word => word.length > 0).length;
  const errors: string[] = [];

  // Basic validation
  const isValid = characterCount >= 0; // All answers are valid, even empty ones
  const isComplete = characterCount >= 10; // Consider complete if at least 10 characters

  // No errors for optional questions
  return {
    isValid,
    isComplete,
    characterCount,
    wordCount,
    errors,
  };
}