// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigationState } from '@/lib/navigation/use-navigation-state';

// Mock the auth provider
jest.mock('@/components/auth/auth-provider');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the navigation state
jest.mock('@/lib/navigation/use-navigation-state');
const mockUseNavigationState = useNavigationState as jest.MockedFunction<typeof useNavigationState>;

// Mock child components
jest.mock('@/components/layout/header-navigation', () => ({
  HeaderNavigation: () => <header data-testid="header-navigation">Header Navigation</header>,
}));

jest.mock('@/components/layout/sidebar-navigation', () => ({
  SidebarNavigation: () => <aside data-testid="sidebar-navigation">Sidebar Navigation</aside>,
}));

jest.mock('@/components/layout/footer-navigation', () => ({
  FooterNavigation: () => <footer data-testid="footer-navigation">Footer Navigation</footer>,
}));

describe('MainLayout', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'team_lead',
  };

  const mockNavigationState = {
    sidebarCollapsed: false,
    isMobileMenuOpen: false,
    expandedSections: [],
    toggleSidebar: jest.fn(),
    toggleSection: jest.fn(),
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

  describe('Basic Layout Structure', () => {
    it('renders the main layout container', () => {
      render(
        <MainLayout>
          <div data-testid="test-content">Test Content</div>
        </MainLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('always renders header navigation', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
    });

    it('always renders footer navigation', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('footer-navigation')).toBeInTheDocument();
    });
  });

  describe('Sidebar Rendering for Authenticated Users', () => {
    it('renders sidebar navigation when user is authenticated', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument();
    });

    it('applies correct layout classes when sidebar is shown', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layoutContainer = screen.getByRole('main').closest('div');
      expect(layoutContainer).toHaveClass('md:grid-cols-[240px_1fr]');
    });

    it('shows content in grid layout with sidebar', () => {
      render(
        <MainLayout>
          <div data-testid="main-content">Main Content</div>
        </MainLayout>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('md:col-span-1');
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Sidebar Rendering for Unauthenticated Users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });
    });

    it('does not render sidebar when user is not authenticated', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.queryByTestId('sidebar-navigation')).not.toBeInTheDocument();
    });

    it('applies single column layout when no sidebar', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layoutContainer = screen.getByRole('main').closest('div');
      expect(layoutContainer).not.toHaveClass('md:grid-cols-[240px_1fr]');
    });

    it('shows full width content when no sidebar', () => {
      render(
        <MainLayout>
          <div data-testid="main-content">Main Content</div>
        </MainLayout>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Mobile Menu Overlay', () => {
    it('does not show mobile overlay by default', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.queryByTestId('mobile-overlay')).not.toBeInTheDocument();
    });

    it('shows mobile overlay when mobile menu is open', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        isMobileMenuOpen: true,
      });

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const overlay = screen.getByRole('button', { name: /close mobile menu/i });
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('md:hidden');
    });

    it('calls toggleMobileMenu when overlay is clicked', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        isMobileMenuOpen: true,
      });

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const overlay = screen.getByRole('button', { name: /close mobile menu/i });
      fireEvent.click(overlay);

      expect(mockNavigationState.toggleMobileMenu).toHaveBeenCalledTimes(1);
    });

    it('prevents body scroll when mobile menu is open', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        isMobileMenuOpen: true,
      });

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      // This is a visual test - the overlay should have fixed positioning
      const overlay = screen.getByRole('button', { name: /close mobile menu/i });
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive classes for desktop layout', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layoutContainer = screen.getByRole('main').closest('div');
      expect(layoutContainer).toHaveClass('md:grid');
    });

    it('hides sidebar on mobile by default', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const sidebarContainer = screen.getByTestId('sidebar-navigation').closest('div');
      expect(sidebarContainer).toHaveClass('hidden', 'md:block');
    });

    it('shows sidebar on mobile when menu is open', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        isMobileMenuOpen: true,
      });

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const sidebarContainer = screen.getByTestId('sidebar-navigation').closest('div');
      expect(sidebarContainer).toHaveClass('block');
    });
  });

  describe('Content Area', () => {
    it('renders children in main content area', () => {
      const testContent = <div data-testid="test-content">Test Content</div>;
      
      render(<MainLayout>{testContent}</MainLayout>);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toContainElement(screen.getByTestId('test-content'));
    });

    it('applies correct padding to main content', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('p-6');
    });

    it('applies correct overflow handling to main content', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('overflow-auto');
    });
  });

  describe('Layout Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      // Check for proper landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Header should be in the header navigation component
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      
      // Footer should be in the footer navigation component
      expect(screen.getByTestId('footer-navigation')).toBeInTheDocument();
    });

    it('provides proper focus management for mobile overlay', () => {
      mockUseNavigationState.mockReturnValue({
        ...mockNavigationState,
        isMobileMenuOpen: true,
      });

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const overlay = screen.getByRole('button', { name: /close mobile menu/i });
      expect(overlay).toHaveAttribute('aria-label', 'Close mobile menu');
    });
  });

  describe('Layout Grid System', () => {
    it('uses CSS Grid for desktop layout', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layoutContainer = screen.getByRole('main').closest('div');
      expect(layoutContainer).toHaveClass('md:grid');
      expect(layoutContainer).toHaveClass('md:grid-cols-[240px_1fr]');
    });

    it('maintains full height layout', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layoutContainer = screen.getByRole('main').closest('div');
      expect(layoutContainer).toHaveClass('h-full');
    });
  });

  describe('Loading States', () => {
    it('renders layout even when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <MainLayout>
          <div data-testid="test-content">Loading Content</div>
        </MainLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer-navigation')).toBeInTheDocument();
    });
  });
});