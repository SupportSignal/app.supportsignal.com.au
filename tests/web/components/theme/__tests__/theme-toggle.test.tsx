import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';

// Mock next-themes
const mockSetTheme = jest.fn();
let mockTheme = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Moon: ({ className, ...props }: any) => (
    <svg data-testid="moon-icon" className={className} {...props}>
      <title>Moon</title>
    </svg>
  ),
  Sun: ({ className, ...props }: any) => (
    <svg data-testid="sun-icon" className={className} {...props}>
      <title>Sun</title>
    </svg>
  ),
}));

// Import after mocking
const { ThemeToggle } = require('../theme-toggle');

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
  });

  it('should render the theme toggle button', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should display moon icon when theme is light', async () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });
  });

  it('should call setTheme when clicked', async () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Wait for component to mount and then click
    await waitFor(() => {
      expect(button).toBeInTheDocument();
    });

    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should have proper accessibility attributes', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('should handle component mounting state', async () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    // Component should render button
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('should render with dark theme', async () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });
});
