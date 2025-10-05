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

### Story 0.2: Technical Debt - Database Schema Audit & Deprecated Table Identification

**Priority**: P2 (Medium)
**Estimated Effort**: Medium (4-8 hours)
**Category**: Technical Debt
**Discovered**: October 2025 - Database clarity and cleanup initiative

#### Problem Statement

The Convex database contains tables from various stages of development, including experimental features, deprecated functionality, and active production code. This creates confusion about what tables are actually used in production versus leftover from experiments. Need clarity on database schema to:
- Identify orphaned tables (no code references)
- Find legacy tables (referenced but from deprecated features)
- Define clean production schema vision
- Prevent future confusion with naming conventions

#### Scope

**Three-Phase Investigation**:

**Phase 1: Orphaned Tables**
- List all Convex tables (dev and prod databases)
- Cross-reference with codebase usage (queries, mutations, schema imports)
- Identify tables with zero references in code
- Assess safe removal candidates

**Phase 2: Legacy Tables**
- Find tables referenced in code but from old/experimental features
- Trace usage to determine if functionality is still active
- Identify candidates for deprecation flagging (not immediate deletion)
- Document historical context for each legacy table

**Phase 3: Clean Schema Vision**
- Define what production database should look like
- Separate experimental/test tables from production tables
- Create naming convention to prevent future confusion (e.g., `exp_*`, `test_*` prefixes)
- Document purpose and ownership for each active table

#### Acceptance Criteria

- [ ] Complete database audit report with three categories:
  - **Orphaned**: No code references (candidates for immediate removal)
  - **Legacy**: Referenced but from deprecated features (flag for review)
  - **Active**: Production tables (document purpose)
- [ ] Clean schema recommendation document
- [ ] Naming convention proposal for experimental work
- [ ] Optional: Table registry document for ongoing maintenance
- [ ] Migration plan for removing orphaned tables (if any identified)

#### Implementation Notes

**Audit Methodology**:
- Use `bunx convex function-spec` to list all queries/mutations
- Grep codebase for table references
- Compare dev vs prod database schemas
- Identify discrepancies and unused tables
- Document table purpose from git history if unclear

**Deliverables**:
- Database audit report with categorized findings
- Clean schema vision document
- Naming convention guide
- Optional: Automated table usage tracking script

**Risk Considerations**:
- Don't delete any tables without explicit approval
- Verify table usage in both dev and prod environments
- Consider data retention requirements before recommending removal
- Flag tables for deprecation rather than immediate deletion

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
**Stories Completed**: 0
**Stories In Progress**: 0
**Stories Planned**: 2 (0.1, 0.2)

**Last Updated**: October 5, 2025
