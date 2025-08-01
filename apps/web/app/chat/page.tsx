'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useAction } from 'convex/react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/auth/auth-provider';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export default function ChatPage() {
  const { user, sessionToken, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<Id<'chat_sessions'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check user's LLM access
  const llmAccess = useQuery(
    api.auth.checkUserLLMAccess,
    user && sessionToken ? { userId: user._id as Id<'users'> } : 'skip'
  );
  
  // Convex actions
  const createSession = useAction(api.agentActions.createOrGetChatSession);
  const generateResponse = useAction(api.agentActions.generateResponse);

  // Initialize session when user is authenticated
  React.useEffect(() => {
    if (user && !sessionId) {
      createSession({
        title: 'Chat Session',
      }).then((session) => {
        setSessionId(session._id as Id<'chat_sessions'>);
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to create session:', err);
        setError('Failed to initialize chat session');
      });
    }
  }, [user, sessionId, createSession]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user || !sessionId) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call the actual Convex backend with LLM integration
      const response = await generateResponse({
        sessionId,
        message: content.trim(),
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: response.response,
        role: 'assistant',
        timestamp: Date.now(),
        status: 'sent',
        metadata: {
          model: response.model,
          tokensUsed: response.tokensUsed,
          hasLLMAccess: response.hasLLMAccess,
          fallbackMessage: response.fallbackMessage || undefined,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: Date.now(),
        status: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access the AI chat assistant.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-screen flex flex-col p-4">
      {/* Home Navigation */}
      <div className="text-left mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="mr-1">←</span>
          Back to Home
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about this project and get AI-powered answers.
        </p>
        {llmAccess && !llmAccess.hasLLMAccess && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              You&apos;re using the basic chat experience. For AI-powered responses with access to our knowledge base, 
              please contact <strong>david@ideasmen.com.au</strong> to request LLM access.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
    </div>
  );
}