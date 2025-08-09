// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantSearch } from '@/components/participants/ParticipantSearch';
import { ParticipantListFilters } from '@/types/participants';
import { 
  testHealthcareAccessibility,
  testKeyboardNavigation,
  testFormAccessibility,
  healthcareA11yUtils
} from '../../../utils/accessibility';

// Mock UI components
jest.mock('@starter/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
}));

jest.mock('@starter/ui/input', () => ({
  Input: ({ className, id, placeholder, value, onChange, ...props }: any) => (
    <input 
      className={`input ${className}`}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

jest.mock('@starter/ui/label', () => ({
  Label: ({ children, htmlFor, className, ...props }: any) => (
    <label htmlFor={htmlFor} className={`label ${className}`} {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@starter/ui/button', () => ({
  Button: ({ children, className, size, variant, onClick, ...props }: any) => (
    <button 
      className={`button ${size || 'default'} ${variant || 'default'} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock types
jest.mock('@/types/participants', () => ({
  SUPPORT_LEVELS: {
    high: {
      value: 'high',
      label: 'High Support',
      description: 'Requires intensive support and frequent monitoring',
      color: 'red',
      priority: 3,
    },
    medium: {
      value: 'medium',
      label: 'Medium Support',
      description: 'Requires regular support with some independence',
      color: 'orange',
      priority: 2,
    },
    low: {
      value: 'low',
      label: 'Low Support',
      description: 'Requires minimal support with high independence',
      color: 'green',
      priority: 1,
    },
  },
  PARTICIPANT_STATUS: {
    active: {
      value: 'active',
      label: 'Active',
      description: 'Currently receiving services',
      color: 'green',
      icon: '✓',
    },
    inactive: {
      value: 'inactive',
      label: 'Inactive',
      description: 'Temporarily not receiving services',
      color: 'orange',
      icon: '⏸',
    },
    discharged: {
      value: 'discharged',
      label: 'Discharged',
      description: 'No longer receiving services',
      color: 'red',
      icon: '✕',
    },
  },
}));

describe('ParticipantSearch - NDIS Compliance', () => {
  const mockOnFiltersChange = jest.fn();

  const defaultFilters: ParticipantListFilters = {
    search: '',
    status: 'all',
    support_level: 'all',
    limit: 50,
  };

  const activeFilters: ParticipantListFilters = {
    search: 'John',
    status: 'active',
    support_level: 'high',
    limit: 25,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NDIS Search Functionality & Privacy', () => {
    it('renders search form with privacy-compliant placeholders', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show search input with appropriate placeholder
      expect(screen.getByPlaceholderText('Name, NDIS number, phone...')).toBeInTheDocument();
      expect(screen.getByText('Search Text')).toBeInTheDocument();
      expect(screen.getByText('Searches name, NDIS number, phone, and notes')).toBeInTheDocument();
    });

    it('handles text search input for NDIS participant lookup', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Name, NDIS number, phone...');
      await user.type(searchInput, 'John Smith');

      // Should call filters change for each character
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'John Smith',
        })
      );
    });

    it('does not expose sensitive search data in DOM attributes', () => {
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should not expose sensitive data patterns in attributes
      const searchInput = screen.getByDisplayValue('John');
      expect(searchInput.getAttribute('data-testid')).toBeNull();
      expect(searchInput.className).not.toMatch(/ndis_\d+/);
    });

    it('provides clear indication of search scope for healthcare workers', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should clearly indicate what can be searched
      expect(screen.getByText('Searches name, NDIS number, phone, and notes')).toBeInTheDocument();
      expect(screen.getByLabelText('Search Text')).toBeInTheDocument();
    });
  });

  describe('NDIS Support Level Filtering', () => {
    it('displays all NDIS support levels with descriptions', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show support level filter
      expect(screen.getByLabelText('Support Level')).toBeInTheDocument();
      
      // Should include all support levels with descriptions
      expect(screen.getByText('High Support - Requires intensive support and frequent monitoring')).toBeInTheDocument();
      expect(screen.getByText('Medium Support - Requires regular support with some independence')).toBeInTheDocument();
      expect(screen.getByText('Low Support - Requires minimal support with high independence')).toBeInTheDocument();
    });

    it('handles support level filter selection', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const supportLevelSelect = screen.getByLabelText('Support Level');
      await user.selectOptions(supportLevelSelect, 'high');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          support_level: 'high',
        })
      );
    });

    it('correctly handles "all" option for support level clearing', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const supportLevelSelect = screen.getByDisplayValue('high');
      await user.selectOptions(supportLevelSelect, 'all');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          support_level: undefined,
        })
      );
    });
  });

  describe('NDIS Participant Status Filtering', () => {
    it('displays all NDIS participant statuses with icons and descriptions', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show status filter
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      
      // Should include all statuses with icons and descriptions
      expect(screen.getByText('✓ Active - Currently receiving services')).toBeInTheDocument();
      expect(screen.getByText('⏸ Inactive - Temporarily not receiving services')).toBeInTheDocument();
      expect(screen.getByText('✕ Discharged - No longer receiving services')).toBeInTheDocument();
    });

    it('handles status filter selection for NDIS workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'active');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('handles status filter clearing correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const statusSelect = screen.getByDisplayValue('active');
      await user.selectOptions(statusSelect, 'all');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: undefined,
        })
      );
    });
  });

  describe('NDIS Results Limit & Performance', () => {
    it('provides appropriate result limits for NDIS data sets', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show result limits
      expect(screen.getByLabelText('Results Limit')).toBeInTheDocument();
      expect(screen.getByText('25 results')).toBeInTheDocument();
      expect(screen.getByText('50 results')).toBeInTheDocument();
      expect(screen.getByText('100 results')).toBeInTheDocument();
      expect(screen.getByText('200 results')).toBeInTheDocument();
    });

    it('handles result limit changes for performance optimization', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const limitSelect = screen.getByLabelText('Results Limit');
      await user.selectOptions(limitSelect, '100');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it('defaults to appropriate limit for healthcare workflow efficiency', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const limitSelect = screen.getByLabelText('Results Limit');
      expect(limitSelect).toHaveDisplayValue('50 results');
    });
  });

  describe('NDIS Active Filter Management', () => {
    it('displays active filters summary for healthcare transparency', () => {
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show active filters section
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      
      // Should show each active filter
      expect(screen.getByText('Text: "John"')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
      expect(screen.getByText('Support: High Support')).toBeInTheDocument();
    });

    it('does not show active filters section when no filters applied', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should not show active filters when none are applied
      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
    });

    it('provides clear all functionality for quick filter reset', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearAllButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        support_level: 'all',
        limit: 50,
      });
    });

    it('correctly identifies when filters are active', () => {
      const partialFilters: ParticipantListFilters = {
        search: '',
        status: 'active',
        support_level: 'all',
        limit: 50,
      };

      render(
        <ParticipantSearch
          filters={partialFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should show active filters even with partial selection
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('meets NDIS accessibility standards', async () => {
      const { container } = render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantSearch');
    });

    it('provides proper form accessibility for healthcare workers', async () => {
      const { container } = render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Test form accessibility specifically
      await testFormAccessibility(container);
    });

    it('supports keyboard navigation for disability service workers', async () => {
      const { container } = render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Expected interactive elements: search input, 3 selects, clear all button
      await testKeyboardNavigation(container, 5);
    });

    it('provides proper labels for screen readers', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // All form controls should have proper labels
      expect(screen.getByLabelText('Search Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Support Level')).toBeInTheDocument();
      expect(screen.getByLabelText('Results Limit')).toBeInTheDocument();
    });

    it('provides accessible descriptions for complex filters', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should provide helpful descriptions for screen readers
      expect(screen.getByText('Searches name, NDIS number, phone, and notes')).toBeInTheDocument();
    });

    it('maintains accessible focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search Text');
      searchInput.focus();
      
      expect(document.activeElement).toBe(searchInput);

      // Tab should move to next focusable element
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText('Status'));
    });
  });

  describe('NDIS Healthcare Search UX & Workflow', () => {
    it('provides intuitive search interface for healthcare staff', () => {
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should have clear heading
      expect(screen.getByText('Advanced Search & Filters')).toBeInTheDocument();
      
      // Should be organized in logical groups
      expect(screen.getByText('Search Text')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Support Level')).toBeInTheDocument();
      expect(screen.getByText('Results Limit')).toBeInTheDocument();
    });

    it('handles real-time filter updates for immediate feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Name, NDIS number, phone...');
      
      // Should call onChange for each keystroke
      await user.type(searchInput, 'A');
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'A' })
      );

      await user.type(searchInput, 'l');
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Al' })
      );
    });

    it('provides visual feedback for active filter state', () => {
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Active filters should be visually distinct
      const textFilter = screen.getByText('Text: "John"');
      expect(textFilter).toHaveClass('bg-blue-100');
      expect(textFilter).toHaveClass('text-blue-800');

      const statusFilter = screen.getByText('Status: Active');
      expect(statusFilter).toHaveClass('bg-green-100');
      expect(statusFilter).toHaveClass('text-green-800');

      const supportFilter = screen.getByText('Support: High Support');
      expect(supportFilter).toHaveClass('bg-orange-100');
      expect(supportFilter).toHaveClass('text-orange-800');
    });
  });

  describe('NDIS Mobile Responsiveness', () => {
    it('renders mobile-friendly layout for healthcare field workers', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should render all filters accessible on mobile
      expect(screen.getByLabelText('Search Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Support Level')).toBeInTheDocument();
      expect(screen.getByLabelText('Results Limit')).toBeInTheDocument();

      // Active filters should be visible on mobile
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
    });

    it('maintains accessibility on mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      await testHealthcareAccessibility(container, 'ParticipantSearch mobile');
    });
  });

  describe('NDIS Error Handling & Edge Cases', () => {
    it('handles empty filter object gracefully', () => {
      const emptyFilters = {};
      
      render(
        <ParticipantSearch
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should render with default values
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Search input
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Support Levels')).toBeInTheDocument();
    });

    it('handles undefined filter values correctly', () => {
      const partialFilters = {
        search: undefined,
        status: undefined,
        support_level: 'high',
        limit: undefined,
      };

      render(
        <ParticipantSearch
          filters={partialFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should handle undefined values as empty/default
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Search input
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      expect(screen.getByDisplayValue('high')).toBeInTheDocument();
    });

    it('prevents invalid filter combinations', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should handle edge cases in filter logic
      const limitSelect = screen.getByLabelText('Results Limit');
      await user.selectOptions(limitSelect, '25');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
        })
      );
    });

    it('maintains filter state consistency after clear', async () => {
      const user = userEvent.setup();
      
      render(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      // Should reset to consistent default state
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        support_level: 'all',
        limit: 50,
      });
    });

    it('handles very long search terms appropriately', async () => {
      const user = userEvent.setup();
      const veryLongSearch = 'A'.repeat(500); // Very long search term
      
      render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Name, NDIS number, phone...');
      await user.clear(searchInput);
      await user.type(searchInput, veryLongSearch);

      // Should handle long search terms without breaking
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: veryLongSearch,
        })
      );
    });

    it('maintains accessibility with dynamic filter changes', async () => {
      const { container, rerender } = render(
        <ParticipantSearch
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      await testHealthcareAccessibility(container);

      // Change to active filters
      rerender(
        <ParticipantSearch
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Should maintain accessibility with active filters
      await testHealthcareAccessibility(container);
    });
  });
});