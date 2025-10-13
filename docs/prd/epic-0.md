# Epic 0: Technical Debt & Continuous Improvement

> **Quick Navigation:** [0.1](#story-01-technical-debt---environment-variable-deduplication-audit) · [0.2](#story-02-technical-debt---database-schema-audit--cleanup) · [0.3](#story-03-technical-debt---dead-code-discovery--cleanup-functions-routes-components-workers) · [0.4](#story-04-technical-debt---apply-coding-standards-from-inconsistencies-audit) · [0.5](#story-05-technical-debt---file-naming-migration-to-kebab-case) · [0.6](#story-06-developer-experience---database-export--analysis-system) · [0.7](#story-07-user-experience---authorization-ui-consistency)

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

## Quick Navigation

**Stories in this Epic:**
- [0.1](#story-01-technical-debt---environment-variable-deduplication-audit)
- [0.2](#story-02-technical-debt---database-schema-audit--cleanup)
- [0.3](#story-03-technical-debt---dead-code-discovery--cleanup-functions-routes-components-workers)
- [0.4](#story-04-technical-debt---apply-coding-standards-from-inconsistencies-audit)
- [0.5](#story-05-technical-debt---file-naming-migration-to-kebab-case)
- [0.6](#story-06-developer-experience---database-export--analysis-system)
- [0.7](#story-07-user-experience---authorization-ui-consistency)

**Stories in this Epic:**
- [Story 0.1: Environment Variable Deduplication Audit](#story-01-technical-debt---environment-variable-deduplication-audit) - ✅ **Complete** (P1 - High)
- [Story 0.2: Database Schema Audit & Cleanup](#story-02-technical-debt---database-schema-audit--cleanup) - ✅ **Complete** (P2 - Medium)
- [Story 0.3: Dead Code Discovery & Cleanup](#story-03-technical-debt---dead-code-discovery--cleanup-functions-routes-components-workers) - 🔄 **In Progress** (P2 - Medium)
- [Story 0.4: Apply Coding Standards from Inconsistencies Audit](#story-04-technical-debt---apply-coding-standards-from-inconsistencies-audit) - ✅ **Complete** (P1 - High)
- [Story 0.5: File Naming Migration to Kebab-Case](#story-05-technical-debt---file-naming-migration-to-kebab-case) - ✅ **Complete** (P2 - Medium)
- [Story 0.6: Database Export & Analysis System](#story-06-developer-experience---database-export--analysis-system) - ✅ **Complete** (P2 - Medium)
- [Story 0.7: Authorization UI Consistency](#story-07-user-experience---authorization-ui-consistency) - 📋 **Planned** (P1 - High)

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

### Story 0.4: Technical Debt - Apply Coding Standards from Inconsistencies Audit

**Priority**: P1 (High)
**Estimated Effort**: Large (12-20 hours)
**Category**: Technical Debt / Code Quality
**Discovered**: October 2025 - Story 0.3 dead code analysis revealed significant coding inconsistencies
**Dependencies**: Story 0.3 (inconsistencies audit completed)

#### Problem Statement

Story 0.3's systematic code analysis discovered 10 major coding inconsistencies across 246 Convex functions, 40 Next.js routes, and 116 React components. These inconsistencies create:
- **High false positive rates in static analysis** (50-78% false positives)
- **Maintenance burden** requiring multiple grep patterns for same analysis
- **Developer confusion** about which patterns to use
- **TypeScript safety violations** via `(api as any)` type casts
- **Inconsistent import patterns** making refactoring fragile

The coding inconsistencies audit (`docs/auditing/coding-inconsistencies-audit.md`) provides detailed impact analysis and prioritized recommendations. This story implements the highest-impact improvements to establish consistent coding standards.

#### Scope

**Phased Implementation Based on Priority**:

**Phase 1: Critical Fixes (Immediate Impact)**
1. **Ban `(api as any)` type casts**
   - Find all instances of `(api as any)` pattern in codebase
   - Fix TypeScript types to enable proper type inference
   - Add ESLint rule to prevent future violations
   - **Impact**: Eliminates 50% false positive rate in Convex function analysis

2. **Centralize route definitions**
   - Create `routes.ts` with type-safe route helpers
   - Migrate object-based routes to centralized definitions
   - Replace template literals with typed route functions
   - **Impact**: Eliminates 72% false positive rate in route analysis

3. **Establish POC code markers**
   - Document standard POC header format
   - Add markers to existing experimental code
   - Update coding standards documentation
   - **Impact**: Reduces wasted investigation time

**Phase 2: High Priority (Developer Experience)**
1. **Standardize component exports**
   - Choose single export pattern (prefer `export function`)
   - Document decision in coding standards
   - Add ESLint rule to enforce pattern
   - Optional: Migrate existing code with codemod

2. **Document barrel export policy**
   - Define when to create index.ts files
   - Document in coding standards
   - Optional: Apply policy to existing directories

3. **Component organization guide**
   - Document structure: features/ vs ui/ vs pages/
   - Add guidance to coding standards
   - Optional: Reorganize existing components

**Phase 3: Medium Priority (Optional Enhancements)**
1. **File naming migration** - PascalCase → kebab-case (codemod)
2. **Import path cleanup** - Relative → @/ alias (codemod)
3. **Test organization** - Centralize remaining __tests__ directories

**Out of Scope**:
- Automated enforcement of all standards (defer to future story)
- Complete codebase migration (focus on critical patterns first)
- Developer onboarding documentation (separate initiative)

#### Acceptance Criteria

**Phase 1 (Critical - Required)**:
- [ ] All `(api as any)` type casts removed and replaced with proper typing
- [ ] ESLint rule added preventing `any` type casts on API object
- [ ] Centralized `routes.ts` created with type-safe helpers
- [ ] All object-based and template literal routes migrated to centralized system
- [ ] POC code marker standard documented in coding standards
- [ ] Existing POC code marked with standard headers

**Phase 2 (High Priority - Recommended)**:
- [ ] Component export pattern chosen and documented
- [ ] ESLint rule added for component export consistency
- [ ] Barrel export policy documented in coding standards
- [ ] Component organization guide added to coding standards

**Phase 3 (Medium Priority - Optional)**:
- [ ] File naming standard implemented (if team approves)
- [ ] Import path cleanup completed (if team approves)

**Validation (All Phases)**:
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run lint` passes with zero warnings
- [ ] `bun test` passes (all tests green)
- [ ] `bun run build` completes successfully
- [ ] Updated coding standards documentation published

**Documentation**:
- [ ] `docs/architecture/coding-standards.md` updated with new standards
- [ ] Migration decisions documented in story completion notes
- [ ] ESLint configuration updated and documented

#### Implementation Notes

**Team Discussion Required**:
- Before implementation, conduct team review of coding inconsistencies audit
- Prioritize which standards to adopt (Critical = required, others = optional)
- Decide on migration strategy (big bang vs incremental)
- Determine ESLint rule strictness (error vs warning)

**Type Cast Fix Strategy**:
- Investigate root cause of `(api as any)` usage
- Fix Convex TypeScript type generation if needed
- Update import patterns to get proper typing
- Document correct patterns in coding standards

**Route Centralization Approach**:
```typescript
// Example routes.ts structure
export const ROUTES = {
  admin: {
    analytics: '/admin/analytics',
    users: '/admin/users',
  },
  auth: {
    resetPassword: (token: string) => `/reset-password?token=${token}`,
  }
} as const;
```

**POC Header Format**:
```typescript
/**
 * ⚠️ PROOF OF CONCEPT - [Feature Name]
 *
 * STATUS: Experimental - Not production ready
 * CREATED: [Date]
 * PURPOSE: [Brief description]
 *
 * DO NOT USE IN PRODUCTION
 * DO NOT DELETE WITHOUT TEAM APPROVAL
 */
```

**Risk Considerations**:
- Type cast removal may reveal hidden type errors
- Route centralization requires comprehensive testing
- Component export pattern changes are breaking (decide on migration vs enforcement for new code)
- Coordinate with ongoing feature development to minimize conflicts

**Success Metrics**:
- Static analysis false positive rate: 50-78% → <20%
- Time to perform code analysis: 4-8 iterations → 1-2 iterations
- Developer confidence in static analysis results: Low → High
- ESLint violations for new code: Zero

---

### Story 0.5: Technical Debt - File Naming Migration to Kebab-Case

**Priority**: P2 (Medium)
**Estimated Effort**: Large (6-10 hours)
**Category**: Technical Debt / Code Quality
**Status**: ✅ **Approved** (Documented in `docs/stories/0.5.story.md`)

#### Problem Statement

The codebase currently uses mixed file naming conventions (PascalCase for components, camelCase for utilities) which creates inconsistency, case-sensitivity issues across platforms, and makes grep/search operations less reliable. Migrating to kebab-case establishes a single, consistent naming standard that works reliably across all platforms.

#### Scope

**Automated Migration with AST-Based Tooling**:
- Use jscodeshift for automated file renaming and import updates
- Preserve git history using `git mv` commands
- Phased migration: Components directory → App directory
- Update all imports to path aliases (`@/`) instead of relative paths
- Add ESLint rule to prevent relative import regressions

#### Acceptance Criteria

- [ ] **Migration Script**: jscodeshift tool with dry-run mode
- [ ] **File Renaming**: All PascalCase files converted to kebab-case
- [ ] **Import Updates**: All imports automatically updated across codebase
- [ ] **Git History**: File history preserved with `git mv`
- [ ] **Validation**: No naming conflicts before execution
- [ ] **Path Aliases**: All imports use `@/` instead of relative paths
- [ ] **ESLint Rule**: Warning on relative imports added
- [ ] **Test Suite**: All tests pass (`bun test`, `bun test:e2e`)
- [ ] **Build Success**: `bun run typecheck` and `bun run build` pass
- [ ] **Documentation**: Kebab-case standard and migration script usage documented
- [ ] **Rollback Points**: Recovery procedures documented for each phase

#### Implementation Notes

**Risk Mitigation**:
- Phase 1: Components directory (isolated scope)
- Phase 2: App directory (after validation)
- Rollback points between phases
- Comprehensive testing after each phase

**Tool Selection**: jscodeshift chosen for AST-based transformation ensuring accurate import updates

---

### Story 0.6: Developer Experience - Database Export & Analysis System

**Priority**: P2 (Medium)
**Estimated Effort**: Medium (4-6 hours)
**Category**: Developer Experience / Infrastructure
**Discovered**: October 2025 - Need for external data analysis workflows

#### Problem Statement

Developers need the ability to export database snapshots for external analysis using Claude Code and other AI-powered tools. Currently, there's no systematic way to extract structured database data for prompt engineering, pattern analysis, or debugging workflows. This creates friction in development workflows and limits the ability to leverage AI tools for data-driven insights.

#### Scope

**System Admin Developer Tool** (`/admin/developer-tools/`):
- Full database JSON export capability
- Segmented export filters (by company/site/worker/participant/provider)
- Daily snapshot workflow support
- Claude Code integration for external analysis
- Downloadable JSON format

**Use Cases**:
- Analyze incident patterns across companies/providers
- Extract datasets for prompt engineering experiments
- Debug data relationships and patterns
- Generate test datasets from production-like data
- Train and validate AI models on real incident data

#### Acceptance Criteria

- [ ] **Admin Interface**: Developer tools page at `/admin/developer-tools/export`
- [ ] **Full Export**: Download complete database snapshot as JSON
- [ ] **Segmented Exports**: Filter by company, site, worker, participant, or provider
- [ ] **Export Options**: Select specific tables or include all
- [ ] **Data Privacy**: System admin only access (role-based)
- [ ] **File Format**: Well-structured JSON with metadata
- [ ] **Download Handling**: Browser download or copy to clipboard
- [ ] **Performance**: Handle large exports (500+ incidents, 100+ participants)
- [ ] **Documentation**: Usage guide for Claude Code analysis workflows
- [ ] **Security**: No sensitive data exposure in logs/errors

#### Implementation Notes

**Architecture**:
- Convex function: `exports.generateDatabaseExport`
- Admin UI: React component with filter options
- Security: System admin role validation
- Performance: Consider streaming for large datasets

**Technical Considerations**:
- JSON serialization of Convex data structures
- Date/timestamp handling for JSON compatibility
- Relationship preservation (IDs maintained)
- Privacy considerations (anonymization options)

**Future Enhancements** (out of scope):
- Scheduled automated exports
- Export history/versioning
- Direct upload to analysis tools
- Data anonymization/masking options

---

### Story 0.7: User Experience - Authorization UI Consistency

**Priority**: P1 (High)
**Estimated Effort**: Medium (4-6 hours)
**Category**: User Experience / Technical Debt
**Discovered**: October 13, 2025 - Story 7.5 SAT revealed inconsistent authorization UI patterns

#### Problem Statement

The application has inconsistent UI patterns for displaying unauthorized access messages across different pages. During Story 7.5 acceptance testing, three distinct patterns were discovered:

1. **UnauthorizedAccessCard component** - Consistent, well-designed pattern (5 pages ✅)
2. **Alert component** - Inconsistent, minimal messaging (3 pages ❌)
3. **Custom UI** - Unknown patterns (11+ pages need audit ❓)

This inconsistency creates poor user experience, maintenance burden, developer confusion, and testing complexity. Additionally, the current `UnauthorizedAccessCard` component is hardcoded for `system_admin` roles only, limiting its usefulness for other permission scenarios.

#### Scope

**Phased Implementation**:

**Phase 1: Complete Authorization UI Audit**
- Systematically test all admin and restricted pages with 3 user roles:
  - System Administrator (full access)
  - Company Administrator (company-scoped access)
  - Frontline Worker (participant-scoped access)
- Document actual vs expected behavior for each URL
- Categorize UI patterns and identify permission bugs

**Phase 2: Component Enhancement**
- Enhance `UnauthorizedAccessCard` to support multiple authorization scenarios
- Support different role requirements (not just system_admin)
- Add flexible messaging, icons, and variants
- Maintain backward compatibility

**Phase 3: Pattern Migration**
- Migrate 3 Alert pages to enhanced UnauthorizedAccessCard
- Fix any custom UI patterns discovered in audit
- Apply consistent pattern to all restricted pages

**Phase 4: Documentation & Testing**
- Document authorization UI pattern in coding standards
- Create comprehensive Story Acceptance Test with all URLs
- Execute role-based testing across all restricted pages

**URLs Requiring Audit** (16+ pages):
- Admin pages: companies, users, developer-tools, participants
- Application pages: dashboard, participants, showcase
- Test with system_admin, company_admin, and frontline_worker roles

#### Acceptance Criteria

**Phase 1**:
- [ ] Comprehensive URL list with expected permissions documented
- [ ] Role-based testing matrix completed for all pages
- [ ] Pattern categorization and bug identification complete

**Phase 2**:
- [ ] Enhanced UnauthorizedAccessCard with flexible props
- [ ] Backward compatibility maintained (5 existing pages work unchanged)
- [ ] Component documentation updated

**Phase 3**:
- [ ] 3 Alert pages migrated to UnauthorizedAccessCard
- [ ] Custom UI patterns standardized
- [ ] All permission bugs fixed
- [ ] Visual consistency achieved across all pages

**Phase 4**:
- [ ] Coding standards updated with authorization UI pattern
- [ ] Story Acceptance Test executed with all URLs and roles
- [ ] Developer guidelines documented

**Validation**:
- [ ] TypeScript, lint, tests, build, CI all pass
- [ ] Manual testing: SAT executed with all roles

#### Implementation Notes

**Current Audit Summary**:
- 5 pages using UnauthorizedAccessCard (consistent) ✅
- 3 pages using Alert component (needs migration) ❌
- 11+ pages with unknown patterns (needs audit) ❓

**Authorization Check Pattern** (from Story 7.5):
```typescript
// 1. Check permission BEFORE query definitions
const hasPermission = user && user.role === 'system_admin';

// 2. Include permission in skip condition
const data = useQuery(api.query, sessionToken && hasPermission ? args : 'skip');

// 3. Early return with UnauthorizedAccessCard
if (!hasPermission) {
  return <UnauthorizedAccessCard message="..." />;
}
```

**Component Enhancement Example**:
```typescript
interface UnauthorizedAccessCardProps {
  message: string;
  requiredRoles?: Array<'system_admin' | 'company_admin' | 'frontline_worker'>;
  icon?: 'shield' | 'lock' | 'warning';
  variant?: 'warning' | 'error';
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
}
```

**Testing Strategy**:
- Manual SAT with role-based URL testing matrix
- Document findings before implementing fixes
- Verify no ConvexErrors for unauthorized access (Story 7.5 bug pattern)

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
**Stories Completed**: 6 (0.1, 0.2, 0.4, 0.5, 0.6)
**Stories In Progress**: 1 (0.3)
**Stories Planned**: 1 (0.7)

**Last Updated**: October 13, 2025
