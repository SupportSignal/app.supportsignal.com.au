"use client";

import { QuestionCard } from "./QuestionCard";
import { QuestionsListProps } from "@/types/clarification";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@starter/ui/alert";

export function QuestionsList({ 
  questions, 
  onAnswerChange, 
  autoSaveStates,
  disabled = false,
  className 
}: QuestionsListProps) {
  if (questions.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Generating clarification questions...</p>
          <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.answered || (q.answer_text && q.answer_text.length > 0)).length;
  const completedQuestions = questions.filter(q => q.answer_text && q.answer_text.length > 10).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">
                Progress: {answeredQuestions} of {totalQuestions} questions answered
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {completedQuestions} complete • {answeredQuestions - completedQuestions} in progress • {totalQuestions - answeredQuestions} not started
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round((answeredQuestions / totalQuestions) * 100)}%
            </div>
            <div className="text-xs text-blue-700">answered</div>
          </div>
        </div>
      </div>

      {/* Questions reminder */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Remember:</strong> All questions are optional. Answer what you can and skip questions if you don&apos;t have information or feel uncomfortable sharing certain details.
        </AlertDescription>
      </Alert>

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((question) => (
          <QuestionCard
            key={question._id}
            question={question}
            onAnswerChange={onAnswerChange}
            autoSaveState={autoSaveStates[question.question_id]}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Completion summary */}
      {answeredQuestions > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">
                {answeredQuestions === totalQuestions 
                  ? "All questions answered!" 
                  : `${answeredQuestions} questions answered so far`
                }
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {answeredQuestions === totalQuestions
                  ? "You can proceed to the next step or continue reviewing your answers."
                  : "You can proceed to the next step anytime, or continue answering more questions."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}