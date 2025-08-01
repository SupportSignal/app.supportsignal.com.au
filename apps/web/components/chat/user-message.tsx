'use client';

import { ChatMessage } from '@/types/chat';
import { Badge } from '@starter/ui';
import { User, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        {/* Message Bubble */}
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>You</span>
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