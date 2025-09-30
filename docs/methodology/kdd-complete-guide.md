# Knowledge-Driven Development (KDD) Complete Guide

**Purpose**: Comprehensive guide for implementing Knowledge-Driven Development methodology to systematically capture implementation knowledge, patterns, and learnings from completed stories.

**Last Updated**: September 30, 2025

## Table of Contents

- [Overview](#overview)
- [Core Philosophy](#core-philosophy)
- [KDD Integration with BMAD](#kdd-integration-with-bmad)
- [Implementation Process](#implementation-process)
- [Knowledge Structure](#knowledge-structure)
- [Tools and Commands](#tools-and-commands)
- [Success Metrics](#success-metrics)
- [Troubleshooting](#troubleshooting)

## Overview

Knowledge-Driven Development (KDD) transforms AI-assisted development from individual implementations into systematic knowledge building. This methodology ensures that valuable insights, patterns, and learnings are preserved and shared for future development, creating a self-improving development environment.

### The Problem KDD Solves

Traditional AI-assisted development suffers from knowledge loss:

1. Implement a feature successfully
2. Solve complex problems along the way
3. Move on to the next feature
4. Six months later, face the same problem and start from scratch

**Result**: The knowledge disappears. Patterns get forgotten. Teams constantly re-solve problems they've already solved.

### KDD Solution

**Systematic Knowledge Capture**:
- Captures knowledge DURING development, not after
- Validates patterns as they emerge from real implementations
- Creates reusable examples from working code
- Builds institutional learning that compounds over time

## Core Philosophy

### Knowledge Assets Over Documentation

KDD creates **living knowledge assets** rather than static documentation:

- **Patterns**: Proven architectural approaches from real implementations
- **Examples**: Working code and configurations extracted from successful stories
- **Lessons**: Technical insights and breakthrough moments captured immediately

### Git-Focused Analysis

KDD analyzes **what actually changed** during implementation:
- Focuses on files modified during the story
- Correlates technical changes with story requirements
- Prioritizes learnings from complex or novel changes

### Knowledge Base Target

**CRITICAL**: KDD writes to knowledge base, NOT to individual stories:

```
❌ WRONG: Story files → QA sections
✅ CORRECT: docs/patterns/, docs/examples/, docs/lessons-learned/
```

Stories get minimal summaries with links to knowledge assets.

## KDD Integration with BMAD

### Enhanced Story Development Cycle

**Before KDD:**
```
Story → Implementation → QA Review → Complete
```

**After KDD:**
```
Story + Documentation Impact Assessment
→ Implementation + Pattern Validation
→ QA Review + Pattern Compliance
→ KDD Knowledge Capture
→ Complete + Knowledge Asset References
```

### Agent Integration Points

#### Development (Dev Agent)
- **Pattern Validation**: Check existing patterns before implementation
- **Pattern Emergence**: Detect novel approaches during development
- **KDD Execution**: MANDATORY `*task capture-kdd-knowledge` on completion

#### Quality Assurance (QA Agent)
- **Pattern Compliance**: Validate implementation follows established patterns
- **Knowledge Review**: Assess KDD outputs for quality and completeness

#### Story Planning (Scrum Master)
- **Documentation Impact Assessment**: Plan what knowledge might emerge
- **Pattern Planning**: Identify which patterns will be validated or created

## Implementation Process

### Mandatory KDD Execution

**EVERY story completion MUST execute KDD:**

```bash
# After story implementation completion:
*task capture-kdd-knowledge    # Extract patterns and lessons to knowledge base
```

### KDD Task Workflow

#### 1. Analyze Implementation Changes
- Run git analysis to identify changed files
- Focus on most significant technical changes
- Correlate changes with story requirements

#### 2. Load Story Context
- Review story requirements and acceptance criteria
- Understand technical decisions and solutions implemented

#### 3. Identify Implementation Patterns
- Document new architectural patterns discovered
- Validate existing patterns that were followed
- Identify anti-patterns that were avoided

#### 4. Capture Technical Learnings
- Record what worked well and should be repeated
- Document challenges and how they were solved
- Capture alternative approaches considered

#### 5. Document Architecture Impact
- Note any architecture updates needed
- Document new dependencies and integrations
- Record compatibility constraints discovered

#### 6. Create Reusable Knowledge
- Extract code examples for future reference
- Create configuration templates
- Plan documentation updates needed

#### 7. Identify Future Improvements
- Document technical debt created
- Note process improvements identified
- Record testing enhancements needed

#### 8. Write to Knowledge Base (Primary Output)
- **Patterns**: Update `docs/patterns/[domain]-patterns.md`
- **Examples**: Create `docs/examples/[feature-name]/`
- **Lessons**: Update `docs/lessons-learned/[category]-lessons.md`
- **Architecture**: Update architecture docs if needed

#### 9. Reference in Story (Minimal Summary)
- Brief summary in Dev Agent Record
- Links to knowledge assets created
- Statement of patterns validated/established

#### 10. Generate Knowledge Summary
- Structured summary of captured knowledge
- List of knowledge assets created
- Recommendations for future development

## Knowledge Structure

### Pattern Documentation (`docs/patterns/`)

**Purpose**: Established architectural patterns and best practices

**Categories:**
- **Backend Patterns**: Convex, API, server-side patterns
- **Frontend Patterns**: React, Next.js, UI component patterns
- **Testing Patterns**: Testing strategies across all layers
- **Architecture Patterns**: System design and project structure
- **Development Workflow Patterns**: Process and collaboration patterns

**Pattern Format:**
```markdown
## [Pattern Name]

### Context
When/why to use this pattern

### Implementation
How to implement the pattern

### Example
Real code from project

### Rationale
Why this approach was chosen

### Related Patterns
Cross-references to other patterns
```

### Implementation Examples (`docs/examples/`)

**Purpose**: Real implementation examples from the project

**Structure:**
```
docs/examples/
├── [feature-name]/
│   ├── README.md              # Overview and usage
│   ├── code-examples/         # Working code files
│   ├── configurations/        # Config files and templates
│   └── setup-scripts/         # Automation and setup
```

**Example Standards:**
- Working, tested code
- Complete documentation
- Clear usage instructions
- Pattern cross-references

### Lessons Learned (`docs/lessons-learned/`)

**Purpose**: Cross-story insights and knowledge capture

**Categories:**
- **Technical Lessons**: Technology-specific learnings
- **Process Lessons**: Development workflow insights
- **Architecture Lessons**: System design insights
- **Anti-Patterns**: Approaches to avoid

**Format:**
```markdown
## [Lesson Title]

### Context
When/where this lesson was learned

### Challenge
What problem was encountered

### Solution
How it was solved

### Outcome
Results and benefits

### Future Recommendations
How to apply this learning
```

## Tools and Commands

### KDD Execution Command

```bash
# Primary KDD command (MANDATORY after each story)
*task capture-kdd-knowledge
```

### Git Analysis Commands

```bash
# See recent commits
git log --oneline -10

# See changed files
git diff HEAD~5..HEAD --name-only

# See scope of changes
git diff HEAD~5..HEAD --stat
```

### Knowledge Base Navigation

```bash
# Check existing patterns
ls docs/patterns/

# Review examples
ls docs/examples/

# See lessons learned
ls docs/lessons-learned/
```

### Validation Commands

```bash
# Verify KDD process completion
*execute-checklist kdd-validation-checklist
```

## Success Metrics

### Process Metrics
- **KDD Execution Rate**: Target 95%+ of stories execute KDD
- **Pattern Adherence**: 90%+ of implementations follow established patterns
- **Knowledge Asset Creation**: Average 2-3 knowledge assets per story

### Quality Metrics
- **Pattern Reuse**: 60%+ reduction in time for similar implementations
- **Code Consistency**: 75% improvement across implementations
- **Knowledge Retention**: 100% capture rate vs previous 0%

### Development Velocity
- **Problem Resolution**: 50% faster resolution of known problems
- **Onboarding Speed**: 60% faster for new developers
- **Development Quality**: 40% reduction in repeated mistakes

## Troubleshooting

### Common Issues

#### KDD Not Being Executed
**Symptoms**: Stories complete without KDD knowledge capture
**Solution**:
- Verify dev agent completion workflow includes `*task capture-kdd-knowledge`
- Check for KDD execution evidence in story completion notes
- Add KDD reminder to story templates

#### Knowledge Going to Stories Instead of Knowledge Base
**Symptoms**: Detailed KDD findings in story QA sections
**Solution**:
- Verify `capture-kdd-knowledge.md` task directs to knowledge base
- Check that Step 8 writes to `docs/patterns/`, `docs/examples/`, `docs/lessons-learned/`
- Stories should only have brief summaries with links

#### No Git Analysis
**Symptoms**: Generic KDD without focus on actual changes
**Solution**:
- Ensure Step 1 of KDD task includes git analysis commands
- Verify git analysis outputs are being used to focus KDD efforts
- Check that KDD correlates changes with story requirements

#### Pattern Documentation Gaps
**Symptoms**: Missing or incomplete pattern documentation
**Solution**:
- Use KDD validation checklist to ensure pattern quality
- Cross-reference patterns with examples and lessons learned
- Ensure patterns include rationale and implementation details

### Process Validation

#### Verify KDD Setup
```bash
# Check KDD task exists and is correctly configured
cat .bmad-core/tasks/capture-kdd-knowledge.md

# Verify dev agent includes KDD in completion workflow
grep -A 5 "completion:" .bmad-core/agents/dev.md

# Check knowledge base structure exists
ls docs/patterns/ docs/examples/ docs/lessons-learned/
```

#### Validate Knowledge Quality
```bash
# Execute KDD validation checklist
*execute-checklist kdd-validation-checklist

# Review recent knowledge assets
find docs/patterns docs/examples docs/lessons-learned -name "*.md" -mtime -7
```

## Integration with Development Workflow

### Pre-Implementation
1. **Check Existing Patterns**: Review `docs/patterns/` for established approaches
2. **Review Examples**: Check `docs/examples/` for similar implementations
3. **Plan Knowledge Capture**: Identify what new knowledge might emerge

### During Implementation
1. **Follow Patterns**: Implement according to established patterns
2. **Detect Emergence**: Note when new patterns or approaches develop
3. **Document Insights**: Capture breakthrough moments immediately

### Post-Implementation
1. **Execute KDD**: Run `*task capture-kdd-knowledge` MANDATORY
2. **Create Knowledge Assets**: Write to patterns, examples, lessons learned
3. **Validate Quality**: Use KDD validation checklist
4. **Reference in Story**: Add brief summary with links to knowledge assets

### Quality Assurance
1. **Pattern Compliance**: Verify implementation follows established patterns
2. **Knowledge Review**: Assess KDD outputs for completeness and quality
3. **Process Improvement**: Identify opportunities to enhance KDD process

## Expected Benefits

### Immediate Value (1-2 weeks)
- **Knowledge Preservation**: 100% capture rate vs previous 0%
- **Pattern Recognition**: Systematic identification of reusable approaches
- **Implementation Focus**: KDD analysis focused on actual code changes

### Medium-term Impact (1-2 months)
- **Pattern Reuse**: 40-60% time reduction on similar problems
- **Code Consistency**: 75% improvement across implementations
- **Team Knowledge**: Shared understanding of proven approaches

### Long-term Transformation (3-6 months)
- **Institutional Learning**: Knowledge survives team changes
- **Self-improving Environment**: Development quality increases over time
- **Competitive Advantage**: Consistent execution patterns
- **Knowledge Assets**: Documentation that appreciates in value

## Conclusion

Knowledge-Driven Development (KDD) transforms how we approach AI-assisted development by systematically capturing and preserving the knowledge that emerges during implementation. By integrating KDD into the BMAD methodology, we create a self-improving development environment where each story contributes to and validates against a growing knowledge base.

**The key insight**: In AI-first development, the bottleneck isn't writing code—it's effectively directing AI agents with the right context and knowledge. KDD ensures that context and knowledge continuously improve, making each development cycle more effective than the last.

**The future of development** isn't just about building applications—it's about building the knowledge systems that make building applications consistently excellent.