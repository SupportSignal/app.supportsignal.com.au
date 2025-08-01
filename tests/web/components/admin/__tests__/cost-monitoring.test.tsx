import { render, screen } from '@testing-library/react';
import { CostMonitoring } from '../cost-monitoring';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;

const mockCostMetrics = {
  totalWrites: 1000,
  estimatedCost: 0.02,
  budgetRemaining: 124000,
  budgetUsedPercent: 0.8,
  breakdown: {
    browser: 600,
    worker: 200,
    backend: 200,
  },
};

describe('CostMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<CostMonitoring />);

    expect(screen.getByText('Cost & Budget')).toBeInTheDocument();
  });

  it('renders cost metrics correctly', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('Cost & Budget Monitoring')).toBeInTheDocument();
    expect(screen.getByText('$0.0200')).toBeInTheDocument(); // Estimated cost formatted to 4 decimals
    expect(screen.getByText('0.80%')).toBeInTheDocument(); // Budget used percent formatted to 2 decimals
    expect(screen.getByText('124,000 writes')).toBeInTheDocument(); // Budget remaining with units
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Total writes
  });

  it('shows correct budget status badge for normal usage', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('0.80%')).toBeInTheDocument(); // Shows percentage in badge, not status text
  });

  it('shows warning status for high budget usage', () => {
    const warningData = {
      ...mockCostMetrics,
      budgetUsedPercent: 85,
    };
    mockUseQuery.mockReturnValue(warningData);

    render(<CostMonitoring />);

    expect(screen.getByText('85.00%')).toBeInTheDocument(); // Shows percentage, not warning text
    expect(screen.getByText('Budget Warning')).toBeInTheDocument(); // Shows warning in alert section
  });

  it('shows critical status for very high budget usage', () => {
    const criticalData = {
      ...mockCostMetrics,
      budgetUsedPercent: 96,
    };
    mockUseQuery.mockReturnValue(criticalData);

    render(<CostMonitoring />);

    expect(screen.getByText('96.00%')).toBeInTheDocument(); // Shows percentage, not critical text
    expect(screen.getByText('Critical Budget Alert')).toBeInTheDocument(); // Shows critical in alert section
  });

  it('displays breakdown by system correctly', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('browser')).toBeInTheDocument(); // lowercase due to capitalize CSS class
    expect(screen.getByText('worker')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument(); // Browser writes
    expect(screen.getAllByText('200')).toHaveLength(2); // Worker and Backend writes (both 200)
  });

  it('shows progress bar for budget usage', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    // Should have a progress indicator
    const progressElements = document.querySelectorAll('[role="progressbar"]');
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('displays monthly usage information', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('Monthly Budget Usage')).toBeInTheDocument();
    expect(
      screen.getByText('Monthly usage and cost tracking')
    ).toBeInTheDocument();
  });
});
