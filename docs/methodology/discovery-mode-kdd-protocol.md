# Discovery Mode KDD Protocol

## Overview

A specialized Knowledge-Driven Development protocol for capturing breakthrough insights that emerge during unplanned problem-solving sessions. While standard KDD focuses on planned knowledge capture, Discovery Mode captures the serendipitous learning that often provides the most valuable architectural insights.

## Problem Statement

Traditional KDD assumes knowledge emerges from planned implementation. But some of the most valuable insights come from:

- **Long debugging sessions** that reveal hidden architectural problems
- **Tool configuration battles** that expose environment assumptions
- **"Best practice" failures** that require architectural rethinking
- **Assumption corrections** discovered through real problem-solving

**Gap**: Standard KDD doesn't systematically capture unplanned discoveries.

## When to Activate Discovery Mode

### Trigger Conditions

Activate Discovery Mode KDD when any debugging/investigation session involves:

- **Duration**: >1 hour of active problem-solving
- **Complexity**: Multiple false assumptions or misleading error messages
- **Architecture**: Discovery of hidden coupling or design issues
- **Tools**: Configuration problems that reveal environment assumptions
- **Patterns**: "Best practices" that prove problematic

### Common Scenarios

- Test architecture debugging (like our mocking session)
- Build/deployment configuration issues
- Performance problem investigations
- Integration debugging between systems
- Tool compatibility resolution

## Discovery Mode Capture Protocol

### During Session: Real-Time Capture

```markdown
## Assumption Tracking

- **Initial Assumption**: What did we think the problem was?
- **Evidence**: What led to that assumption?
- **Correction Point**: When/how was assumption proven wrong?
- **Real Problem**: What was actually happening?

## Architecture Revelations

- **Hidden Coupling**: What dependencies were revealed?
- **Design Flaws**: What architectural assumptions proved wrong?
- **Emergent Patterns**: What better approaches emerged naturally?

## Tool/Environment Insights

- **Configuration Issues**: What setup problems were discovered?
- **Tool Behavior**: What unexpected tool behavior was learned?
- **Environment Assumptions**: What environmental dependencies were revealed?
```

### End of Session: Knowledge Extraction

#### 1. Root Cause Analysis

```yaml
discovery_session:
  duration: '2.5 hours'
  initial_problem: '110 failing auth component tests'
  assumed_cause: 'Missing test environment setup'
  actual_cause: 'Over-mocking hiding architectural coupling issues'
  breakthrough_moment: 'Removing global auth mock revealed real integration problems'
```

#### 2. Pattern Documentation

```yaml
patterns_discovered:
  - name: 'Strategic Minimal Mocking'
    context: 'Testing components with external dependencies'
    insight: 'Mock external boundaries, test internal integration'
    anti_pattern: 'Mocking internal components/providers'

  - name: 'Architecture Discovery Through Testing'
    context: 'Fixing failing tests reveals design problems'
    insight: 'Test failures often indicate architectural coupling issues'
    application: 'Use test debugging as architecture validation tool'
```

#### 3. Tool/Environment Insights

```yaml
tool_discoveries:
  - tool: 'Jest vs Bun Test'
    issue: 'Different test discovery mechanisms'
    resolution: 'Use Jest for consistent 249 test discovery'
    lesson: 'Tool choice affects test runner behavior significantly'

  - configuration: 'Global test mocks in jest.setup.js'
    problem: 'Hiding real architectural integration issues'
    solution: 'Per-test file strategic mocking'
    principle: 'Global mocks should only mock external dependencies'
```

#### 4. Architectural Insights

```yaml
architecture_revelations:
  - discovery: 'Over-mocking prevents architectural validation'
    evidence: '110 tests failing when realistic integration tested'
    principle: 'Less mocking = better architecture testing'
    application: "Mock boundaries you don't control, test behavior you do control"

  - discovery: 'Test runner choice affects architectural discovery'
    evidence: 'bun test vs jest showed different problem patterns'
    principle: 'Consistent tooling enables consistent architectural validation'
```

## Knowledge Asset Creation

### Pattern Documents

From discoveries, create reusable patterns:

- `docs/patterns/[discovery-pattern-name].md`
- Include context, implementation, rationale, and discovery story
- Cross-reference with related established patterns

### Anti-Pattern Documentation

Document approaches that failed:

- `docs/lessons-learned/anti-patterns/[anti-pattern-name].md`
- Include what was tried, why it failed, and better approaches
- Prevent team from repeating the same mistakes

### Example Libraries

Create working examples from successful solutions:

- `docs/examples/[domain]/[solution-name]/`
- Include complete working code that emerged from the session
- Document the journey from problem to solution

### Discovery Stories

Document the investigation journey:

- `docs/lessons-learned/discovery-sessions/[session-date]-[problem-domain].md`
- Include the full journey from assumption to insight
- Valuable for understanding how insights were reached

## Integration with Standard KDD

### Story Integration

When discoveries emerge during story implementation:

1. **Continue story implementation** with discovered insights
2. **Document discovery** using Discovery Mode protocol
3. **Update story** with architectural insights section
4. **Create patterns** from validated discoveries

### Retrospective Integration

Use Discovery Mode insights in retrospectives:

- **Process Improvements**: What systematic changes prevent this class of problem?
- **Tool/Environment**: What configuration/setup issues need addressing?
- **Architectural Debt**: What coupling/design issues need future attention?
- **Knowledge Gaps**: What assumptions need validation across the team?

## Example: Testing Architecture Discovery Session

### Session Context

- **Duration**: 2.5 hours
- **Initial Problem**: "110 failing auth component tests"
- **Team**: Solo debugging with AI assistance

### Assumptions Journey

1. **Assumption 1**: "Tests need better environment setup"
   - **Evidence**: `useAuth must be used within AuthProvider` errors
   - **Action**: Investigated jest.setup.js configuration
   - **Result**: Found extensive global mocking

2. **Assumption 2**: "Global mocks need better configuration"
   - **Evidence**: Mocks seemed to address provider errors
   - **Action**: Attempted to fix global auth provider mock
   - **Result**: Created more abstraction, still failing tests

3. **Breakthrough**: "Over-mocking is hiding real architectural problems"
   - **Evidence**: Removing global mocks revealed real integration issues
   - **Action**: Implemented minimal strategic mocking
   - **Result**: 153 passing tests with real architectural validation

### Key Discoveries

- **Architecture**: Over-mocking prevents architectural validation
- **Testing**: Real integration testing catches more bugs than isolated unit tests
- **Tools**: Jest vs Bun test runner affects discovery patterns
- **Philosophy**: "Less mocking = better architecture testing"

### Knowledge Assets Created

- **Pattern**: Strategic Minimal Mocking (docs/patterns/)
- **Example**: Complete working implementation (docs/examples/)
- **Anti-Pattern**: Over-mocking documentation (docs/lessons-learned/)
- **Discovery Story**: This protocol document

## Success Metrics

### Immediate Value

- **Problem Resolution Speed**: Faster resolution of similar problems
- **Pattern Reuse**: Team applies discovered patterns to new problems
- **Architecture Improvement**: Design issues addressed based on discoveries
- **Tool/Environment Optimization**: Configuration problems resolved systematically

### Long-term Impact

- **Institutional Learning**: Discovery insights become team knowledge
- **Problem Prevention**: Anti-patterns prevent repeated mistakes
- **Architecture Evolution**: Design improves based on real problem feedback
- **Process Refinement**: Development workflow improves based on discovery insights

## Implementation Checklist

### Session Preparation

- [ ] Recognize trigger conditions for Discovery Mode
- [ ] Set up real-time capture template
- [ ] Plan to document journey, not just solution

### During Session

- [ ] Track assumption corrections as they happen
- [ ] Note architecture revelations in real-time
- [ ] Document tool/environment insights immediately
- [ ] Capture breakthrough moments and what caused them

### Session Completion

- [ ] Complete root cause analysis
- [ ] Extract reusable patterns from solutions
- [ ] Document anti-patterns from failed approaches
- [ ] Create working examples from successful solutions
- [ ] Plan integration with standard KDD process

### Knowledge Asset Creation

- [ ] Create pattern documents for reusable insights
- [ ] Document anti-patterns to prevent repetition
- [ ] Build example libraries from working solutions
- [ ] Write discovery stories for complex investigations

## Integration with AI Development

### Claude Integration

For AI-assisted discovery sessions:

```markdown
## Discovery Mode AI Prompts

"We're in Discovery Mode KDD - please help track:

- What assumptions are we correcting?
- What architectural insights are emerging?
- What patterns are we discovering vs what we planned?"

"Document this breakthrough moment: [describe insight]

- What was the assumption before?
- What evidence changed our thinking?
- What's the new understanding?"
```

### Context Preservation

Ensure AI has discovery context:

- Share real-time capture as session progresses
- Ask AI to identify patterns in the discovery journey
- Use AI to help extract reusable insights from specific solutions

## Discovery Mode vs Standard KDD

### Standard KDD (Planned)

- **When**: During planned story implementation
- **Focus**: Validating and documenting planned patterns
- **Output**: Pattern validation, incremental improvements

### Discovery Mode (Unplanned)

- **When**: During debugging/investigation sessions
- **Focus**: Capturing breakthrough insights and assumption corrections
- **Output**: New patterns, anti-patterns, architectural revelations

### Complementary Value

- **Standard KDD**: Builds systematic knowledge from planned work
- **Discovery Mode**: Captures breakthrough insights from problem-solving
- **Together**: Creates comprehensive knowledge system that improves through both planning and discovery

## Future Enhancements

### Automated Discovery Detection

- Monitor session duration and complexity
- Suggest Discovery Mode activation
- Auto-capture assumption correction patterns

### Cross-Session Pattern Analysis

- Identify recurring discovery patterns across sessions
- Suggest systematic improvements based on repeated discoveries
- Build prediction models for common problem categories

### Team Discovery Sharing

- Share discovery insights across team members
- Build collective discovery pattern library
- Cross-pollinate insights between different problem domains

---

**Key Insight**: "The most valuable architectural knowledge often emerges not from what we plan to learn, but from what we discover while solving real problems."
