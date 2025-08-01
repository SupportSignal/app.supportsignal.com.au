import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../typing-indicator';

describe('TypingIndicator', () => {
  it('renders typing indicator with animation', () => {
    render(<TypingIndicator />);

    expect(screen.getByText('Assistant is typing...')).toBeInTheDocument();
  });

  it('displays animated dots', () => {
    const { container } = render(<TypingIndicator />);

    // Check for animated dots (should have animate-bounce class)
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('shows bot icon', () => {
    const { container } = render(<TypingIndicator />);

    // Check for Lucide React Bot icon
    const botIcon = container.querySelector('svg');
    expect(botIcon).toBeInTheDocument();
  });
});
