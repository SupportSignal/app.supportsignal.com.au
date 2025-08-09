// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderNavigation } from '@/components/layout/header-navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';

// Mock the auth provider
jest.mock('@/components/auth/auth-provider');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the navigation state
jest.mock('@/lib/navigation/use-navigation-state');
const mockUseNavigationState = useNavigationState as jest.MockedFunction<typeof useNavigationState>;

// Mock navigation config
jest.mock('@/lib/navigation/navigation-config', () => ({
  NAVIGATION_CONFIG: {
    branding: {
      logo: '🟢',
      title: 'SupportSignal',
      tagline: 'Where insight meets action',
    },
    colors: {
      navy: '#0C2D55',
    },
  },
}));

// Mock components
jest.mock('@/components/auth/logout-button', () => ({
  LogoutButton: () => <button data-testid="logout-button">Logout</button>,
}));

jest.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

jest.mock('./breadcrumb-navigation', () => ({
  BreadcrumbNavigation: () => <nav data-testid="breadcrumb">Breadcrumbs</nav>,
}));

describe('HeaderNavigation', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'team_lead',
  };

  const mockNavigationState = {
    toggleMobileMenu: jest.fn(),
    sidebarCollapsed: false,
    expandedSections: [],
    toggleSidebar: jest.fn(),
    toggleSection: jest.fn(),
    isMobileMenuOpen: false,
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

  describe('Rendering for Signed-in Users', () => {
    it('renders header with branding for signed-in users', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('SupportSignal')).toBeInTheDocument();
      expect(screen.getByText('Where insight meets action')).toBeInTheDocument();
    });

    it('displays search input for signed-in users', () => {
      render(<HeaderNavigation />);
      
      const searchInput = screen.getByLabelText('Search');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search... (⌘K)');
    });

    it('shows mobile menu button for signed-in users', () => {
      render(<HeaderNavigation />);
      
      // Mobile menu button should be present but hidden on desktop
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveClass('md:hidden');
    });

    it('displays user profile information', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getAllByText('Test User')).toHaveLength(3); // Profile button + dropdowns
    });

    it('shows notification bell', () => {
      render(<HeaderNavigation />);
      
      const notificationButton = screen.getByRole('button', { name: /bell/i });
      expect(notificationButton).toBeInTheDocument();
    });

    it('renders settings dropdown', () => {
      render(<HeaderNavigation />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('displays breadcrumb navigation', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    });
  });

  describe('Rendering for Signed-out Users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });
    });

    it('renders header with branding for signed-out users', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByText('SupportSignal')).toBeInTheDocument();
      expect(screen.getByText('Where insight meets action')).toBeInTheDocument();
    });

    it('shows sign in and sign up links', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('does not show search input for signed-out users', () => {
      render(<HeaderNavigation />);
      
      expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
    });

    it('does not show mobile menu button for signed-out users', () => {
      render(<HeaderNavigation />);
      
      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
    });

    it('does not display breadcrumb navigation', () => {
      render(<HeaderNavigation />);
      
      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
    });

    it('shows theme toggle for signed-out users', () => {
      render(<HeaderNavigation />);
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('toggles mobile menu when mobile button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderNavigation />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(mobileMenuButton);
      
      expect(mockNavigationState.toggleMobileMenu).toHaveBeenCalledTimes(1);
    });

    it('opens settings dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderNavigation />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      // Check if dropdown content appears
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Profile Settings')).toBeInTheDocument();
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });
    });

    it('opens user profile dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderNavigation />);
      
      const userButtons = screen.getAllByRole('button', { name: /test user/i });
      await user.click(userButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard shortcut for search', async () => {
      render(<HeaderNavigation />);
      
      const searchInput = screen.getByLabelText('Search');
      
      // Test Cmd+K shortcut
      fireEvent.keyDown(searchInput, { key: 'k', metaKey: true });
      
      expect(searchInput).toHaveFocus();
    });

    it('supports Ctrl+K shortcut for search', async () => {
      render(<HeaderNavigation />);
      
      const searchInput = screen.getByLabelText('Search');
      
      // Test Ctrl+K shortcut
      fireEvent.keyDown(searchInput, { key: 'k', ctrlKey: true });
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute for header', () => {
      render(<HeaderNavigation />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('has accessible search input', () => {
      render(<HeaderNavigation />);
      
      const searchInput = screen.getByLabelText('Search');
      expect(searchInput).toHaveAttribute('aria-label', 'Search');
    });

    it('provides proper focus management', async () => {
      const user = userEvent.setup();
      render(<HeaderNavigation />);
      
      // Tab through focusable elements
      await user.tab();
      
      // First focusable element should receive focus
      const searchInput = screen.getByLabelText('Search');
      expect(searchInput).toHaveFocus();
    });

    it('has proper ARIA labels for buttons', () => {
      render(<HeaderNavigation />);
      
      const notificationButton = screen.getByRole('button', { name: /bell/i });
      expect(notificationButton).toBeInTheDocument();
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('hides branding text on small screens', () => {
      render(<HeaderNavigation />);
      
      const brandingContainer = screen.getByText('SupportSignal').closest('div');
      expect(brandingContainer).toHaveClass('hidden', 'sm:block');
    });

    it('hides search on mobile screens', () => {
      render(<HeaderNavigation />);
      
      const searchContainer = screen.getByLabelText('Search').closest('div');
      expect(searchContainer?.parentElement).toHaveClass('hidden', 'md:flex');
    });

    it('shows user name only on larger screens in profile button', () => {
      render(<HeaderNavigation />);
      
      const userName = screen.getByText('Test User').closest('span');
      expect(userName).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('Navigation Links', () => {
    it('provides correct navigation links for signed-out users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });

      render(<HeaderNavigation />);
      
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      
      expect(signInLink).toHaveAttribute('href', '/login');
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('provides home link in branding', () => {
      render(<HeaderNavigation />);
      
      const homeLink = screen.getByRole('link', { name: /supportsignal/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});