"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@starter/ui/collapsible';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface OriginalContentCollapseProps {
  originalContent: {
    before_event: string;
    during_event: string;
    end_event: string;
    post_event: string;
  };
  defaultCollapsed?: boolean;
}

export function OriginalContentCollapse({ 
  originalContent, 
  defaultCollapsed = true 
}: OriginalContentCollapseProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const formatPhaseTitle = (phase: string) => {
    return phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const hasContent = Object.values(originalContent).some(content => content.trim().length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Original Narrative Content
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
            <div className="space-y-4">
              {Object.entries(originalContent).map(([phase, content]) => {
                if (!content.trim()) return null;
                
                return (
                  <div key={phase} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {formatPhaseTitle(phase)}
                    </h4>
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <p className="text-sm whitespace-pre-wrap">{content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}