import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '../assistant-message';
import { ChatMessage } from '@/types/chat';

const mockMessage: ChatMessage = {
  id: '1',
  content: 'This is an assistant response',
  role: 'assistant',
  timestamp: Date.now() - 60000,
  status: 'sent',
};

describe('AssistantMessage', () => {
  it('renders assistant message content', () => {
    render(<AssistantMessage message={mockMessage} />);

    expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('shows timestamp relative to now', () => {
    render(<AssistantMessage message={mockMessage} />);

    expect(screen.getByText(/minute ago/)).toBeInTheDocument();
  });

  it('displays error status', () => {
    const errorMessage = { ...mockMessage, status: 'error' as const };
    render(<AssistantMessage message={errorMessage} />);

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('does not show status badge for sent messages', () => {
    render(<AssistantMessage message={mockMessage} />);

    expect(screen.queryByText('sent')).not.toBeInTheDocument();
  });

  it('displays sources when provided', () => {
    const messageWithSources = {
      ...mockMessage,
      sources: [
        { title: 'README.md', excerpt: 'Project documentation' },
        { title: 'architecture.md', excerpt: 'System architecture' },
      ],
    };

    render(<AssistantMessage message={messageWithSources} />);

    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('architecture.md')).toBeInTheDocument();
    expect(screen.getByText('Project documentation')).toBeInTheDocument();
    expect(screen.getByText('System architecture')).toBeInTheDocument();
  });

  it('does not show sources section when no sources', () => {
    render(<AssistantMessage message={mockMessage} />);

    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('preserves whitespace in message content', () => {
    const messageWithNewlines = {
      ...mockMessage,
      content: 'Line 1\n\nLine 2\nLine 3',
    };

    render(<AssistantMessage message={messageWithNewlines} />);

    // Check that the message container has the whitespace-pre-wrap class
    const messageContainer = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             element?.textContent === 'Line 1\n\nLine 2\nLine 3';
    });
    expect(messageContainer).toHaveClass('whitespace-pre-wrap');
  });
});