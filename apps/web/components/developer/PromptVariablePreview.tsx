/**
 * Story 11.0: Prompt Variable Preview Component
 *
 * Displays template variables and their values for prompt testing.
 * Supports both single prompt and batch execution contexts.
 *
 * Foundation component - will be enhanced in Story 11.2 for batch testing.
 */

'use client';

import { Badge } from '@starter/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Code2 } from 'lucide-react';

interface PromptVariable {
  name: string;
  value: string | null;
  source?: 'context' | 'user_input' | 'system';
}

interface PromptVariablePreviewProps {
  variables: PromptVariable[];
  mode?: 'single' | 'batch';
  className?: string;
}

export function PromptVariablePreview({
  variables,
  mode = 'single',
  className = '',
}: PromptVariablePreviewProps) {
  const hasValues = variables.some((v) => v.value !== null);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Template Variables
          </CardTitle>
          {mode === 'batch' && (
            <Badge variant="outline" className="text-xs">
              Batch Mode
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {variables.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No variables in template</p>
        ) : (
          <>
            {variables.map((variable) => (
              <div
                key={variable.name}
                className="flex items-start justify-between gap-2 p-2 bg-muted rounded text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono font-medium">{`{{${variable.name}}}`}</code>
                    {variable.source && (
                      <Badge variant="secondary" className="text-xs">
                        {variable.source}
                      </Badge>
                    )}
                  </div>
                  {variable.value ? (
                    <p className="text-muted-foreground truncate">{variable.value}</p>
                  ) : (
                    <p className="text-destructive italic">Missing value</p>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>
                {variables.filter((v) => v.value !== null).length} / {variables.length} populated
              </span>
              {!hasValues && <span className="text-destructive">⚠️ No values provided</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
