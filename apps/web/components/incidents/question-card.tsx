"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@starter/ui/card";
import { Textarea } from "@starter/ui/textarea";
import { Label } from "@starter/ui/label";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { QuestionCardProps, AnswerAutoSaveState } from "@/types/clarification";
import { cn } from "@/lib/utils";

export function QuestionCard({ 
  question, 
  onAnswerChange, 
  autoSaveState,
  disabled = false 
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState(question.answer_text || "");
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when question answer changes externally
  useEffect(() => {
    if (question.answer_text !== localAnswer && !hasChanges) {
      setLocalAnswer(question.answer_text || "");
    }
  }, [question.answer_text, localAnswer, hasChanges]);

  const handleAnswerChange = (value: string) => {
    setLocalAnswer(value);
    setHasChanges(true);
    onAnswerChange(question.question_id, value);
  };

  const isAnswered = question.answered || localAnswer.length > 0;
  const isComplete = localAnswer.length > 10; // Basic completeness check
  const wordCount = localAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;

  const getStatusIcon = () => {
    if (autoSaveState?.pending) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (autoSaveState?.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (isComplete) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    
    if (isAnswered) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return null;
  };

  const getStatusText = () => {
    if (autoSaveState?.pending) return "Saving...";
    if (autoSaveState?.error) return `Save error: ${autoSaveState.error}`;
    if (isComplete) return "Complete";
    if (isAnswered) return "In progress";
    return "Not answered";
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isComplete && "border-green-200 bg-green-50/50",
      isAnswered && !isComplete && "border-yellow-200 bg-yellow-50/50",
      !isAnswered && "border-gray-200",
      disabled && "opacity-60"
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Question header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label 
                htmlFor={`question-${question.question_id}`}
                className="text-base font-medium text-gray-900 leading-relaxed"
              >
                <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center mr-3 flex-shrink-0">
                  {question.question_order}
                </span>
                {question.question_text}
              </Label>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className={cn(
                "text-xs font-medium",
                isComplete && "text-green-600",
                isAnswered && !isComplete && "text-yellow-600",
                !isAnswered && "text-gray-500",
                autoSaveState?.error && "text-red-600",
                autoSaveState?.pending && "text-blue-600"
              )}>
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Answer textarea */}
          <div className="space-y-2">
            <Textarea
              id={`question-${question.question_id}`}
              value={localAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here... (optional - you can skip any question)"
              className={cn(
                "min-h-[120px] resize-none transition-colors",
                isComplete && "border-green-300 focus:border-green-400",
                isAnswered && !isComplete && "border-yellow-300 focus:border-yellow-400"
              )}
              disabled={disabled}
            />
            
            {/* Answer metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                {wordCount > 0 && (
                  <span>
                    {wordCount} word{wordCount !== 1 ? 's' : ''} • {localAnswer.length} character{localAnswer.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {autoSaveState?.last_saved && (
                <div className="text-gray-400">
                  Last saved: {new Date(autoSaveState.last_saved).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Helper text */}
          {!isAnswered && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              💡 This question is optional. You can skip it or come back to it later. 
              Answer with as much detail as feels comfortable.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}