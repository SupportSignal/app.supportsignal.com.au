// @ts-nocheck
"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuestionsList } from "./QuestionsList";
import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui/card";
import { Button } from "@starter/ui/button";
import { Alert, AlertDescription } from "@starter/ui/alert";
import { 
  ClarificationStepProps, 
  ClarificationQuestion, 
  AnswerAutoSaveState,
  PHASE_NAMES,
  PHASE_DESCRIPTIONS,
  ClarificationPhase
} from "@/types/clarification";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { AlertCircle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

// Auto-save delay (in milliseconds)
const AUTO_SAVE_DELAY = 2000;

export function ClarificationStep({ 
  incident_id, 
  phase, 
  onNext, 
  onPrevious,
  canProceed = true,
  isLoading = false 
}: ClarificationStepProps) {
  const { sessionToken, user } = useAuth();
  
  // Simple state management
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [autoSaveStates, setAutoSaveStates] = useState<Record<string, AnswerAutoSaveState>>({});
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMockAnswers, setIsGeneratingMockAnswers] = useState(false);
  const [mockAnswersError, setMockAnswersError] = useState<string | null>(null);

  // Convex hooks
  const existingQuestions = useQuery(api.aiClarification.getClarificationQuestions, 
    sessionToken ? {
      sessionToken,
      incident_id,
      phase,
    } : "skip"
  );
  
  const submitAnswer = useMutation(api.aiClarification.submitClarificationAnswer);
  const generateQuestions = useAction(api.aiClarification.generateClarificationQuestions);
  const generateMockAnswers = useAction(api.aiClarification.generateMockAnswers);
  
  // Get narrative content for question generation
  const incident = useQuery(api.incidents.getDraftIncident,
    sessionToken ? {
      sessionToken,
      incidentId: incident_id,
    } : "skip"
  );

  // Get narrative content for specific phase
  const getPhaseNarrative = (phase: ClarificationPhase, narrative: any) => {
    if (!narrative) return "";
    
    switch (phase) {
      case "before_event":
        return narrative.before_event || "";
      case "during_event":
        return narrative.during_event || "";
      case "end_event":
        return narrative.end_event || "";
      case "post_event":
        return narrative.post_event || "";
      default:
        return "";
    }
  };

  // Reset state when incident ID changes (new incident)
  useEffect(() => {
    console.log('🐛 ClarificationStep: incident_id changed, resetting state', { incident_id, phase });
    setQuestions([]);
    setAutoSaveStates({});
    setPendingAnswers({});
    setGenerationError(null);
    setIsGenerating(false);
  }, [incident_id, phase]);

  // Update questions when query results change
  useEffect(() => {
    console.log('🐛 ClarificationStep: existingQuestions changed', { 
      existingQuestions: existingQuestions?.length || 0, 
      incident_id, 
      phase 
    });
    
    if (existingQuestions) {
      setQuestions(existingQuestions);
      
      // Initialize auto-save states for new questions
      const initialStates: Record<string, AnswerAutoSaveState> = {};
      existingQuestions.forEach((question: any) => {
        initialStates[question.question_id] = {
          question_id: question.question_id,
          pending: false,
          last_saved: question.updated_at,
          error: null,
        };
      });
      setAutoSaveStates(initialStates);
    } else {
      // No existing questions - ensure state is clean
      setQuestions([]);
      setAutoSaveStates({});
    }
  }, [existingQuestions]);

  // Manual question generation (user-triggered only)
  const handleGenerateQuestions = useCallback(async () => {
    if (!sessionToken || !incident?.narrative) {
      setGenerationError("Missing session or narrative data");
      return;
    }

    const phaseNarrative = getPhaseNarrative(phase, incident.narrative);
    if (!phaseNarrative?.trim()) {
      setGenerationError("No narrative content available for this phase");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateQuestions({
        sessionToken,
        incident_id,
        phase,
        narrative_content: phaseNarrative,
      });

      // Questions will automatically appear via useQuery reactivity
      // No need to manually set them here
      console.log("Questions generated successfully:", result);
      
    } catch (error) {
      console.error("Failed to generate clarification questions:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  }, [sessionToken, incident?.narrative, generateQuestions, incident_id, phase]);

  // Auto-save answer with debouncing
  const saveAnswer = useCallback(async (questionId: string, answerText: string) => {
    if (!sessionToken) return;

    setAutoSaveStates(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        pending: true,
        error: null,
      },
    }));

    try {
      await submitAnswer({
        sessionToken,
        incident_id,
        question_id: questionId,
        answer_text: answerText,
        phase,
      });

      setAutoSaveStates(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          pending: false,
          last_saved: Date.now(),
          error: null,
        },
      }));

      // Update local question state
      setQuestions(prev => prev.map(q => 
        q.question_id === questionId 
          ? { ...q, answer_text: answerText, answered: answerText.length > 0 }
          : q
      ));

    } catch (error) {
      console.error("Failed to save answer:", error);
      setAutoSaveStates(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          pending: false,
          error: error instanceof Error ? error.message : "Save failed",
        },
      }));
    }
  }, [sessionToken, incident_id, phase, submitAnswer]);

  // Handle answer changes with debouncing
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    // Update pending answers immediately for UI responsiveness
    setPendingAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));

    // Clear existing timeout for this question
    if (window.autoSaveTimeouts && window.autoSaveTimeouts[questionId]) {
      clearTimeout(window.autoSaveTimeouts[questionId]);
    }

    // Set up new timeout for auto-save
    if (!window.autoSaveTimeouts) {
      window.autoSaveTimeouts = {};
    }

    window.autoSaveTimeouts[questionId] = setTimeout(() => {
      saveAnswer(questionId, answer);
      setPendingAnswers(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }, AUTO_SAVE_DELAY);
  }, [saveAnswer]);

  // Handle mock answers generation (sample data feature)
  const handleGenerateMockAnswers = useCallback(async () => {
    if (!sessionToken || !user) {
      setMockAnswersError("Authentication required");
      return;
    }

    // Check if user has sample_data permission (based on role)
    const hasSampleDataPermission = user.role === 'system_admin';
    if (!hasSampleDataPermission) {
      setMockAnswersError("Sample data permission required to generate mock answers");
      return;
    }

    if (questions.length === 0) {
      setMockAnswersError("No questions available to generate mock answers for");
      return;
    }

    setIsGeneratingMockAnswers(true);
    setMockAnswersError(null);

    try {
      const result = await generateMockAnswers({
        sessionToken,
        incident_id,
        phase,
      });

      console.log("✅ Mock answers generated successfully:", result);

      // Questions and answers will automatically update via useQuery reactivity
      // No need to manually set them here

    } catch (error) {
      console.error("❌ Failed to generate mock answers:", error);
      setMockAnswersError(error instanceof Error ? error.message : "Failed to generate mock answers");
    } finally {
      setIsGeneratingMockAnswers(false);
    }
  }, [sessionToken, user, questions.length, generateMockAnswers, incident_id, phase]);

  // Check if user has sample data permissions (based on role)
  const hasSampleDataPermission = user?.role === 'system_admin';

  // Calculate progress stats
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => 
    q.answered || (pendingAnswers[q.question_id] && pendingAnswers[q.question_id].length > 0)
  ).length;

  if (!sessionToken) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to continue with the clarification questions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center justify-between">
            <span>Step {getStepNumber(phase)}: {PHASE_NAMES[phase]} Clarification</span>
            {/* Sample Data Button - Only show to users with sample_data permission */}
            {hasSampleDataPermission && totalQuestions > 0 && (
              <Button 
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
                onClick={handleGenerateMockAnswers}
                disabled={isGeneratingMockAnswers || isLoading}
              >
                {isGeneratingMockAnswers ? "Generating..." : "Mock Answers"}
              </Button>
            )}
          </CardTitle>
          <p className="text-gray-600 leading-relaxed">
            {PHASE_DESCRIPTIONS[phase]}
          </p>
          
          {totalQuestions > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Progress: {answeredQuestions} of {totalQuestions} answered
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Error states */}
      {generationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p>Failed to generate questions: {generationError}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  You can continue without questions or try generating them again.
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setGenerationError(null);
                    handleGenerateQuestions();
                  }}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                  Try Again
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Mock answers error state */}
      {mockAnswersError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to generate mock answers: {mockAnswersError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* No questions state - proactive loading or manual generation */}
      {!generationError && totalQuestions === 0 && !isGenerating && existingQuestions !== undefined && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="font-medium">Generating {PHASE_NAMES[phase]} questions...</p>
              <p className="text-sm">Questions are being created in the background and will appear here automatically.</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse animation-delay-100" />
                <div className="h-2 w-2 bg-blue-300 rounded-full animate-pulse animation-delay-200" />
              </div>
            </div>
            
            {/* Fallback manual generation - only show after some time or on error */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">Taking longer than expected?</p>
              <Button 
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !incident?.narrative}
                variant="outline"
                size="sm"
                className="min-w-[140px]"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                Generate Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {(isGenerating || isLoading) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 mb-2">
              {isGenerating ? "Generating clarification questions..." : "Loading..."}
            </p>
            <p className="text-sm text-gray-500">
              This usually takes a few seconds
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      {totalQuestions > 0 && !isLoading && (
        <>
          <QuestionsList
            questions={questions.map(q => ({
              ...q,
              answer_text: pendingAnswers[q.question_id] || q.answer_text || "",
            }))}
            onAnswerChange={handleAnswerChange}
            autoSaveStates={autoSaveStates}
            disabled={isLoading || isGeneratingMockAnswers}
          />

        </>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              Previous Step
            </Button>
            
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {answeredQuestions > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{answeredQuestions} questions answered</span>
                </div>
              )}
              <span className="text-gray-400">•</span>
              <span>All questions are optional</span>
            </div>
            
            <Button
              onClick={onNext}
              disabled={!canProceed || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Next Step
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to get step number for phase
function getStepNumber(phase: ClarificationPhase): number {
  switch (phase) {
    case "before_event": return 3;
    case "during_event": return 4;
    case "end_event": return 5;
    case "post_event": return 6;
    default: return 3;
  }
}

// Extend window type for auto-save timeouts
declare global {
  interface Window {
    autoSaveTimeouts?: Record<string, NodeJS.Timeout>;
  }
}