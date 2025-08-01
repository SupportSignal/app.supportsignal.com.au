import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CleanupControls } from '../cleanup-controls';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;
const mockUseMutation = require('convex/react').useMutation;

const mockCleanupStatus = {
  recommendation: {
    action: 'Consider running safe cleanup to optimize storage',
  },
  counts: {
    log_queue_sample: 100,
    recent_log_entries_sample: 50,
    note: 'Showing actual counts',
  },
  recentActivity: {
    totalRecentSample: 150,
    topMessages: [
      ['Error processing request', 5],
      ['User login', 3],
      ['Data sync', 2],
    ],
  },
};

describe('CleanupControls', () => {
  const mockSafeCleanup = jest.fn();
  const mockForceCleanup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation
      .mockReturnValueOnce(mockSafeCleanup)
      .mockReturnValueOnce(mockForceCleanup);
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<CleanupControls />);

    expect(screen.getByText('Cleanup Controls')).toBeInTheDocument();
  });

  it('renders cleanup status correctly', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Database Cleanup Controls')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Log queue sample
    expect(screen.getByText('50')).toBeInTheDocument(); // Recent log entries sample
    expect(screen.getByText('150')).toBeInTheDocument(); // Total recent activity
  });

  it('displays cleanup recommendation', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Cleanup Recommended')).toBeInTheDocument();
    expect(
      screen.getByText('Consider running safe cleanup to optimize storage')
    ).toBeInTheDocument();
  });

  it('shows safe cleanup button and handles click', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockSafeCleanup.mockResolvedValue({
      deletedCount: 50,
      message: 'Cleanup completed',
    });

    render(<CleanupControls />);

    const safeCleanupButton = screen.getByText('Run Safe Cleanup');
    expect(safeCleanupButton).toBeInTheDocument();

    fireEvent.click(safeCleanupButton);

    await waitFor(() => {
      expect(mockSafeCleanup).toHaveBeenCalledWith({});
    });
  });

  it('shows force cleanup button with warning styling', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByText('Emergency Clean');
    expect(forceCleanupButton).toBeInTheDocument();
  });

  it('handles force cleanup with confirmation dialog', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockForceCleanup.mockResolvedValue({
      deletedRecent: 50,
      deletedQueue: 100,
      totalDeleted: 150,
      message: 'Force cleanup completed',
    });

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByText('Emergency Clean');
    fireEvent.click(forceCleanupButton);

    // Check that dialog appears
    expect(screen.getByText('Confirm Emergency Cleanup')).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently delete ALL log entries/)
    ).toBeInTheDocument();

    // Click confirm
    const confirmButton = screen.getByText('Delete All Logs');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockForceCleanup).toHaveBeenCalledWith({});
    });
  });

  it('cancels force cleanup when user clicks cancel', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByText('Emergency Clean');
    fireEvent.click(forceCleanupButton);

    // Check that dialog appears
    expect(screen.getByText('Confirm Emergency Cleanup')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Force cleanup should not be called
    expect(mockForceCleanup).not.toHaveBeenCalled();
  });

  it('displays top recent messages when present', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Top Recent Messages')).toBeInTheDocument();
    expect(screen.getByText('Error processing request')).toBeInTheDocument();
    expect(screen.getByText('User login')).toBeInTheDocument();
  });

  it('shows cleanup progress when operations are running', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockSafeCleanup.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () => resolve({ deletedCount: 50, message: 'Cleanup completed' }),
            1000
          )
        )
    );

    render(<CleanupControls />);

    const safeCleanupButton = screen.getByText('Run Safe Cleanup');
    fireEvent.click(safeCleanupButton);

    // Button should be disabled during operation
    expect(safeCleanupButton).toBeDisabled();
  });

  it('displays cleanup statistics', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Log Queue Entries')).toBeInTheDocument();
    expect(screen.getByText('Recent Log Entries')).toBeInTheDocument();
    expect(screen.getByText('Total Recent Activity')).toBeInTheDocument();
  });
});
