'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TestLLMPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      // Simulate the fallback response that users without LLM access would see
      const fallbackResponses = [
        "Thanks for your message! I'm a basic chat assistant. For AI-powered responses with access to our knowledge base, please contact david@ideasmen.com.au to request LLM access.",
        "I received your message. Currently, you're using the basic chat experience. To unlock AI features and knowledge base integration, reach out to david@ideasmen.com.au for LLM access.",
        "Hello! I'm operating in basic mode. For advanced AI responses and document search capabilities, please contact david@ideasmen.com.au to request full access.",
        "Your message has been received. I'm providing basic responses right now. To access our full AI capabilities, please contact david@ideasmen.com.au for LLM permissions.",
      ];

      // Simple hash-based selection for consistent responses
      const hash = message.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const selectedResponse = fallbackResponses[Math.abs(hash) % fallbackResponses.length];

      // Simulate delay
      await new Promise<void>(resolve => {
        setTimeout(resolve, 1000);
      });
      setResponse(selectedResponse);
    } catch (error) {
      setResponse('Error: Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold">LLM Access Test</h1>
        <p className="text-muted-foreground">
          Testing the fallback messages for users without LLM access.
        </p>
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This simulates the experience for users without LLM access. 
            The actual system would show this message and provide the fallback responses below.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 p-4 border rounded-lg mb-4 overflow-y-auto bg-white">
          {response && (
            <div className="mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <strong>You:</strong> {message}
              </div>
              <div className="bg-gray-100 p-3 rounded-lg mt-2">
                <strong>Assistant:</strong> {response}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to test fallback response..."
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}