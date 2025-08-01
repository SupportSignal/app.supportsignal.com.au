import { render, screen } from '@testing-library/react';
import { SystemHealthOverview } from '../system-health-overview';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;

const mockData = {
  rateLimitState: {
    browser: { current: 5, limit: 10, resetTime: Date.now() + 60000 },
    worker: { current: 2, limit: 5, resetTime: Date.now() + 60000 },
    backend: { current: 3, limit: 5, resetTime: Date.now() + 60000 },
    global: { current: 10, limit: 20, budget: 125000 },
  },
  costMetrics: {
    totalWrites: 1000,
    estimatedCost: 0.02,
    budgetRemaining: 124000,
    budgetUsedPercent: 0.8,
    breakdown: { browser: 600, worker: 200, backend: 200 },
  },
  usage: {
    estimatedStorageMB: 15,
    estimatedStorageBytes: 15728640,
    recordCounts: {
      log_queue_sample: 100,
      recent_log_entries_sample: 50,
      users: 5,
      sessions: 10,
      note: 'Showing actual counts',
    },
    warnings: [],
  },
};

describe('SystemHealthOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Health Overview')).toBeInTheDocument();
  });

  it('renders healthy system status', () => {
    mockUseQuery
      .mockReturnValueOnce(mockData.rateLimitState) // rateLimitState
      .mockReturnValueOnce(mockData.costMetrics) // costMetrics
      .mockReturnValueOnce(mockData.usage); // usage

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Health Overview')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });

  it('shows warning status for high usage', () => {
    const warningData = {
      ...mockData,
      rateLimitState: {
        ...mockData.rateLimitState,
        global: { current: 18, limit: 20, budget: 125000 }, // 90% usage
      },
    };

    mockUseQuery
      .mockReturnValueOnce(warningData.rateLimitState)
      .mockReturnValueOnce(mockData.costMetrics)
      .mockReturnValueOnce(mockData.usage);

    render(<SystemHealthOverview />);

    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('shows critical status for critical issues', () => {
    const criticalData = {
      ...mockData,
      costMetrics: {
        ...mockData.costMetrics,
        budgetUsedPercent: 96, // Critical budget usage
      },
    };

    mockUseQuery
      .mockReturnValueOnce(mockData.rateLimitState)
      .mockReturnValueOnce(criticalData.costMetrics)
      .mockReturnValueOnce(mockData.usage);

    render(<SystemHealthOverview />);

    expect(screen.getByText('Critical Issues')).toBeInTheDocument();
    expect(screen.getByText(/budget nearly exhausted/i)).toBeInTheDocument();
  });

  it('displays quick stats correctly', () => {
    mockUseQuery
      .mockReturnValueOnce(mockData.rateLimitState)
      .mockReturnValueOnce(mockData.costMetrics)
      .mockReturnValueOnce(mockData.usage);

    render(<SystemHealthOverview />);

    expect(screen.getByText('10')).toBeInTheDocument(); // Active logs
    expect(screen.getByText('0.8%')).toBeInTheDocument(); // Budget used
    expect(screen.getByText('15')).toBeInTheDocument(); // Storage MB
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Total writes
  });

  it('shows system status indicators', () => {
    mockUseQuery
      .mockReturnValueOnce(mockData.rateLimitState)
      .mockReturnValueOnce(mockData.costMetrics)
      .mockReturnValueOnce(mockData.usage);

    render(<SystemHealthOverview />);

    expect(screen.getByText('Rate Limiting')).toBeInTheDocument();
    expect(screen.getByText('Budget Status')).toBeInTheDocument();
    expect(screen.getByText('Database Health')).toBeInTheDocument();
  });

  it('displays warnings for elevated storage usage', () => {
    const highStorageData = {
      ...mockData,
      usage: {
        ...mockData.usage,
        estimatedStorageMB: 30, // High storage usage
      },
    };

    mockUseQuery
      .mockReturnValueOnce(mockData.rateLimitState)
      .mockReturnValueOnce(mockData.costMetrics)
      .mockReturnValueOnce(highStorageData.usage);

    render(<SystemHealthOverview />);

    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });
});
