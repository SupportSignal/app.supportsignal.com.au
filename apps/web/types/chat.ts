export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
  sources?: ChatSource[];
  metadata?: {
    model?: string;
    tokensUsed?: number;
    hasLLMAccess?: boolean;
    fallbackMessage?: string;
  };
}

export interface ChatSource {
  title: string;
  url?: string;
  excerpt?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

export interface ChatComponentProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  error?: string;
}