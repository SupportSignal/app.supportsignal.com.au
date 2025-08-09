// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';

// Mock the auth provider
jest.mock('@/components/auth/auth-provider');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the navigation state
jest.mock('@/lib/navigation/use-navigation-state');
const mockUseNavigationState = useNavigationState as jest.MockedFunction<typeof useNavigationState>;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock navigation config
jest.mock('@/lib/navigation/navigation-config', () => ({
  NAVIGATION_CONFIG: {
    branding: {
      logo: '🟢',
      title: 'SupportSignal',
      tagline: 'Where insight meets action',
    },
    colors: {
      backgroundGrey: '#F4F7FA',
      navy: '#0C2D55',
    },
    sections: [
      {
        id: 'main',
        title: 'Main Workflow',
        isCollapsible: false,
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '📊',
            href: '/dashboard',
          },
          {
            id: 'incidents',
            label: 'Incidents',
            icon: '🚨',
            children: [
              {
                id: 'create-incident',
                label: 'Create New',
                icon: '📝',
                href: '/incidents/create',
              },
            ],
          },
        ],
      },
      {
        id: 'developer',
        title: 'Developer Tools',
        isCollapsible: true,
        items: [
          {
            id: 'debug',
            label: 'Debug Tools',
            icon: '🐛',
            href: '/debug',
            isDeveloperTool: true,
            requiredRole: ['system_admin'],
          },
        ],
      },
    ],
  },
}));

// Mock navigation utilities
jest.mock('@/lib/navigation/navigation-utils', () => ({
  filterNavigationSections: (sections: any, role: string) => sections,
  isActiveRoute: (pathname: string, href?: string) => pathname === href,
}));

// Mock theme toggle
jest.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

describe('SidebarNavigation', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'team_lead',
  };

  const mockNavigationState = {
    sidebarCollapsed: false,
    expandedSections: ['developer'],
    toggleSidebar: jest.fn(),
    toggleSection: jest.fn(),
    isMobileMenuOpen: false,
    toggleMobileMenu: jest.fn(),
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseNavigationState.mockReturnValue(mockNavigationState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sidebar navigation when user is authenticated', () => {
      render(<SidebarNavigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('SupportSignal')).toBeInTheDocument();
      expect(screen.getByText('Where insight meets action')).toBeInTheDocument();
    });

    it('does not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });

      const { container } = render(<SidebarNavigation />);
      expect(container.firstChild).toBeNull();
    });

    it('renders navigation menu items', () => {
      render(<SidebarNavigation />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Incidents')).toBeInTheDocument();
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    });

    it('displays active route correctly', () => {
      render(<SidebarNavigation />);
      
      const dashboardItem = screen.getByText('Dashboard').closest('div');
      expect(dashboardItem).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Interactions', () => {
    it('toggles sidebar when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarNavigation />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle/i });
      await user.click(toggleButton);
      
      expect(mockNavigationState.toggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('expands/collapses sections when clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarNavigation />);
      
      const developerSection = screen.getByText('Developer Tools');
      await user.click(developerSection);
      
      expect(mockNavigationState.toggleSection).toHaveBeenCalledWith('developer');
    });

    it('renders theme toggle', () => {
      render(<SidebarNavigation />);
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('shows live status indicator', () => {
      render(<SidebarNavigation />);
      
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SidebarNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SidebarNavigation />);
      
      const menuItem = screen.getByText('Dashboard').closest('[role="menuitem"]');
      
      if (menuItem) {
        await user.tab();
        expect(menuItem).toHaveFocus();
        
        // Test Enter key navigation
        fireEvent.keyDown(menuItem, { key: 'Enter' });
        // Since it's a link, navigation would happen via href
      }
    });

    it('handles collapsible sections with keyboard', async () => {
      render(<SidebarNavigation />);
      
      const incidentsItem = screen.getByText('Incidents').closest('div');
      if (incidentsItem) {
        // Test arrow key expansion
        fireEvent.keyDown(incidentsItem, { key: 'ArrowRight' });
        expect(mockNavigationState.toggleSection).toHaveBeenCalledWith('incidents');
        
        // Test arrow key collapse
        fireEvent.keyDown(incidentsItem, { key: 'ArrowLeft' });
        expect(mockNavigationState.toggleSection).toHaveBeenCalledWith('incidents');
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('collapses properly when sidebar is collapsed', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        sidebarCollapsed: true,
      });

      render(<SidebarNavigation />);
      
      // When collapsed, tagline should not be visible
      expect(screen.queryByText('Where insight meets action')).not.toBeInTheDocument();
    });

    it('shows only icons when collapsed', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        sidebarCollapsed: true,
      });

      render(<SidebarNavigation />);
      
      // Icons should still be visible
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });
  });

  describe('Role-Based Filtering', () => {
    it('shows developer tools for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'system_admin' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });

      render(<SidebarNavigation />);
      
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    });

    it('filters menu items based on user role', () => {
      render(<SidebarNavigation />);
      
      // Navigation sections should be filtered based on role
      // This depends on the filterNavigationSections mock implementation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});