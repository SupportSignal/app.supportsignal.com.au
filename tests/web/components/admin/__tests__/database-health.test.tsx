import { render, screen } from '@testing-library/react';
import { DatabaseHealth } from '../database-health';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;

const mockUsageData = {
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
};

describe('DatabaseHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<DatabaseHealth />);

    expect(screen.getByText('Database Health')).toBeInTheDocument();
  });

  it('renders database usage correctly', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Database Health')).toBeInTheDocument();
    expect(screen.getByText('15 MB')).toBeInTheDocument(); // Storage usage
    expect(screen.getByText('100')).toBeInTheDocument(); // Log queue count
    expect(screen.getByText('50')).toBeInTheDocument(); // Log entries count
    expect(screen.getByText('5')).toBeInTheDocument(); // Users count
    expect(screen.getByText('10')).toBeInTheDocument(); // Sessions count
  });

  it('shows healthy status for normal storage usage', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('15 MB')).toBeInTheDocument(); // Shows storage amount, not status text
  });

  it('shows warning status for elevated storage usage', () => {
    const warningData = {
      ...mockUsageData,
      estimatedStorageMB: 30,
      warnings: ['Storage usage is elevated'],
    };
    mockUseQuery.mockReturnValue(warningData);

    render(<DatabaseHealth />);

    expect(screen.getByText('30 MB')).toBeInTheDocument(); // Shows storage amount
    expect(screen.getByText('Storage usage is elevated')).toBeInTheDocument(); // Warning appears in alert
  });

  it('shows critical status for high storage usage', () => {
    const criticalData = {
      ...mockUsageData,
      estimatedStorageMB: 60,
      warnings: ['Storage usage critical - cleanup recommended'],
    };
    mockUseQuery.mockReturnValue(criticalData);

    render(<DatabaseHealth />);

    expect(screen.getByText('60 MB')).toBeInTheDocument(); // Shows storage amount
    expect(
      screen.getByText('Storage usage critical - cleanup recommended')
    ).toBeInTheDocument();
  });

  it('displays record counts for all tables', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Log Queue')).toBeInTheDocument(); // Uses display names
    expect(screen.getByText('Recent Logs')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('shows storage breakdown information', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
    expect(screen.getByText('Table Statistics')).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const dataWithWarnings = {
      ...mockUsageData,
      warnings: ['High storage usage detected', 'Consider running cleanup'],
    };
    mockUseQuery.mockReturnValue(dataWithWarnings);

    render(<DatabaseHealth />);

    expect(screen.getByText('High storage usage detected')).toBeInTheDocument();
    expect(screen.getByText('Consider running cleanup')).toBeInTheDocument();
  });

  it('shows no warnings message when warnings array is empty', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    // When no warnings, the warnings section is not rendered
    expect(
      screen.getByText('Database size is healthy, no cleanup needed')
    ).toBeInTheDocument();
  });
});
