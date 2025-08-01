'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@starter/ui';
import { Button } from '@starter/ui';
import { Input } from '@starter/ui';
import { ChatMessage } from '@/types/chat';
import { MessageList } from './message-list';
import { Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  error,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submitMessage = () => {
    if (!input.trim() || isLoading) return;

    onSendMessage(input);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 min-h-0">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this project..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
