# Epic Numbering Discovery Protocol

**MANDATORY BEFORE ANY EPIC CREATION OR SUGGESTION**

When creating a new epic OR when user asks "where should this go" regarding epic placement:

## Step 1: ALWAYS Check Existing Epics First

```bash
# MANDATORY FIRST COMMAND - Never skip this
ls docs/prd/epic-*.md | sort
```

**DO NOT:**
- ❌ Trust `docs/prd/index.md` for epic availability (it can be stale)
- ❌ Assume "RESERVED" slots are actually available
- ❌ Assume gaps in numbering are usable
- ❌ Suggest epic numbers without running the ls command first

## Step 2: Find Next Available Number

```bash
# Pattern: epic-N.md where N is a number
# Find HIGHEST N currently in use
# Next available = HIGHEST + 1
```

**Example:**
```bash
$ ls docs/prd/epic-*.md | sort
epic-0.md
epic-1.md
epic-2.md
epic-3.md
epic-4.md
epic-5.md
epic-6.md
epic-7.md
epic-8.md
epic-9.md
epic-10.md

# HIGHEST = 10
# NEXT AVAILABLE = 11
```

## Step 3: Verify Before Proceeding

**BEFORE creating or renaming any epic files:**

1. Show user the current epic list
2. State explicitly: "I see epics 0-N exist, next available is Epic N+1"
3. Ask user: "Should I use Epic N+1 for [feature name]?"
4. WAIT for user confirmation

**Example:**
```
I found these epic files:
- epic-0.md through epic-10.md (11 epics total)

Next available epic number is Epic 11.

Should I create Epic 11 for Multi-Prompt Analysis System?
```

## Step 4: Check for Detailed PRD Files

Some epics have both formats:
- `epic-N.md` - Standard epic format (concise)
- `epic-N-detailed-name.md` - Detailed PRD

**ALWAYS check both patterns:**
```bash
ls docs/prd/epic-8*
# May show: epic-8.md AND epic-8-multi-prompt-analysis-system.md
```

## Common Failure Patterns to Avoid

**❌ WRONG - Trusting stale index:**
```
User: "Where should this epic go?"
Claude: *Reads index.md*
Claude: "Index says Epic 4 is RESERVED, let's use that"
Result: Conflict with existing epic-4.md file
```

**✅ CORRECT - Verify files first:**
```
User: "Where should this epic go?"
Claude: *Runs ls docs/prd/epic-*.md | sort*
Claude: "I see epics 0-10 exist. Next available is Epic 11. Should I use that?"
User: "Yes"
Result: No conflicts
```

## Protocol Enforcement

**This protocol is MANDATORY and takes precedence over:**
- Any stale index.md content
- Any "RESERVED" markings in documentation
- Any assumptions about gaps in numbering
- Any user requests that skip verification (politely verify anyway)

## Scrum Master Agent Integration

When the SM agent is active and creating epics, it MUST:
1. Follow this exact protocol before suggesting epic numbers
2. Show ls output to user
3. Get explicit confirmation of epic number
4. Never proceed without verification
