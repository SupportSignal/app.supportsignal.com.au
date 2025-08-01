import { render, screen } from '@testing-library/react';
import { UserMessage } from '../user-message';
import { ChatMessage } from '@/types/chat';

const mockMessage: ChatMessage = {
  id: '1',
  content: 'This is a test message',
  role: 'user',
  timestamp: Date.now() - 60000,
  status: 'sent',
};

describe('UserMessage', () => {
  it('renders user message content', () => {
    render(<UserMessage message={mockMessage} />);

    expect(screen.getByText('This is a test message')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows timestamp relative to now', () => {
    render(<UserMessage message={mockMessage} />);

    expect(screen.getByText(/minute ago/)).toBeInTheDocument();
  });

  it('displays sending status', () => {
    const sendingMessage = { ...mockMessage, status: 'sending' as const };
    render(<UserMessage message={sendingMessage} />);

    expect(screen.getByText('sending')).toBeInTheDocument();
  });

  it('displays error status', () => {
    const errorMessage = { ...mockMessage, status: 'error' as const };
    render(<UserMessage message={errorMessage} />);

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('does not show status badge for sent messages', () => {
    render(<UserMessage message={mockMessage} />);

    expect(screen.queryByText('sent')).not.toBeInTheDocument();
  });
});
