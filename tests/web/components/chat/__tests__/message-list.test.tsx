import { render, screen } from '@testing-library/react';
import { MessageList } from '../message-list';
import { ChatMessage } from '@/types/chat';

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello, how can I help?',
    role: 'assistant',
    timestamp: Date.now() - 60000,
    status: 'sent',
  },
  {
    id: '2',
    content: 'Tell me about this project',
    role: 'user',
    timestamp: Date.now() - 30000,
    status: 'sent',
  },
];

describe('MessageList', () => {
  it('renders messages correctly', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Tell me about this project')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(
      screen.getByText(/Ask me anything about this project/)
    ).toBeInTheDocument();
  });

  it('shows typing indicator when loading', () => {
    render(<MessageList messages={[]} isLoading={true} />);

    expect(screen.getByText('Assistant is typing...')).toBeInTheDocument();
  });

  it('renders user and assistant messages differently', () => {
    render(<MessageList messages={mockMessages} />);

    // Check for user and assistant indicators
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('displays suggested questions in empty state', () => {
    render(<MessageList messages={[]} />);

    expect(
      screen.getByText(/How does the admin monitoring system work/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What UI components are available/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Explain the Convex backend architecture/)
    ).toBeInTheDocument();
  });
});
