# KDD Quick Reference

**Knowledge-Driven Development (KDD) - Quick Commands and Checklist**

## Essential Commands

### Execute KDD (MANDATORY after each story)
```bash
*task capture-kdd-knowledge    # Extract patterns and lessons to knowledge base
```

### Git Analysis for KDD Focus
```bash
git log --oneline -10                    # Recent commits
git diff HEAD~5..HEAD --name-only       # Changed files
git diff HEAD~5..HEAD --stat            # Scope of changes
```

### Knowledge Base Locations
```bash
docs/patterns/          # Architectural patterns and best practices
docs/examples/          # Working implementation examples
docs/lessons-learned/   # Technical insights and breakthroughs
```

## KDD Process Checklist

### ✅ Before Starting KDD
- [ ] Story implementation is complete
- [ ] All tests pass and CI is green
- [ ] Ready to capture knowledge from implementation

### ✅ During KDD Execution
- [ ] **Git Analysis**: Focus on files that actually changed
- [ ] **Pattern Analysis**: Identify new patterns or validate existing ones
- [ ] **Technical Insights**: Capture what worked well and challenges solved
- [ ] **Knowledge Assets**: Write to knowledge base (NOT story)

### ✅ KDD Outputs Required
- [ ] **Patterns**: Update `docs/patterns/[domain]-patterns.md` if new patterns emerged
- [ ] **Examples**: Create `docs/examples/[feature]/` if reusable code should be preserved
- [ ] **Lessons**: Update `docs/lessons-learned/[category]-lessons.md` with insights
- [ ] **Story Reference**: Brief summary in story with links to knowledge assets

### ✅ KDD Quality Check
- [ ] Knowledge written to knowledge base (not story details)
- [ ] Story has minimal summary with links to knowledge assets
- [ ] Patterns include implementation examples and rationale
- [ ] Examples are working, tested code with documentation

## Common KDD Mistakes

### ❌ Writing Details to Story
**Wrong**: Full KDD findings in story QA sections
**Right**: Brief summary in story, details in knowledge base

### ❌ Generic Analysis
**Wrong**: Theoretical pattern analysis without git focus
**Right**: Analysis focused on files that actually changed

### ❌ Missing Knowledge Assets
**Wrong**: KDD execution without creating knowledge base files
**Right**: Always create/update patterns, examples, or lessons learned

### ❌ No Cross-References
**Wrong**: Isolated knowledge assets without connections
**Right**: Cross-reference patterns, examples, and lessons

## Quick KDD Templates

### Pattern Documentation Template
```markdown
## [Pattern Name]

### Context
When/why to use this pattern

### Implementation
How to implement the pattern

### Example
```typescript
// Real code from implementation
```

### Rationale
Why this approach was chosen

### Related Patterns
- Link to related pattern docs
```

### Example Documentation Template
```markdown
# [Feature Name] Implementation Example

## Overview
Brief description of what this example demonstrates

## Usage
How to use/adapt this example

## Key Files
- `file1.ts` - Purpose and key concepts
- `file2.ts` - Purpose and key concepts

## Setup Instructions
1. Step-by-step setup
2. Configuration requirements
3. Dependencies needed

## Related Patterns
- Links to relevant pattern documentation
```

### Lesson Learned Template
```markdown
## [Lesson Title]

### Context
When/where this lesson was learned (Story X.X)

### Challenge
What problem was encountered

### Solution
How it was solved (specific technical approach)

### Outcome
Results achieved and benefits gained

### Future Application
How this applies to future development
```

## Validation Commands

### Check KDD Execution
```bash
# Verify KDD task is properly configured
cat .bmad-core/tasks/capture-kdd-knowledge.md | grep "Knowledge Base"

# Check recent knowledge assets created
find docs/patterns docs/examples docs/lessons-learned -name "*.md" -mtime -7
```

### Validate Knowledge Quality
```bash
# Execute KDD validation checklist
*execute-checklist kdd-validation-checklist

# Check for cross-references
grep -r "docs/patterns\|docs/examples\|docs/lessons" docs/
```

## Success Indicators

### ✅ KDD Working Correctly
- Stories complete with brief KDD summary and links
- New files appear in `docs/patterns/`, `docs/examples/`, `docs/lessons-learned/`
- Knowledge assets have concrete examples from actual implementation
- Cross-references between patterns, examples, and lessons

### ❌ KDD Not Working
- Stories have detailed KDD content in QA sections
- No new knowledge base files created
- Generic patterns without implementation specifics
- Knowledge isolated without cross-references

## Integration Points

### Dev Agent Completion
```yaml
completion: "MANDATORY: run the task capture-kdd-knowledge"
```

### Story Template Enhancement
```yaml
- id: kdd-reminder
  title: "🧠 KDD REMINDER"
  instruction: "BEFORE marking complete: Execute *task capture-kdd-knowledge"
```

### CLAUDE.md Reference
```markdown
#### KDD Integration
**MANDATORY**: Every story completion MUST execute KDD knowledge capture:
*task capture-kdd-knowledge    # Extract patterns and lessons to knowledge base
```

## Emergency KDD Recovery

### If KDD Was Skipped
1. **Immediate**: Execute KDD on completed story
2. **Analysis**: Use git history to understand changes made
3. **Focus**: Extract most important patterns and lessons
4. **Document**: Create knowledge assets retroactively

### If Knowledge Went to Story
1. **Extract**: Copy detailed findings from story
2. **Relocate**: Move to appropriate knowledge base files
3. **Summarize**: Replace story details with brief summary + links
4. **Cross-reference**: Ensure knowledge assets are linked

## Quick Win KDD Tips

1. **Start Small**: Even one pattern or lesson per story builds knowledge
2. **Focus on Changes**: Use git analysis to focus effort on what actually changed
3. **Extract Working Code**: Copy successful configurations and approaches
4. **Cross-Reference**: Always link patterns, examples, and lessons together
5. **Be Specific**: Include rationale and context, not just implementation

Remember: **KDD transforms individual implementations into institutional knowledge that accelerates future development.**