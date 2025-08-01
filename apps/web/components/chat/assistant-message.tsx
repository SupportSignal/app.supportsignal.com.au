'use client';

import { ChatMessage } from '@/types/chat';
import { Badge } from '@starter/ui';
import { Card, CardContent } from '@starter/ui';
import { Bot, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AssistantMessageProps {
  message: ChatMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        {/* Message Bubble */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </CardContent>
        </Card>

        {/* Sources (Story 4.4 placeholder) */}
        {message.sources && message.sources.length > 0 && (
          <Card className="bg-background border-dashed">
            <CardContent className="p-3">
              <div className="text-xs font-medium mb-2 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Sources
              </div>
              <div className="space-y-1">
                {message.sources.map((source, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    <span className="font-medium">{source.title}</span>
                    {source.excerpt && (
                      <span className="block text-xs mt-1">
                        {source.excerpt}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            <span>Assistant</span>
          </div>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
          {message.status && message.status !== 'sent' && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <Badge variant={getStatusColor()} className="text-xs px-1 py-0">
                  {message.status}
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}