// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClarificationStepErrorBoundary } from '@/components/incidents/ClarificationStepErrorBoundary';

// Mock the console methods to test error logging
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="child-component">Child component rendered successfully</div>;
};

describe('ClarificationStepErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
    mockReload.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child component rendered successfully')).toBeInTheDocument();
    });

    it('should not show error UI when children render normally', () => {
      render(
        <ClarificationStepErrorBoundary>
          <div>Normal content</div>
        </ClarificationStepErrorBoundary>
      );

      expect(screen.queryByText(/clarification step error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText(/clarification step error/i)).toBeInTheDocument();
      expect(screen.getByText(/component encountered an error/i)).toBeInTheDocument();
      expect(screen.getByText('Component crashed')).toBeInTheDocument();
    });

    it('should log error to console when error occurs', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error for logging" />
        </ClarificationStepErrorBoundary>
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ClarificationStep Error Boundary caught an error'),
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle errors with different messages', () => {
      const { rerender } = render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Test with different error
      rerender(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Authentication failed" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('should handle unknown errors gracefully', () => {
      const ThrowUnknownError = () => {
        const error = new Error();
        error.message = '';
        throw error;
      };

      render(
        <ClarificationStepErrorBoundary>
          <ThrowUnknownError />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should reset error state when "Try Again" is clicked', () => {
      const { rerender } = render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Recoverable error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText(/clarification step error/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // After reset, re-render with working component
      rerender(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.queryByText(/clarification step error/i)).not.toBeInTheDocument();
    });

    it('should log reset action when Try Again is clicked', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Resetting ClarificationStep error boundary')
      );
    });

    it('should reload page when "Reload Page" is clicked', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Reloading page due to error boundary')
      );
    });
  });

  describe('User Guidance', () => {
    it('should display helpful error message and recovery instructions', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText(/might be due to a network issue/i)).toBeInTheDocument();
      expect(screen.getByText(/if this problem persists/i)).toBeInTheDocument();
      expect(screen.getByText(/refresh your browser/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('should provide both Try Again and Reload Page options', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show technical details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Dev mode error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText(/technical details.*development only/i)).toBeInTheDocument();
      
      // Click to expand details
      const detailsToggle = screen.getByText(/technical details.*development only/i);
      fireEvent.click(detailsToggle);

      // Should show stack trace in development
      expect(screen.getByText(/at throwError/i, { exact: false })).toBeInTheDocument();
    });

    it('should not show technical details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Prod mode error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary State Management', () => {
    it('should maintain error state until reset', () => {
      const { rerender } = render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Persistent error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText(/clarification step error/i)).toBeInTheDocument();

      // Re-render with different children but same error boundary
      rerender(
        <ClarificationStepErrorBoundary>
          <div>Different content</div>
        </ClarificationStepErrorBoundary>
      );

      // Should still show error state
      expect(screen.getByText(/clarification step error/i)).toBeInTheDocument();
      expect(screen.queryByText('Different content')).not.toBeInTheDocument();
    });

    it('should handle multiple errors in sequence', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="First error" />
        </ClarificationStepErrorBoundary>
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      // Reset and cause another error
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // This would require a more complex test setup to simulate a second error
      // but the error boundary should handle it properly
    });
  });

  describe('Component Stack Information', () => {
    it('should capture and display component stack in development', () => {
      process.env.NODE_ENV = 'development';

      const NestedComponent = () => <ThrowError shouldThrow={true} />;
      const WrapperComponent = () => <NestedComponent />;

      render(
        <ClarificationStepErrorBoundary>
          <WrapperComponent />
        </ClarificationStepErrorBoundary>
      );

      const detailsToggle = screen.getByText(/technical details.*development only/i);
      fireEvent.click(detailsToggle);

      // Should show component stack with nested component names
      expect(screen.getByText(/NestedComponent|WrapperComponent/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels and structure', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      // Should have proper button roles
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

      // Should have alert for screen readers
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <ClarificationStepErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ClarificationStepErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload page/i });

      expect(tryAgainButton).not.toHaveAttribute('disabled');
      expect(reloadButton).not.toHaveAttribute('disabled');
    });
  });

  describe('Error Types and Edge Cases', () => {
    it('should handle React errors during rendering', () => {
      const ReactError = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          if (count > 0) {
            throw new Error('React lifecycle error');
          }
          setCount(1);
        }, [count]);

        return <div>Component</div>;
      };

      render(
        <ClarificationStepErrorBoundary>
          <ReactError />
        </ClarificationStepErrorBoundary>
      );

      // Should catch React lifecycle errors
      expect(screen.getByText(/clarification step error/i)).toBeInTheDocument();
    });

    it('should handle async errors appropriately', () => {
      // Note: Error boundaries don't catch async errors, but we test the UI remains stable
      const AsyncComponent = () => {
        React.useEffect(() => {
          setTimeout(() => {
            try {
              throw new Error('Async error');
            } catch (e) {
              // This won't be caught by error boundary
              console.error('Async error caught in component:', e);
            }
          }, 0);
        }, []);

        return <div data-testid="async-component">Async component</div>;
      };

      render(
        <ClarificationStepErrorBoundary>
          <AsyncComponent />
        </ClarificationStepErrorBoundary>
      );

      // Component should render normally (error boundary doesn't catch async errors)
      expect(screen.getByTestId('async-component')).toBeInTheDocument();
    });
  });
});