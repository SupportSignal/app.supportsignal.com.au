/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoggingStatus } from '@/components/logging/logging-status';
import { ConsoleLogger } from '@/lib/console-override';

// Mock the console override module
jest.mock('../../../lib/console-override', () => ({
  ConsoleLogger: {
    getStatus: jest.fn(),
    newTrace: jest.fn(),
  },
}));

const mockGetStatus = ConsoleLogger.getStatus as jest.Mock;
const mockNewTrace = ConsoleLogger.newTrace as jest.Mock;

describe('LoggingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default status
    mockGetStatus.mockReturnValue({
      initialized: true,
      enabled: true,
      traceId: 'trace_123456789_abcdef',
      userId: 'test_user',
    });

    mockNewTrace.mockReturnValue('trace_987654321_fedcba');
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should render status indicator in development', () => {
    process.env.NODE_ENV = 'development';

    render(<LoggingStatus />);

    expect(screen.getByText('Claude Logging Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Trace: trace_123456...')).toBeInTheDocument();
    expect(screen.getByText('User: test_user')).toBeInTheDocument();
  });

  test('should not render in production', () => {
    process.env.NODE_ENV = 'production';

    render(<LoggingStatus />);

    expect(screen.queryByText('Claude Logging Status')).not.toBeInTheDocument();
  });

  test('should show inactive status when disabled', () => {
    process.env.NODE_ENV = 'development';
    mockGetStatus.mockReturnValue({
      initialized: false,
      enabled: false,
      traceId: 'trace_123456789_abcdef',
      userId: 'test_user',
    });

    render(<LoggingStatus />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('should show green indicator when active', () => {
    process.env.NODE_ENV = 'development';

    render(<LoggingStatus />);

    const indicator = screen.getByText('Active').previousElementSibling;
    expect(indicator).toHaveClass('bg-green-400');
  });

  test('should show red indicator when inactive', () => {
    process.env.NODE_ENV = 'development';
    mockGetStatus.mockReturnValue({
      initialized: false,
      enabled: false,
      traceId: 'trace_123456789_abcdef',
      userId: 'test_user',
    });

    render(<LoggingStatus />);

    const indicator = screen.getByText('Inactive').previousElementSibling;
    expect(indicator).toHaveClass('bg-red-400');
  });

  test('should handle new trace button click', () => {
    process.env.NODE_ENV = 'development';

    render(<LoggingStatus />);

    const newTraceButton = screen.getByText('New Trace');
    fireEvent.click(newTraceButton);

    expect(mockNewTrace).toHaveBeenCalled();
  });

  test('should update status periodically', () => {
    process.env.NODE_ENV = 'development';

    // Use fake timers
    jest.useFakeTimers();

    render(<LoggingStatus />);

    // Initial call
    expect(mockGetStatus).toHaveBeenCalledTimes(1);

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Should have been called again
    expect(mockGetStatus).toHaveBeenCalledTimes(2);

    // Restore real timers
    jest.useRealTimers();
  });

  test('should truncate long trace ID', () => {
    process.env.NODE_ENV = 'development';
    mockGetStatus.mockReturnValue({
      initialized: true,
      enabled: true,
      traceId: 'trace_very_long_trace_id_that_should_be_truncated',
      userId: 'test_user',
    });

    render(<LoggingStatus />);

    expect(screen.getByText('Trace: trace_very_l...')).toBeInTheDocument();
  });

  test('should handle null status gracefully', () => {
    process.env.NODE_ENV = 'development';
    mockGetStatus.mockReturnValue(null);

    render(<LoggingStatus />);

    expect(screen.queryByText('Claude Logging Status')).not.toBeInTheDocument();
  });
});
