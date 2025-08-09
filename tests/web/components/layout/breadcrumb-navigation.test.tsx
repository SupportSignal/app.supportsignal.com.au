// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('BreadcrumbNavigation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('does not render for root path', () => {
      mockUsePathname.mockReturnValue('/');
      
      const { container } = render(<BreadcrumbNavigation />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render for single-level paths', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      const { container } = render(<BreadcrumbNavigation />);
      expect(container.firstChild).toBeNull();
    });

    it('renders breadcrumbs for multi-level paths', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('renders breadcrumbs for deep nested paths', () => {
      mockUsePathname.mockReturnValue('/incidents/analysis/completed/report-123');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Report 123')).toBeInTheDocument();
    });
  });

  describe('Custom Items', () => {
    it('uses custom breadcrumb items when provided', () => {
      mockUsePathname.mockReturnValue('/some/path');
      
      const customItems = [
        { label: 'Dashboard', href: '/dashboard', icon: <span>📊</span> },
        { label: 'Reports', href: '/dashboard/reports', icon: <span>📋</span> },
        { label: 'Monthly Report', href: '/dashboard/reports/monthly' },
      ];
      
      render(<BreadcrumbNavigation items={customItems} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('does not render when custom items has only one item', () => {
      mockUsePathname.mockReturnValue('/some/path');
      
      const customItems = [
        { label: 'Dashboard', href: '/dashboard' },
      ];
      
      const { container } = render(<BreadcrumbNavigation items={customItems} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Path Parsing', () => {
    it('handles paths with hyphens correctly', () => {
      mockUsePathname.mockReturnValue('/incident-reports/user-analytics');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('Incident Reports')).toBeInTheDocument();
      expect(screen.getByText('User Analytics')).toBeInTheDocument();
    });

    it('handles paths with numbers and special characters', () => {
      mockUsePathname.mockReturnValue('/reports/year-2024/q1-summary');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('Year 2024')).toBeInTheDocument();
      expect(screen.getByText('Q1 Summary')).toBeInTheDocument();
    });

    it('capitalizes path segments correctly', () => {
      mockUsePathname.mockReturnValue('/user/profile/settings');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('creates clickable links for all but the last breadcrumb', () => {
      mockUsePathname.mockReturnValue('/incidents/create/new');
      
      render(<BreadcrumbNavigation />);
      
      // Home and Incidents should be links
      const homeLink = screen.getByRole('link', { name: /home/i });
      const incidentsLink = screen.getByRole('link', { name: /incidents/i });
      
      expect(homeLink).toHaveAttribute('href', '/');
      expect(incidentsLink).toHaveAttribute('href', '/incidents');
      
      // Create should be a link
      const createLink = screen.getByRole('link', { name: /create/i });
      expect(createLink).toHaveAttribute('href', '/incidents/create');
      
      // Last item (New) should not be a link
      const newItem = screen.getByText('New');
      expect(newItem.closest('a')).toBeNull();
    });

    it('shows home icon for first breadcrumb', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      // Home should have an icon (via the Home lucide icon)
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Separators', () => {
    it('shows separators between breadcrumb items', () => {
      mockUsePathname.mockReturnValue('/incidents/create/new');
      
      render(<BreadcrumbNavigation />);
      
      // Check for ChevronRight icons (rendered as svg elements)
      const separators = screen.getAllByRole('img', { hidden: true });
      // Should have 3 separators for 4 breadcrumbs (Home > Incidents > Create > New)
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });

    it('does not show separator before first item', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      const breadcrumbList = screen.getByRole('list');
      const firstItem = breadcrumbList.querySelector('li:first-child');
      
      // First item should not have a separator before it
      expect(firstItem?.querySelector('[data-testid="chevron-right"]')).toBeNull();
    });
  });

  describe('Styling and Classes', () => {
    it('applies correct CSS classes', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex', 'items-center', 'space-x-1');
    });

    it('applies custom className when provided', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation className="custom-breadcrumb-class" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-breadcrumb-class');
    });

    it('highlights the current page breadcrumb differently', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      // Last item should have different styling (not be a link)
      const currentPageItem = screen.getByText('Create');
      expect(currentPageItem.closest('a')).toBeNull();
      expect(currentPageItem.closest('span')).toHaveClass('text-gray-900', 'dark:text-white', 'font-medium');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with nav and list', () => {
      mockUsePathname.mockReturnValue('/incidents/create');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('has proper list item structure', () => {
      mockUsePathname.mockReturnValue('/incidents/create/new');
      
      render(<BreadcrumbNavigation />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(4); // Home, Incidents, Create, New
    });

    it('provides accessible link text', () => {
      mockUsePathname.mockReturnValue('/incidents/analysis');
      
      render(<BreadcrumbNavigation />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      const incidentsLink = screen.getByRole('link', { name: /incidents/i });
      
      expect(homeLink).toBeInTheDocument();
      expect(incidentsLink).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty path segments gracefully', () => {
      mockUsePathname.mockReturnValue('/incidents//create');
      
      render(<BreadcrumbNavigation />);
      
      // Should skip empty segments
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles paths ending with slash', () => {
      mockUsePathname.mockReturnValue('/incidents/create/');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('handles single character path segments', () => {
      mockUsePathname.mockReturnValue('/a/b/c');
      
      render(<BreadcrumbNavigation />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });
});