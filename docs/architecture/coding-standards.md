# Coding Standards

A minimal, strict set of mandatory rules for all developers (human and AI), including mandatory correlation IDs, enforcement of the repository pattern, a ban on direct `process.env` access, and a `no-any` TypeScript policy.

## Core Principles

### TypeScript Requirements

- **Strict Mode**: TypeScript strict mode must be enabled
- **No Any Policy**: Use of `any` type is prohibited except where documented with `@ts-expect-error`
  - **Never use**: `(api as any)` or similar type casts to `any`
  - **For unavoidable issues**: Use `@ts-expect-error` with explanation (e.g., Convex type inference limitations)
  - **ESLint enforcement**: `@typescript-eslint/no-explicit-any` rule enabled
- **Type Safety**: All code must be fully type-safe
- **Type Assertions**: Use consistent assertion style (`as` syntax), enforced by `@typescript-eslint/consistent-type-assertions`

### Environment Access

- **No Direct process.env**: Direct access to `process.env` is banned
- **Configuration Pattern**: Use centralized configuration management
- **Environment-Aware Patterns**: Follow established patterns for environment detection and URL generation
- **Defensive Configuration**: Validate environment variables with meaningful error messages
- **Configuration Caching**: Implement caching with reset capability for test isolation

### Repository Pattern

- **Data Access**: All data access must follow repository pattern
- **Abstraction**: Business logic should be separated from data access

### Correlation IDs

- **Request Tracking**: All requests must include correlation IDs
- **Logging**: All logs must include correlation ID for traceability

### Route Management

- **Centralized Routes**: All application routes must be defined in `apps/web/lib/routes.ts`
- **Type-Safe Routes**: Use typed route constants instead of hardcoded strings
- **Dynamic Routes**: Use helper functions for routes with parameters (e.g., `ROUTES.auth.resetPassword(token)`)
- **No Magic Strings**: Avoid hardcoded route strings in components - import from `ROUTES` constant

**Example**:
```typescript
// ❌ Bad - hardcoded route string
<Link href="/admin/companies/create">Create</Link>

// ✅ Good - centralized route constant
import { ROUTES } from '@/lib/routes';
<Link href={ROUTES.admin.companies.create}>Create</Link>
```

### POC/Experimental Code Markers

When writing proof-of-concept or experimental code that may be removed or refactored, use standardized header comments:

**Format**:
```typescript
/**
 * POC: [Feature Name]
 * Status: Experimental
 * Created: YYYY-MM-DD
 * Purpose: [Brief description of what this code demonstrates]
 * TODO: [What needs to happen before this becomes production code]
 */
```

**Example**:
```typescript
/**
 * POC: Real-time Collaboration
 * Status: Experimental
 * Created: 2025-10-07
 * Purpose: Test WebSocket connection patterns for real-time editing
 * TODO: Add error handling, reconnection logic, and load testing
 */
export function CollaborativeEditor() {
  // ... experimental code
}
```

**When to Use POC Markers**:
- Prototyping new features or patterns
- Testing third-party integrations
- Exploring alternative implementations
- Code that exists for evaluation, not production use

**Benefits**:
- Clear identification during dead code analysis
- Understanding of code intent and maturity
- Easy to find and review experimental code
- Prevents accidental production deployment

## Pattern References

For detailed implementation patterns, see:

- [Frontend Patterns](../patterns/frontend-patterns.md) - React and Next.js coding patterns
- [Backend Patterns](../patterns/backend-patterns.md) - Convex and API coding patterns
- [Testing Patterns](../patterns/testing-patterns.md) - Code testing standards
- [Architecture Patterns](../patterns/architecture-patterns.md) - System design patterns

## Implementation Examples

For concrete examples of these standards in practice, see:

- [Monorepo Setup Example](../examples/monorepo-setup/) - Project structure and tooling standards
- [Configuration Examples](../examples/configuration/) - Environment and configuration patterns

## Knowledge-Driven Development (KDD) Integration

These coding standards are enforced through:

- **Pattern Validation**: During development, validate against established patterns
- **Code Review**: QA process validates standard adherence
- **Documentation**: Standards are captured and evolved through KDD process

## Related Documentation

- [Development Workflow Patterns](../patterns/development-workflow-patterns.md) - Process for enforcing standards
- [Story Template](../../.bmad-core/templates/story-tmpl.yaml) - Includes pattern validation requirements
