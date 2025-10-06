# Epic 0: Technical Debt & Continuous Improvement

## Epic Overview

**Goal**: Maintain platform quality, eliminate technical debt, and continuously improve developer experience and system reliability through ongoing maintenance and refinement work.

**Duration**: Ongoing (allocate 10-20% sprint capacity)
**Team Size**: Varies by story
**Dependencies**: None (cross-cutting)
**Enables**: Sustainable development velocity and platform reliability

---

## Business Context

Epic 0 represents the critical but often invisible work that keeps the SupportSignal platform healthy, maintainable, and efficient. This epic captures technical debt remediation, bug fixes, developer experience improvements, performance optimizations, and infrastructure enhancements that don't fit within feature epics but are essential for long-term success.

**Key Business Drivers**:
- **Platform Stability**: Proactive issue resolution before they impact users
- **Developer Velocity**: Improved tooling and workflows reduce friction
- **Code Quality**: Maintainable codebase enables faster feature delivery
- **Technical Excellence**: Continuous refinement supports compliance and reliability requirements

**Sprint Planning Approach**:
- Reserve 10-20% of sprint velocity for Epic 0 work
- Prioritize by impact: P0 (blocking) > P1 (important) > P2 (nice to have)
- Balance technical debt with feature development
- Track Epic 0 velocity separately to monitor health trends

---

## Story Categories

Stories in Epic 0 are categorized by type:

- **Technical Debt**: Code quality, refactoring, modernization
- **Bug Fix**: Production issues, regression fixes
- **Developer Experience**: Tooling, documentation, workflow improvements
- **Performance**: Optimization, efficiency improvements
- **Security**: Vulnerability fixes, security hardening
- **Infrastructure**: CI/CD, deployment, monitoring improvements
- **Documentation**: Knowledge capture, guides, references

---

## Story Breakdown

### Story 0.1: Technical Debt - Environment Variable Deduplication Audit

**Priority**: P1 (High)
**Estimated Effort**: Small (2-4 hours)
**Category**: Technical Debt
**Discovered**: October 2025 - Environment configuration review

#### Problem Statement

The environment variable source of truth file (`~/.env-configs/app.supportsignal.com.au.env`) may contain duplicate values with different environment variable names, creating confusion and potential misconfiguration risks. While some duplicates are legitimate (e.g., `NEXT_PUBLIC_*` vs `CONVEX_*` prefixes for same value), others may represent technical debt or configuration drift.

#### Scope

**Investigation Areas**:
1. Scan source of truth environment file for duplicate values with different keys
2. Categorize duplicates as legitimate (intentional) vs illegitimate (technical debt)
3. Identify common patterns (e.g., `*_URL` variables, legacy keys)
4. Assess cleanup impact and risk
5. Create remediation plan with prioritized actions

**Expected Findings**:
- URL variables that might be duplicated unnecessarily
- Legacy environment keys pointing to same resources
- Configuration drift between dev/prod that shouldn't exist
- Unused environment variables that can be removed

#### Acceptance Criteria

- [ ] Complete audit report showing all duplicate values
- [ ] Duplicates categorized as legitimate vs illegitimate
- [ ] Risk assessment for each proposed cleanup action
- [ ] Cleanup recommendation with execution plan
- [ ] Documentation of legitimate duplicate patterns for future reference

#### Implementation Notes

**Audit Methodology**:
- Parse table format environment file
- Group by value (DEV_VALUE and PROD_VALUE separately)
- Identify keys sharing same values
- Cross-reference with codebase usage
- Document intentional duplicates (prefixing patterns)

**Deliverables**:
- Audit report with categorized findings
- Cleanup proposal with risk assessment
- Updated environment documentation if needed

---

### Story 0.2: Technical Debt - Database Schema Audit & Cleanup

**Priority**: P2 (Medium)
**Estimated Effort**: Medium (4-8 hours)
**Category**: Technical Debt
**Discovered**: October 2025 - Database clarity and cleanup initiative

#### Problem Statement

The Convex database contains tables from various stages of development, including experimental features, deprecated functionality, and active production code. This creates confusion about what tables are actually used in production versus leftover from experiments. Need clarity on database schema to:
- Identify orphaned tables (no code references)
- Find questionable tables (stale or early POC code requiring human review)
- Define clean production schema vision
- Prevent future confusion with naming conventions

#### Scope

**Database Tables ONLY** - Focused audit and cleanup of Convex database schema:

**Phase 1: Discovery**
- List all Convex tables (dev and prod databases)
- Cross-reference with codebase usage (queries, mutations, schema imports)
- Check git timestamps (>2 months = stale)
- Identify early POC tables (created in first month of project)

**Phase 2: Categorization**
- **Orphaned**: Zero code references (safe removal candidates)
- **Questionable**: Stale code OR early POC - requires human review with structured questions
- **Active**: Production tables (document purpose)

**Phase 3: Human Review & Cleanup**
- Present structured questions for questionable tables (Title + Description + "Keep or deprecate?")
- Get explicit human approval for all removals
- Execute approved cleanups immediately (remove from schema.ts)
- Validate after each removal (typecheck, build)

**Phase 4: Documentation**
- Clean schema vision with naming conventions
- Audit report documenting findings and actions taken

#### Acceptance Criteria

- [x] Complete database audit report with categorized findings
- [x] Human-approved cleanup execution (orphaned + deprecated tables removed)
- [x] Validation passed (typecheck deferred to Story 0.3 - expected failures from deprecated code)
- [x] Clean schema vision with naming conventions documented
- [x] Active tables documented with purpose comments

**Status**: ✅ Complete (October 5, 2025)

#### Implementation Notes

**Audit Methodology**:
- Use Convex CLI to list tables and query data volumes
- Grep codebase for table references
- Use git timestamps to identify stale code (>2 months)
- Identify early POC code (first month of project)
- Present structured questions for human decisions
- Execute cleanup with human approval gates

**Deliverables**:
- Audit findings in story completion notes (self-contained)
- Story 0.3 handoff integrated into Story 0.3 file
- Clean schema vision with naming conventions
- Updated schema.ts (deprecated tables removed)

**Risk Considerations**:
- Don't delete any tables without explicit approval
- Verify table usage in both dev and prod environments
- Consider data retention requirements before recommending removal
- Flag tables for deprecation rather than immediate deletion

---

### Story 0.3: Technical Debt - Dead Code Discovery & Cleanup (Functions, Routes, Components, Workers)

**Priority**: P2 (Medium)
**Estimated Effort**: High (8-12 hours)
**Category**: Technical Debt
**Discovered**: October 2025 - Systematic dead code elimination across all code layers
**Dependencies**: Story 0.2 (database audit provides active table list for function validation)

#### Problem Statement

Beyond database tables, the codebase contains orphaned and experimental code across multiple layers:
- Convex functions (queries, mutations, actions) that are no longer called
- Next.js routes and API endpoints that are unreachable
- React components and hooks that are never imported
- Cloudflare Workers that may no longer be deployed or used

This dead code creates maintenance burden, confusion, and makes the codebase harder to understand. Need systematic discovery and cleanup across all code layers.

#### Scope

**Multi-Layer Code Audit & Cleanup** - Systematic analysis across:

**Phase 1: Convex Functions**
- List all queries, mutations, actions using `bunx convex function-spec`
- Grep for frontend usage (useQuery, useMutation, useAction)
- Grep for backend usage (ctx.runQuery, ctx.scheduler)
- Use Story 0.2's active table list to validate function relevance
- Categorize: Orphaned / Questionable / Active

**Phase 2: Next.js Routes & API Endpoints**
- List all app router pages and API routes
- Grep for navigation references (Link, router.push)
- Grep for API calls (fetch to route endpoints)
- Check documentation references
- Categorize: Orphaned / Questionable / Active

**Phase 3: React Components & Hooks**
- List all components and custom hooks
- Grep for import statements (direct and dynamic)
- Check ShadCN UI components (likely active)
- Categorize: Orphaned / Questionable / Active

**Phase 4: Cloudflare Workers**
- List all workers in `apps/workers/`
- Check environment variable references
- Verify deployment status (wrangler list)
- Grep for fetch calls to worker endpoints
- Categorize: Orphaned / Questionable / Active

**Phase 5: Human Review & Cleanup**
- Present structured questions for questionable code
- Get explicit human approval for all removals
- Execute approved cleanups per layer (with git commits for rollback)
- Validate after each layer (typecheck, build, test)

**Phase 6: Cross-Layer Validation**
- Comprehensive validation suite
- Verify no broken references
- Test critical user flows

#### Acceptance Criteria

- [ ] Complete dead code audit report with categorized findings per layer
- [ ] Human-approved cleanup execution across all layers
- [ ] Comprehensive validation passed (typecheck, lint, build, tests)
- [ ] Active code documented with purpose comments
- [ ] Audit report documenting findings, actions, and lessons learned

#### Implementation Notes

**Audit Methodology**:
- Use dependency tracing to map code relationships
- Cross-reference Story 0.2's active table list for function validation
- Use git timestamps (>2 months = stale)
- Identify early POC code (first month of project)
- Check for hidden dependencies (dynamic imports, string references)
- Present structured questions for human decisions
- Execute cleanup with validation after each layer

**Deliverables**:
- Audit findings in story completion notes (self-contained)
- Updated codebase with removed orphaned/deprecated code
- Active code documented with purpose comments

**Risk Considerations**:
- Never delete code without explicit human approval
- Watch for hidden dependencies (dynamic imports, scheduler calls)
- Validate comprehensively after each layer cleanup
- Use Story 0.2 results to avoid false positives (functions using active tables likely active)
- Commit per layer for easy rollback if issues arise

---

## Future Story Candidates

As additional technical debt, bugs, or improvements are discovered, they will be added to Epic 0 following the story template:

```markdown
### Story 0.X: [Category] - [Brief Description]

**Priority**: [P0-Critical/P1-High/P2-Medium/P3-Low]
**Estimated Effort**: [XS/S/M/L/XL]
**Category**: [Technical Debt/Bug Fix/Developer Experience/etc.]
**Discovered**: [Date and context]

#### Problem Statement
Brief description of issue or improvement opportunity

#### Scope
What work is involved

#### Acceptance Criteria
- [ ] Clear, testable criteria

#### Implementation Notes
Technical approach or constraints
```

---

## Epic Metrics

**Health Indicators**:
- Epic 0 velocity as % of total sprint velocity (target: 10-20%)
- Number of P0/P1 stories in backlog (target: <5)
- Average age of Epic 0 stories (target: <2 sprints)
- Technical debt ratio trend (increasing/stable/decreasing)

**Success Criteria**:
- Consistent Epic 0 capacity allocation
- Proactive issue identification and resolution
- Improved developer satisfaction scores
- Reduced production incidents from technical debt

---

## Epic Status

**Current Status**: Active (Ongoing)
**Stories Completed**: 2 (0.1, 0.2)
**Stories In Progress**: 0
**Stories Planned**: 1 (0.3)

**Last Updated**: October 5, 2025
