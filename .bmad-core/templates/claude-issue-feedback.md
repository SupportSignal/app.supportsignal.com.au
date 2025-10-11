# Claude Code General Feedback Template

This template is for general feedback that doesn't fit feature request or bug report categories.

---

## Title
**Format:** `[FEEDBACK] Brief, clear description`

**Example:** `[FEEDBACK] Documentation could better explain MCP server configuration`

**Field Value:**
```
{{TITLE}}
```

---

## Feedback Type
**Options:**
- Documentation
- User Experience
- Configuration
- Error Messages
- Command Behavior
- General Suggestion

**Field Value:**
```
{{FEEDBACK_TYPE}}
```

---

## Current Experience
**What to include:**
- What you encountered
- Your expectations
- What felt unclear or problematic
- Impact on your workflow

**Format:**
```
What I Encountered:
[Description of the current state]

My Expectations:
[What I expected to experience]

What Felt Problematic:
[Specific issues or confusion points]

Impact:
[How this affected my work]
```

**Field Value:**
```
{{CURRENT_EXPERIENCE}}
```

---

## Suggested Improvement
**What to include:**
- How you think it could be better
- Specific changes you'd like to see
- Examples of good patterns from other tools
- Why your suggestion would help

**Format:**
```
Proposed Improvement:
[What you'd like to see changed]

Specific Changes:
- [Change 1]
- [Change 2]
- [Change 3]

Why This Would Help:
[Explanation of benefits]

Examples from Other Tools:
[Reference implementations if relevant]
```

**Field Value:**
```
{{SUGGESTED_IMPROVEMENT}}
```

---

## Context / Example
**What to include:**
- Real scenario from your experience
- Specific examples
- What you were trying to accomplish
- Where you got stuck or confused

**Format:**
```
Scenario:
[What you were trying to do]

What Happened:
1. [Step 1]
2. [Step 2]
3. [Where confusion/issue occurred]

What Would Have Helped:
[What would have made this easier]
```

**Field Value:**
```
{{CONTEXT_EXAMPLE}}
```

---

## Priority
**Options:**
- `High - Significantly impacts experience`
- `Medium - Would improve experience`
- `Low - Minor improvement`

**Field Value:**
```
{{PRIORITY}}
```

---

## Additional Context
**What to include:**
- Related documentation or features
- User quotes from conversation
- Session context
- Any other relevant information

**Format:**
```
Related Features/Docs:
[Links or references]

Session Context:
[What led to this feedback]

Additional Information:
[Any other relevant details]
```

**Field Value:**
```
{{ADDITIONAL_CONTEXT}}
```

---

## Final Output Format

```
Title:
{{TITLE}}

Feedback Type:
{{FEEDBACK_TYPE}}

Current Experience:
{{CURRENT_EXPERIENCE}}

Suggested Improvement:
{{SUGGESTED_IMPROVEMENT}}

Context / Example:
{{CONTEXT_EXAMPLE}}

Priority:
{{PRIORITY}}

Additional Context:
{{ADDITIONAL_CONTEXT}}
```
