# Task: Create Claude Code GitHub Issue

## Purpose
Automate the creation of GitHub issues for Claude Code by analyzing conversation history and generating pre-filled issue content.

## Usage
```
*task create-claude-issue
```

## Workflow

### Step 1: Determine Issue Type
Ask the user to select the issue type:
- **feature** - Feature request or enhancement
- **bug** - Bug report or defect
- **feedback** - General feedback or suggestion

### Step 2: Analyze Conversation History
Review recent conversation (last 50+ messages) to extract:

**Problem Context:**
- User's explicit statements about problems
- Frustration points mentioned
- Pain points in current workflow
- Questions that indicate confusion or difficulty

**Technical Details:**
- Commands that failed or behaved unexpectedly
- Error messages or warnings
- Unexpected behavior described
- Performance issues mentioned

**Solution Discussion:**
- Solutions proposed by user
- Solutions suggested by assistant
- Alternative approaches discussed
- Desired user experience described

**Use Cases:**
- Real scenarios from the conversation
- Step-by-step workflows mentioned
- Time/effort impacts discussed

**User Quotes:**
- Direct quotes expressing frustration
- Explicit feature requests
- Statements about current workarounds

### Step 3: Load Appropriate Template
Based on issue type, load template from:
- `.bmad-core/templates/claude-issue-feature.md` (for feature requests)
- `.bmad-core/templates/claude-issue-bug.md` (for bug reports)
- `.bmad-core/templates/claude-issue-feedback.md` (for general feedback)

### Step 4: Fill Template Fields

**Title:**
- Extract concise, descriptive title from problem discussion
- Use format: `[TYPE] Brief description`
- Example: `[FEATURE] Add progress visibility to /push command`

**Problem Statement:**
- Summarize the core problem from conversation
- Include specific pain points mentioned
- List current limitations
- Describe impact on workflow
- Use user's own words where possible

**Proposed Solution:**
- Describe ideal user experience discussed
- Include specific features or behaviors suggested
- Detail interaction patterns proposed
- Reference UI/UX patterns mentioned

**Alternative Solutions:**
- List workarounds user mentioned they're currently using
- Include alternatives discussed in conversation
- Explain why current workarounds are insufficient

**Use Case Example:**
- Use actual scenario from conversation
- Include step-by-step flow discussed
- Show current vs. desired experience
- Quantify time/effort savings if mentioned

**Additional Context:**
- Include relevant technical details
- Add direct user quotes about frustration
- Reference related features or tools discussed
- Note session context that triggered the issue

### Step 5: Generate Output
Format the complete issue content with clear section markers:

```
==============================================
📋 CLAUDE CODE GITHUB ISSUE
==============================================

GitHub URL: https://github.com/anthropics/claude-code/issues/new

Copy the content below and paste into the GitHub issue form:

==============================================

[COMPLETE FORMATTED ISSUE CONTENT]

==============================================
✅ Issue content ready to submit!
==============================================
```

## Output Format
The output should be:
1. **Copy-paste ready** - No manual editing required
2. **Complete** - All fields filled with relevant content
3. **Accurate** - Based on actual conversation history
4. **Contextual** - Includes real examples from discussion
5. **Formatted** - Matches GitHub's expected structure

## Guidelines

**DO:**
- Use direct quotes from user when expressing frustration
- Include actual commands, errors, or technical details mentioned
- Reference real scenarios from the conversation
- Maintain user's voice in problem descriptions
- Keep formatting simple (markdown basics only)

**DON'T:**
- Invent problems or scenarios not discussed
- Add speculative features not mentioned
- Use overly technical jargon unless user did
- Make assumptions about priority or importance
- Include code examples unless specifically discussed

## Success Criteria
The task is successful when:
- User can copy output directly to GitHub
- All mandatory fields are populated
- Content accurately reflects conversation
- User recognizes their problem/frustration in the description
- No manual editing required before submission
