# React Act() Warning Prevention Patterns

## Overview

Comprehensive patterns for preventing React Testing Library `act()` warnings in test suites, based on Discovery Mode KDD session findings during CI failure investigation.

## Problem Statement

React Testing Library emits warnings when state updates occur outside of `act()` calls during testing. These warnings cause CI failures even when tests pass locally, creating a disconnect between local development and CI pipeline results.

### Common Warning Messages

```
Warning: An update to ComponentName inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
```

## Root Cause Analysis

### Discovery Session Context

- **Session Duration**: 45 minutes
- **Initial Problem**: "CI failing on React act() warnings"
- **Assumption**: "Local tests pass, so CI environment issue"
- **Discovery**: "State updates in provider components not wrapped in act()"

### Key Insights from Testing Architecture Review

1. **Provider Component Testing Gap**: Our testing patterns work well for form components but miss provider component `useEffect` patterns
2. **Timing Sensitivity**: Provider initialization happens in `useEffect`, creating async state updates not covered by existing patterns
3. **Environment Differences**: CI is more strict about React testing warnings than local development

## Act() Warning Prevention Patterns

### Pattern 1: Provider Component Testing

#### Problem Context

Testing components that use `useEffect` for initialization (like LoggingProvider, AuthProvider) without proper `act()` wrapping.

#### ❌ Anti-Pattern: Unguarded Provider Testing

```typescript
// DON'T DO THIS - Causes act() warnings
test('should initialize console override in development', () => {
  render(
    <LoggingProvider>
      <div>Test</div>
    </LoggingProvider>
  );
  // Provider's useEffect runs after render, causing unguarded state updates
  expect(initializeConsoleOverride).toHaveBeenCalled();
});
```

#### ✅ Correct Pattern: Act-Wrapped Provider Testing

```typescript
// CORRECT - Wrap render when testing providers with useEffect
test('should initialize console override in development', async () => {
  await act(async () => {
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );
  });

  expect(initializeConsoleOverride).toHaveBeenCalled();
});
```

### Pattern 2: Timer-Based State Updates

#### Problem Context

Testing components that use timers or delayed state updates.

#### ✅ Correct Pattern: Timer Advancement with Act

```typescript
// From established mock-email-viewer patterns
test('should handle countdown timers properly', async () => {
  jest.useFakeTimers();

  render(<ComponentWithTimer />);

  // Always wrap timer advancement in act()
  act(() => {
    jest.advanceTimersByTime(2000);
  });

  await waitFor(() => {
    expect(screen.getByText(/countdown: 3/i)).toBeInTheDocument();
  });

  jest.useRealTimers();
});
```

### Pattern 3: Form Interaction State Updates

#### Problem Context

Testing form submissions and interactions that trigger state changes.

#### ✅ Correct Pattern: State-Changing Interactions

```typescript
// From established change-password-form patterns
test('should handle form submission', async () => {
  render(
    <AuthProvider>
      <ChangePasswordForm />
    </AuthProvider>
  );

  // State-changing interactions need act() wrapping
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
  });

  await waitFor(() => {
    expect(mockAuthService.changePassword).toHaveBeenCalled();
  });
});
```

### Pattern 4: Async Effect Testing

#### Problem Context

Testing components with `useEffect` that performs async operations.

#### ✅ Correct Pattern: Async Effect Handling

```typescript
test('should handle async effects properly', async () => {
  const mockAsyncOperation = jest.fn().mockResolvedValue('success');

  await act(async () => {
    render(<ComponentWithAsyncEffect asyncFn={mockAsyncOperation} />);
  });

  // Wait for async effects to complete
  await waitFor(() => {
    expect(mockAsyncOperation).toHaveBeenCalled();
  });
});
```

## Provider-Specific Patterns

### LoggingProvider Testing Pattern

Based on our codebase analysis, LoggingProvider needs specific act() handling:

```typescript
describe('LoggingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.CLAUDE_LOGGING_ENABLED = 'true';
  });

  test('should render children and initialize properly', async () => {
    await act(async () => {
      render(
        <LoggingProvider>
          <div data-testid="child">Test Child</div>
        </LoggingProvider>
      );
    });

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(initializeConsoleOverride).toHaveBeenCalled();
  });

  test('should handle localStorage operations without warnings', async () => {
    mockLocalStorage.getItem.mockReturnValue('stored_user_123');

    await act(async () => {
      render(
        <LoggingProvider>
          <div>Test</div>
        </LoggingProvider>
      );
    });

    expect(ConsoleLogger.setUserId).toHaveBeenCalledWith('stored_user_123');
  });
});
```

### AuthProvider Testing Pattern

Our existing auth tests already follow good patterns:

```typescript
// ✅ GOOD - Already using act() properly in auth tests
await act(async () => {
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
});
```

## When to Use Act()

### Always Use Act() For:

1. **Provider component renders** with `useEffect` initialization
2. **Timer advancement** with `jest.advanceTimersByTime()`
3. **Form submissions** that trigger state updates
4. **Button clicks** that change component state
5. **Async operations** that update component state

### Act() Not Required For:

1. **Static component renders** without state changes
2. **Assertion-only operations** (expect calls)
3. **Mock setup and teardown**
4. **Query operations** that don't trigger updates

## Integration with Existing Testing Architecture

### Strategic Minimal Mocking + Act() Patterns

Combine our established mocking patterns with proper act() usage:

```typescript
// Mock external dependencies (not our components)
jest.mock('../../../lib/console-override', () => ({
  initializeConsoleOverride: jest.fn(),
  ConsoleLogger: {
    setUserId: jest.fn(),
    getStatus: jest.fn(() => ({ initialized: true })),
  },
}));

describe('Component with Provider', () => {
  test('should work with real provider and proper act()', async () => {
    // Use real provider, mock external service
    await act(async () => {
      render(
        <LoggingProvider>
          <AuthProvider>
            <ComponentUnderTest />
          </AuthProvider>
        </LoggingProvider>
      );
    });

    // Test real integration with act() protection
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(mockExternalService).toHaveBeenCalled();
  });
});
```

## CI/CD Integration Requirements

### Preventing CI Failures

1. **Local Validation**: Run tests locally with `npx jest` (not bun test)
2. **React Strict Mode**: Ensure tests pass in strict mode locally
3. **Environment Consistency**: Use same Node.js version in CI as locally
4. **Warning as Errors**: Configure CI to treat React warnings as failures

### CI Configuration Standards

```yaml
# .github/workflows/test.yml
test:
  env:
    NODE_ENV: test # Critical for React Testing Library
  steps:
    - name: Run tests with strict warnings
      run: |
        npm run test -- --verbose
        # Ensure React warnings fail the build
```

## Discovery Session Lessons

### Key Breakthrough Moments

1. **Recognition**: "CI failures aren't environment issues - they're revealing missing act() patterns"
2. **Pattern Gap**: "We have act() patterns for form interactions but not for provider initialization"
3. **Architecture Insight**: "Provider testing needs same rigor as component testing"

### Anti-Patterns Discovered

1. **Ignoring CI Warnings**: "Local tests pass" doesn't mean CI warnings are ignorable
2. **Provider Testing Exemption**: Thinking provider components don't need act() wrapping
3. **Timer Inconsistency**: Using act() for some timer operations but not others

## Implementation Checklist

### For New Provider Components

- [ ] Wrap initial render in `act()` if component has `useEffect`
- [ ] Use `act()` for any timer-based testing
- [ ] Test async initialization with proper `waitFor()` + `act()` combination
- [ ] Verify tests pass locally with React warnings enabled

### For Existing Components

- [ ] Review components with `useEffect` for missing `act()` wrapping
- [ ] Check timer-based operations use consistent `act()` patterns
- [ ] Ensure form interactions follow established `act()` patterns
- [ ] Validate CI passes with new `act()` patterns

### For CI Pipeline

- [ ] Configure React warnings to fail builds
- [ ] Use consistent Node.js and npm versions
- [ ] Set `NODE_ENV=test` for test steps
- [ ] Monitor for new warning patterns in future changes

## Success Metrics

### Immediate Impact

- **CI Stability**: No more "passing tests but failing CI" scenarios
- **Warning Elimination**: Zero React testing warnings in test output
- **Pattern Consistency**: All provider and interaction tests use proper `act()` patterns

### Long-term Benefits

- **Debugging Clarity**: React warnings surface real timing issues
- **Architecture Validation**: Proper async testing catches race conditions
- **Team Confidence**: CI results accurately reflect code quality

## Related Patterns

- **Strategic Minimal Mocking** (docs/patterns/testing-architecture-patterns.md)
- **Testing Infrastructure Standards** (docs/testing/technical/test-strategy-and-standards.md)
- **Discovery Mode KDD Protocol** (docs/methodology/discovery-mode-kdd-protocol.md)

## Key Insight

**"React act() warnings are architectural feedback - they reveal when our tests aren't properly modeling real user interaction timing."**

The solution isn't to suppress warnings, but to improve our testing patterns to match real-world React behavior patterns.
