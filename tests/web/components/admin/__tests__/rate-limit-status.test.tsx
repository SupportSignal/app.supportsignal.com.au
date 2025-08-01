import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { RateLimitStatus } from '../rate-limit-status';
import { api } from '@/lib/convex-api';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;
const mockUseMutation = require('convex/react').useMutation;

const mockRateLimitState = {
  browser: { current: 5, limit: 10, resetTime: Date.now() + 60000 },
  worker: { current: 2, limit: 5, resetTime: Date.now() + 60000 },
  backend: { current: 3, limit: 5, resetTime: Date.now() + 60000 },
  global: { current: 10, limit: 20, budget: 125000 },
};

describe('RateLimitStatus', () => {
  const mockUpdateRateLimit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue(mockUpdateRateLimit);
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<RateLimitStatus />);

    expect(screen.getByText('Rate Limiting Status')).toBeInTheDocument();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('renders rate limit data correctly', () => {
    mockUseQuery.mockReturnValue(mockRateLimitState);

    render(<RateLimitStatus />);

    expect(screen.getByText('Rate Limiting Status')).toBeInTheDocument();
    expect(screen.getByText('10/20')).toBeInTheDocument(); // Global status
    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('shows correct status badges for different usage levels', () => {
    const highUsageState = {
      ...mockRateLimitState,
      browser: { current: 9, limit: 10, resetTime: Date.now() + 60000 }, // 90% usage
    };
    mockUseQuery.mockReturnValue(highUsageState);

    render(<RateLimitStatus />);

    // Should show warning/critical badges for high usage
    const badges = screen.getAllByText(/9\/10/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('handles refresh button click', async () => {
    mockUseQuery.mockReturnValue(mockRateLimitState);
    mockUpdateRateLimit.mockResolvedValue({});

    render(<RateLimitStatus />);

    const refreshButton = screen.getByRole('button');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockUpdateRateLimit).toHaveBeenCalledWith({});
    });
  });

  it('displays reset time information', () => {
    mockUseQuery.mockReturnValue(mockRateLimitState);

    render(<RateLimitStatus />);

    // Should show reset time text (there are multiple, so we'll get all)
    expect(screen.getAllByText(/resets/i)).toHaveLength(3); // One for each system
  });

  it('shows budget information', () => {
    mockUseQuery.mockReturnValue(mockRateLimitState);

    render(<RateLimitStatus />);

    expect(screen.getByText(/budget.*125,000/i)).toBeInTheDocument();
  });
});
