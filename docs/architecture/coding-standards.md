# Coding Standards

A minimal, strict set of mandatory rules for all developers (human and AI), including mandatory correlation IDs, enforcement of the repository pattern, a ban on direct `process.env` access, and a `no-any` TypeScript policy.

## Core Principles

### TypeScript Requirements

- **Strict Mode**: TypeScript strict mode must be enabled
- **No Any Policy**: Use of `any` type is prohibited
- **Type Safety**: All code must be fully type-safe

### Environment Access

- **No Direct process.env**: Direct access to `process.env` is banned
- **Configuration Pattern**: Use centralized configuration management

### Repository Pattern

- **Data Access**: All data access must follow repository pattern
- **Abstraction**: Business logic should be separated from data access

### Correlation IDs

- **Request Tracking**: All requests must include correlation IDs
- **Logging**: All logs must include correlation ID for traceability

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
