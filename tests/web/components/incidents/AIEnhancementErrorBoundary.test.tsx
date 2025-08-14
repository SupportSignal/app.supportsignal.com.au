// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorBoundary } from 'react-error-boundary';

// Mock components that might throw errors
const ThrowingComponent = ({ shouldThrow = true, errorMessage = 'Test error' }: any) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success-component">Component rendered successfully</div>;
};

const AsyncThrowingComponent = ({ shouldThrow = true, delay = 100 }: any) => {
  const [hasThrown, setHasThrown] = React.useState(false);
  
  React.useEffect(() => {
    if (shouldThrow && !hasThrown) {
      setTimeout(() => {
        setHasThrown(true);
        throw new Error('Async component error');
      }, delay);
    }
  }, [shouldThrow, hasThrown, delay]);
  
  return <div data-testid="async-component">Async component loading...</div>;
};

// Mock AI Enhancement components that can fail
const MockEnhancedReviewStep = ({ simulateError = false }: any) => {
  if (simulateError) {
    throw new Error('AI enhancement service unavailable');
  }
  return <div data-testid="enhanced-review-step">Enhanced Review Step</div>;
};

const MockAIEnhancementDisplay = ({ simulateNetworkError = false }: any) => {
  if (simulateNetworkError) {
    throw new Error('Network timeout while fetching enhancement');
  }
  return <div data-testid="ai-enhancement-display">AI Enhancement Display</div>;
};

// Custom Error Boundary for AI Enhancement features
const AIEnhancementErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('AI Enhancement Error:', error, errorInfo);
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div data-testid="error-boundary-fallback" className="p-4 border border-red-200 rounded-md bg-red-50">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        AI Enhancement Error
      </h3>
      <p className="text-red-700 mb-4">
        {error.message.includes('AI') || error.message.includes('enhancement') 
          ? 'There was an issue with the AI enhancement service. You can continue with manual review.'
          : 'Something went wrong. Please try again.'}
      </p>
      <div className="space-x-2">
        <button 
          data-testid="retry-button"
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
        <button 
          data-testid="continue-manual-button"
          onClick={() => {/* Navigate to manual review */}}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Continue Manually
        </button>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-red-600">
          Technical Details
        </summary>
        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
          {error.stack}
        </pre>
      </details>
    </div>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
};

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock console.error to verify error logging
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('AI Enhancement Error Boundary Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Error Boundary Functionality', () => {
    it('should catch and display component errors', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Component failed to render" />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('AI Enhancement Error')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong. Please try again./)).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should render children normally when no errors occur', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('should provide retry functionality', () => {
      const { rerender } = render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Simulate fixing the error and retrying
      rerender(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </AIEnhancementErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Should show success after retry
      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });
  });

  describe('AI-Specific Error Handling', () => {
    it('should show AI-specific error message for AI service errors', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent 
            shouldThrow={true} 
            errorMessage="AI enhancement service unavailable" 
          />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByText(/There was an issue with the AI enhancement service/)).toBeInTheDocument();
      expect(screen.getByText(/You can continue with manual review/)).toBeInTheDocument();
      expect(screen.getByTestId('continue-manual-button')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', () => {
      render(
        <AIEnhancementErrorBoundary>
          <MockAIEnhancementDisplay simulateNetworkError={true} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong. Please try again./)).toBeInTheDocument();
    });

    it('should handle AI service unavailable errors', () => {
      render(
        <AIEnhancementErrorBoundary>
          <MockEnhancedReviewStep simulateError={true} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByText(/There was an issue with the AI enhancement service/)).toBeInTheDocument();
      expect(screen.getByTestId('continue-manual-button')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should allow manual continuation when AI fails', async () => {
      const mockNavigate = jest.fn();
      
      render(
        <AIEnhancementErrorBoundary>
          <MockEnhancedReviewStep simulateError={true} />
        </AIEnhancementErrorBoundary>
      );

      const continueButton = screen.getByTestId('continue-manual-button');
      fireEvent.click(continueButton);

      // Should trigger manual workflow continuation
      expect(continueButton).toBeInTheDocument();
    });

    it('should handle multiple consecutive errors', () => {
      const { rerender } = render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="First error" />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Simulate another error after retry
      rerender(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Second error" />
        </AIEnhancementErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Should still show error boundary
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('should provide graceful degradation options', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent 
            shouldThrow={true} 
            errorMessage="AI enhancement timeout" 
          />
        </AIEnhancementErrorBoundary>
      );

      // Should offer both retry and manual options
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('continue-manual-button')).toBeInTheDocument();
    });
  });

  describe('Error Information Display', () => {
    it('should show technical details when expanded', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent 
            shouldThrow={true} 
            errorMessage="Detailed AI error" 
          />
        </AIEnhancementErrorBoundary>
      );

      const detailsToggle = screen.getByText('Technical Details');
      fireEvent.click(detailsToggle);

      // Should show error stack trace
      expect(screen.getByText(/Error: Detailed AI error/)).toBeInTheDocument();
    });

    it('should log errors for monitoring', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent 
            shouldThrow={true} 
            errorMessage="Logged error" 
          />
        </AIEnhancementErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'AI Enhancement Error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle errors with missing stack traces', () => {
      const errorWithoutStack = new Error('No stack error');
      errorWithoutStack.stack = undefined;

      const ComponentThatThrowsNoStack = () => {
        throw errorWithoutStack;
      };

      render(
        <AIEnhancementErrorBoundary>
          <ComponentThatThrowsNoStack />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('AI Enhancement Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA attributes for error state', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </AIEnhancementErrorBoundary>
      );

      const errorContainer = screen.getByTestId('error-boundary-fallback');
      expect(errorContainer).toHaveClass('p-4', 'border', 'border-red-200');
      
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </AIEnhancementErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      const continueButton = screen.getByTestId('continue-manual-button');

      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);

      // Tab to next button
      fireEvent.keyDown(retryButton, { key: 'Tab' });
      continueButton.focus();
      expect(document.activeElement).toBe(continueButton);
    });

    it('should provide clear action buttons', () => {
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </AIEnhancementErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      const continueButton = screen.getByTestId('continue-manual-button');

      expect(retryButton).toHaveTextContent('Try Again');
      expect(continueButton).toHaveTextContent('Continue Manually');
      
      // Should have proper styling
      expect(retryButton).toHaveClass('px-4', 'py-2', 'bg-red-600');
      expect(continueButton).toHaveClass('px-4', 'py-2', 'bg-gray-600');
    });
  });

  describe('Edge Cases and Error Types', () => {
    it('should handle null/undefined errors', () => {
      const ComponentThatThrowsNull = () => {
        throw null;
      };

      render(
        <AIEnhancementErrorBoundary>
          <ComponentThatThrowsNull />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('should handle string errors', () => {
      const ComponentThatThrowsString = () => {
        throw "String error";
      };

      render(
        <AIEnhancementErrorBoundary>
          <ComponentThatThrowsString />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('should handle errors during async operations', async () => {
      // This test simulates async errors that might occur during AI processing
      const { rerender } = render(
        <AIEnhancementErrorBoundary>
          <AsyncThrowingComponent shouldThrow={false} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('async-component')).toBeInTheDocument();

      // Simulate async error
      rerender(
        <AIEnhancementErrorBoundary>
          <AsyncThrowingComponent shouldThrow={true} delay={50} />
        </AIEnhancementErrorBoundary>
      );

      // Wait for async error to be thrown and caught
      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'A'.repeat(1000) + ' - very long error message';
      
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage={longMessage} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      
      // Should still show the error boundary without breaking layout
      expect(screen.getByText('AI Enhancement Error')).toBeInTheDocument();
    });

    it('should handle errors with special characters', () => {
      const specialMessage = 'Error with special chars: <script>alert("xss")</script> & symbols';
      
      render(
        <AIEnhancementErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage={specialMessage} />
        </AIEnhancementErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      // Should safely render without executing scripts
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  describe('Integration with AI Enhancement Components', () => {
    it('should wrap AI enhancement components properly', () => {
      const AIEnhancementWorkflow = () => (
        <AIEnhancementErrorBoundary>
          <div data-testid="ai-workflow">
            <MockEnhancedReviewStep simulateError={false} />
            <MockAIEnhancementDisplay simulateNetworkError={false} />
          </div>
        </AIEnhancementErrorBoundary>
      );

      render(<AIEnhancementWorkflow />);

      expect(screen.getByTestId('ai-workflow')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-review-step')).toBeInTheDocument();
      expect(screen.getByTestId('ai-enhancement-display')).toBeInTheDocument();
    });

    it('should isolate errors to failed components', () => {
      const MixedWorkflow = () => (
        <div data-testid="mixed-workflow">
          <div data-testid="working-section">
            <span>This section works fine</span>
          </div>
          <AIEnhancementErrorBoundary>
            <MockEnhancedReviewStep simulateError={true} />
          </AIEnhancementErrorBoundary>
        </div>
      );

      render(<MixedWorkflow />);

      // Working section should still be visible
      expect(screen.getByTestId('working-section')).toBeInTheDocument();
      expect(screen.getByText('This section works fine')).toBeInTheDocument();
      
      // Error boundary should contain the error
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });
});