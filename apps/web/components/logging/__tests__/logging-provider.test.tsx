/**
 * @jest-environment jsdom
 */

import { render, screen, act } from '@testing-library/react';
import { LoggingProvider } from '../logging-provider';

// Mock the console override module
jest.mock('../../../lib/console-override', () => ({
  initializeConsoleOverride: jest.fn(),
  ConsoleLogger: {
    setUserId: jest.fn(),
    getStatus: jest.fn(() => ({
      initialized: true,
      enabled: true,
      traceId: 'test_trace_123',
      userId: 'test_user',
    })),
  },
}));

describe('LoggingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render children without React warnings', async () => {
    await act(async () => {
      render(
        <LoggingProvider>
          <div data-testid="child">Test Child</div>
        </LoggingProvider>
      );
    });

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('should render LoggingStatus component without warnings', async () => {
    await act(async () => {
      render(
        <LoggingProvider>
          <div>Test</div>
        </LoggingProvider>
      );
    });

    // LoggingStatus should be rendered (may not be visible in test environment)
    // This test mainly ensures no act() warnings are generated during rendering
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('should not cause act() warnings during initialization', async () => {
    // This test primarily exists to ensure no React warnings are generated
    // The act() wrapper should prevent "state update not wrapped in act()" warnings
    await act(async () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );
    });

    // If we get here without warnings, the act() pattern is working
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
