# Logging Refactor: Agent Delegation Guidelines

## Overview

This document defines how the logging system refactor should be delegated to specialized agents when ready for implementation. It follows the project's methodology of using specialized agents for specific types of work rather than attempting all implementation directly.

## Agent Delegation Strategy

### 1. General-Purpose Agent (Primary Implementation)

**Use for**: Core infrastructure setup and business logic implementation

**Responsibilities**:

- Create Cloudflare Worker directory structure and configuration
- Implement Worker rate limiting and Redis integration logic
- Set up Upstash Redis data structures and operations
- Create new Convex HTTP actions for on-demand log fetching
- Build new debug interface components and pages
- Update browser client endpoint configuration

**Delegation Pattern**:

```
Task(
  description="Implement Worker infrastructure",
  prompt="Following docs/technical-guides/logging-refactor-comprehensive-specifications.md, create the Cloudflare Worker at apps/workers/log-ingestion/ with all components specified. Focus on the core Worker logic, Redis integration, and rate limiting implementation.",
  subagent_type="general-purpose"
)
```

**Key Documents to Reference**:

- `docs/technical-guides/logging-refactor-comprehensive-specifications.md`
- `docs/technical-guides/worker-redis-logging-architecture.md`
- `docs/prd/epic-3.md` (Stories 3.4 and 3.5)

### 2. Tester Agent (MANDATORY for All Testing Work)

**Use for**: All testing strategy, implementation, and validation

**CRITICAL**: Following the project's specialized agent delegation requirements, the tester agent MUST be used proactively for all testing work, not just reactively when problems arise.

**Responsibilities**:

- **Test Strategy Planning**: Define comprehensive testing approach for Worker + Redis architecture
- **Test Implementation**: Create unit, integration, and E2E tests for new logging system
- **Test Infrastructure**: Set up testing patterns for Cloudflare Workers and Redis
- **Validation Testing**: Verify cleanup of old system doesn't break existing functionality
- **Coverage Analysis**: Ensure adequate test coverage for all new components

**Delegation Patterns**:

**Proactive Test Planning**:

```
Task(
  description="Plan testing strategy for logging refactor",
  prompt="Review docs/technical-guides/logging-refactor-comprehensive-specifications.md and plan comprehensive testing strategy for the Worker + Redis logging system. Define test approaches for: 1) Worker rate limiting and validation logic, 2) Browser → Worker → Redis integration flow, 3) On-demand log fetching from Convex, 4) Debug interface functionality. Include test infrastructure requirements for Cloudflare Workers testing.",
  subagent_type="tester"
)
```

**Test Implementation**:

```
Task(
  description="Implement Worker logging tests",
  prompt="Following the test strategy, implement comprehensive tests for the log-ingestion Worker. Include: rate limiting validation, Redis integration tests, system detection logic, batch processing, and error handling. Use appropriate testing frameworks for Cloudflare Workers.",
  subagent_type="tester"
)
```

**Cleanup Validation**:

```
Task(
  description="Validate Convex logging cleanup",
  prompt="Following docs/technical-guides/convex-logging-cleanup-strategy.md, create validation tests to ensure the cleanup of old logging system doesn't break existing functionality. Test that browser console override still works after endpoint change, and that Convex functions operate normally after table removal.",
  subagent_type="tester"
)
```

## Implementation Phases and Agent Assignment

### Phase 1: Infrastructure Setup

**Agent**: General-Purpose  
**Focus**: Worker creation, Redis setup, monorepo integration

**Tasks**:

1. Create `apps/workers/log-ingestion/` structure
2. Set up Upstash Redis integration
3. Configure Cloudflare Worker deployment
4. Update monorepo scripts and Turbo configuration

**Test Delegation**: Proactively delegate test strategy planning to tester agent before implementation begins.

### Phase 2: Core Worker Logic

**Agent**: General-Purpose  
**Focus**: Rate limiting, validation, Redis operations

**Tasks**:

1. Implement Worker-based rate limiting
2. Create log validation and processing logic
3. Build Redis buffering operations
4. Add system detection from headers

**Test Delegation**: Delegate test implementation to tester agent parallel with development.

### Phase 3: Convex Integration

**Agent**: General-Purpose  
**Focus**: On-demand log fetching, correlation analysis

**Tasks**:

1. Create new Convex HTTP actions for Redis querying
2. Adapt existing correlation logic for fetched data
3. Remove old Convex logging system

**Test Delegation**: Use tester agent for integration testing and cleanup validation.

### Phase 4: Frontend Updates

**Agent**: General-Purpose  
**Focus**: Browser client updates, debug interface

**Tasks**:

1. Update browser console override endpoint
2. Create new `/debug` interface
3. Build trace search and timeline components

**Test Delegation**: Tester agent handles E2E testing and user interface validation.

### Phase 5: System Cleanup

**Agent**: General-Purpose  
**Focus**: Remove broken Convex logging system

**Tasks**:

1. Execute cleanup strategy from `convex-logging-cleanup-strategy.md`
2. Remove tables, files, and references
3. Clean documentation and update references

**Test Delegation**: Critical - tester agent must validate no functionality broken by cleanup.

## Specialized Agent Usage Guidelines

### When to Use General-Purpose Agent

- ✅ Core business logic implementation
- ✅ Infrastructure setup and configuration
- ✅ Component creation and integration
- ✅ Data structure and API design
- ✅ Documentation updates

### When to Use Tester Agent (MANDATORY)

- ✅ **Test strategy planning** (before any implementation)
- ✅ **Test implementation** (parallel with development)
- ✅ **Coverage analysis** (ensure adequate testing)
- ✅ **Validation testing** (cleanup doesn't break functionality)
- ✅ **Integration testing** (multi-system flow verification)
- ✅ **E2E testing** (complete user workflows)

### Agent Communication Pattern

**DO NOT** attempt complex testing work without tester agent involvement. The project has learned that testing infrastructure requires specialized expertise.

**Correct Pattern**:

1. Plan with tester agent first
2. Implement with general-purpose agent
3. Test with tester agent
4. Validate with tester agent
5. Document lessons learned

## Document Dependencies

### Primary Implementation Documents

- `docs/technical-guides/logging-refactor-comprehensive-specifications.md` - Complete technical specs
- `docs/technical-guides/worker-redis-logging-architecture.md` - Architecture overview
- `docs/technical-guides/convex-logging-cleanup-strategy.md` - Cleanup procedures

### Reference Documents

- `docs/prd/epic-3.md` - Epic and story definitions
- `docs/logging-system-comprehensive-analysis.md` - Current system analysis
- `CLAUDE.md` - Project conventions and commands

### Testing Reference Documents

When delegating to tester agent, also reference:

- `docs/testing/technical/test-strategy-and-standards.md` - Testing standards
- `docs/testing/technical/testing-patterns.md` - Established patterns
- `docs/testing/technical/testing-infrastructure-lessons-learned.md` - Previous lessons

## Success Criteria for Agent Delegation

### General-Purpose Agent Success

- ✅ Worker deploys successfully to Cloudflare
- ✅ Redis integration functions correctly
- ✅ Browser logs reach Redis via Worker
- ✅ Debug interface fetches logs on-demand
- ✅ Old Convex system cleanly removed

### Tester Agent Success

- ✅ Comprehensive test strategy documented
- ✅ All critical paths have test coverage
- ✅ Integration flows validated end-to-end
- ✅ Cleanup validation confirms no functionality broken
- ✅ Testing lessons learned documented

### Combined Success

- ✅ Logging system race conditions eliminated
- ✅ Cost reduced from $10/month to $2/month
- ✅ Multi-system log correlation preserved
- ✅ Debug interface provides clean UX
- ✅ System scales better than previous version

## Common Delegation Mistakes to Avoid

### ❌ Wrong Agent Usage

- Don't attempt testing work without tester agent
- Don't ask general-purpose agent for specialized testing infrastructure
- Don't skip test strategy planning phase

### ❌ Poor Task Definition

- Don't delegate without specific document references
- Don't ask for implementation without clear specifications
- Don't combine unrelated tasks in single delegation

### ❌ Sequential Dependencies

- Don't wait for complete implementation before starting tests
- Don't cleanup old system before new system validated
- Don't skip validation steps between phases

## Rollback Strategy for Agent Work

### If Agent Work Fails

1. **Identify Issue**: Determine if problem is specification, implementation, or testing
2. **Refine Documentation**: Update specs based on learnings
3. **Re-delegate**: Assign to appropriate agent with refined instructions
4. **Document Lessons**: Update this guide with insights

### If Multiple Attempts Fail

1. **Escalate to User**: Request guidance on approach
2. **Break Down Further**: Split complex tasks into smaller pieces
3. **Reconsider Architecture**: May need specification changes

This delegation strategy ensures proper use of specialized agents while maintaining clear accountability and deliverable quality for the logging system refactor.
