# YouTube Brief Methodology

## Overview

This document captures the validated methodology for creating YouTube briefs that serve both as filming guides and Gamma.AI presentation sources for 2-5 minute focused technical videos.

## Target Audience

- **Knowledge Level**: Context engineering + BMAD methodology familiarity
- **Expectation**: Educational content covering "why" and "how" of implementations
- **Context**: Part of ongoing series building on previous BMAD implementations

## Video Structure Requirements

### Core Format (2-5 minutes)

1. **Hook** - Engaging opening that captures attention
2. **Why Important** - Value proposition for the specific capability
3. **What/How** - Implementation details and process
4. **Value for Viewers** - Closing with concrete benefits

### Content Focus

- **Macro Context**: BMAD methodology integration
- **Micro Context**: Specific capability being demonstrated
- **Implementation Journey**: How it was built/configured
- **Real Benefits**: Case-by-case value proposition

## Brief Structure Requirements

### Dual-Purpose Format

YouTube briefs must serve two functions:

1. **Filming Guide**: Complete talking points and production notes
2. **Gamma.AI Source**: Structure optimized for AI presentation generation

### Required Sections

#### 1. Visual Narrative (Gamma.AI Optimized)

- Hierarchical slide structure (8-slide default)
- Block-based content organization
- Simple outlines for AI processing
- Visual elements and graphics specifications

#### 2. Script Outline

- Hook/Why/What/Value structure
- Detailed talking points
- Production timing notes
- Screen recording specifications

#### 3. Technical Implementation Details

**File References:**

- Complete file paths for all modified files
- Explanations of why each change was necessary
- Before/after code comparisons

**Commit Integration:**

- Specific commit hashes for each significant change
- GitHub compare view links for visual diffs
- Inline diff snippets for key modifications

#### 4. Implementation Context Capture

**Same Conversation Scenario:**

- Use conversation summary to capture implementation process
- Include decision rationale and problem-solving approach
- Document why specific approaches were chosen

**Different Conversation Scenario:**

- Reverse engineer from commit diffs and file changes
- Ask clarifying questions for missing context
- Research related documentation for background

## Content Guidelines

### Technical Detail Level

- **Show Specific Files**: Provide exact file paths for on-screen demonstration
- **Commit References**: Include hashes and compare links for before/after views
- **Code Snippets**: Inline diffs for key changes
- **Context Links**: References to related documentation and decisions

### Value Proposition Approach

- **Case-by-Case Basis**: Tailor benefits to actual improvements experienced
- **Specific Metrics**: Include quantifiable improvements when available
- **Problem Prevention**: Focus on issues avoided or solved
- **Methodology Integration**: Show how capability fits broader BMAD workflow

### Production Elements

- **Screen Recordings**: Specific files and commands to demonstrate
- **Visual Graphics**: Charts, diagrams, and comparison views
- **Code Demonstrations**: Live editing and before/after comparisons
- **Workflow Integration**: How capability fits development process

## Gamma.AI Integration

### Presentation Structure

- **Hierarchical Cards**: Nested information organization
- **8-Slide Default**: Core content in standard format
- **Block Content**: Mixed document/presentation elements
- **Media Integration**: Support for videos, code snippets, and links

### Content Optimization

- **Simple Outlines**: Clear, AI-parseable structure
- **Visual Elements**: Specifications for auto-generated graphics
- **Template Compatibility**: Work with Gamma's theme system
- **Export Formats**: PDF and PowerPoint compatibility

## Implementation Workflow

### Phase 1: Context Gathering

1. Identify macro (BMAD) and micro (specific capability) context
2. Determine if implementation was same conversation or different
3. Gather commit hashes, file changes, and decision rationale
4. Research related documentation and background

### Phase 2: Content Structure

1. Create Visual Narrative section for Gamma.AI
2. Develop Script Outline with Hook/Why/What/Value structure
3. Compile Technical Implementation Details with commits/diffs
4. Document Implementation Context and decision reasoning

### Phase 3: Production Preparation

1. Identify specific files and commands for demonstration
2. Create GitHub compare links for visual diffs
3. Prepare screen recording specifications
4. Validate content against 2-5 minute timing

## Quality Standards

### Completeness Criteria

- [ ] Hook captures attention and sets context
- [ ] Value proposition is case-specific and concrete
- [ ] Implementation details include all modified files
- [ ] Commit references enable easy before/after comparison
- [ ] Gamma.AI structure is optimized for presentation generation
- [ ] Content fits 2-5 minute target timing

### Technical Accuracy

- [ ] All file paths are correct and current
- [ ] Commit hashes link to actual changes
- [ ] Code snippets are accurate and complete
- [ ] Implementation context reflects actual decisions made

### Production Readiness

- [ ] Screen recording specifications are clear
- [ ] Visual elements are well-defined
- [ ] Timing estimates are realistic
- [ ] Content flows logically for filming

## Template Structure

```markdown
# [Capability Name] - YouTube Brief

## Video Overview

- **Duration**: 2-5 minutes
- **Target**: [Specific capability focus]
- **Context**: [BMAD integration point]

## Visual Narrative (Gamma.AI)

[8-slide structure with hierarchical content]

## Script Outline

### Hook (30 seconds)

### Why Important (60-90 seconds)

### What/How Implementation (120-180 seconds)

### Value for Viewers (30 seconds)

## Technical Implementation

### Files Modified

### Commit References

### Implementation Context

### Key Decisions

## Production Elements

### Screen Recordings

### Visual Graphics

### Code Demonstrations
```

---

_This methodology ensures YouTube briefs serve both immediate filming needs and long-term knowledge preservation while integrating seamlessly with Gamma.AI presentation generation._

## Future Integration Notes

**Potential Agent Integration:**
This methodology could be integrated into the BMAD agent ecosystem in the future:

- **Content Creator Agent**: Auto-generate YouTube briefs following this methodology
- **Scrum Master Agent**: Include YouTube brief creation in story completion workflows
- **Documentation Agent**: Reference this methodology for video content planning
- **Template Updates**: Add YouTube brief generation to `.bmad-core/templates/`
- **Task Automation**: Create `.bmad-core/tasks/create-youtube-brief.md` workflow

**Integration Points:**

- `.bmad-core/agents/` - Agents that could reference this methodology
- `.bmad-core/templates/youtube-brief-tmpl.yaml` - Template for brief generation
- `docs/methodology/bmad-context-engineering.md` - Cross-reference with main methodology
- Story completion workflows - Auto-trigger brief creation option

_Note: These integrations are deferred to allow the methodology to mature through practical usage before automation._
