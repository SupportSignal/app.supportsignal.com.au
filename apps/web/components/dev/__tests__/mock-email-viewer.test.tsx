import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MockEmailViewer } from '@/components/dev/mock-email-viewer';
import userEvent from '@testing-library/user-event';
import { mockEmailService } from '@/lib/email/email-service';

// Mock the email service
jest.mock('../../../lib/email/email-service', () => ({
  mockEmailService: {
    getAllEmails: jest.fn(),
    clearAllEmails: jest.fn(),
  },
  MockEmail: jest.fn(),
}));

// Mock clipboard - need to ensure we have the right mock reference
const mockWriteText = jest.fn().mockResolvedValue(undefined);
const mockAlert = jest.fn();

// Setup mocks before tests
beforeAll(() => {
  global.navigator.clipboard.writeText = mockWriteText;
  global.alert = mockAlert;
});

describe('MockEmailViewer', () => {
  const mockEmails = [
    {
      id: '1',
      to: 'test@example.com',
      subject: 'Password Reset Request',
      html: '<p>Reset your password</p>',
      sentAt: new Date('2024-01-01T10:00:00Z'),
      token: 'reset-token-123',
      expiresAt: new Date('2024-01-01T11:00:00Z'),
      type: 'passwordReset' as const,
    },
    {
      id: '2',
      to: 'user@example.com',
      subject: 'Verify Your Email',
      html: '<p>Verify your email</p>',
      sentAt: new Date('2024-01-01T10:30:00Z'),
      token: 'verify-token-456',
      expiresAt: new Date('2024-01-01T11:30:00Z'),
      type: 'emailVerification' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
    mockAlert.mockClear();
    jest.useFakeTimers();
    (mockEmailService.getAllEmails as jest.Mock).mockReturnValue(mockEmails);
    // Setup window.location for the component
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders collapsed state by default', () => {
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('📧 Mock Emails (2)');
  });

  it('expands when clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    expect(
      screen.getByRole('heading', { name: /mock emails/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /clear all/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh/i })
    ).toBeInTheDocument();
  });

  it('displays email list when expanded', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText(/password reset/i)).toBeInTheDocument();
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  it('clears all emails when clear button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearButton);

    expect(mockEmailService.clearAllEmails).toHaveBeenCalled();

    // Mock empty state after clearing
    (mockEmailService.getAllEmails as jest.Mock).mockReturnValue([]);

    // Force re-render by triggering the interval
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText(/no mock emails/i)).toBeInTheDocument();
    });
  });

  it('refreshes emails when refresh button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    // Clear the mock to track new calls
    (mockEmailService.getAllEmails as jest.Mock).mockClear();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockEmailService.getAllEmails).toHaveBeenCalled();
  });

  it('auto-refreshes emails every 2 seconds', async () => {
    render(<MockEmailViewer />);

    // Initial call
    expect(mockEmailService.getAllEmails).toHaveBeenCalledTimes(1);

    // Advance timer by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockEmailService.getAllEmails).toHaveBeenCalledTimes(2);

    // Advance timer by another 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockEmailService.getAllEmails).toHaveBeenCalledTimes(3);
  });

  it('displays email details when email is selected', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    // Click on first email
    const firstEmail = screen.getByText('test@example.com');
    await user.click(firstEmail);

    // Check email details are displayed
    expect(screen.getByText('To: test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/sent:/i)).toBeInTheDocument();
    expect(screen.getByText(/expires:/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy reset link/i })
    ).toBeInTheDocument();
  });

  it('copies reset link to clipboard', async () => {
    jest.useRealTimers(); // Use real timers for this test
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    // Click on first email
    const firstEmail = screen.getByText('test@example.com');
    await user.click(firstEmail);

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy reset link/i });

    // Re-assign our mock after user-event may have overridden it
    navigator.clipboard.writeText = mockWriteText;

    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        'http://localhost:3000/reset-password?token=reset-token-123'
      );
    });
    expect(mockAlert).toHaveBeenCalledWith('Reset link copied to clipboard!');

    jest.useFakeTimers(); // Restore fake timers
  });

  it('shows expired token indicator', async () => {
    const user = userEvent.setup({ delay: null });
    const expiredEmail = {
      ...mockEmails[0],
      expiresAt: new Date('2020-01-01T10:00:00Z'), // Past date
    };

    (mockEmailService.getAllEmails as jest.Mock).mockReturnValue([
      expiredEmail,
    ]);

    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it('collapses when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', { name: /mock emails/i });
    await user.click(toggleButton);

    const closeButton = screen.getByRole('button', { name: /✕/i });
    await user.click(closeButton);

    // Should be back to collapsed state
    expect(
      screen.getByRole('button', { name: /mock emails/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /mock emails/i })
    ).not.toBeInTheDocument();
  });

  it('handles empty email list', async () => {
    const user = userEvent.setup({ delay: null });
    (mockEmailService.getAllEmails as jest.Mock).mockReturnValue([]);

    render(<MockEmailViewer />);

    const toggleButton = screen.getByRole('button', {
      name: /mock emails \(0\)/i,
    });
    await user.click(toggleButton);

    expect(screen.getByText(/no mock emails/i)).toBeInTheDocument();
  });
});
