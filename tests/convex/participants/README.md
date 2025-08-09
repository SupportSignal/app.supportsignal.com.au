# NDIS Participants Management Test Suite

This directory contains comprehensive tests for the NDIS Participants Management system implemented in Story 2.3.

## Test Structure

```
tests/convex/participants/
├── README.md                 # This file
├── fixtures.ts               # Test data and mock objects
├── create.test.ts           # Tests for participant creation
├── list.test.ts             # Tests for participant listing  
├── integration.test.ts      # End-to-end workflow tests
└── [other function tests]   # Additional Convex function tests
```

```
tests/web/components/participants/
├── ParticipantForm.test.tsx    # Form component tests
├── ParticipantList.test.tsx    # List component tests
└── [other component tests]     # Additional React component tests
```

## Coverage Areas

### 1. Unit Tests - Convex Functions
- **create.test.ts**: Participant creation with validation, permissions, and multi-tenant isolation
- **list.test.ts**: Participant listing with company scoping, search, filtering, and sorting
- Additional function tests for getById, update, updateStatus, search operations

### 2. Unit Tests - React Components  
- **ParticipantForm.test.tsx**: Form validation, submission, auto-save, accessibility
- **ParticipantList.test.tsx**: Data display, search, filtering, responsive design

### 3. Integration Tests
- **integration.test.ts**: End-to-end workflows, role-based access control, multi-tenant isolation

## Test Categories

### Functional Testing
- ✅ **Form Validation**: All field validation rules and error messages
- ✅ **CRUD Operations**: Create, read, update operations with proper audit trails  
- ✅ **Search & Filter**: Participant list search and filtering functionality
- ✅ **Duplicate Detection**: NDIS number uniqueness validation within company scope

### Security Testing  
- ✅ **Role-Based Access**: Permission enforcement for different user roles
- ✅ **Company Isolation**: Multi-tenant data separation verification
- ✅ **Session Management**: Authentication token validation and expiry handling

### Performance Testing
- ✅ **Large Data Sets**: Handling of 100+ participants efficiently
- ✅ **Search Performance**: Debounced search with filtering
- ✅ **Pagination**: Limit-based data loading

### Accessibility Testing
- ✅ **WCAG 2.1 AA Compliance**: Form and list interface accessibility  
- ✅ **Screen Reader Support**: Proper ARIA labels and announcements
- ✅ **Keyboard Navigation**: Full keyboard accessibility

### Mobile Responsiveness
- ✅ **Mobile Interface**: Responsive design testing across viewports
- ✅ **Touch Interactions**: Mobile-friendly form interactions

## Running the Tests

### Individual Test Suites

```bash
# Run Convex function tests
npx jest tests/convex/participants/

# Run specific test file
npx jest tests/convex/participants/create.test.ts

# Run React component tests  
cd apps/web && npm test -- tests/web/components/participants/

# Run specific component test
cd apps/web && npm test -- ParticipantForm.test.tsx
```

### With Coverage

```bash
# Convex tests with coverage
npx jest --coverage tests/convex/participants/

# Web component tests with coverage
cd apps/web && npm test -- --coverage tests/web/components/participants/
```

### Watch Mode (Development)

```bash
# Watch Convex tests
npx jest --watch tests/convex/participants/

# Watch React component tests
cd apps/web && npm test -- --watch tests/web/components/participants/
```

## Test Data and Fixtures

The `fixtures.ts` file provides comprehensive test data including:

- **Mock Users**: Different roles (system_admin, company_admin, team_lead, frontline_worker)
- **Mock Companies**: Multi-tenant test scenarios
- **Mock Participants**: Various participant types and statuses
- **Mock Sessions**: Authentication test data
- **Validation Data**: Valid and invalid form inputs
- **Search Test Data**: Structured data for search functionality testing

### Usage Example

```typescript
import { mockUsers, validParticipantData, invalidParticipantData } from './fixtures';

// Use in tests
const teamLead = mockUsers.teamLead;
const validForm = validParticipantData.complete;
const invalidForm = invalidParticipantData.shortFirstName;
```

## Test Patterns and Best Practices

### 1. Pragmatic Testing Philosophy
Following the project's pragmatic testing approach:
- Test actual behavior, not implementation details
- Focus on user-facing functionality  
- Use realistic test data matching NDIS requirements

### 2. Mock Strategy
- **Convex Functions**: Mock database operations and permissions
- **React Components**: Mock Convex hooks and UI components
- **External Services**: Mock localStorage, session storage

### 3. Test Organization
```typescript
describe('Main Feature', () => {
  describe('Sub-feature Group', () => {
    it('should behave correctly in specific scenario', () => {
      // Test implementation
    });
  });
});
```

### 4. Error Testing
Each test suite includes comprehensive error handling:
- Authentication failures
- Validation errors
- Network errors  
- Database errors
- Permission denials

## Role-Based Access Control Testing

### Permission Matrix Tested

| Operation | System Admin | Company Admin | Team Lead | Frontline Worker |
|-----------|-------------|---------------|-----------|------------------|
| Create Participant | ✅ | ✅ | ✅ | ❌ |
| Update Participant | ✅ | ✅ | ✅ | ❌ |  
| Update Status | ✅ | ✅ | ✅ | ❌ |
| View Participant | ✅ | ✅ | ✅ | ✅ |
| List Participants | ✅ | ✅ | ✅ | ✅ |
| Search Participants | ✅ | ✅ | ✅ | ✅ |

### Multi-Tenant Testing
- Company A users cannot access Company B participants
- Duplicate NDIS numbers allowed across companies
- Search scoped to user's company only

## Coverage Expectations

Target coverage levels based on project standards:

- **Statements**: 85%+ 
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

## Debugging Tests

### Common Issues and Solutions

1. **Mock not working**: Ensure mock is properly setup before test execution
2. **Async test failures**: Use `waitFor()` for async operations
3. **State contamination**: Check `beforeEach()` cleanup is comprehensive
4. **Component rendering issues**: Verify all dependencies are mocked

### Debug Commands

```bash
# Run single test with detailed output
npx jest tests/convex/participants/create.test.ts --verbose

# Debug specific test case
npx jest tests/convex/participants/create.test.ts -t "should validate NDIS number format"

# Run tests with debugging enabled
node --inspect-brk node_modules/.bin/jest tests/convex/participants/
```

## Continuous Integration

These tests are designed to run in CI environments:

- All tests use centralized configuration
- No external dependencies (all mocked)
- Deterministic test data
- Proper cleanup between tests

## Maintenance

### Adding New Tests
1. Follow existing file structure and naming conventions
2. Use fixtures from `fixtures.ts` for consistent test data
3. Include error scenarios and edge cases
4. Update this README if adding new test categories

### Updating Tests
1. When adding new features, extend existing test files
2. Update fixtures if new data structures are needed
3. Maintain backward compatibility in test data
4. Keep tests focused and isolated

## Related Documentation

- [Story 2.3 Acceptance Criteria](../../../docs/stories/2.3.story.md)
- [Testing Patterns](../../../docs/testing/technical/testing-patterns.md)
- [Testing Infrastructure Lessons](../../../docs/testing/technical/testing-infrastructure-lessons-learned.md)