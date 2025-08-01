# Specialized Test Agent Setup in BMAD - YouTube Brief

## Video Overview

- **Duration**: 3-4 minutes
- **Target**: Setting up specialized test development agent in BMAD ecosystem
- **Context**: Extending BMAD agent system with domain-specific expertise for testing infrastructure

## Visual Narrative (Gamma.AI)

### Slide 1: Title

- **Title**: "Creating Specialized Agents in BMAD"
- **Subtitle**: "Building a Test Development Expert Agent"
- **Visual**: BMAD logo with testing/code icons

### Slide 2: The Problem

- **Title**: "Why Specialized Agents Matter"
- **Content**:
  - Generic dev agents lack domain expertise
  - Testing requires specific patterns and knowledge
  - Complex mocking strategies need specialized guidance
- **Visual**: Comparison of generic vs specialized agent capabilities

### Slide 3: Agent Ecosystem Architecture

- **Title**: "BMAD Agent Architecture"
- **Content**:
  - `.bmad-core/agents/` directory structure
  - Persona-driven specialization
  - Command-specific workflows
- **Visual**: Directory structure diagram with agent files

### Slide 4: Test Agent Design

- **Title**: "TestBot Agent Capabilities"
- **Content**:
  - Coverage analysis and gap identification
  - Strategic test planning and implementation
  - Mocking strategy design
  - Error path testing expertise
- **Visual**: Agent capabilities mind map

### Slide 5: Agent Configuration Structure

- **Title**: "YAML Configuration Pattern"
- **Content**:
  - Persona definition and focus areas
  - Command structure with specialized testing commands
  - Dependencies for tasks, templates, checklists
- **Visual**: YAML structure breakdown

### Slide 6: Testing Standards Integration

- **Title**: "Built-in Best Practices"
- **Content**:
  - References testing strategy documentation
  - Enforces proven patterns and standards
  - Includes lessons learned from infrastructure work
- **Visual**: Documentation integration flow

### Slide 7: Specialized Commands

- **Title**: "Test-Specific Command Set"
- **Content**:
  - `*coverage-analysis` for gap identification
  - `*create-test-suite` for comprehensive testing
  - `*mock-strategy` for complex dependency handling
- **Visual**: Command interface mockup

### Slide 8: Value & Next Steps

- **Title**: "Impact and Implementation"
- **Content**:
  - Systematic approach to test coverage improvement
  - Domain expertise embedded in AI assistant
  - Template for other specialized agents
- **Visual**: Before/after coverage improvement example

## Script Outline

### Hook (30 seconds)

"What if your AI coding assistant had specialized expertise in testing infrastructure? Today I'm showing you how to create domain-specific agents in the BMAD ecosystem that go beyond generic development help."

**Screen Recording**: Show the test-dev.md agent file structure

### Why Important (90 seconds)

"We learned from our recent testing infrastructure work that achieving high test coverage requires specific knowledge - understanding Jest vs Bun limitations, complex mocking patterns, and systematic coverage improvement strategies. A generic development agent doesn't have this specialized expertise built in.

The BMAD agent system lets us create specialized personas with domain-specific knowledge, commands, and workflows. Instead of explaining mocking strategies every time, we can embed that expertise directly into an agent."

**Screen Recording**:

- Show coverage improvement results (60% → 86.7%)
- Demonstrate complex mocking patterns from auth tests
- Show the generic dev agent vs specialized needs

### What/How Implementation (120 seconds)

"Creating a specialized agent involves three key components:

First, the persona definition - we're creating 'TestBot', a test engineer focused on coverage optimization and systematic testing approaches.

Second, specialized commands - instead of generic 'help' commands, we have `*coverage-analysis` for gap identification, `*create-test-suite` for comprehensive testing, and `*mock-strategy` for complex dependency handling.

Third, integrated knowledge - the agent automatically references our testing strategy documentation, patterns, and lessons learned from infrastructure work."

**Screen Recording**:

- Walk through the test-dev.md file structure
- Show the YAML configuration sections
- Highlight the command definitions
- Show integration with testing documentation files

### Value for Viewers (30 seconds)

"This pattern gives you AI assistance with deep domain expertise. The agent knows to use `npx jest` instead of `bun test`, understands singleton testing patterns, and can systematically improve coverage. Plus, this template shows how to create other specialized agents for your specific domains."

**Screen Recording**: Show the agent greeting and command interface

## Technical Implementation

### Files Modified

**Primary Implementation:**

- `/Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai/.bmad-core/agents/test-dev.md`

**Referenced Documentation:**

- `docs/architecture/test-strategy-and-standards.md`
- `docs/patterns/testing-patterns.md`
- `docs/lessons-learned/technology/testing-infrastructure-kdd.md`
- `docs/methodology/youtube-brief-methodology.md`

### Implementation Context

**Design Rationale:**
This agent was created based on lessons learned from implementing comprehensive testing infrastructure, where we discovered that achieving high coverage (86.7% statements, 79.49% branches) requires specific expertise in:

- Jest vs Bun test runner compatibility
- Complex mocking strategies for Convex and auth services
- Systematic error path testing
- Coverage-driven development approaches

**Agent Architecture Decisions:**

- **Persona-driven**: TestBot identity with systematic, coverage-focused approach
- **Command specialization**: Testing-specific commands rather than generic development commands
- **Knowledge integration**: Direct references to established testing documentation
- **Workflow enforcement**: Built-in adherence to testing standards and patterns

**BMAD Integration Pattern:**

- Follows established `.bmad-core/agents/` directory structure
- Uses same YAML configuration pattern as existing dev agent
- Integrates with task/template/checklist dependency system
- Maintains compatibility with BMAD activation and command protocols

### Key Design Decisions

**Specialization Focus:**

- Coverage optimization and gap analysis expertise
- Strategic test planning and implementation guidance
- Mocking strategy design for complex dependencies
- Error path testing and edge case identification

**Command Design:**

- `*coverage-analysis`: Strategic coverage improvement planning
- `*gap-analysis`: Deep dive into specific coverage gaps
- `*create-test-suite`: Comprehensive test generation
- `*mock-strategy`: Complex dependency mocking design
- `*coverage-sprint`: Focused coverage improvement execution

**Knowledge Embedding:**

- Testing standards and patterns automatically referenced
- Lessons learned from infrastructure work included
- Best practices enforced through agent behavior
- Proven patterns and anti-patterns built into guidance

## Production Elements

### Screen Recordings

1. **Agent File Structure** (20 seconds)
   - Navigate to `.bmad-core/agents/test-dev.md`
   - Show YAML configuration structure
   - Highlight key sections (persona, commands, dependencies)

2. **Testing Documentation Integration** (30 seconds)
   - Show referenced documentation files
   - Demonstrate how agent pulls in established patterns
   - Show connection to lessons learned from infrastructure work

3. **Command Interface Demo** (45 seconds)
   - Show agent activation process
   - Demonstrate specialized command set
   - Walk through coverage-analysis workflow (conceptual)

4. **Comparison with Generic Agent** (30 seconds)
   - Show generic dev agent capabilities
   - Contrast with specialized test agent features
   - Highlight domain expertise differences

### Visual Graphics

- **Agent Architecture Diagram**: Show `.bmad-core/agents/` ecosystem
- **Command Comparison Chart**: Generic vs specialized command sets
- **Knowledge Integration Flow**: How agent references documentation
- **Coverage Improvement Results**: Before/after metrics from infrastructure work

### Code Demonstrations

**Agent Configuration Walkthrough:**

```yaml
agent:
  name: TestBot
  id: test-dev
  title: Unit Test Specialist
  icon: 🧪
  whenToUse: 'Use for test writing, coverage analysis, mocking strategies'
```

**Specialized Command Example:**

```yaml
commands:
  - coverage-analysis: Analyze current test coverage and identify high-impact improvement opportunities
  - create-test-suite: Generate comprehensive test suite for specified component/service/utility
  - mock-strategy: Design mocking approach for complex dependencies
```

**Knowledge Integration Pattern:**

```yaml
activation-instructions:
  - CRITICAL: Read the following full files as these are your explicit rules for testing standards
  - docs/architecture/test-strategy-and-standards.md
  - docs/patterns/testing-patterns.md
  - docs/lessons-learned/technology/testing-infrastructure-kdd.md
```

## Gamma.AI Presentation Notes

**Theme**: Technology/Development focused
**Color Scheme**: Blue/green tech colors with code syntax highlighting
**Graphics**: Emphasize architecture diagrams and workflow visualizations
**Code Blocks**: Syntax highlighted YAML and command examples
**Charts**: Coverage improvement metrics and capability comparisons

---

_This brief demonstrates the BMAD approach to creating specialized AI agents with domain expertise, using our testing infrastructure lessons as a practical foundation for embedded knowledge._
