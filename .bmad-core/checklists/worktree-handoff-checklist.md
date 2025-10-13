# Worktree Handoff Checklist

**Purpose**: Ensure complete documentation before merging worktree changes to main branch

**Used By**: Worktree Manager Agent (Willow)

**When**: Before running `./scripts/worktree-end.sh X.Y`

---

## Pre-Merge Requirements

### ✅ Documentation Complete

- [ ] **File List Generated**
  - All changed files documented
  - Each file has brief description of changes
  - New files vs modified files clearly identified
  - Deleted files noted (if any)

- [ ] **Testing Approach Documented**
  - What needs to be tested in main branch
  - How to test (step-by-step instructions)
  - Expected outcomes for each test
  - Known limitations or edge cases

- [ ] **Schema Changes Documented** (if applicable)
  - Database schema changes listed
  - Migration scripts identified (if needed)
  - Index changes noted
  - Backward compatibility addressed

- [ ] **Dependencies Changes Documented** (if applicable)
  - New npm packages listed with versions
  - Removed packages noted
  - Environment variables added/changed
  - Configuration file changes

- [ ] **Known Issues Documented**
  - Limitations of current implementation
  - TODOs for future work
  - Warnings about untested scenarios
  - Performance concerns (if any)

- [ ] **Story Status Updated**
  - Status set to "Ready for Main Branch Testing"
  - NOT marked as "Completed"
  - Completion date NOT added yet
  - QA Results section left empty (for main branch)

---

## Handoff Documentation Template

Add this section to story file before merge:

```markdown
## Worktree Handoff Notes

### Development Environment
Story X.Y was developed in git worktree (`story-X-Y/`) isolated from main branch.

### Why Worktree Was Used
[Brief explanation of why worktree was appropriate for this story]

### What Cannot Be Tested in Worktree
[List what requires main branch environment for testing]

### Testing Plan for Main Branch

**After Merge, Execute in Main**:

1. **Verify Development Environment**:
   ```bash
   cd /path/to/main
   # List verification steps
   ```

2. **Test Feature X**:
   - [Specific test steps]
   - [Expected outcomes]

3. **Test Feature Y**:
   - [Specific test steps]
   - [Expected outcomes]

### Schema Changes
[If applicable, list all schema changes with impact assessment]

### Dependencies
[List new packages, env vars, or configuration changes]

### Known Issues & Warnings
[List any limitations, TODOs, or concerns]

### Handoff Checklist
- [x] All files documented in File List
- [x] Testing approach documented
- [x] Schema changes noted (if any)
- [x] Dependencies changes noted (if any)
- [x] Known issues documented
- [x] Status set to "Ready for Main Branch Testing"
```

---

## Safety Checks

Before allowing merge, verify:

- [ ] **Location Check**: Confirmed in worktree directory (not main)
- [ ] **Uncommitted Changes**: All work committed to worktree branch
- [ ] **Documentation Review**: All sections above completed
- [ ] **Human Confirmation**: Human has reviewed and approved handoff

---

## Merge Instructions Template

Provide to human:

```bash
# 1. Ensure all changes committed in worktree
cd /path/to/story-X-Y
git status  # Should be clean

# 2. Return to main branch
cd /path/to/main

# 3. Run worktree end script
./scripts/worktree-end.sh X.Y

# 4. Review merge conflicts (if any)
# Resolve carefully, preserving intent of both branches

# 5. Test thoroughly
[Provide specific testing commands from handoff docs]

# 6. Mark story complete
# Only after all tests pass in main branch
```

---

## Post-Merge Actions

After successful merge to main:

- [ ] **Run Tests**: Execute testing plan from handoff docs
- [ ] **Verify Features**: Confirm all features work as expected
- [ ] **Update Story Status**: Change from "Ready for Main Branch Testing" to "Completed"
- [ ] **Add Completion Date**: Document when testing completed
- [ ] **Fill QA Results**: Complete Pattern Compliance and Velocity sections
- [ ] **Clean Up Worktree**: Remove worktree directory (script handles this)

---

## Red Flags (Block Merge)

Do NOT allow merge if:

- ❌ File List incomplete or missing
- ❌ No testing approach documented
- ❌ Schema changes not documented
- ❌ Story marked as "Completed" (should be "Ready for Main Branch Testing")
- ❌ Human has not reviewed handoff documentation
- ❌ Currently in main branch (not worktree)

---

## Example: Good Handoff Documentation

**Story 0.6** provides a good example (see `docs/stories/0.6.story.md`):
- Complete file list with descriptions
- Detailed testing plan for main branch
- Schema changes documented (participants.site_id)
- Dependencies changes noted (none)
- Known issues documented
- Status correctly set to "Ready for Main Branch Testing"

---

## Common Mistakes to Avoid

1. **Marking Story Complete in Worktree**
   - Story cannot be complete until tested in main
   - Always use "Ready for Main Branch Testing" status

2. **Insufficient Testing Instructions**
   - Must provide step-by-step testing guide
   - Include expected outcomes, not just actions

3. **Missing Schema Documentation**
   - Schema changes have high merge conflict risk
   - Must document explicitly even if "optional"

4. **Forgetting Dependencies**
   - New packages require npm install in main
   - Environment variables need to be set

5. **No Known Issues**
   - Every implementation has limitations
   - Document honestly for future developers

---

## Validation Checklist Summary

Quick validation before merge:

- [ ] Story file has "Worktree Handoff Notes" section
- [ ] File List present with all changes
- [ ] Testing Plan detailed and actionable
- [ ] Schema changes documented (or "None")
- [ ] Dependencies documented (or "None")
- [ ] Known issues documented (or "None")
- [ ] Status = "Ready for Main Branch Testing"
- [ ] Human has reviewed and approved
- [ ] Currently in worktree directory
- [ ] All changes committed

**If all checked**: ✅ Safe to proceed with merge

**If any missing**: ❌ Block merge, complete documentation first
