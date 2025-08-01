import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import { ThemeProvider } from '../theme-provider';
import { ThemeToggle } from '../theme-toggle';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock next-themes with more realistic behavior
const mockSetTheme = jest.fn();
let mockTheme = 'light';

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: any) => {
    // Create a mock context provider
    return (
      <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
        {children}
      </div>
    );
  },
  useTheme: () => ({
    theme: mockTheme,
    setTheme: (newTheme: string) => {
      mockTheme = newTheme;
      mockSetTheme(newTheme);
      // Simulate localStorage behavior
      localStorageMock.setItem('theme', newTheme);
    },
    systemTheme: 'light',
    themes: ['light', 'dark', 'system'],
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">🌙</div>,
  Sun: () => <div data-testid="sun-icon">☀️</div>,
}));

describe('Theme Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render ThemeProvider with correct configuration', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div>Test App</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    expect(provider).toBeInTheDocument();

    const props = JSON.parse(provider.getAttribute('data-props') || '{}');
    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('system');
    expect(props.enableSystem).toBe(true);
    expect(props.disableTransitionOnChange).toBe(true);
  });

  it('should integrate ThemeProvider and ThemeToggle correctly', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('should persist theme changes to localStorage', async () => {
    const TestComponent = () => {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeToggle />
        </ThemeProvider>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should handle theme switching between light and dark', async () => {
    const TestComponent = () => {
      return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ThemeToggle />
        </ThemeProvider>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Initial state should be light with moon icon
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    // Click to switch to dark
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should render app content correctly', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div data-testid="app">App Content</div>
      </ThemeProvider>
    );

    // The app content should render
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('should handle system theme preference', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeToggle />
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.defaultTheme).toBe('system');
    expect(props.enableSystem).toBe(true);
  });
});
