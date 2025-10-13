# Worktree Development Pattern

**Pattern Type**: Development Workflow
**Source**: Story 0.6 lessons learned
**Status**: Active - Recommended for appropriate scenarios
**Last Updated**: October 11, 2025

## Overview

Git worktrees provide isolated development environments for working on multiple branches simultaneously. This pattern defines when to use worktrees, how to manage them safely, and how to handle the handoff process when merging back to main.

**Key Principle**: Use worktrees for simple, isolated changes. Avoid for complex features requiring full testing.

---

## When to Use Worktrees

### ✅ **Good Fit** (Recommended)

Use worktrees when:
- **Simple UI component changes** (styling, layout, no logic)
- **Documentation updates** (markdown files, guides, READMEs)
- **Isolated refactoring** (no dependencies, no testing required)
- **Exploratory code** (might be discarded, safe to isolate)
- **Code that doesn't require testing in worktree** (can test in main after merge)
- **Small bug fixes** (when confident, no complex testing needed)

**Characteristics**:
- No schema changes
- No database dependencies
- No multi-service coordination
- Can be tested (or visually reviewed) quickly in main after merge

### ❌ **Bad Fit** (Avoid)

**Do NOT use worktrees** when:
- **Schema changes** (Convex, database, migrations)
- **Features requiring full testing** (need real data, complex scenarios)
- **Work involving multiple services** (web + workers + backend)
- **Changes needing data seeding** (test data setup)
- **Complex dependency changes** (new packages, environment changes)
- **Features with deployment complexity** (separate Convex deployments cause conflicts)

**Characteristics**:
- Requires separate Convex deployment (empty database)
- Needs seed data for testing
- Has schema validation dependencies
- Requires full integration testing

---

## Decision Matrix

| Scenario | Worktree? | Rationale | Testing Strategy |
|----------|-----------|-----------|------------------|
| **Simple UI component** | ✅ Yes | No dependencies, isolated | Visual test in main after merge |
| **Documentation update** | ✅ Yes | No code execution | Review in main, no testing needed |
| **Schema migration** | ❌ Never | Deployment sync impossible | Always develop in main |
| **Database export (Story 0.6)** | ❌ No | Convex + UI + testing needed | Should have used main from start |
| **Refactoring experiment** | ✅ Yes | Might discard, safe to isolate | Test thoroughly if keeping |
| **Bug fix (simple)** | ✅ Maybe | Depends on testing needs | Use main if testing complex |
| **Full-stack feature** | ❌ No | Multiple moving parts | Develop and test in main |

---

## Human-Driven Workflow

### Overview

Worktree workflow is **human-controlled** using the **Worktree Manager agent (Willow)** who provides instructions rather than executing commands.

**Critical Safety**: AI agents do NOT execute worktree scripts to prevent directory confusion and accidental main branch contamination.

### Workflow Phases

#### **Phase 1: Suitability Assessment**

**Command**: Invoke Worktree Manager agent

```
*worktree-manager
*start-worktree
```

**Agent Actions**:
1. Reads story file
2. Analyzes complexity (dependencies, testing, schema)
3. Provides suitability assessment
4. Recommends worktree vs main branch development

**Decision Point**: If unsuitable, develop in main branch instead.

#### **Phase 2: Worktree Creation** (If Suitable)

**Human Actions** (do NOT let AI execute):
1. Ensure in main branch directory:
   ```bash
   cd /path/to/app.supportsignal.com.au
   pwd  # Verify correct location
   ```

2. Run worktree start script:
   ```bash
   ./scripts/worktree-start.sh X.Y
   ```
   *(Script creates `../story-X-Y/` directory)*

3. Open new terminal/Claude session

4. Navigate to worktree:
   ```bash
   cd ../story-X-Y
   pwd  # Verify you're in worktree
   ```

5. Invoke developer agent to begin work

#### **Phase 3: Development in Worktree**

**In worktree directory**:
- Develop feature/fix normally
- Commit changes regularly
- **Do NOT mark story as "Completed"**
- Status should remain "In Progress" or similar

**Limitations**:
- Separate Convex deployment (empty database)
- Cannot test features requiring real data
- Schema changes may cause sync issues
- Must document what cannot be tested

#### **Phase 4: Handoff Documentation**

**Command**: Before merging, invoke Worktree Manager

```
*worktree-manager
*end-worktree
```

**Agent Actions**:
1. Verifies you're in worktree (not main!)
2. Checks for uncommitted changes
3. Generates File List from git status
4. Guides you through handoff documentation
5. Validates handoff checklist complete

**Required Documentation**:
- Complete File List (all changed files)
- Testing approach for main branch
- Schema changes (if any)
- Dependencies changes (if any)
- Known issues or warnings
- Story status: "Ready for Main Branch Testing"

**Blocking**: Cannot merge until handoff documentation is complete.

#### **Phase 5: Merge to Main**

**Human Actions** (do NOT let AI execute):
1. Commit all changes in worktree:
   ```bash
   cd /path/to/story-X-Y
   git add .
   git commit -m "descriptive message"
   ```

2. Return to main branch:
   ```bash
   cd /path/to/app.supportsignal.com.au
   ```

3. Run worktree end script:
   ```bash
   ./scripts/worktree-end.sh X.Y
   ```
   *(Script merges changes and removes worktree directory)*

4. Review merge conflicts (if any)

5. Test thoroughly in main branch

6. Mark story complete ONLY after testing passes

---

## Safety Guardrails

### 1. Human-Only Script Execution

**Rule**: AI agents provide instructions, humans execute scripts.

**Why**: AI agents don't maintain persistent directory context and could accidentally execute commands in wrong location.

**Example Risk**:
```bash
# AI agent thinks it's in worktree but accidentally runs:
cd /app.supportsignal.com.au  # Oops, now in main!
# Makes edits thinking it's in worktree... main branch contaminated!
```

### 2. Directory Verification

**Before every operation**:
```bash
pwd  # Always verify current location
```

**Worktree Manager checks**:
- Current directory path
- Git branch name
- Whether in main or worktree
- Warns if location seems wrong

### 3. Handoff Documentation Enforcement

**Blocking rules**:
- Cannot merge without complete handoff documentation
- Cannot mark story "Completed" in worktree
- Must set status to "Ready for Main Branch Testing"

### 4. Testing in Main Branch

**Critical**: Features are NOT complete until tested in main branch.

**Workflow**:
- Worktree: Development + handoff documentation
- Main: Testing + validation + mark complete

---

## Examples

### ✅ Good Example: Simple UI Component

**Story**: Update button styling across application

**Why Good Fit**:
- UI-only changes (no backend, no database)
- No testing needed in worktree
- Can visually review in main after merge
- Isolated changes, low risk

**Workflow**:
1. Create worktree: `./scripts/worktree-start.sh 0.8`
2. Update button styles in `components/ui/button.tsx`
3. Commit changes
4. Document handoff: "Visual review needed in main"
5. Merge: `./scripts/worktree-end.sh 0.8`
6. Test: Open app in main, verify button styling
7. Mark complete

**Time Saved**: Allows working on other features in main while button work isolated.

### ❌ Bad Example: Database Export Feature (Story 0.6)

**Story**: Database export system with full JSON export

**Why Bad Fit**:
- Convex export function (separate deployment)
- Requires real data for testing
- Schema change (participants.site_id)
- Cannot test in worktree (empty database)

**What Happened**:
- 3+ hours dealing with Convex deployment complexity
- Schema validation errors (site_id missing in worktree)
- Could not test export feature properly
- Had to merge blindly, test in main

**Should Have Done**:
- Developed in main branch from start
- Normal testing workflow
- Faster completion

**Lesson**: Full-stack features with database dependencies should use main branch.

---

## Tools & Scripts

### Worktree Start Script

**Location**: `./scripts/worktree-start.sh`

**Usage**:
```bash
./scripts/worktree-start.sh X.Y
```

**What it does**:
- Creates worktree at `../story-X-Y/`
- Checks out branch `story/X.Y`
- Sets up git tracking

### Worktree End Script

**Location**: `./scripts/worktree-end.sh`

**Usage**:
```bash
./scripts/worktree-end.sh X.Y
```

**What it does**:
- Merges worktree branch to main
- Handles merge conflicts
- Removes worktree directory
- Cleans up git references

### Worktree Manager Agent (Willow)

**Invocation**: `*worktree-manager`

**Commands**:
- `*help` - Show available commands
- `*start-worktree` - Analyze story, provide setup instructions
- `*end-worktree` - Guide handoff documentation and merge
- `*status` - Check current location and worktree state
- `*exit` - Exit worktree manager mode

**Agent File**: `.bmad-core/agents/worktree-manager.md`

---

## Common Pitfalls

### 1. Using Worktree for Complex Features

**Problem**: Story 0.6 used worktree for full-stack feature with database dependency.

**Result**: Could not test, 3+ hours complexity, blind merge.

**Solution**: Use decision matrix above to assess suitability first.

### 2. Marking Story Complete in Worktree

**Problem**: Temptation to mark story complete before merging to main.

**Result**: Story appears done but hasn't been tested in real environment.

**Solution**: Worktree Manager enforces "Ready for Main Branch Testing" status.

### 3. Skipping Handoff Documentation

**Problem**: Merging without documenting what needs testing.

**Result**: Don't know what to test in main, might miss critical issues.

**Solution**: Worktree Manager blocks merge until handoff complete.

### 4. AI Agent Executing Scripts

**Problem**: Letting AI agent run `./scripts/worktree-start.sh` directly.

**Result**: High risk of directory confusion, accidental main branch edits.

**Solution**: Human-only script execution, AI provides instructions.

### 5. Not Verifying Directory

**Problem**: Assuming you're in right directory without checking.

**Result**: Commands executed in wrong location, file corruption.

**Solution**: Always run `pwd` before operations.

---

## Integration with Story Template

### Template Updates

Story template includes:
- **Worktree Notes** field (optional, freeform text)
- **Worktree Handoff** checklist (enforced before merge)

**Location**: `.bmad-core/templates/story-tmpl.yaml`

### Story Statuses for Worktree Development

- **In Progress**: Actively developing in worktree
- **Ready for Main Branch Testing**: Handoff complete, merged to main, awaiting testing
- **Completed**: Testing passed in main, story truly done

**Do NOT use "Completed" while in worktree!**

---

## Related Documentation

- **Agent**: `.bmad-core/agents/worktree-manager.md` - Worktree Manager (Willow) specification
- **Checklist**: `.bmad-core/checklists/worktree-handoff-checklist.md` - Complete handoff requirements
- **Lessons Learned**: `docs/lessons-learned/worktree-workflow-kdd.md` - Story 0.6 analysis and recommendations
- **Story Example**: `docs/stories/0.6.story.md` - Real-world worktree handoff documentation

---

## Key Takeaways

1. **Worktrees are tools, not defaults** - Use only when appropriate
2. **Human-driven workflow** - AI provides instructions, humans execute
3. **Simple changes only** - Avoid complex features with dependencies
4. **Testing in main required** - Story not complete until tested in main
5. **Handoff documentation mandatory** - Knowledge must transfer across branches
6. **Directory awareness critical** - Always verify location with `pwd`
7. **Story 0.6 taught us** - Full-stack features belong in main branch

**Bottom Line**: When in doubt, use main branch. Worktrees add value for specific scenarios but introduce complexity that's not worth it for most stories.
