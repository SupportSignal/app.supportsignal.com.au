'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="text-6xl">💬</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Start a conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about this project! I can help with architecture,
              code explanations, documentation, and more.
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Try asking:</p>
            <ul className="space-y-1">
              <li>• &ldquo;How does the admin monitoring system work?&rdquo;</li>
              <li>• &ldquo;What UI components are available?&rdquo;</li>
              <li>• &ldquo;Explain the Convex backend architecture&rdquo;</li>
            </ul>
          </div>
        </div>
      )}

      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} />
          )}
        </div>
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}