"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@starter/ui/collapsible';
import { ChevronDown, ChevronRight, HelpCircle, Badge } from 'lucide-react';

interface QADisplayCollapseProps {
  clarificationResponses: Array<{
    question_text: string;
    answer_text: string;
    phase: string;
  }>;
  defaultCollapsed?: boolean;
}

export function QADisplayCollapse({ 
  clarificationResponses, 
  defaultCollapsed = true 
}: QADisplayCollapseProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  // Filter to only show answered questions
  const answeredQuestions = clarificationResponses.filter(
    qa => qa.answer_text.trim().length > 0
  );

  const formatPhaseTitle = (phase: string) => {
    return phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Group questions by phase
  const questionsByPhase = answeredQuestions.reduce((acc, qa) => {
    if (!acc[qa.phase]) {
      acc[qa.phase] = [];
    }
    acc[qa.phase].push(qa);
    return acc;
  }, {} as Record<string, typeof answeredQuestions>);

  if (answeredQuestions.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Clarification Questions & Answers
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {answeredQuestions.length} answered
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {Object.entries(questionsByPhase).map(([phase, questions]) => (
                <div key={phase} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {formatPhaseTitle(phase)}
                    </h4>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {questions.map((qa, index) => (
                      <div key={index} className="bg-muted/30 p-4 rounded-md border space-y-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm flex items-start gap-2">
                            <span className="text-primary">Q:</span>
                            <span>{qa.question_text}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm flex items-start gap-2">
                            <span className="text-green-600 font-medium">A:</span>
                            <span className="whitespace-pre-wrap">{qa.answer_text}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}