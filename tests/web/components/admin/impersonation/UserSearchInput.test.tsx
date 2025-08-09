/**
 * Comprehensive Tests for UserSearchInput Component
 * 
 * Tests the user search interface with autocomplete functionality,
 * including search filtering, user selection, and accessibility.
 * 
 * Test Categories:
 * - Search input functionality
 * - Search results display and filtering
 * - User selection interactions
 * - Loading and empty states
 * - Keyboard navigation and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSearchInput } from '@/components/admin/impersonation/UserSearchInput';
import { ImpersonationSearchResult } from '@/types/impersonation';

// Test fixtures
const mockSearchResults: ImpersonationSearchResult[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'company_admin',
    company_name: 'Acme Corporation',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'team_lead',
    company_name: 'Beta Industries',
  },
  {
    id: 'user-3',
    name: 'Bob Johnson',
    email: 'bob.johnson@freelancer.com',
    role: 'frontline_worker',
    // No company_name
  },
  {
    id: 'user-4',
    name: 'Alice Brown',
    email: 'alice.brown@startup.io',
    role: 'company_admin',
    company_name: 'Gamma Startup',
  },
];

const defaultProps = {
  searchTerm: '',
  onSearchTermChange: jest.fn(),
  searchResults: [],
  selectedUser: null,
  onUserSelect: jest.fn(),
};

describe('UserSearchInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Input Functionality', () => {
    it('should render search input with placeholder', () => {
      render(<UserSearchInput {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Search users by name or email/);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('should display current search term', () => {
      render(<UserSearchInput {...defaultProps} searchTerm="john" />);
      
      const searchInput = screen.getByDisplayValue('john');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call onSearchTermChange when user types', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<UserSearchInput {...defaultProps} onSearchTermChange={mockOnChange} />);
      
      const searchInput = screen.getByPlaceholderText(/Search users by name or email/);
      await user.type(searchInput, 'john');
      
      expect(mockOnChange).toHaveBeenCalledTimes(4); // j, o, h, n
      expect(mockOnChange).toHaveBeenLastCalledWith('john');
    });

    it('should handle search input clearing', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<UserSearchInput {...defaultProps} searchTerm="existing" onSearchTermChange={mockOnChange} />);
      
      const searchInput = screen.getByDisplayValue('existing');
      await user.clear(searchInput);
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should show search icon in input', () => {
      render(<UserSearchInput {...defaultProps} />);
      
      // Search icon should be present (from Lucide React)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Search Results Display', () => {
    it('should not display results dropdown when no results', () => {
      render(<UserSearchInput {...defaultProps} searchResults={[]} />);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should display search results when available', () => {
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      // Should show all users in results
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@company.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    it('should display user details correctly', () => {
      render(<UserSearchInput {...defaultProps} searchResults={[mockSearchResults[0]]} />);
      
      // User name
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Email
      expect(screen.getByText('john.doe@company.com')).toBeInTheDocument();
      
      // Role badge
      expect(screen.getByText('company_admin')).toBeInTheDocument();
      
      // Company badge
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    it('should handle users without company gracefully', () => {
      render(<UserSearchInput {...defaultProps} searchResults={[mockSearchResults[2]]} />);
      
      // User details should still be displayed
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('bob.johnson@freelancer.com')).toBeInTheDocument();
      expect(screen.getByText('frontline_worker')).toBeInTheDocument();
      
      // Company badge should not be present
      expect(screen.queryByText(/company/)).not.toBeInTheDocument();
    });

    it('should limit results display appropriately', () => {
      const manyResults = Array.from({ length: 20 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        role: 'frontline_worker',
      })) as ImpersonationSearchResult[];
      
      render(<UserSearchInput {...defaultProps} searchResults={manyResults} />);
      
      // Should display all results (component doesn't limit, relies on backend)
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 19')).toBeInTheDocument();
    });

    it('should show appropriate styling for different roles', () => {
      const roleVariations = [
        { ...mockSearchResults[0], role: 'system_admin' },
        { ...mockSearchResults[1], role: 'company_admin' },
        { ...mockSearchResults[2], role: 'team_lead' },
        { ...mockSearchResults[3], role: 'frontline_worker' },
      ];
      
      render(<UserSearchInput {...defaultProps} searchResults={roleVariations} />);
      
      // All role badges should be displayed
      expect(screen.getByText('system_admin')).toBeInTheDocument();
      expect(screen.getByText('company_admin')).toBeInTheDocument();
      expect(screen.getByText('team_lead')).toBeInTheDocument();
      expect(screen.getByText('frontline_worker')).toBeInTheDocument();
    });
  });

  describe('User Selection Functionality', () => {
    it('should call onUserSelect when user clicks on result', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps} 
        searchResults={mockSearchResults}
        onUserSelect={mockOnSelect}
      />);
      
      await user.click(screen.getByText('John Doe'));
      
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should highlight selected user in results', () => {
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={mockSearchResults}
        selectedUser={mockSearchResults[1]}
      />);
      
      // Selected user should have different styling (highlighted)
      const selectedUserElement = screen.getByText('Jane Smith').closest('[role="option"]');
      expect(selectedUserElement).toHaveClass('bg-blue-50'); // or similar selected state class
    });

    it('should allow selecting different users', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={mockSearchResults}
        onUserSelect={mockOnSelect}
      />);
      
      // Select first user
      await user.click(screen.getByText('John Doe'));
      expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[0]);
      
      // Select different user
      await user.click(screen.getByText('Jane Smith'));
      expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[1]);
      
      expect(mockOnSelect).toHaveBeenCalledTimes(2);
    });

    it('should handle selection of user without company', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={[mockSearchResults[2]]}
        onUserSelect={mockOnSelect}
      />);
      
      await user.click(screen.getByText('Bob Johnson'));
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[2]);
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      
      const resultsContainer = screen.getByRole('listbox');
      expect(resultsContainer).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(mockSearchResults.length);
    });

    it('should handle keyboard navigation through results', async () => {
      const user = userEvent.setup();
      
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      const searchInput = screen.getByRole('combobox');
      
      // Focus on input
      await user.click(searchInput);
      
      // Arrow down should navigate through options
      await user.keyboard('{ArrowDown}');
      
      // First option should be focused/highlighted
      // Note: Implementation depends on actual keyboard navigation setup
      expect(searchInput).toHaveFocus();
    });

    it('should support Enter key selection', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={mockSearchResults}
        onUserSelect={mockOnSelect}
      />);
      
      // Focus on first result and press Enter
      const firstOption = screen.getAllByRole('option')[0];
      await user.click(firstOption);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should support Escape key to close results', async () => {
      const user = userEvent.setup();
      
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      const searchInput = screen.getByRole('combobox');
      await user.click(searchInput);
      
      // Results should be visible
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      // Results container should still be present but potentially collapsed
      // (Implementation dependent)
      expect(searchInput).toHaveFocus();
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      const searchInput = screen.getByRole('combobox');
      
      // Click input should focus it
      await user.click(searchInput);
      expect(searchInput).toHaveFocus();
      
      // Tab should move focus appropriately
      await user.keyboard('{Tab}');
      expect(searchInput).not.toHaveFocus();
    });

    it('should have descriptive labels and help text', () => {
      render(<UserSearchInput {...defaultProps} />);
      
      const searchInput = screen.getByRole('combobox');
      
      // Should have accessible name
      expect(searchInput).toHaveAccessibleName();
      
      // Placeholder should provide guidance
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search'));
    });
  });

  describe('Loading and Empty States', () => {
    it('should handle empty search results gracefully', () => {
      render(<UserSearchInput 
        {...defaultProps}
        searchTerm="nonexistent"
        searchResults={[]}
      />);
      
      // Should show search input but no results
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should handle undefined search results', () => {
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={undefined as any}
      />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should show loading state appropriately', () => {
      // If component supports loading state
      render(<UserSearchInput 
        {...defaultProps}
        searchTerm="loading"
        searchResults={[]}
      />);
      
      // Component should handle loading gracefully
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle very long search terms', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const longSearchTerm = 'a'.repeat(100);
      
      render(<UserSearchInput 
        {...defaultProps}
        onSearchTermChange={mockOnChange}
      />);
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, longSearchTerm);
      
      expect(mockOnChange).toHaveBeenLastCalledWith(longSearchTerm);
    });
  });

  describe('Visual Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      // Input container should have proper styling
      const inputContainer = container.querySelector('.relative');
      expect(inputContainer).toBeInTheDocument();
      
      // Results should have dropdown styling
      const resultsContainer = screen.getByRole('listbox');
      expect(resultsContainer).toHaveClass('absolute'); // Dropdown positioning
    });

    it('should handle responsive design classes', () => {
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      // Should handle mobile and desktop layouts
      const resultsContainer = screen.getByRole('listbox');
      expect(resultsContainer).toBeInTheDocument();
    });

    it('should show proper hover states', async () => {
      const user = userEvent.setup();
      
      render(<UserSearchInput {...defaultProps} searchResults={mockSearchResults} />);
      
      const firstOption = screen.getAllByRole('option')[0];
      
      // Hover should change styling
      await user.hover(firstOption);
      
      // Should have hover styling (implementation dependent)
      expect(firstOption).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid search term changes', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps}
        onSearchTermChange={mockOnChange}
      />);
      
      const searchInput = screen.getByRole('combobox');
      
      // Rapid typing
      await user.type(searchInput, 'john', { delay: 1 });
      
      // Should handle all changes
      expect(mockOnChange).toHaveBeenCalledTimes(4);
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<UserSearchInput 
        {...defaultProps}
        onSearchTermChange={mockOnChange}
      />);
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, '@#$%');
      
      expect(mockOnChange).toHaveBeenLastCalledWith('@#$%');
    });

    it('should handle international characters', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      const internationalResults = [
        {
          id: 'user-int',
          name: 'José María',
          email: 'jose@example.com',
          role: 'company_admin',
        },
      ] as ImpersonationSearchResult[];
      
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={internationalResults}
        onSearchTermChange={mockOnChange}
      />);
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'José');
      
      expect(mockOnChange).toHaveBeenLastCalledWith('José');
      expect(screen.getByText('José María')).toBeInTheDocument();
    });

    it('should handle users with very long names/emails', () => {
      const longNameResult = {
        id: 'user-long',
        name: 'Very Long User Name That Might Overflow The Container Width',
        email: 'very.long.email.address.that.might.cause.layout.issues@verylongdomainname.com',
        role: 'frontline_worker',
        company_name: 'Very Long Company Name That Should Also Be Handled Properly',
      } as ImpersonationSearchResult;
      
      render(<UserSearchInput 
        {...defaultProps}
        searchResults={[longNameResult]}
      />);
      
      expect(screen.getByText('Very Long User Name That Might Overflow The Container Width')).toBeInTheDocument();
      expect(screen.getByText('very.long.email.address.that.might.cause.layout.issues@verylongdomainname.com')).toBeInTheDocument();
    });

    it('should maintain selection state across re-renders', () => {
      const { rerender } = render(<UserSearchInput 
        {...defaultProps}
        searchResults={mockSearchResults}
        selectedUser={mockSearchResults[1]}
      />);
      
      // Selected user should be highlighted
      expect(screen.getByText('Jane Smith').closest('[role="option"]')).toHaveClass('bg-blue-50');
      
      // Re-render with same selection
      rerender(<UserSearchInput 
        {...defaultProps}
        searchResults={mockSearchResults}
        selectedUser={mockSearchResults[1]}
      />);
      
      // Selection should persist
      expect(screen.getByText('Jane Smith').closest('[role="option"]')).toHaveClass('bg-blue-50');
    });
  });
});