'use client';

import { Card, CardContent } from '@starter/ui';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        {/* Typing Bubble */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-muted-foreground">
                Assistant is typing...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}