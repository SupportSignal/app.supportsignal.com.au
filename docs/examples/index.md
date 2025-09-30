# Reference Examples Library

This directory contains real implementation examples from the project that demonstrate established patterns and best practices. These examples are extracted from actual working code and serve as reference implementations for future development.

## Example Categories

### [Monorepo Setup](monorepo-setup/)

Complete example of Bun-based Turborepo monorepo initialization, tooling configuration, and project structure setup.

### [Frontend Examples](frontend/)

React, Next.js, and UI component examples demonstrating established frontend patterns.

### [Backend Examples](backend/)

Convex function examples showing data operations, authentication, and API patterns:

- **[AI Prompt Integration Examples](./backend/ai-prompt-integration/)** - Complete AI prompt template management with variable substitution, caching, and OpenAI integration (Added: 2025-09-30)
- **[Browser Log Capture System](./backend/browser-log-capture-system.md)** - Complete browser console log capture system with Convex Actions, dual table storage, and correlation tracking
- **[Convex Runtime Architecture Constraints](./backend/convex-runtime-architecture-constraints.md)** - V8 vs Node.js runtime separation patterns, file organization, and deployment constraint prevention

### [Testing Examples](testing/)

Comprehensive testing examples across unit, integration, and end-to-end testing.

### [CI/CD Deployment Examples](cicd-deployment/)

Complete CI/CD and deployment examples demonstrating automated pipeline implementation.

### [Configuration Examples](configuration/)

Examples of project configuration, environment setup, and tooling configuration:

- **[Port Management Examples](./configuration/port-management-examples.md)** - Complete port management configuration examples and scripts

## Using Reference Examples

### For Developers

1. **Before Implementation**: Review similar examples for established approaches
2. **During Development**: Use examples as templates and reference implementations
3. **Pattern Validation**: Ensure your implementation follows example patterns

### For Code Reviews

1. **Consistency Checking**: Validate implementations match established examples
2. **Quality Assessment**: Compare against proven working implementations
3. **Pattern Evolution**: Update examples based on improved implementations

### Example Documentation Standards

Each example should include:

#### Structure

- **README.md**: Overview, context, and usage instructions
- **Source Code**: Complete, working implementation
- **Tests**: Associated test files demonstrating testing patterns
- **Documentation**: Inline comments and external documentation

#### Content Requirements

- **Context**: When and why to use this example
- **Implementation Details**: How the example works
- **Pattern References**: Links to relevant pattern documentation
- **Variations**: Common modifications or extensions
- **Related Examples**: Cross-references to similar implementations

## Knowledge-Driven Development (KDD) Integration

This example library is a key component of our KDD methodology:

- **Implementation Consistency**: Ensures similar problems are solved similarly
- **Knowledge Preservation**: Captures working solutions for future reference
- **Pattern Validation**: Provides concrete implementations of abstract patterns
- **Learning Acceleration**: New developers can learn from proven implementations

## Contributing Examples

Examples are created through:

1. **Story Completion**: Successful implementations become reference examples
2. **QA Reviews**: Examples identified during code review process
3. **Refactoring**: Improved implementations replace older examples
4. **Team Contribution**: Developers identify reusable implementations

### Example Creation Process

1. **Identify**: Recognize a reusable implementation during development
2. **Extract**: Create standalone example with necessary context
3. **Document**: Add comprehensive documentation and usage instructions
4. **Review**: Validate example quality and completeness
5. **Integrate**: Add to example library with proper categorization

## Example Maintenance

- **Regular Reviews**: Examples reviewed quarterly for relevance and accuracy
- **Version Control**: All example changes tracked via git
- **Deprecation**: Outdated examples marked deprecated with migration guidance
- **Updates**: Examples updated when patterns evolve

## Quality Standards

All examples must meet these standards:

### Code Quality

- **Working Code**: All examples must run without errors
- **Best Practices**: Follow established patterns and conventions
- **Comments**: Clear, helpful comments explaining key concepts
- **Testing**: Include relevant test examples

### Documentation Quality

- **Clear Instructions**: Easy-to-follow setup and usage instructions
- **Context**: Explain when and why to use the example
- **Completeness**: Cover all necessary implementation details
- **Maintenance**: Keep documentation current with code changes

### Accessibility

- **Searchable**: Easy to find relevant examples
- **Organized**: Logical categorization and cross-referencing
- **Up-to-date**: Regular maintenance to ensure accuracy
- **Comprehensive**: Cover common use cases and variations

## Anti-Patterns to Avoid

### Example Smell Indicators

- **Overly Complex**: Examples that try to demonstrate too many concepts
- **Outdated**: Examples using deprecated patterns or technologies
- **Incomplete**: Missing context, documentation, or error handling
- **Unrealistic**: Examples that don't represent real-world usage

### Maintenance Issues

- **Stale Examples**: Not updated when underlying patterns change
- **Duplicate Examples**: Multiple examples solving the same problem differently
- **Missing Tests**: Examples without associated test demonstrations
- **Poor Organization**: Difficult to find relevant examples

## Related Documentation

- [Patterns Library](../patterns/) - For abstract pattern definitions
- [Lessons Learned](../lessons-learned/) - For insights and anti-patterns
- [Architecture Documentation](../architecture/) - For system design context
