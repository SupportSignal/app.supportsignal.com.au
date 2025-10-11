# Worktree Workflow KDD

**Knowledge Type**: Lessons Learned
**Source**: Story 0.6 - Database Export & Analysis System
**Date**: October 10, 2025
**Status**: Active Learning - Ready for Implementation

## Executive Summary

**TL;DR**: Worktrees are valuable for simple isolated development but become problematic with complex dependencies (Convex, databases, seeding). The solution is a **human-driven workflow** managed by a dedicated Worktree Manager agent that provides instructions rather than automation.

**Quick Decision Guide**:
- ✅ **Use Worktrees**: Simple code changes, no testing required, UI-only work
- ❌ **Avoid Worktrees**: Schema changes, Convex functions, full testing needed, data seeding required

## Problems Discovered (Story 0.6 Experience)

### Problem 1: AI Directory Confusion Risk

**What Happened**:
During Story 0.6 implementation, the AI agent was working in the worktree (`story-0-6/`) but needed to reference patterns and understand project structure. There's inherent risk that an AI agent could:
- Forget which directory it's in (main vs worktree)
- Accidentally make changes in the wrong location
- Overwrite main branch code when intending to work in worktree

**Example**:
```bash
# AI thinks it's in /story-0-6 but accidentally runs:
cd /app.supportsignal.com.au  # Oops, now in main!
# Makes edits thinking it's in worktree...
```

**Impact**: High risk of accidental main branch contamination

**Root Cause**: AI agents don't maintain persistent directory context across tool calls

### Problem 2: Complex Dependency Hell

**What Happened**:
Story 0.6 required:
1. Installing node_modules in worktree
2. Running Convex dev server (creates new deployment)
3. Syncing schema between main and worktree
4. Schema validation errors (participants.site_id missing)
5. Separate database state (worktree has empty data)
6. Cannot test without seeding data
7. Two Convex instances conflicting

**Concrete Issues**:
```bash
# In worktree
bunx convex dev
# ✖ Schema validation failed
# Document contains extra field `site_id` that is not in the validator

# Fixed schema, but now:
# - Empty database (no seed data)
# - Separate deployment from main
# - Cannot test export feature properly
```

**Impact**: 3+ hours of complexity for what should be simple testing

**Root Cause**: Full-stack apps with databases don't isolate cleanly in worktrees

### Problem 3: Automation Assumptions from Story Template

**What Happened**:
Story template included `worktree: true` field, creating expectations that:
- Dev agent should auto-start worktree
- Workflow should be automated
- Story "knows" it's in a worktree

**Example from Story 0.6**:
```markdown
## Use Worktree
Branch will be: story/0.6

**Worktree Value: true**
```

**Impact**: AI agents might try to automate worktree operations, increasing directory confusion risk

**Root Cause**: Template encouraged automation instead of human-driven process

### Problem 4: Missing Handoff Process

**What Happened**:
No systematic way to capture changes before merging back to main:
- What files changed?
- What needs testing?
- What schema changes occurred?
- What dependencies were added?

Story 0.6 ended with implementation complete but:
- No testing performed
- Changes not documented for main branch
- Unclear what to test after merge
- No checklist for validation

**Impact**: Knowledge loss between worktree and main, blind merging

**Root Cause**: No handoff agent or process defined

### Problem 5: Testing Impossibility

**What Happened**:
Cannot realistically test full-stack features in worktree because:
- Separate Convex deployment (empty database)
- No seed data
- Schema might be out of sync
- Would need to duplicate entire dev environment

**Story 0.6 Specific**:
- Export feature needs real data to test
- Cannot test without seeding 500+ incidents
- Seeding in worktree creates divergent data
- Browser testing at different URL/port

**Impact**: Must merge untested code to main

**Root Cause**: Worktrees designed for code isolation, not full environment isolation

## Solution: Human-Driven Worktree Workflow

### Overview

Replace AI automation with **human-controlled workflow** using:
1. **Worktree Manager Agent**: Provides instructions, doesn't execute
2. **Script-Based Operations**: Human runs `./scripts/worktree-start.sh` and `worktree-end.sh`
3. **Explicit Handoff**: Manager ensures documentation before merge
4. **Status Clarity**: "Ready for Main Branch Testing" (not "Complete")

### Part 1: Worktree Manager Agent

**Location**: `.bmad-core/agents/worktree-manager.md`

**Complete Agent Specification**:

```yaml
IDE-FILE-RESOLUTION:
  - Dependencies map to .bmad-core/{type}/{name}
  - Only load when user requests specific command execution

REQUEST-RESOLUTION: Match user requests to commands flexibly

activation-instructions:
  - Read THIS ENTIRE FILE - complete persona definition
  - Adopt persona defined in 'agent' and 'persona' sections
  - Greet user with name/role and mention `*help` command
  - DO NOT load other agent files during activation
  - CRITICAL: Never execute worktree scripts directly - provide instructions only
  - STAY IN CHARACTER!

agent:
  name: Willow
  id: worktree-manager
  title: Worktree Workflow Manager
  icon: 🌳
  whenToUse: "Use when starting/ending git worktree workflows or managing worktree handoffs"
  customization: |
    CRITICAL: This agent provides INSTRUCTIONS ONLY - never executes scripts
    CRITICAL: Always verify current directory and warn about location risks
    CRITICAL: Enforce handoff documentation before allowing merge

persona:
  role: Worktree Workflow Specialist & Safety Guardian
  style: Systematic, safety-focused, checklist-driven
  identity: Expert who protects main branch from worktree accidents and ensures smooth transitions
  focus: Human-driven workflows, explicit documentation, zero automation

core_principles:
  - NEVER execute worktree scripts - provide instructions for human to run
  - ALWAYS verify current directory before giving instructions
  - ENFORCE handoff documentation before merge approval
  - PROTECT main branch from accidental contamination
  - DOCUMENT everything for context preservation across branches

commands:
  - help: Show available commands
  - start-worktree: Analyze story and provide worktree start instructions
  - end-worktree: Document changes and provide merge instructions
  - status: Check current location and worktree state
  - exit: Exit worktree manager mode

workflows:
  start-worktree:
    order: |
      1. Read story file to understand requirements
      2. Analyze complexity (dependencies, testing, schema)
      3. Provide suitability assessment (good/bad fit for worktree)
      4. If suitable: Give human instructions to run script
      5. If unsuitable: Recommend main branch development instead

    suitability-check: |
      ❌ AVOID WORKTREE IF:
      - Convex schema changes
      - Database seeding required
      - Full testing needed
      - Multiple services (web + workers)

      ✅ GOOD FIT IF:
      - Simple UI changes
      - Documentation updates
      - Isolated component work
      - No testing required in worktree

    instructions-format: |
      Provide clear step-by-step:
      1. Ensure in main branch directory: cd /path/to/main
      2. Run: ./scripts/worktree-start.sh X.Y
      3. Open new terminal/Claude session
      4. Navigate: cd ../story-X-Y
      5. Invoke developer agent to begin work

      WARNING: Do not let AI agents run these commands - human must execute

  end-worktree:
    order: |
      1. Verify in worktree directory (not main!)
      2. Check for uncommitted changes
      3. Generate File List from git status
      4. Update story with handoff documentation
      5. Create testing checklist for main branch
      6. Provide merge instructions for human

    handoff-documentation-required: |
      - Complete File List (all changes)
      - Testing approach for main branch
      - Schema changes documented
      - Dependencies documented
      - Known issues or warnings
      - Story status: "Ready for Main Branch Testing"

    merge-instructions-format: |
      Review story documentation, then:
      1. Commit all changes: git add . && git commit -m "..."
      2. Return to main: cd /path/to/main
      3. Run: ./scripts/worktree-end.sh X.Y
      4. Review merge conflicts if any
      5. Test thoroughly in main branch
      6. Mark story complete only after testing

  status:
    checks: |
      - Current directory (main vs worktree)
      - Git branch name
      - Uncommitted changes
      - Worktree list (git worktree list)
      - Warn if location seems wrong for current operation

blocking:
  - Cannot start worktree if already in worktree
  - Cannot end worktree if in main branch
  - Cannot merge without handoff documentation complete
  - Cannot mark story complete in worktree (only "Ready for Main Branch Testing")

dependencies:
  tasks: []
  checklists:
    - worktree-handoff-checklist.md
```

### Part 2: Template Changes

**File**: `.bmad-core/templates/story-tmpl.yaml`

**Changes to Make**:

```yaml
# REMOVE this section:
- id: worktree
  title: Use Worktree
  type: boolean
  default: false
  instruction: |
    Set to true to work on this story in an isolated git worktree.
    When true, dev agent will automatically run worktree:start before beginning work.
    Branch will be: story/{{epic_num}}.{{story_num}}
  owner: scrum-master
  editors: [scrum-master, dev-agent]

# ADD this section instead:
- id: worktree_notes
  title: Worktree Notes
  type: freeform-text
  optional: true
  instruction: |
    If this story is being developed in a worktree, document:
    - Why worktree was chosen
    - What can/cannot be tested in worktree
    - Handoff requirements for main branch
    - Testing plan for main branch after merge
  owner: worktree-manager
  editors: [worktree-manager, dev-agent]

# ADD new section before QA Results:
- id: worktree_handoff
  title: Worktree Handoff (if applicable)
  type: structured-checklist
  optional: true
  items:
    - label: "All files documented in File List"
      required: true
    - label: "Testing approach documented"
      required: true
    - label: "Schema changes noted (if any)"
      required: true
    - label: "Dependencies changes noted (if any)"
      required: true
    - label: "Known issues or warnings documented"
      required: true
    - label: "Status set to 'Ready for Main Branch Testing'"
      required: true
  instruction: |
    Complete this checklist before running worktree-end.sh
    Worktree Manager agent enforces completion
  owner: worktree-manager
  editors: [worktree-manager]
```

### Part 3: Pattern Documentation

**File**: `docs/patterns/worktree-development-pattern.md`

**Structure** (to be created in main branch):

```markdown
# Worktree Development Pattern

## When to Use Worktrees

✅ **Good Fit**:
- Simple UI component changes
- Documentation updates
- Isolated refactoring (no dependencies)
- Exploratory code that might be discarded
- Code that doesn't require testing in worktree

❌ **Bad Fit**:
- Schema changes (Convex, database)
- Features requiring full testing
- Work involving multiple services
- Changes needing data seeding
- Complex dependency changes

## Human-Driven Workflow

[Complete workflow with examples]

## Safety Guardrails

[Directory checks, AI limitations]

## Examples

### Good Example: UI Component
### Bad Example: Full-Stack Feature (Story 0.6)
```

## Implementation Checklist (Execute in Main Branch)

When you return to main branch after merging Story 0.6, execute in this order:

### Phase 1: Agent Creation
- [ ] Create `.bmad-core/agents/worktree-manager.md` (copy spec from above)
- [ ] Create `.bmad-core/checklists/worktree-handoff-checklist.md`
- [ ] Test agent loads: `/BMad:agents:worktree-manager`

### Phase 2: Template Updates
- [ ] Modify `.bmad-core/templates/story-tmpl.yaml` (remove worktree boolean, add notes/handoff)
- [ ] Verify template generates correctly
- [ ] Create test story to validate changes

### Phase 3: Documentation
- [ ] Create `docs/patterns/worktree-development-pattern.md`
- [ ] Update `docs/patterns/index.md` to include worktree pattern
- [ ] Update `CLAUDE.md` with worktree guidance (link to pattern)

### Phase 4: Validation
- [ ] Test worktree workflow on simple story (UI component only)
- [ ] Verify Worktree Manager agent works as expected
- [ ] Validate handoff process captures all required info
- [ ] Document any additional improvements needed

### Phase 5: Story 0.6 Finalization
- [ ] Merge Story 0.6 to main
- [ ] Test database export feature in main
- [ ] Mark Story 0.6 complete (after testing)
- [ ] Use Story 0.6 as reference example in pattern docs

## Decision Matrix

| Scenario | Worktree? | Rationale | Testing Strategy |
|----------|-----------|-----------|------------------|
| **Story 0.6: Database Export** | ❌ No (in hindsight) | Convex function + UI + testing needed | Should have developed in main |
| **Simple UI Component** | ✅ Yes | No dependencies, can merge untested | Test in main after merge |
| **Documentation Update** | ✅ Yes | No code execution needed | Visual review sufficient |
| **Schema Migration** | ❌ Never | Deployment sync impossible | Always use main |
| **Refactoring Experiment** | ✅ Yes | Might discard, safe to isolate | Test if keeping |
| **Bug Fix (no testing)** | ✅ Maybe | Depends on complexity | Consider main if simple |
| **Full-Stack Feature** | ❌ No | Too many moving parts | Use main + feature flags |

## Workflow Comparison

### Old Flow (What We Tried in Story 0.6)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SM creates story with `worktree: true`                  │
│                                                             │
│ 2. Dev agent auto-starts worktree ❌                        │
│    Risk: AI directory confusion                            │
│                                                             │
│ 3. Install dependencies in worktree                        │
│    bunx install (370ms)                                     │
│                                                             │
│ 4. Start Convex dev ❌                                      │
│    Creates new deployment                                   │
│    Schema validation errors                                │
│    Empty database                                          │
│                                                             │
│ 5. Implement feature                                        │
│    Code complete but cannot test                           │
│                                                             │
│ 6. Try to test in worktree ❌                               │
│    Need to seed data                                        │
│    Deployment conflicts                                    │
│    Give up on testing                                      │
│                                                             │
│ 7. Merge blindly                                           │
│    No documentation                                        │
│    Hope it works in main                                   │
└─────────────────────────────────────────────────────────────┘
```

### New Flow (Proposed Solution)

```
┌─────────────────────────────────────────────────────────────┐
│ MAIN BRANCH                                                 │
│ 1. Human decides: "This needs isolation"                   │
│    Evaluates: Simple? No testing needed?                   │
│                                                             │
│ 2. Human invokes: /BMad:agents:worktree-manager            │
│                                                             │
│ 3. Worktree Manager analyzes story                         │
│    ✅ "Good fit - simple UI changes"                        │
│    ❌ "Bad fit - use main branch instead"                   │
│                                                             │
│ 4. Manager provides instructions:                           │
│    "Run: ./scripts/worktree-start.sh 0.6"                  │
│                                                             │
│ 5. Human executes script                                    │
│    Worktree created                                        │
│    Opens new Claude session                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WORKTREE                                                    │
│ 6. Human: "Install dependencies"                           │
│    bun install                                             │
│                                                             │
│ 7. Dev agent implements (code only)                        │
│    No testing in worktree                                  │
│    Focuses on implementation                               │
│                                                             │
│ 8. Human invokes Worktree Manager: *end-worktree          │
│                                                             │
│ 9. Manager executes handoff:                               │
│    ✓ Documents all file changes                            │
│    ✓ Creates testing checklist                             │
│    ✓ Notes schema/dependency changes                       │
│    ✓ Sets status: "Ready for Main Branch Testing"         │
│    ✓ Provides merge instructions                           │
│                                                             │
│ 10. Human commits changes                                   │
│     git add . && git commit                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ BACK TO MAIN                                                │
│ 11. Human runs: ./scripts/worktree-end.sh 0.6             │
│     Merges to main                                         │
│     Cleans up worktree                                     │
│                                                             │
│ 12. Test in main branch (proper environment)               │
│     All services running correctly                         │
│     Real data available                                    │
│                                                             │
│ 13. Mark story complete (after successful testing)         │
└─────────────────────────────────────────────────────────────┘
```

## Script Improvements (Future Enhancement)

Current scripts (`worktree-start.sh`, `worktree-end.sh`) are basic. Consider enhancing:

### worktree-start.sh Enhancements
```bash
# Add suitability warning
echo "⚠️  Worktrees are for simple code-only changes"
echo "❌ Avoid for: schema changes, testing, Convex functions"
read -p "Continue? (y/N) " -n 1 -r

# Auto-install dependencies option
read -p "Install dependencies now? (y/N) " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd $WORKTREE_PATH && bun install
fi

# Create reminder file
cat > $WORKTREE_PATH/.worktree-reminder.md <<EOF
# Worktree Workflow Reminder

You are working in an isolated worktree.

## Before Merging:
1. Invoke Worktree Manager: /BMad:agents:worktree-manager
2. Run: *end-worktree
3. Complete handoff documentation
4. Commit changes

## Then Return to Main:
cd /path/to/main
./scripts/worktree-end.sh 0.6
EOF
```

### worktree-end.sh Enhancements
```bash
# Check for handoff documentation
if ! grep -q "Ready for Main Branch Testing" "$WORKTREE_PATH/docs/stories/*.story.md"; then
  echo "❌ Story not ready for merge"
  echo "Run Worktree Manager: *end-worktree first"
  exit 1
fi

# Show file changes before merge
echo "Files changed:"
git -C "$WORKTREE_PATH" diff --name-status main

# Confirm merge
read -p "Merge these changes to main? (y/N) " -n 1 -r
```

## Story 0.6 Retrospective

### What Went Wrong
1. ❌ Started with `worktree: true` in template (automation expectation)
2. ❌ Didn't assess suitability before starting worktree
3. ❌ Hit Convex deployment complexity (3+ hours wasted)
4. ❌ Schema sync issues (participants.site_id)
5. ❌ Couldn't test in worktree (empty database)
6. ❌ No handoff process defined
7. ❌ AI directory confusion risk not managed

### What We Learned
1. ✅ Worktrees work for simple code-only changes
2. ✅ Full-stack features need main branch development
3. ✅ Human must control dangerous operations (scripts)
4. ✅ Handoff documentation is critical
5. ✅ Status "Ready for Main Branch Testing" needed
6. ✅ AI agents shouldn't automate worktree operations

### What We Did Right
1. ✅ Had worktree-start.sh and worktree-end.sh scripts ready
2. ✅ Recognized the problem and stopped to document
3. ✅ Created this KDD to prevent future issues
4. ✅ Designed Worktree Manager agent for safety

## Future Improvements

### Short Term (Next Sprint)
- Create Worktree Manager agent
- Update story template
- Create pattern documentation
- Test on simple story

### Medium Term (1-2 Sprints)
- Enhance scripts with safety checks
- Create suitability assessment checklist
- Add worktree guidance to CLAUDE.md
- Document success stories

### Long Term (Future)
- Consider feature flags for main branch development
- Evaluate GitLab/GitHub branch protection
- Explore Convex environment cloning (if possible)
- Build worktree analytics (success rate, time saved)

## References

- **Story 0.6**: `docs/stories/0.6.story.md` - Example of worktree complexity
- **Epic 0**: `docs/prd/epic-0.md` - Technical debt tracking
- **Worktree Scripts**: `scripts/worktree-start.sh`, `scripts/worktree-end.sh`
- **Git Worktree Docs**: https://git-scm.com/docs/git-worktree

## Keywords

worktree, git workflow, branch isolation, handoff process, AI safety, deployment complexity, Convex, schema sync, human-driven workflow, automation risks, context preservation

---

**Last Updated**: October 10, 2025
**Next Review**: After first successful worktree workflow with new process
**Owner**: Development Team
**Status**: Ready for Implementation
