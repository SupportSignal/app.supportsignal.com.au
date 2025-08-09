// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantList } from '@/components/participants/ParticipantList';
import { mockParticipants, searchTestData } from '../../../convex/participants/fixtures';

// Mock Convex hooks
const mockListParticipants = jest.fn();
const mockSearchParticipants = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: jest.fn((queryFn) => {
    if (queryFn.toString().includes('list')) {
      return mockListParticipants();
    }
    return mockSearchParticipants();
  }),
}));

// Mock the API
jest.mock('@/convex/_generated/api', () => ({
  api: {
    participants: {
      list: {
        listParticipants: 'participants/list/listParticipants',
      },
      search: {
        searchParticipants: 'participants/search/searchParticipants',
      },
    },
  },
}));

// Mock child components
jest.mock('@/components/participants/ParticipantCard', () => ({
  ParticipantCard: ({ participant, onEdit, onStatusChange }: any) => (
    <div data-testid={`participant-card-${participant._id}`}>
      <h3>{participant.first_name} {participant.last_name}</h3>
      <p>Status: {participant.status}</p>
      <p>Support Level: {participant.support_level}</p>
      <button onClick={() => onEdit(participant._id)}>Edit</button>
      <button onClick={() => onStatusChange(participant._id, 'inactive')}>Change Status</button>
    </div>
  ),
}));

jest.mock('@/components/participants/ParticipantSearch', () => ({
  ParticipantSearch: ({ onSearch, onFilterChange }: any) => (
    <div data-testid="participant-search">
      <input
        data-testid="search-input"
        placeholder="Search participants..."
        onChange={(e) => onSearch(e.target.value)}
      />
      <select data-testid="status-filter" onChange={(e) => onFilterChange({ status: e.target.value })}>
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="discharged">Discharged</option>
      </select>
      <select data-testid="support-filter" onChange={(e) => onFilterChange({ support_level: e.target.value })}>
        <option value="all">All Support Levels</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ParticipantList', () => {
  const mockOnEdit = jest.fn();
  const mockOnCreate = jest.fn();
  const mockOnStatusChange = jest.fn();

  const defaultParticipants = [
    mockParticipants.johnDoe,
    mockParticipants.janeDoe,
    mockParticipants.bobSmith,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-session-token');
    
    // Default successful query result
    mockListParticipants.mockReturnValue({
      participants: defaultParticipants,
      totalCount: defaultParticipants.length,
      correlationId: 'test-correlation-id',
    });

    mockSearchParticipants.mockReturnValue({
      participants: [],
      totalCount: 0,
      correlationId: 'test-search-correlation-id',
    });
  });

  describe('Loading and Data Display', () => {
    it('renders loading state', () => {
      mockListParticipants.mockReturnValue(undefined); // Loading state

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/loading participants/i)).toBeInTheDocument();
    });

    it('renders participants when data is loaded', () => {
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('displays total participant count', () => {
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/3 participants/i)).toBeInTheDocument();
    });

    it('renders empty state when no participants', () => {
      mockListParticipants.mockReturnValue({
        participants: [],
        totalCount: 0,
        correlationId: 'empty-test',
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/no participants found/i)).toBeInTheDocument();
      expect(screen.getByText(/create new participant/i)).toBeInTheDocument();
    });

    it('shows error state when query fails', () => {
      mockListParticipants.mockReturnValue({
        error: { message: 'Failed to load participants' },
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/error loading participants/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load participants/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Mock search results
      mockSearchParticipants.mockReturnValue({
        participants: [searchTestData.participants[0]], // John Smith
        totalCount: 1,
        correlationId: 'search-test',
      });
    });

    it('switches to search mode when search term is entered', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(mockSearchParticipants).toHaveBeenCalled();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('debounces search input', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup();
      
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      
      // Type rapidly
      await user.type(searchInput, 'J');
      await user.type(searchInput, 'o');
      await user.type(searchInput, 'h');
      await user.type(searchInput, 'n');

      expect(mockSearchParticipants).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockSearchParticipants).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('returns to list mode when search is cleared', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      // Enter search term
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(mockSearchParticipants).toHaveBeenCalled();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        expect(mockListParticipants).toHaveBeenCalled();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // From list, not search
      });
    });

    it('shows search results count', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText(/1 participant/i)).toBeInTheDocument();
      });
    });

    it('handles search with no results', async () => {
      const user = userEvent.setup();
      
      mockSearchParticipants.mockReturnValue({
        participants: [],
        totalCount: 0,
        correlationId: 'no-results-test',
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText(/no participants found matching/i)).toBeInTheDocument();
        expect(screen.getByText(/try different search terms/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('applies status filter', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const statusFilter = screen.getByTestId('status-filter');
      await user.selectOptions(statusFilter, 'active');

      await waitFor(() => {
        expect(mockListParticipants).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'active',
          })
        );
      });
    });

    it('applies support level filter', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const supportFilter = screen.getByTestId('support-filter');
      await user.selectOptions(supportFilter, 'high');

      await waitFor(() => {
        expect(mockListParticipants).toHaveBeenCalledWith(
          expect.objectContaining({
            support_level: 'high',
          })
        );
      });
    });

    it('combines multiple filters', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const statusFilter = screen.getByTestId('status-filter');
      const supportFilter = screen.getByTestId('support-filter');

      await user.selectOptions(statusFilter, 'active');
      await user.selectOptions(supportFilter, 'medium');

      await waitFor(() => {
        expect(mockListParticipants).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'active',
            support_level: 'medium',
          })
        );
      });
    });

    it('applies filters to search when searching', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      // Set filters first
      const statusFilter = screen.getByTestId('status-filter');
      await user.selectOptions(statusFilter, 'active');

      // Then search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(mockSearchParticipants).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'John',
            filters: expect.objectContaining({
              status: 'active',
            }),
          })
        );
      });
    });
  });

  describe('Actions and Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockParticipants.johnDoe._id);
    });

    it('calls onStatusChange when status change button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ParticipantList 
          onEdit={mockOnEdit} 
          onCreate={mockOnCreate}
          onStatusChange={mockOnStatusChange}
        />
      );

      const statusButton = screen.getAllByText('Change Status')[0];
      await user.click(statusButton);

      expect(mockOnStatusChange).toHaveBeenCalledWith(
        mockParticipants.johnDoe._id,
        'inactive'
      );
    });

    it('calls onCreate when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const createButton = screen.getByRole('button', { name: /add new participant/i });
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalled();
    });

    it('calls onCreate from empty state', async () => {
      mockListParticipants.mockReturnValue({
        participants: [],
        totalCount: 0,
        correlationId: 'empty-test',
      });

      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const createButton = screen.getByText(/create new participant/i);
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('renders mobile-friendly layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      // Should still render all participants (layout handled by CSS)
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('shows create button prominently on mobile', () => {
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const createButton = screen.getByRole('button', { name: /add new participant/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('does not trigger unnecessary re-renders', () => {
      const { rerender } = render(
        <ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />
      );

      // Clear mock call history
      mockListParticipants.mockClear();

      // Re-render with same props
      rerender(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      // Should not trigger new query if data hasn't changed
      expect(mockListParticipants).toHaveBeenCalledTimes(1);
    });

    it('handles large participant lists efficiently', () => {
      const largeParticipantList = Array.from({ length: 100 }, (_, index) => ({
        ...mockParticipants.johnDoe,
        _id: `participant_${index}`,
        first_name: `Participant${index}`,
        last_name: `User${index}`,
      }));

      mockListParticipants.mockReturnValue({
        participants: largeParticipantList,
        totalCount: largeParticipantList.length,
        correlationId: 'large-list-test',
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/100 participants/i)).toBeInTheDocument();
      expect(screen.getAllByText('Edit')).toHaveLength(100);
    });
  });

  describe('Error Handling', () => {
    it('handles authentication errors', () => {
      mockListParticipants.mockReturnValue({
        error: { message: 'Authentication required' },
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    });

    it('handles network errors', () => {
      mockListParticipants.mockReturnValue({
        error: { message: 'Network error' },
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('provides retry mechanism for failed requests', async () => {
      mockListParticipants.mockReturnValue({
        error: { message: 'Network error' },
      });

      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();

      // Mock successful retry
      mockListParticipants.mockReturnValue({
        participants: defaultParticipants,
        totalCount: defaultParticipants.length,
        correlationId: 'retry-test',
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/search participants/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new participant/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      const createButton = screen.getByRole('button', { name: /add new participant/i });

      await user.tab();
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(createButton).toHaveFocus();
    });

    it('announces changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText(/1 participant/i)).toBeInTheDocument();
      });

      // Verify aria-live region updates
      expect(screen.getByRole('status')).toHaveTextContent(/1 participant/);
    });
  });

  describe('Integration with Session Management', () => {
    it('handles missing session token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      mockListParticipants.mockReturnValue({
        error: { message: 'Authentication required' },
      });

      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    });

    it('passes session token to queries', () => {
      render(<ParticipantList onEdit={mockOnEdit} onCreate={mockOnCreate} />);

      expect(mockListParticipants).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionToken: 'test-session-token',
        })
      );
    });
  });
});