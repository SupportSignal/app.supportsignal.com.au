# Claude Code Bug Report Template

This template matches the typical structure for GitHub bug reports.

---

## Title
**Format:** `[BUG] Brief, clear description of the bug`

**Example:** `[BUG] /push command hangs indefinitely with no error message`

**Field Value:**
```
{{TITLE}}
```

---

## Preflight Checklist
**Copy exactly:**
```
✅ I have searched existing issues and this bug hasn't been reported yet
✅ I have verified this is reproducible
✅ This is a single bug report (not multiple bugs)
```

---

## Bug Description
**What to include:**
- Clear description of the bug
- What you expected to happen
- What actually happened
- Impact of the bug

**Format:**
```
[Clear description of what's broken]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Impact:
[How this affects workflow]
```

**Field Value:**
```
{{BUG_DESCRIPTION}}
```

---

## Steps to Reproduce
**What to include:**
- Exact steps to reproduce the bug
- Starting conditions
- Each action taken
- Result observed

**Format:**
```
1. [First step]
2. [Second step]
3. [Third step]
4. [Observe result]

Expected: [What should happen]
Actual: [What happens instead]
```

**Field Value:**
```
{{STEPS_TO_REPRODUCE}}
```

---

## Environment Information
**What to include:**
- Claude Code version
- Operating system
- Relevant configuration
- Project type

**Format:**
```
Claude Code Version: [version]
Operating System: [OS and version]
Shell: [bash/zsh/etc]
Project Type: [e.g., Next.js, Python, etc.]

Additional Environment Details:
[Any relevant configuration]
```

**Field Value:**
```
{{ENVIRONMENT_INFO}}
```

---

## Error Messages / Logs
**What to include:**
- Exact error messages
- Console output
- Log excerpts
- Stack traces

**Format:**
```
Error Output:
```
[Paste error messages or logs here]
```

Console Output:
```
[Paste relevant console output]
```

Stack Trace (if applicable):
```
[Paste stack trace]
```
```

**Field Value:**
```
{{ERROR_MESSAGES}}
```

---

## Screenshots / Recordings
**What to include:**
- Screenshots showing the bug
- Terminal output captures
- UI state before/after

**Format:**
```
[Attach screenshots or describe visual aspects]

Before: [Description or screenshot]
After: [Description or screenshot]
```

**Field Value:**
```
{{SCREENSHOTS}}
```

---

## Workaround (if any)
**What to include:**
- Temporary solution you're using
- Manual steps to avoid the bug

**Format:**
```
Current Workaround:
[How you're working around this bug]

Limitations of Workaround:
[Why this isn't a complete solution]
```

**Field Value:**
```
{{WORKAROUND}}
```

---

## Additional Context
**What to include:**
- When the bug started
- Frequency of occurrence
- Related issues
- Conversation context

**Format:**
```
Frequency: [Always / Sometimes / Rarely]
Started: [When you first noticed]

Related Context:
[Any additional relevant information]

Session Context:
[What led to discovering this bug]
```

**Field Value:**
```
{{ADDITIONAL_CONTEXT}}
```

---

## Severity
**Options:**
- `Critical - Blocks all work`
- `High - Major feature broken`
- `Medium - Feature partially broken`
- `Low - Minor issue or cosmetic`

**Field Value:**
```
{{SEVERITY}}
```

---

## Final Output Format

```
Title:
{{TITLE}}

Preflight Checklist:
✅ I have searched existing issues and this bug hasn't been reported yet
✅ I have verified this is reproducible
✅ This is a single bug report (not multiple bugs)

Bug Description:
{{BUG_DESCRIPTION}}

Steps to Reproduce:
{{STEPS_TO_REPRODUCE}}

Environment Information:
{{ENVIRONMENT_INFO}}

Error Messages / Logs:
{{ERROR_MESSAGES}}

Screenshots / Recordings:
{{SCREENSHOTS}}

Workaround (if any):
{{WORKAROUND}}

Additional Context:
{{ADDITIONAL_CONTEXT}}

Severity:
{{SEVERITY}}
```
