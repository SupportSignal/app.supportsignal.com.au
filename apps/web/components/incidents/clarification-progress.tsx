"use client";

import { ClarificationProgressProps, PHASE_NAMES } from "@/types/clarification";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export function ClarificationProgress({ 
  progress, 
  currentPhase, 
  className 
}: ClarificationProgressProps) {
  return (
    <div className={cn("bg-white border rounded-lg p-4", className)}>
      <h3 className="font-semibold text-gray-900 mb-4">Clarification Progress</h3>
      
      <div className="space-y-3">
        {progress.map((phaseProgress) => {
          const isCurrentPhase = phaseProgress.phase === currentPhase;
          const isComplete = phaseProgress.completion_percentage === 100;
          const hasProgress = phaseProgress.answered_questions > 0;
          
          return (
            <div 
              key={phaseProgress.phase}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isCurrentPhase && "bg-blue-50 border border-blue-200",
                !isCurrentPhase && isComplete && "bg-green-50 border border-green-200",
                !isCurrentPhase && hasProgress && !isComplete && "bg-yellow-50 border border-yellow-200",
                !isCurrentPhase && !hasProgress && "bg-gray-50 border border-gray-200"
              )}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : hasProgress ? (
                  <Clock className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              {/* Phase info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium truncate",
                    isCurrentPhase && "text-blue-900",
                    isComplete && !isCurrentPhase && "text-green-900",
                    hasProgress && !isComplete && !isCurrentPhase && "text-yellow-900",
                    !hasProgress && !isCurrentPhase && "text-gray-600"
                  )}>
                    {PHASE_NAMES[phaseProgress.phase]}
                    {isCurrentPhase && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </h4>
                  
                  <div className={cn(
                    "text-sm font-medium",
                    isComplete && "text-green-600",
                    hasProgress && !isComplete && "text-yellow-600",
                    !hasProgress && "text-gray-500"
                  )}>
                    {phaseProgress.answered_questions}/{phaseProgress.total_questions}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      isComplete && "bg-green-500",
                      hasProgress && !isComplete && "bg-yellow-500",
                      !hasProgress && "bg-gray-300"
                    )}
                    style={{ width: `${phaseProgress.completion_percentage}%` }}
                  />
                </div>
                
                {/* Status text */}
                <div className="mt-1 text-xs text-gray-600">
                  {isComplete 
                    ? "All questions answered"
                    : hasProgress 
                    ? `${phaseProgress.completion_percentage}% complete`
                    : "Not started"
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Overall summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>Overall Progress:</strong>{" "}
          {progress.reduce((total, p) => total + p.answered_questions, 0)}{" "}
          of {progress.reduce((total, p) => total + p.total_questions, 0)} questions answered
        </div>
      </div>
    </div>
  );
}