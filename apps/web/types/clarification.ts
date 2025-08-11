import { Id } from "../../convex/_generated/dataModel";

// Clarification question phase types
export type ClarificationPhase = 
  | "before_event"
  | "during_event"
  | "end_event"
  | "post_event";

// Phase display names for UI
export const PHASE_NAMES: Record<ClarificationPhase, string> = {
  before_event: "Before Event",
  during_event: "During Event", 
  end_event: "End of Event",
  post_event: "Post-Event Support",
};

// Phase descriptions for context
export const PHASE_DESCRIPTIONS: Record<ClarificationPhase, string> = {
  before_event: "Clarify the circumstances and conditions leading up to the incident",
  during_event: "Add details about what happened during the incident itself",
  end_event: "Provide more information about how the incident concluded",
  post_event: "Describe the support and care provided after the incident",
};

// Clarification question interface
export interface ClarificationQuestion {
  _id: Id<"clarification_questions">;
  incident_id: Id<"incidents">;
  question_id: string;
  phase: ClarificationPhase;
  question_text: string;
  question_order: number;
  generated_at: number;
  ai_model?: string;
  prompt_version?: string;
  is_active: boolean;
  answered: boolean;
  answer_text: string;
  answer_id: Id<"clarification_answers"> | null;
  updated_at: number | null;
}

// Clarification answer interface
export interface ClarificationAnswer {
  _id: Id<"clarification_answers">;
  incident_id: Id<"incidents">;
  question_id: string;
  answer_text: string;
  phase: ClarificationPhase;
  answered_at: number;
  answered_by?: Id<"users">;
  updated_at: number;
  is_complete: boolean;
  character_count: number;
  word_count: number;
}

// Question generation result
export interface QuestionGenerationResult {
  questions: ClarificationQuestion[];
  cached: boolean;
  correlation_id: string | null;
}

// Answer submission result
export interface AnswerSubmissionResult {
  success: boolean;
  answer_id: Id<"clarification_answers">;
  metrics: {
    character_count: number;
    word_count: number;
    is_complete: boolean;
  };
}

// Progress tracking for clarification phases
export interface ClarificationProgress {
  phase: ClarificationPhase;
  total_questions: number;
  answered_questions: number;
  completion_percentage: number;
  has_unanswered: boolean;
}

// Auto-save state for answers
export interface AnswerAutoSaveState {
  question_id: string;
  pending: boolean;
  last_saved: number | null;
  error: string | null;
}

// Clarification step props interface
export interface ClarificationStepProps {
  incident_id: Id<"incidents">;
  phase: ClarificationPhase;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  isLoading?: boolean;
}

// Question card props interface
export interface QuestionCardProps {
  question: ClarificationQuestion;
  onAnswerChange: (questionId: string, answer: string) => void;
  autoSaveState?: AnswerAutoSaveState;
  disabled?: boolean;
}

// Questions list props interface
export interface QuestionsListProps {
  questions: ClarificationQuestion[];
  onAnswerChange: (questionId: string, answer: string) => void;
  autoSaveStates: Record<string, AnswerAutoSaveState>;
  disabled?: boolean;
  className?: string;
}

// Progress indicator props interface  
export interface ClarificationProgressProps {
  progress: ClarificationProgress[];
  currentPhase: ClarificationPhase;
  className?: string;
}