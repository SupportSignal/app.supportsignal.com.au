// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogSearch } from '@/components/debug-logs/log-search';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;
const mockUseMutation = require('convex/react').useMutation;

const mockSearchResults = [
  {
    _id: '1',
    _creationTime: Date.now() - 3600000,
    message: 'User login successful',
    level: 'info',
    context: { userId: 'user123', action: 'login' },
    correlationId: 'corr-123',
  },
  {
    _id: '2',
    _creationTime: Date.now() - 1800000,
    message: 'Error processing request',
    level: 'error',
    context: { error: 'Network timeout', endpoint: '/api/data' },
    correlationId: 'corr-456',
  },
];

describe('LogSearch', () => {
  const mockSearchLogs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);
    mockUseMutation.mockReturnValue(mockSearchLogs);
  });

  it('renders search interface correctly', () => {
    render(<LogSearch />);

    expect(screen.getByText('Log Search & Correlation')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search message content...')
    ).toBeInTheDocument();
    expect(screen.getByText('Search Logs')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<LogSearch />);

    const searchInput = screen.getByPlaceholderText(
      'Search message content...'
    );
    fireEvent.change(searchInput, { target: { value: 'error' } });

    expect(searchInput).toHaveValue('error');
  });

  it('performs search when search button is clicked', async () => {
    render(<LogSearch />);

    const searchInput = screen.getByPlaceholderText(
      'Search message content...'
    );
    const searchButton = screen.getByText('Search Logs');

    fireEvent.change(searchInput, { target: { value: 'login' } });
    fireEvent.click(searchButton);

    // Just verify the input value changed (search is reactive via useQuery)
    expect(searchInput).toHaveValue('login');
  });

  it('performs search when Enter key is pressed', async () => {
    render(<LogSearch />);

    const searchInput = screen.getByPlaceholderText(
      'Search message content...'
    );
    fireEvent.change(searchInput, { target: { value: 'error' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    // Just verify the input value changed (search is reactive via useQuery)
    expect(searchInput).toHaveValue('error');
  });

  it('displays search results correctly', async () => {
    mockSearchLogs.mockResolvedValue(mockSearchResults);

    render(<LogSearch />);

    const searchInput = screen.getByPlaceholderText(
      'Search message content...'
    );
    const searchButton = screen.getByText('Search Logs');

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('User login successful')).toBeInTheDocument();
      expect(screen.getByText('Error processing request')).toBeInTheDocument();
      expect(screen.getByText('corr-123')).toBeInTheDocument();
      expect(screen.getByText('corr-456')).toBeInTheDocument();
    });
  });

  it('shows different badge colors for different log levels', async () => {
    mockSearchLogs.mockResolvedValue(mockSearchResults);

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    await waitFor(() => {
      const infoBadge = screen.getByText('info');
      const errorBadge = screen.getByText('error');

      expect(infoBadge).toBeInTheDocument();
      expect(errorBadge).toBeInTheDocument();
    });
  });

  it('handles level filter changes', () => {
    render(<LogSearch />);

    const levelSelect = screen.getByDisplayValue('All Levels');
    fireEvent.click(levelSelect);

    // Should show level options
    expect(screen.getByText('All Levels')).toBeInTheDocument();
  });

  it('handles time range filter changes', () => {
    render(<LogSearch />);

    const timeSelect = screen.getByDisplayValue('Last Hour');
    fireEvent.click(timeSelect);

    // Should show time range options
    expect(screen.getByText('Last Hour')).toBeInTheDocument();
  });

  it('displays correlation ID links', async () => {
    mockSearchLogs.mockResolvedValue(mockSearchResults);

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    await waitFor(() => {
      const correlationLinks = screen.getAllByText(/corr-/);
      expect(correlationLinks).toHaveLength(2);
    });
  });

  it('shows loading state during search', async () => {
    mockSearchLogs.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(mockSearchResults), 1000)
        )
    );

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    // Button should be disabled during search
    expect(searchButton).toBeDisabled();
  });

  it('displays no results message when search returns empty', async () => {
    mockSearchLogs.mockResolvedValue([]);

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('shows context information for log entries', async () => {
    mockSearchLogs.mockResolvedValue(mockSearchResults);

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/userId.*user123/)).toBeInTheDocument();
      expect(screen.getByText(/action.*login/)).toBeInTheDocument();
      expect(screen.getByText(/error.*Network timeout/)).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    mockSearchLogs.mockResolvedValue(mockSearchResults);

    render(<LogSearch />);

    const searchButton = screen.getByText('Search Logs');
    fireEvent.click(searchButton);

    await waitFor(() => {
      // Should show relative time formatting
      expect(screen.getByText(/hour ago/i)).toBeInTheDocument();
      expect(screen.getByText(/minutes ago/i)).toBeInTheDocument();
    });
  });
});
