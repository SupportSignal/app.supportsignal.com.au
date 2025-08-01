import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../chat-interface';
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

describe('ChatInterface', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface with messages', () => {
    render(
      <ChatInterface messages={mockMessages} onSendMessage={mockOnSendMessage} />
    );

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Tell me about this project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });

  it('handles message submission', async () => {
    render(
      <ChatInterface messages={[]} onSendMessage={mockOnSendMessage} />
    );

    const input = screen.getByPlaceholderText(/ask a question/i);
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');

    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('handles Enter key submission', async () => {
    render(
      <ChatInterface messages={[]} onSendMessage={mockOnSendMessage} />
    );

    const input = screen.getByPlaceholderText(/ask a question/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('prevents submission of empty messages', () => {
    render(
      <ChatInterface messages={[]} onSendMessage={mockOnSendMessage} />
    );

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();

    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('disables input when loading', () => {
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isLoading={true}
      />
    );

    const input = screen.getByPlaceholderText(/ask a question/i);
    const sendButton = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Failed to send message';
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(
      <ChatInterface messages={[]} onSendMessage={mockOnSendMessage} />
    );

    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText(/Ask me anything about this project/)).toBeInTheDocument();
  });

  it('prevents Shift+Enter submission', () => {
    render(
      <ChatInterface messages={[]} onSendMessage={mockOnSendMessage} />
    );

    const input = screen.getByPlaceholderText(/ask a question/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });
});