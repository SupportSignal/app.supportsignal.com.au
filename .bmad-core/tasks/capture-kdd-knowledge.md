# Capture KDD Knowledge Task

## Purpose

To systematically capture implementation knowledge, patterns, and learnings from completed stories according to Knowledge-Driven Development (KDD) methodology. This ensures valuable insights are preserved and shared for future development.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 1. Analyze Implementation Changes

**Git Analysis:**
- Run: `git log --oneline -10` to see recent commits related to the story
- Run: `git diff HEAD~5..HEAD --name-only` to see files changed in recent commits
- Run: `git diff HEAD~5..HEAD --stat` to see scope of changes by file
- Focus on commits that relate to the current story implementation

**Implementation Focus:**
- Identify files with most significant changes during story implementation
- Understand commit patterns and development flow for this story
- Correlate technical changes with story requirements and acceptance criteria
- Prioritize KDD analysis on most complex, novel, or challenging changes

### 2. Load Story Context

- Read the completed story file to understand what was implemented
- Review the Dev Agent Record sections for implementation details
- Identify key technical decisions and solutions implemented

### 3. Identify Implementation Patterns

**New Patterns Discovered:**

- What new architectural patterns emerged during implementation?
- What new coding patterns were established?
- What new deployment or infrastructure patterns were created?
- What integration patterns were discovered?

**Pattern Validation:**

- Which existing patterns were successfully followed?
- Which patterns needed modification or adaptation?
- What anti-patterns were avoided or corrected?

### 4. Capture Technical Learnings

**What Worked Well:**

- Which technical approaches were successful?
- What tools, libraries, or configurations performed well?
- What development workflows proved effective?

**Challenges and Solutions:**

- What technical challenges were encountered?
- How were blockers and issues resolved?
- What alternative approaches were considered?
- What would be done differently next time?

### 5. Document Architecture Impact

**Architecture Updates Needed:**

- Does any architecture documentation need updating based on implementation?
- Were any assumptions in the architecture proven incorrect?
- Do any new architectural components need documenting?

**Dependencies and Integrations:**

- What new dependencies were added and why?
- How do new components integrate with existing architecture?
- What compatibility or version constraints were discovered?

### 6. Create Reusable Knowledge

**Examples and Templates:**

- Should any code examples be extracted for future reference?
- Could any configurations be templated for reuse?
- Are there setup scripts or automation that should be preserved?

**Documentation Updates:**

- What new documentation should be created?
- What existing documentation needs updating?
- What troubleshooting guides would help future developers?

### 7. Identify Future Improvements

**Technical Debt:**

- What technical debt was created that should be addressed?
- What temporary solutions need future improvement?
- What performance or security considerations need follow-up?

**Process Improvements:**

- What development process improvements were identified?
- What tooling or automation could be improved?
- What testing or validation approaches could be enhanced?

### 8. Write to Knowledge Base (Primary KDD Output)

**CRITICAL**: Write KDD findings to knowledge base files, NOT to story documentation.

**A. Update/Create Pattern Documentation (`docs/patterns/[domain]-patterns.md`):**

- Document new architectural patterns discovered during implementation
- Update existing patterns that were validated, modified, or extended
- Include concrete implementation examples and rationale for pattern choices
- Add cross-references to related patterns and examples

**B. Create Implementation Examples (`docs/examples/[feature-name]/`):**

- Extract reusable code examples from actual implementation
- Create configuration templates and setup scripts that worked
- Document usage patterns, best practices, and common pitfalls
- Include working code that can be referenced or copied by future developers

**C. Capture Lessons Learned (`docs/lessons-learned/[category]-lessons.md`):**

- Document technical insights, breakthroughs, and "aha moments"
- Record challenges encountered and specific solutions that worked
- Capture what worked exceptionally well and should be repeated
- Document anti-patterns discovered and approaches to avoid

**D. Update Architecture Documentation (if needed):**

- Update architecture files if implementation revealed new patterns or approaches
- Document integration points and dependencies discovered
- Update system diagrams or component relationships if they changed

### 9. Update Knowledge Base TOCs (Self-Improvement)

**CRITICAL**: Maintain knowledge base discoverability by updating relevant TOCs.

**Update Relevant Index Files:**

**A. Category-Specific TOCs:**
- If patterns created/updated: Update `docs/patterns/index.md`
- If examples created: Update `docs/examples/index.md`
- If lessons captured: Update `docs/lessons-learned/index.md`

**B. Master TOC Updates:**
- Update `docs/index.md` KDD sections if new categories or significant additions
- Add timestamp and brief description of new knowledge assets
- Ensure cross-references between related knowledge assets

**C. Cross-Reference Validation:**
- Ensure new patterns reference related examples and lessons
- Add links from examples back to relevant patterns
- Update related knowledge assets with bidirectional references

**TOC Update Format:**
```markdown
- **[Asset Name](path/to/file.md)** - Brief description (Created: YYYY-MM-DD)
```

### 10. Reference in Story (Minimal Summary)

**IMPORTANT**: Only add brief references and links to story, NOT full KDD details.

**Dev Agent Record → Completion Notes:**
- Add brief summary of key technical insights (2-3 bullet points max)
- Reference knowledge base files created/updated with links

**QA Results → Knowledge Capture:**
- List knowledge assets created: `docs/patterns/[files]`, `docs/examples/[dirs]`, `docs/lessons-learned/[files]`
- Brief statement of patterns validated and new patterns established

### 11. Generate Knowledge Summary

Provide a structured summary of captured knowledge:

#### Technical Patterns Established

- List new patterns with brief descriptions
- Note reusability and applicability

#### Key Learnings

- Summarize most important insights
- Highlight critical success factors

#### Architecture Impact

- Identify any architecture updates needed
- Note integration points and dependencies

#### Recommendations

- Suggest improvements for future stories
- Recommend documentation or template updates

#### Knowledge Assets Created

- List any examples, templates, or guides created
- Note location and purpose of knowledge assets

## Completion Criteria

- All implementation patterns identified and documented
- Technical learnings systematically captured
- Knowledge base files created/updated (NOT just story sections)
- Relevant TOCs updated for discoverability
- Cross-references maintained between knowledge assets
- Story documentation updated with minimal KDD summary and links
- Knowledge summary provided for future reference
- Any necessary architecture or template updates identified
