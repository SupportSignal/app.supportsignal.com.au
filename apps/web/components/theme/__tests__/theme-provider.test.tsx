import React from 'react';
import { render, screen } from '@/lib/test-utils';
import { ThemeProvider } from '../theme-provider';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    attribute,
    defaultTheme,
    enableSystem,
    disableTransitionOnChange,
  }: any) => {
    // Mock the theme provider props
    const mockContext = {
      theme: 'light',
      setTheme: jest.fn(),
      systemTheme: 'light',
      themes: ['light', 'dark', 'system'],
    };

    return (
      <div
        data-testid="theme-provider"
        data-attribute={attribute}
        data-default-theme={defaultTheme}
        data-enable-system={enableSystem}
        data-disable-transition={disableTransitionOnChange}
      >
        {children}
      </div>
    );
  },
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should pass props to NextThemesProvider', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div>Test Child</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-attribute', 'class');
    expect(provider).toHaveAttribute('data-default-theme', 'system');
    expect(provider).toHaveAttribute('data-enable-system', 'true');
    expect(provider).toHaveAttribute('data-disable-transition', 'true');
  });

  it('should render without crashing when no props provided', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
